import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { mkdirSync } from "node:fs";
import { ORIGIN, setup } from "./harness.mjs";

const out = process.argv[2] ?? "test/shots";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const sizes = { desktop: { width: 1440, height: 900 }, tablet: { width: 820, height: 1180 }, mobile: { width: 390, height: 844 } };
const pages = ["index.html", "puppies.html", "puppy.html?slug=juniper", "parents.html", "home.html", "journey.html", "apply.html?puppy=clover", "families.html", "faq.html", "privacy.html"];
const problems = [];

for (const [label, viewport] of Object.entries(sizes)) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await setup(context);
  for (const path of pages) {
    const page = await context.newPage();
    page.on("pageerror", (e) => problems.push(`${label} ${path}: pageerror ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("ERR_FAILED")) problems.push(`${label} ${path}: console ${m.text()}`); });
    await page.goto(`${ORIGIN}/${path}`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    // Scroll through so reveals and lazy sections run, then back up.
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1) problems.push(`${label} ${path}: horizontal overflow ${overflow}px`);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(300);
    const name = path.replace(/[^a-z0-9]+/gi, "_");
    await page.screenshot({ path: `${out}/${label}-${name}.png`, fullPage: true });
    await page.close();
  }
  await context.close();
}
await browser.close();
console.log(problems.length ? problems.join("\n") : "no problems");
