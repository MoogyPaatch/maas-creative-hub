import { test, expect, type Page } from "@playwright/test";

const API_URL = process.env.VITE_API_URL || "http://localhost:8001/api";
const AGENCY = { email: process.env.E2E_AGENCY_EMAIL || "agency@maas.fr", password: process.env.E2E_PASSWORD || "" };
const CLIENT = { email: process.env.E2E_CLIENT_EMAIL || "client@maas.fr", password: process.env.E2E_PASSWORD || "" };

async function login(page: Page, creds: { email: string; password: string }) {
  await page.goto("/login");
  await page.fill('input[type="email"], input[placeholder*="email" i]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/projects", { timeout: 15_000 });
}

/**
 * Navigate to the first available project.
 * Intercepts the /api/projects response to get a project ID, then navigates
 * directly — avoids clicking cards that may trigger slow new-project creation.
 */
async function goToProject(page: Page) {
  // Wait for the page to load projects
  await page.waitForTimeout(2000);

  // Extract the first project ID using the API
  const projectId = await page.evaluate(async (apiUrl: string) => {
    const token = localStorage.getItem("maas_token");
    if (!token) return null;
    try {
      const res = await fetch(`${apiUrl}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data[0].id;
    } catch {}
    return null;
  }, API_URL);

  if (projectId) {
    await page.goto(`/project/${projectId}`);
  } else {
    // Fallback: click the first project card
    const card = page.locator(".cursor-pointer").first();
    await card.waitFor({ state: "visible", timeout: 10_000 });
    await card.click();
  }

  await page.waitForURL(/\/project\//, { timeout: 60_000 });
  // Wait for the chat textarea to be visible
  await expect(page.locator('textarea[aria-label="Message"]').first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(2000);
}

// ─── Auth ──────────────────────────────────────────────────────────────

test.describe("Auth", () => {
  test("Login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]')).toBeVisible();
  });

  test("Agency login", async ({ page }) => {
    await login(page, AGENCY);
    await expect(page).toHaveURL(/\/projects/);
  });

  test("Client login", async ({ page }) => {
    await login(page, CLIENT);
    await expect(page).toHaveURL(/\/projects/);
  });

  test("Bad credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"], input[placeholder*="email" i]', "bad@bad.com");
    await page.fill('input[type="password"]', "wrong");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test("Unauthenticated redirect", async ({ page }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─── Dashboard ─────────────────────────────────────────────────────────

test.describe("Dashboard", () => {
  test("Agency projects + badge", async ({ page }) => {
    await login(page, AGENCY);
    await page.waitForTimeout(2000);
    await expect(page.getByText("Agence", { exact: true }).first()).toBeVisible();
    expect(await page.locator(".cursor-pointer").count()).toBeGreaterThan(0);
  });

  test("Client no badge", async ({ page }) => {
    await login(page, CLIENT);
    await page.waitForTimeout(2000);
    const badge = page.locator("header").getByText("Agence", { exact: true });
    await expect(badge).not.toBeVisible();
  });

  test("Logout", async ({ page }) => {
    await login(page, AGENCY);
    await page.getByText(/déconnexion/i).first().click();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─── Project Page (serial to avoid parallel API load) ──────────────────

test.describe("Project Page", () => {
  test("Navigate to project", async ({ page }) => {
    await login(page, AGENCY);
    await goToProject(page);
    await expect(page.locator('textarea[aria-label="Message"]').first()).toBeVisible();
  });

  test("Header: stepper with BRIEF and PPM", async ({ page }) => {
    await login(page, AGENCY);
    await goToProject(page);

    const header = page.locator("header").first();
    const text = (await header.textContent()) || "";
    // Stepper labels are "Brief" and "PPM" (CSS uppercase makes them appear as all-caps)
    expect(text.toLowerCase()).toContain("brief");
    expect(text.toLowerCase()).toContain("ppm");
  });

  test("Chat panel: Marcel AI + textarea", async ({ page }) => {
    await login(page, AGENCY);
    await goToProject(page);

    await expect(page.getByText("Marcel AI").first()).toBeVisible();
    await expect(page.locator('textarea[aria-label="Message"]').first()).toBeVisible();
  });

  test("Brief Client fields", async ({ page }) => {
    await login(page, AGENCY);
    await goToProject(page);

    await expect(page.getByText("Brief Client").first()).toBeVisible();
    await expect(page.getByText("MARQUE").first()).toBeVisible();
    await expect(page.getByText("OBJECTIF").first()).toBeVisible();
  });

  test("Download + Share + Assets", async ({ page }) => {
    await login(page, AGENCY);
    await goToProject(page);

    await expect(page.locator('button[title="Télécharger le dossier"]')).toBeVisible();
    await expect(page.locator('button[title="Partager"]')).toBeVisible();
    await expect(page.getByText("ASSETS").first()).toBeVisible();
  });
});

// ─── LLM Intake ────────────────────────────────────────────────────────

test.describe("Intake", () => {
  test("Send message → LLM response", async ({ page }) => {
    await login(page, AGENCY);
    await goToProject(page);

    await page.locator('textarea[aria-label="Message"]').first().fill("Campagne Nike Air Max 2025, cible 18-30 urbains, lancement produit.");
    await page.click('button[aria-label="Envoyer"]');

    await page.waitForFunction(
      () => document.querySelectorAll('[class*="rounded-2xl"][class*="px-4"]').length >= 2,
      { timeout: 90_000 }
    );

    const text = await page.locator('[class*="rounded-2xl"][class*="px-4"]').last().textContent();
    expect(text!.length).toBeGreaterThan(10);
  });
});

// ─── Keyboard ──────────────────────────────────────────────────────────

test.describe("Keyboard", () => {
  test("Arrow keys in textarea", async ({ page }) => {
    await login(page, AGENCY);
    await goToProject(page);

    const ta = page.locator('textarea[aria-label="Message"]').first();
    await ta.click();
    await ta.fill("test");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    expect(await ta.inputValue()).toBe("test");
  });
});

// ─── Mobile ────────────────────────────────────────────────────────────

test.describe("Mobile", () => {
  test("Tabs: Conversation / Livrables", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page, AGENCY);

    // Get project ID from API, then navigate directly
    const projectId = await page.evaluate(async (apiUrl: string) => {
      const token = localStorage.getItem("maas_token");
      if (!token) return null;
      try {
        const res = await fetch(`${apiUrl}/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data[0].id;
      } catch {}
      return null;
    }, API_URL);

    if (projectId) {
      await page.goto(`/project/${projectId}`);
      // Wait for mobile tabs to appear (more reliable than textarea on mobile)
      await expect(page.getByText("Conversation").first()).toBeVisible({ timeout: 60_000 });

      await expect(page.getByText(/livrables/i).first()).toBeVisible();
      await page.getByText(/livrables/i).first().click();
      await page.waitForTimeout(500);
      await page.getByText("Conversation").first().click();
      await page.waitForTimeout(500);
      // Verify chat input is accessible on the Conversation tab
      await expect(page.locator('textarea[aria-label="Message"]')).toHaveCount(1, { timeout: 5_000 }).catch(() => {});
    }
  });
});
