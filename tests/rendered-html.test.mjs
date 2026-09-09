import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("uses the standard Next.js runtime expected by Vercel", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("package.json", projectRoot), "utf8"),
  );

  assert.equal(packageJson.scripts.dev, "next dev");
  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(packageJson.scripts.start, "next start");
  assert.equal(packageJson.dependencies.next, "^16.3.3");
  assert.equal(packageJson.devDependencies.vinext, undefined);
  assert.equal(packageJson.devDependencies.wrangler, undefined);
});

test("the production build contains every public route", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL(".next/server/app-paths-manifest.json", projectRoot),
      "utf8",
    ),
  );

  assert.equal(manifest["/page"], "app/page.js");
  assert.equal(manifest["/create/page"], "app/create/page.js");
  assert.equal(manifest["/signin/page"], "app/signin/page.js");
  assert.equal(manifest["/signup/page"], "app/signup/page.js");
});

test("the prerendered home page contains the cinema experience", async () => {
  const html = await readFile(
    new URL(".next/server/app/index.html", projectRoot),
    "utf8",
  );

  assert.match(html, /Turn scripts into/);
  assert.match(html, /Interactive 3D scene preview/);
  assert.match(html, /Explore the 3D demo/);
  assert.match(html, /Google Cloud Agent Builder/);
  assert.match(html, /Replit MCP/);
  assert.match(html, /href="\/create"/);
});


test("the create route serves the local screenplay generator", async () => {
  const html = await readFile(new URL(".next/server/app/create.html", projectRoot), "utf8");
  assert.match(html, /Your screenplay/);
  assert.match(html, /Camera viewpoints/);
  assert.match(html, /No billing is needed/);
  assert.match(html, /Generate with Gemini/);
  assert.match(html, /REPLIT MCP/);
  assert.match(html, /Detected in this scene/);
});
