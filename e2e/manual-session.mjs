// Guided manual browser session: opens a VISIBLE Chrome window, waits for a
// human login, then runs basic end-to-end checks in that same session.
// Run: node e2e/manual-session.mjs [baseUrl]
import { chromium } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = process.argv[2] || "http://localhost:5173";
const shots = path.resolve("test-results", "manual");
fs.mkdirSync(shots, { recursive: true });

const results = [];
const problems = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`,
  );
}

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "aenko-manual-"));

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  channel: "chrome",
  viewport: { width: 1440, height: 900 },
});

const page = context.pages()[0] ?? (await context.newPage());
await page.bringToFront().catch(() => {});
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console: ${m.text()}`);
});

await page.goto(`${BASE}/login`);
console.log(
  "\nACTION NEEDED: please LOG IN to the AENKO app in the opened Chrome window.",
);
console.log(
  "You have 15 minutes. The checks start automatically after login.\n",
);
try {
  await page.waitForFunction(
    () =>
      localStorage.getItem("aenko_token") &&
      !location.pathname.startsWith("/login"),
    { timeout: 900000 },
  );
} catch {
  console.log("LOGIN TIMEOUT: no session detected. Closing.");
  await context.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
  process.exit(2);
}
console.log("Login detected. Running basic checks...\n");

async function visit(route, heading, shot) {
  await page.goto(`${BASE}${route}`);
  try {
    await expectHeading(heading);
    await page.locator(".content").first().waitFor({ timeout: 15000 });
    await page.screenshot({ path: path.join(shots, shot) });
    check(`page ${route} loads (${heading})`, true);
  } catch (e) {
    await page.screenshot({ path: path.join(shots, shot) });
    check(`page ${route} loads (${heading})`, false, String(e).split("\n")[0]);
  }
}

async function expectHeading(text) {
  await page
    .getByRole("heading", { name: new RegExp(text, "i") })
    .first()
    .waitFor({ timeout: 20000 });
}

await visit("/", "dashboard", "dashboard.png");
await visit("/discover", "discover", "discover.png");
await visit("/library", "library", "library.png");
await visit("/guide", "anime guide", "guide.png");
await visit("/quests", "quests", "quests.png");
await visit("/achievements", "achievements", "achievements.png");
await visit("/guilds", "guilds", "guilds.png");
await visit("/profile", "profile", "profile.png");
await visit("/activity", "activity", "activity.png");

// Discover search adapts to live MAL or honest provider-error states.
await page.goto(`${BASE}/discover`);
await page.getByLabel("Anime title").fill("Naruto");
await page.getByRole("button", { name: "Search" }).click();
try {
  await page.locator(".anime-card").first().waitFor({ timeout: 30000 });
  const n = await page.locator(".anime-card").count();
  check("discover search returns live MAL results", true, `${n} cards`);
} catch {
  const unavailable = await page.getByText("temporarily unavailable").count();
  check(
    "discover search fails honestly without credentials",
    unavailable > 0,
    unavailable > 0
      ? "provider-error state shown"
      : "neither results nor error state",
  );
}
await page.screenshot({ path: path.join(shots, "search.png") });

// AI Insight: generate once, report whichever honest outcome appears.
await page.goto(`${BASE}/ai`);
await expectHeading("ai anime intelligence");
await page.getByRole("button", { name: /generate new insight/i }).click();
let aiOutcome = "unknown";
try {
  await page.getByText("AI-generated").waitFor({ timeout: 120000 });
  aiOutcome = "live model response";
} catch {
  try {
    await page.getByText("Local fallback").waitFor({ timeout: 10000 });
    aiOutcome = "labelled fallback";
  } catch {
    aiOutcome = "NO RESULT (timeout)";
  }
}
await page.screenshot({ path: path.join(shots, "ai.png") });
check(
  "ai insight generates an honest outcome",
  aiOutcome !== "NO RESULT (timeout)",
  aiOutcome,
);

const critical = problems.filter(
  (e) => !e.includes("favicon") && !e.includes("Failed to load resource"),
);
check(
  "no critical browser errors",
  critical.length === 0,
  critical.slice(0, 3).join(" | "),
);

console.log(
  `\nDone: ${results.filter((r) => r.ok).length}/${results.length} checks passed.`,
);
console.log(`Screenshots in ${shots}`);
console.log("Browser stays open 60s for you to look around, then closes.");
await new Promise((r) => setTimeout(r, 60000));
await context.close();
fs.rmSync(userDataDir, { recursive: true, force: true });
process.exit(results.every((r) => r.ok) ? 0 : 1);
