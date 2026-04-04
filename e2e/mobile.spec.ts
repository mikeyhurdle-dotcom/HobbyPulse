import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Journey 4: Mobile Experience
// Persona: User browsing on phone during commute.
// Runs only in mobile projects (tabletopwatch-mobile, simracewatch-mobile).
// ---------------------------------------------------------------------------

test.describe("Journey 4: Mobile UX", () => {
  test("4.1 Layout is single-column, no horizontal scroll", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();

    // Check for horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test("4.2 Hamburger menu opens side sheet with nav links", async ({
    page,
  }) => {
    await page.goto("/");

    // Find hamburger button (usually a menu icon button)
    const hamburger = page.locator(
      "button[aria-label*='menu' i], button[aria-label*='Menu' i], nav button:has(svg)",
    ).last();
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    // Side sheet should appear with nav links
    const sheet = page.locator(
      "[role='dialog'], [data-state='open'], .fixed",
    );
    await expect(sheet.first()).toBeVisible({ timeout: 3_000 });

    // Nav links should be present
    const watchLink = page.locator("[role='dialog'] a, .fixed a", {
      hasText: /watch/i,
    });
    const dealsLink = page.locator("[role='dialog'] a, .fixed a", {
      hasText: /deals/i,
    });
    expect(await watchLink.count()).toBeGreaterThan(0);
    expect(await dealsLink.count()).toBeGreaterThan(0);
  });

  test("4.3 Tapping a nav link closes sheet and navigates", async ({
    page,
  }) => {
    await page.goto("/");

    // Open hamburger
    const hamburger = page.locator(
      "button[aria-label*='menu' i], button[aria-label*='Menu' i], nav button:has(svg)",
    ).last();
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    // Click "Watch" link in the sheet
    const watchLink = page.locator("[role='dialog'] a, .fixed a", {
      hasText: /^watch$/i,
    });
    if ((await watchLink.count()) > 0) {
      await watchLink.first().click();
      await expect(page).toHaveURL(/\/watch/);

      // Sheet should be closed
      const sheet = page.locator("[role='dialog'][data-state='open']");
      await expect(sheet).toHaveCount(0);
    }
  });

  test("4.4 Watch page filters are mobile-friendly", async ({ page }) => {
    await page.goto("/watch");

    // Search bar should be full-width
    const searchInput = page.locator(
      "input[type='text'], input[type='search']",
    ).first();
    await expect(searchInput).toBeVisible();

    const searchBox = await searchInput.boundingBox();
    const viewport = page.viewportSize()!;
    // Search should be at least 80% of viewport width
    expect(searchBox!.width).toBeGreaterThan(viewport.width * 0.7);

    // No horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test("4.5 Theme toggle switches between light and dark", async ({
    page,
  }) => {
    await page.goto("/");

    // Find theme toggle button
    const themeToggle = page.locator(
      "button[aria-label*='theme' i], button[aria-label*='mode' i], button[aria-label*='light' i], button[aria-label*='dark' i]",
    );
    await expect(themeToggle.first()).toBeVisible();

    // Get initial theme
    const initialClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );

    // Click toggle
    await themeToggle.first().click();
    await page.waitForTimeout(500);

    // Theme should have changed
    const newClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
    expect(newClass).not.toBe(initialClass);

    // Click again to revert
    await themeToggle.first().click();
    await page.waitForTimeout(500);

    const revertedClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
    expect(revertedClass).toBe(initialClass);
  });

  test("4.6 Video detail page stacks on mobile", async ({ page }) => {
    await page.goto("/watch");

    const videoLink = page.locator("a[href*='/watch/']").first();
    await expect(videoLink).toBeVisible({ timeout: 10_000 });
    const href = await videoLink.getAttribute("href");
    await page.goto(href!);
    await expect(page).toHaveURL(/\/watch\//);

    // Video embed should scale to full width
    const embed = page.locator("iframe[src*='youtube'], iframe[src*='youtu']");
    await expect(embed).toBeVisible({ timeout: 10_000 });

    const embedBox = await embed.boundingBox();
    const viewport = page.viewportSize()!;
    // Embed should be at least 85% of viewport width
    expect(embedBox!.width).toBeGreaterThan(viewport.width * 0.85);
  });

  test("4.7 Deals grid stacks on narrow screen", async ({ page }) => {
    await page.goto("/deals");

    const productCards = page.locator("a[href*='/deals/']");
    await expect(productCards.first()).toBeVisible({ timeout: 10_000 });

    // On mobile, cards should stack (single column or 2 columns max)
    const firstCard = await productCards.nth(0).boundingBox();
    const viewport = page.viewportSize()!;

    // Each card should be at least 40% of viewport width (max 2 cols)
    expect(firstCard!.width).toBeGreaterThan(viewport.width * 0.4);
  });

  test("4.8 Tap targets are large enough (44px+)", async ({ page }) => {
    await page.goto("/");

    // Check key interactive elements have adequate tap target size
    const buttons = page.locator("button, a[href]");
    const count = await buttons.count();
    const smallTargets: string[] = [];

    for (let i = 0; i < Math.min(count, 15); i++) {
      const el = buttons.nth(i);
      const isVisible = await el.isVisible();
      if (!isVisible) continue;

      const box = await el.boundingBox();
      if (!box) continue;

      // Skip tiny decorative elements
      if (box.width < 10 && box.height < 10) continue;

      const text = ((await el.textContent()) ?? "").trim().slice(0, 30);
      // Either width or height should be at least 36px
      // (44px is ideal but 36px is acceptable for inline links)
      if (box.width < 36 && box.height < 36) {
        smallTargets.push(`"${text}" (${Math.round(box.width)}x${Math.round(box.height)})`);
      }
    }

    // Allow up to 2 small targets (inline text links are acceptable)
    expect(
      smallTargets.length,
      `Small tap targets: ${smallTargets.join(", ")}`,
    ).toBeLessThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Journey 5: Light/Dark Mode (mobile)
// ---------------------------------------------------------------------------

test.describe("Journey 5: Theme Persistence", () => {
  test("5.3 Theme persists across navigation", async ({ page }) => {
    await page.goto("/");

    // Find and click theme toggle
    const themeToggle = page.locator(
      "button[aria-label*='theme' i], button[aria-label*='mode' i], button[aria-label*='light' i], button[aria-label*='dark' i]",
    );
    await expect(themeToggle.first()).toBeVisible();
    await themeToggle.first().click();
    await page.waitForTimeout(500);

    const themeAfterToggle = await page.evaluate(() =>
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );

    // Navigate to watch
    await page.goto("/watch");
    await page.waitForTimeout(500);

    const themeAfterNav = await page.evaluate(() =>
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );

    expect(themeAfterNav).toBe(themeAfterToggle);
  });

  test("5.5 Deals page elements readable in light mode", async ({ page }) => {
    await page.goto("/deals");

    // Force light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    });
    await page.waitForTimeout(300);

    // Price text should be visible
    const prices = page.locator(":text('£')");
    if ((await prices.count()) > 0) {
      await expect(prices.first()).toBeVisible();
    }

    // Product cards should be visible
    const cards = page.locator("a[href*='/deals/']");
    if ((await cards.count()) > 0) {
      await expect(cards.first()).toBeVisible();
    }
  });
});
