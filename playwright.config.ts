import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 1,
  timeout: 30_000,
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "tabletopwatch",
      testMatch: "tabletopwatch.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "https://tabletopwatch.com",
      },
    },
    {
      name: "simracewatch",
      testMatch: "simracewatch.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "https://simracewatch.com",
      },
    },
    {
      name: "tabletopwatch-mobile",
      testMatch: "tabletopwatch.spec.ts",
      use: {
        ...devices["Pixel 7"],
        baseURL: "https://tabletopwatch.com",
      },
    },
    {
      name: "simracewatch-mobile",
      testMatch: "simracewatch.spec.ts",
      use: {
        ...devices["Pixel 7"],
        baseURL: "https://simracewatch.com",
      },
    },
  ],
});
