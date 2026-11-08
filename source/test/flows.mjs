import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { ORIGIN, setup } from "./harness.mjs";
const browser = await chromium.launch();
const log = (...a) => console.log(...a);
const errs = [];
const subs = [];
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
await setup(ctx, { submissions: subs });
const page = await ctx.newPage();
page.on("pageerror", (e) => errs.push(e.message));

// Application: try to continue empty, then fill each step.
await page.goto(`${ORIGIN}/apply.html?puppy=clover`);
await page.waitForSelector(".wform");
await page.click(".wform button[type=submit]");
log("empty step errors:", await page.$$eval(".wform .err", (e) => e.map((x) => x.textContent).filter(Boolean).length), "focused:", await page.evaluate(() => document.activeElement?.getAttribute("name")));
await page.fill('[autocomplete=given-name]', "Ana");
await page.fill('[autocomplete=family-name]', "Lopez");
await page.fill('[autocomplete=email]', "ana@example.com");
await page.fill('[autocomplete=tel]', "480-555-0101");
await page.click(".wform button[type=submit]");
await page.waitForTimeout(200);
log("step:", await page.textContent(".wform__stepname"));
for (const sel of await page.$$(".wform select")) { const opts = await sel.$$eval("option", (o) => o.map((x) => x.value).filter(Boolean)); await sel.selectOption(opts[0]); }
for (const ta of await page.$$(".wform textarea")) await ta.fill("A house with a fenced yard.");
await page.click(".wform button[type=submit]");
await page.waitForTimeout(200);
log("step:", await page.textContent(".wform__stepname"));
log("puppy prefill:", await page.$$eval(".wform input[type=text]", (els) => els.map((e) => e.value)));
for (const sel of await page.$$(".wform select")) { const opts = await sel.$$eval("option", (o) => o.map((x) => x.value).filter(Boolean)); await sel.selectOption(opts[0]); }
await page.click(".wform button[type=submit]");
await page.waitForSelector(".wform__done", { timeout: 5000 }).catch(() => {});
log("done:", (await page.textContent("[data-form=application]"))?.trim().slice(0, 140));
log("submitted:", JSON.stringify(subs[0]?.submission?.submissions ?? subs[0]).slice(0, 400));

// Newsletter.
await page.evaluate(() => document.querySelector("[data-form=newsletter]")?.scrollIntoView());
await page.waitForSelector("[data-form=newsletter] form");
await page.fill("[data-form=newsletter] input[type=email]", "bad");
await page.click("[data-form=newsletter] button[type=submit]");
log("newsletter errors:", await page.$$eval("[data-form=newsletter] .err", (e) => e.map((x) => x.textContent).filter(Boolean)));
await page.fill("[data-form=newsletter] input[type=email]", "ana@example.com");
await page.check("[data-form=newsletter] input[type=checkbox]");
await page.click("[data-form=newsletter] button[type=submit]");
await page.waitForSelector("[data-form=newsletter] .wform__done");
log("newsletter done; submissions:", subs.length);

// Puppies filters and empty state.
await page.goto(`${ORIGIN}/puppies.html`);
await page.waitForSelector(".pup");
log("count:", await page.textContent("[data-count]"));
await page.click('label.chip:has(input[name=breed][value=Morkie])');
await page.waitForTimeout(300);
log("morkie:", await page.$$eval(".pup .pup__name", (e) => e.map((x) => x.textContent)), page.url());
await page.click('label.chip:has(input[name=sex][value=Boy])');
await page.waitForTimeout(300);
log("empty:", await page.textContent(".empty h3"));
await page.click("[data-reset]");
await page.waitForTimeout(300);
log("after reset:", await page.$$eval(".pup", (e) => e.length));

// Menu.
await page.click(".menu-toggle");
log("menu open:", await page.evaluate(() => document.documentElement.classList.contains("menu-open")), "focus:", await page.evaluate(() => document.activeElement?.textContent));
await page.keyboard.press("Escape");
log("menu closed:", !(await page.evaluate(() => document.documentElement.classList.contains("menu-open"))));

// Profile not found and gallery/lightbox.
await page.goto(`${ORIGIN}/puppy.html?slug=nope`);
await page.waitForSelector(".empty");
log("not found:", await page.textContent(".empty h3"));
await page.goto(`${ORIGIN}/puppy.html?slug=juniper`);
await page.click(".gallery__main");
log("lightbox:", await page.getAttribute(".lightbox", "class"), await page.textContent(".lightbox__count"));
await page.keyboard.press("ArrowRight");
log("lightbox next:", await page.textContent(".lightbox__count"));
await page.keyboard.press("Escape");
log("hero gl with reduced motion:", await page.goto(`${ORIGIN}/`).then(() => page.waitForTimeout(1500)).then(() => page.$eval("[data-hero]", (e) => e.className)));
log("price text anywhere:", await page.evaluate(() => /\$\d/.test(document.body.innerText)));

// Forms fail to load, and no puppies at all.
const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await setup(ctx2, { failForms: true, emptyPuppies: true });
const p2 = await ctx2.newPage();
await p2.goto(`${ORIGIN}/apply.html`);
await p2.waitForSelector(".wform__formerr");
log("form fail:", await p2.textContent(".wform__formerr"));
await p2.goto(`${ORIGIN}/puppies.html`);
await p2.waitForSelector(".empty");
log("no puppies:", await p2.textContent(".empty h3"));
log("errors:", errs);
await browser.close();
