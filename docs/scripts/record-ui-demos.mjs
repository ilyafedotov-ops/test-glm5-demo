import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.DEMO_BASE_URL || "http://localhost:3000";
const EMAIL = process.env.DEMO_EMAIL || "admin@nexusops.com";
const PASSWORD = process.env.DEMO_PASSWORD || "admin123";
const OUTPUT_DIR = path.resolve(process.cwd(), process.env.DEMO_VIDEO_DIR || "docs/videos");
const TMP_DIR = path.join(OUTPUT_DIR, ".tmp");
const VIEWPORT = { width: 1366, height: 768 };

function log(message) {
  console.log(`[record-demos] ${message}`);
}

function assertFfmpegAvailable() {
  const result = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (result.status !== 0) {
    throw new Error("ffmpeg is required but was not found on PATH.");
  }
}

function runFfmpeg(args) {
  const result = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed with exit code ${result.status}.`);
  }
}

async function convertWebmToGif(webmPath, gifPath) {
  const palettePath = path.join(
    path.dirname(webmPath),
    `${path.basename(webmPath, ".webm")}-palette.png`
  );

  runFfmpeg([
    "-y",
    "-i",
    webmPath,
    "-vf",
    "fps=12,scale=1280:-1:flags=lanczos,palettegen",
    "-frames:v",
    "1",
    "-update",
    "1",
    palettePath,
  ]);
  runFfmpeg([
    "-y",
    "-i",
    webmPath,
    "-i",
    palettePath,
    "-filter_complex",
    "fps=12,scale=1280:-1:flags=lanczos[x];[x][1:v]paletteuse",
    "-loop",
    "0",
    gifPath,
  ]);

  await fs.rm(palettePath, { force: true });
}

async function waitForStable(page, ms = 900) {
  await page.waitForTimeout(ms);
}

function asRegex(text) {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await Promise.all([
    page.waitForURL("**/dashboard", { timeout: 60000 }),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);
  await waitForStable(page, 1200);
}

async function ensureGroupExpanded(page, groupLabel, expectedLinkLabel) {
  const aside = page.locator("aside");
  const link = aside.getByRole("link", { name: expectedLinkLabel, exact: true });

  if (await link.isVisible().catch(() => false)) {
    return;
  }

  await aside.getByRole("button", { name: asRegex(groupLabel) }).first().click();
  await waitForStable(page, 500);
}

async function clickSidebarLink(page, groupLabel, linkLabel, expectedPath) {
  const aside = page.locator("aside");
  await ensureGroupExpanded(page, groupLabel, linkLabel);
  const link = aside.getByRole("link", { name: linkLabel, exact: true }).first();
  await link.scrollIntoViewIfNeeded();
  await waitForStable(page, 250);
  await link.click({ force: true });
  await page.waitForURL(`**${expectedPath}`, { timeout: 60000 });
  await waitForStable(page, 1000);
}

async function runDemo(browser, key, flow) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: {
      dir: TMP_DIR,
      size: VIEWPORT,
    },
  });
  const page = await context.newPage();
  const video = page.video();

  await login(page);
  await page.locator("aside").first().waitFor({ state: "visible", timeout: 60000 });
  await flow(page);

  await context.close();

  if (!video) {
    throw new Error(`No video captured for ${key}.`);
  }

  const sourcePath = await video.path();
  const targetWebm = path.join(OUTPUT_DIR, `${key}.webm`);
  const targetGif = path.join(OUTPUT_DIR, `${key}.gif`);

  await fs.copyFile(sourcePath, targetWebm);
  await convertWebmToGif(targetWebm, targetGif);

  return { webm: targetWebm, gif: targetGif };
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });
  assertFfmpegAvailable();

  const browser = await chromium.launch({ headless: true });

  try {
    log("Recording demo 1/3: Sidebar expand/collapse interaction");
    const demo1 = await runDemo(browser, "01-sidebar-expand-collapse", async (page) => {
      const aside = page.locator("aside");
      await waitForStable(page, 1000);

      await aside.getByRole("button", { name: /service operations/i }).first().click();
      await waitForStable(page, 650);
      await aside.getByRole("button", { name: /service operations/i }).first().click();
      await waitForStable(page, 650);

      await aside.getByRole("button", { name: /task management/i }).first().click();
      await waitForStable(page, 650);
      await aside.getByRole("button", { name: /task management/i }).first().click();
      await waitForStable(page, 650);

      await aside.getByRole("button", { name: /knowledge & cmdb/i }).first().click();
      await waitForStable(page, 650);
      await aside.getByRole("button", { name: /knowledge & cmdb/i }).first().click();
      await waitForStable(page, 650);

      await aside.getByRole("button", { name: /analytics/i }).first().click();
      await waitForStable(page, 650);
      await aside.getByRole("button", { name: /analytics/i }).first().click();
      await waitForStable(page, 1000);
    });
    log(`Saved: ${demo1.webm}`);
    log(`Saved: ${demo1.gif}`);

    log("Recording demo 2/3: Dashboard -> Incidents -> Problems -> Changes tour");
    const demo2 = await runDemo(browser, "02-dashboard-incidents-problems-changes-tour", async (page) => {
      await waitForStable(page, 1200);

      await clickSidebarLink(page, "Service Operations", "Incidents", "/incidents");
      await page.mouse.wheel(0, 420);
      await waitForStable(page, 600);

      await clickSidebarLink(page, "Service Operations", "Problems", "/problems");
      await page.mouse.wheel(0, 360);
      await waitForStable(page, 600);

      await clickSidebarLink(page, "Service Operations", "Changes", "/changes");
      await page.mouse.wheel(0, 360);
      await waitForStable(page, 1200);
    });
    log(`Saved: ${demo2.webm}`);
    log(`Saved: ${demo2.gif}`);

    log("Recording demo 3/3: Tasks/Workflows/Reports/Knowledge quick navigation");
    const demo3 = await runDemo(
      browser,
      "03-tasks-workflows-reports-knowledge-quick-navigation",
      async (page) => {
        await waitForStable(page, 1200);
        for (const route of ["/tasks", "/workflows", "/reports", "/knowledge"]) {
          await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
          await waitForStable(page, 1100);
        }
      }
    );
    log(`Saved: ${demo3.webm}`);
    log(`Saved: ${demo3.gif}`);
  } finally {
    await browser.close();
    await fs.rm(TMP_DIR, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
