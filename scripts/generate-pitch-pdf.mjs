import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const htmlPath = join(root, "docs", "restrohub-pitch.html");
const outDir = join(root, "docs");
const outPath = join(outDir, "RestoHub-Pitch.pdf");

mkdirSync(outDir, { recursive: true });

const html = readFileSync(htmlPath, "utf8");

let puppeteer;
try {
  puppeteer = await import("puppeteer");
} catch {
  console.error("Installing puppeteer…");
  const { execSync } = await import("node:child_process");
  execSync("npm install --no-save puppeteer", { cwd: root, stdio: "inherit" });
  puppeteer = await import("puppeteer");
}

const browser = await puppeteer.default.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle0" });
await page.emulateMediaType("print");

await page.pdf({
  path: outPath,
  format: "A4",
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  preferCSSPageSize: true,
});

await browser.close();
console.log(`PDF saved to ${outPath}`);
