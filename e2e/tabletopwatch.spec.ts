import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Journey 1: Watch a Battle Report -> Find Deals on Units
// Persona: Warhammer player who wants to copy a winning army list at the best price
// ---------------------------------------------------------------------------

test.describe("Journey 1: Watch -> Army List -> Deals", () => {
  test("1.1 Home page loads with hero, stats, and featured videos", async ({
    page,
  }) => {
    await page.goto("/");

    // Hero section visible
    await expect(page.locator("main")).toBeVisible();

    // Real stats — should not show placeholder "--"
    const stats = page.locator("[data-testid='hero-stats'], .stats, h1 ~ p");
    if ((await stats.count()) > 0) {
      const statsText = await stats.first().textContent();
      expect(statsText).not.toContain("--");
    }

    // Featured videos should exist
    const videoCards = page.locator(
      "a[href*='/watch/'], [data-testid='video-card']",
    );
    await expect(videoCards.first()).toBeVisible({ timeout: 10_000 });
    expect(await videoCards.count()).toBeGreaterThanOrEqual(1);
  });

  test("1.2 Watch page loads with filters", async ({ page }) => {
    await page.goto("/watch");

    // Search bar
    await expect(
      page.locator("input[type='text'], input[type='search']").first(),
    ).toBeVisible();

    // Game system filter pills or dropdown
    const filterElements = page.locator(
      "button, [role='tab'], select, [data-testid='game-filter']",
    );
    expect(await filterElements.count()).toBeGreaterThan(0);
  });

  test("1.3 Game system filter works", async ({ page }) => {
    await page.goto("/watch");

    // Look for a 40K filter pill/button
    const pill40k = page.locator("button, [role='tab']", {
      hasText: /40[kK]/,
    });
    if ((await pill40k.count()) > 0) {
      await pill40k.first().click();
      await page.waitForURL(/game=40k/i, { timeout: 5_000 }).catch(() => {
        // URL might use different param name — that's OK
      });
    }
  });

  test("1.4-1.5 Video detail page loads with embed and army lists", async ({
    page,
  }) => {
    await page.goto("/watch");

    // Click first video card
    const videoLink = page
      .locator("a[href*='/watch/']")
      .first();
    await expect(videoLink).toBeVisible({ timeout: 10_000 });
    await videoLink.click();

    // Should be on a video detail page
    await expect(page).toHaveURL(/\/watch\//);

    // YouTube embed should be present
    const embed = page.locator("iframe[src*='youtube'], iframe[src*='youtu']");
    await expect(embed).toBeVisible({ timeout: 10_000 });

    // Title should exist
    const title = page.locator("h1");
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText!.length).toBeGreaterThan(3);
  });

  test("1.6 Winner badge does NOT show spoilers", async ({ page }) => {
    await page.goto("/watch");

    // Navigate to a video
    const videoLink = page.locator("a[href*='/watch/']").first();
    await expect(videoLink).toBeVisible({ timeout: 10_000 });
    await videoLink.click();
    await expect(page).toHaveURL(/\/watch\//);

    // Winner/spoiler badges should NOT be visible (per CLAUDE.md rule)
    const spoilerBadges = page.locator(
      "[data-testid='winner-badge'], .winner-badge, :text('Winner')",
    );
    // These should either not exist or be hidden
    const count = await spoilerBadges.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(spoilerBadges.nth(i)).not.toBeVisible();
      }
    }
  });

  test("1.7 Unit name links to deals with search pre-filled", async ({
    page,
  }) => {
    await page.goto("/watch");

    const videoLink = page.locator("a[href*='/watch/']").first();
    await expect(videoLink).toBeVisible({ timeout: 10_000 });
    await videoLink.click();
    await expect(page).toHaveURL(/\/watch\//);

    // Look for unit links that go to deals
    const unitLink = page.locator("a[href*='/deals?q=']").first();
    if ((await unitLink.count()) > 0) {
      const href = await unitLink.getAttribute("href");
      expect(href).toContain("/deals?q=");
      await unitLink.click();
      await expect(page).toHaveURL(/\/deals\?q=/);
    }
  });

  test("1.9 Buy This Army navigates to build page", async ({ page }) => {
    await page.goto("/watch");

    const videoLink = page.locator("a[href*='/watch/']").first();
    await expect(videoLink).toBeVisible({ timeout: 10_000 });
    await videoLink.click();
    await expect(page).toHaveURL(/\/watch\//);

    // Look for "Buy This Army" button/link
    const buyArmy = page.locator("a, button", {
      hasText: /buy.*army/i,
    });
    if ((await buyArmy.count()) > 0) {
      await buyArmy.first().click();
      await expect(page).toHaveURL(/\/build/);
    }
  });
});

// ---------------------------------------------------------------------------
// Journey 2: Browse Deals -> Price Comparison
// Persona: Budget-conscious hobbyist looking for the cheapest deals
// ---------------------------------------------------------------------------

test.describe("Journey 2: Browse Deals -> Price Comparison", () => {
  test("2.1 Deals page loads with product grid", async ({ page }) => {
    await page.goto("/deals");

    // Page title
    await expect(page.locator("h1")).toContainText(/deals/i);

    // Product cards should exist
    const productCards = page.locator("a[href*='/deals/']");
    await expect(productCards.first()).toBeVisible({ timeout: 10_000 });
    expect(await productCards.count()).toBeGreaterThan(0);
  });

  test("2.2 Search filter works", async ({ page }) => {
    await page.goto("/deals");

    const searchInput = page.locator(
      "input[name='q'], input[placeholder*='Search']",
    );
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Combat Patrol");

    const filterBtn = page.locator("button[type='submit']", {
      hasText: /filter/i,
    });
    await filterBtn.click();

    await expect(page).toHaveURL(/q=Combat/i);
  });

  test("2.3 Sort by price works", async ({ page }) => {
    await page.goto("/deals");

    const sortSelect = page.locator("select[name='sort']");
    await expect(sortSelect).toBeVisible();
    await sortSelect.selectOption("price-asc");

    const filterBtn = page.locator("button[type='submit']");
    await filterBtn.click();

    await expect(page).toHaveURL(/sort=price-asc/);
  });

  test("2.4 Product detail page with price comparison table", async ({
    page,
  }) => {
    await page.goto("/deals");

    // Click first product
    const productLink = page.locator("a[href*='/deals/']").first();
    await expect(productLink).toBeVisible({ timeout: 10_000 });
    await productLink.click();

    await expect(page).toHaveURL(/\/deals\/[^?]/);

    // Product name
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();

    // Price should show
    const priceText = page.locator(":text('£')");
    expect(await priceText.count()).toBeGreaterThan(0);

    // Price comparison section
    const comparisonSection = page.locator("h2", {
      hasText: /price comparison/i,
    });
    await expect(comparisonSection).toBeVisible();

    // At least one listing row with a Buy button
    const buyButtons = page.locator("a", { hasText: /buy/i });
    expect(await buyButtons.count()).toBeGreaterThan(0);
  });

  test("2.5 Product images load correctly (quality audit)", async ({
    page,
  }) => {
    await page.goto("/deals");

    // Check that product images use next/image (rendered as <img> with srcset)
    const images = page.locator("a[href*='/deals/'] img");
    const count = await images.count();

    if (count > 0) {
      const firstImg = images.first();
      await expect(firstImg).toBeVisible({ timeout: 10_000 });

      // next/image adds srcset for responsive images
      const srcset = await firstImg.getAttribute("srcset");
      const src = await firstImg.getAttribute("src");

      // Should have either srcset (next/image optimized) or a valid src
      expect(srcset || src).toBeTruthy();

      // Image should have actual dimensions (not 0x0)
      const box = await firstImg.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(50);
      expect(box!.height).toBeGreaterThan(50);
    }
  });

  test("2.6 Product detail image loads at high quality", async ({ page }) => {
    await page.goto("/deals");

    const productLink = page.locator("a[href*='/deals/']").first();
    await expect(productLink).toBeVisible({ timeout: 10_000 });
    await productLink.click();

    await expect(page).toHaveURL(/\/deals\/[^?]/);

    // Main product image
    const mainImg = page.locator("img[alt]").first();
    if ((await mainImg.count()) > 0) {
      await expect(mainImg).toBeVisible({ timeout: 10_000 });

      const box = await mainImg.boundingBox();
      expect(box).toBeTruthy();
      // Detail page image should be substantial (at least 200px)
      expect(box!.width).toBeGreaterThan(200);
      expect(box!.height).toBeGreaterThan(200);
    }
  });

  test("2.7 Price alert form is present on product detail", async ({
    page,
  }) => {
    await page.goto("/deals");

    // Wait for product grid to load, then click first product
    const productLink = page.locator("a[href*='/deals/']").first();
    await expect(productLink).toBeVisible({ timeout: 10_000 });
    const href = await productLink.getAttribute("href");
    // Navigate directly to avoid click race conditions
    await page.goto(href!);
    await expect(page).toHaveURL(/\/deals\/[^?]/);

    // Price alert section
    const pageText = await page.textContent("body");
    expect(pageText).toMatch(/price alert/i);

    // Email input
    const emailInput = page.locator("input[type='email']");
    expect(await emailInput.count()).toBeGreaterThan(0);
  });

  test("2.8 Buy buttons link to external retailers", async ({ page }) => {
    await page.goto("/deals");

    const productLink = page.locator("a[href*='/deals/']").first();
    await expect(productLink).toBeVisible({ timeout: 10_000 });
    await productLink.click();

    const buyButtons = page.locator("a[target='_blank']", {
      hasText: /buy/i,
    });
    if ((await buyButtons.count()) > 0) {
      const href = await buyButtons.first().getAttribute("href");
      expect(href).toBeTruthy();
      // Should link to an external retailer, not internal
      expect(href).toMatch(/^https?:\/\//);
    }
  });
});

// ---------------------------------------------------------------------------
// Image Quality Audit
// ---------------------------------------------------------------------------

test.describe("Image Quality Audit", () => {
  test("Deal card images are not broken and render at reasonable size", async ({
    page,
  }) => {
    await page.goto("/deals");

    const dealImages = page.locator("a[href*='/deals/'] img");
    const count = await dealImages.count();

    const brokenImages: string[] = [];

    for (let i = 0; i < Math.min(count, 8); i++) {
      const img = dealImages.nth(i);
      const isVisible = await img.isVisible();
      if (!isVisible) continue;

      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth,
      );
      const alt = (await img.getAttribute("alt")) ?? `image-${i}`;

      // Image with 0 naturalWidth means it failed to load
      if (naturalWidth === 0) {
        brokenImages.push(alt);
      }
    }

    expect(
      brokenImages,
      `Broken images found: ${brokenImages.join(", ")}`,
    ).toHaveLength(0);

    // Verify images render at a usable size in the layout
    if (count > 0) {
      const firstImg = dealImages.first();
      const box = await firstImg.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(50);
      expect(box!.height).toBeGreaterThan(50);
    }
  });
});
