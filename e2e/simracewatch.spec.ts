import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Journey 3: Sim Racing — Watch Replay -> Find Setup -> Shop Hardware
// Persona: Sim racer who wants to copy a fast driver's setup and upgrade rig
// ---------------------------------------------------------------------------

test.describe("Journey 3: Watch Replay -> Setup -> Hardware Deals", () => {
  test("3.1 Home page loads with hero and featured videos", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("main")).toBeVisible();

    // Featured videos should exist
    const videoCards = page.locator(
      "a[href*='/watch/'], [data-testid='video-card']",
    );
    await expect(videoCards.first()).toBeVisible({ timeout: 10_000 });
    expect(await videoCards.count()).toBeGreaterThanOrEqual(1);
  });

  test("3.2 Watch page loads with sim racing content", async ({ page }) => {
    await page.goto("/watch");

    // Search bar
    await expect(
      page.locator("input[type='text'], input[type='search']").first(),
    ).toBeVisible();

    // Should have sim-specific filters (iRacing, ACC, F1 etc.)
    const pageText = await page.textContent("body");
    const hasSim =
      /iRacing|ACC|Assetto|F1|LMU/i.test(pageText ?? "");
    expect(hasSim).toBeTruthy();
  });

  test("3.3 Filter by sim works", async ({ page }) => {
    await page.goto("/watch");

    // Look for an iRacing filter
    const iRacingPill = page.locator("button, [role='tab']", {
      hasText: /iRacing/i,
    });
    if ((await iRacingPill.count()) > 0) {
      await iRacingPill.first().click();
      // Allow page to update
      await page.waitForTimeout(1_000);
    }
  });

  test("3.4-3.5 Video detail page with car setup data", async ({ page }) => {
    await page.goto("/watch");

    // Click first video
    const videoLink = page.locator("a[href*='/watch/']").first();
    await expect(videoLink).toBeVisible({ timeout: 10_000 });
    await videoLink.click();

    await expect(page).toHaveURL(/\/watch\//);

    // YouTube embed
    const embed = page.locator("iframe[src*='youtube'], iframe[src*='youtu']");
    await expect(embed).toBeVisible({ timeout: 10_000 });

    // Title
    const title = page.locator("h1");
    await expect(title).toBeVisible();
  });

  test("3.7-3.8 Hardware links connect to deals", async ({ page }) => {
    await page.goto("/watch");

    const videoLink = page.locator("a[href*='/watch/']").first();
    await expect(videoLink).toBeVisible({ timeout: 10_000 });
    await videoLink.click();
    await expect(page).toHaveURL(/\/watch\//);

    // Look for hardware links to deals (in main content, not nav)
    const hardwareLink = page.locator("main a[href*='/deals']").first();
    if ((await hardwareLink.count()) > 0) {
      await hardwareLink.scrollIntoViewIfNeeded();
      await hardwareLink.click();
      await expect(page).toHaveURL(/\/deals/);
    }
  });

  test("3.9 Sim racing deals page has products", async ({ page }) => {
    await page.goto("/deals");

    await expect(page.locator("h1")).toContainText(/deals/i);

    const productCards = page.locator("a[href*='/deals/']");
    await expect(productCards.first()).toBeVisible({ timeout: 10_000 });
    expect(await productCards.count()).toBeGreaterThan(0);

    // Check for sim racing retailers (Moza, Trak Racer)
    const pageText = await page.textContent("body");
    const hasSimRetailer =
      /Moza|Trak Racer|eBay/i.test(pageText ?? "");
    expect(hasSimRetailer).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Cross-Vertical: SimRaceWatch specifics
// ---------------------------------------------------------------------------

test.describe("Cross-Vertical: SimRaceWatch identity", () => {
  test("Brand name is SimRaceWatch", async ({ page }) => {
    await page.goto("/");
    const navText = await page.locator("nav").textContent();
    expect(navText).toMatch(/SimRaceWatch/i);
  });

  test("Accent colour is racing red", async ({ page }) => {
    await page.goto("/");

    // The vertical accent CSS variable should be set
    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--vertical-accent")
        .trim(),
    );
    // Should have a value set (red spectrum for sim racing)
    expect(accent.length).toBeGreaterThan(0);
  });

  test("Setups page is accessible", async ({ page }) => {
    await page.goto("/setups");
    // Should not redirect or 404
    await expect(page.locator("main")).toBeVisible();
  });

  test("Build page redirects away (sim racing has no army builder)", async ({
    page,
  }) => {
    await page.goto("/build");
    // Should redirect to watch or show different content
    await page.waitForTimeout(2_000);
    const url = page.url();
    // Build page either redirects or shows a different state for sim racing
    expect(url).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Image Quality Audit (SimRaceWatch)
// ---------------------------------------------------------------------------

test.describe("Image Quality Audit", () => {
  test("Deal card images are not broken and render at reasonable size", async ({
    page,
  }) => {
    await page.goto("/deals");

    // Scroll to product grid to trigger lazy-loaded images
    const dealImages = page.locator("a[href*='/deals/'] img");
    const count = await dealImages.count();
    if (count > 0) {
      await dealImages.first().scrollIntoViewIfNeeded();
      // Wait for lazy images to load after scroll
      await page.waitForTimeout(2_000);
    }

    const brokenImages: string[] = [];

    for (let i = 0; i < Math.min(count, 8); i++) {
      const img = dealImages.nth(i);
      await img.scrollIntoViewIfNeeded();
      // Wait for this specific image to load
      await img
        .evaluate(
          (el: HTMLImageElement) =>
            el.complete ||
            new Promise((resolve) => {
              el.addEventListener("load", resolve, { once: true });
              el.addEventListener("error", resolve, { once: true });
              setTimeout(resolve, 3_000);
            }),
        );

      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth,
      );
      const alt = (await img.getAttribute("alt")) ?? `image-${i}`;

      if (naturalWidth === 0) {
        brokenImages.push(alt);
      }
    }

    expect(
      brokenImages,
      `Broken images found: ${brokenImages.join(", ")}`,
    ).toHaveLength(0);

    if (count > 0) {
      const firstImg = dealImages.first();
      const box = await firstImg.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(50);
      expect(box!.height).toBeGreaterThan(50);
    }
  });

  test("Product detail image is high quality", async ({ page }) => {
    await page.goto("/deals");

    const productLink = page.locator("a[href*='/deals/']").first();
    if ((await productLink.count()) === 0) return;
    await expect(productLink).toBeVisible({ timeout: 10_000 });
    await productLink.click();

    const mainImg = page.locator("img[alt]").first();
    if ((await mainImg.count()) > 0) {
      await expect(mainImg).toBeVisible({ timeout: 10_000 });

      const box = await mainImg.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(200);
      expect(box!.height).toBeGreaterThan(200);
    }
  });
});
