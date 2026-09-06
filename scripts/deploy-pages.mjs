#!/usr/bin/env node

// Deploy the latest static export to Cloudflare Pages (production).
//
// Usage:
//   node scripts/deploy-pages.mjs            # build + deploy + ensure custom domain
//   node scripts/deploy-pages.mjs --no-domain  # skip the custom-domain step
//
// Secrets policy:
//   This script contains NO credentials. wrangler reads CLOUDFLARE_API_TOKEN
//   and CLOUDFLARE_ACCOUNT_ID from the environment automatically. The script
//   refuses to run (and prints which variables are missing) if they are not
//   set, and never prints their values.

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PROJECT = "what-do-you-see";
const DOMAIN = "wdus.avpclub.eu.org";
const OUT_DIR = path.resolve(process.cwd(), "out");

const skipDomain = process.argv.includes("--no-domain");

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function fail(msg) {
  console.error(`\nERROR: ${msg}`);
  process.exit(1);
}

// 0. Environment check — names only, values never touched or printed.
const missing = ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"].filter(
  (k) => !process.env[k],
);
if (missing.length > 0) {
  fail(
    `missing environment variable(s): ${missing.join(", ")}.\n` +
      "  This script stores no credentials; wrangler reads them from the\n" +
      "  environment. Export them in your shell and re-run.",
  );
}

// 1. Warn if a local `next start` server is running (build:export replaces
//    .next and would leave the running server serving dead chunks).
try {
  const listeners = execSync("ss -tlnp | grep -E ':(3103)\\b'", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (listeners.trim()) {
    console.warn(
      "WARNING: a server is listening on port 3103 (local next start?).\n" +
        "  build:export replaces .next; restart that server afterwards\n" +
        "  (npm run build && npm start -- -p 3103 -H 0.0.0.0).",
    );
  }
} catch {
  // ss not available or nothing on the port — nothing to warn about.
}

// 2. Static export build (excludes API routes by design; script stashes and
//    restores them, and cleans stale .next/dev first).
run("node scripts/build-export.mjs");

// 3. Verify the export output is sane before deploying it.
for (const f of ["index.html", "404.html"]) {
  if (!fs.existsSync(path.join(OUT_DIR, f))) fail(`out/${f} is missing after build — not deploying.`);
}
const chunks = fs.existsSync(path.join(OUT_DIR, "_next", "static"))
  ? fs.readdirSync(path.join(OUT_DIR, "_next", "static", "chunks"))
  : [];
if (chunks.length === 0) fail("out/_next/static/chunks is empty — not deploying.");
console.log(`\nVerified: out/index.html, out/404.html, ${chunks.length} static chunks.`);

// 4. Ensure the Pages project exists (idempotent).
const exists = execSync(
  `npx wrangler pages project list --json 2>/dev/null || echo '[]'`,
  { encoding: "utf8" },
)
  .trim()
  .includes(`"${PROJECT}"`);
if (!exists) {
  run(`npx wrangler pages project create ${PROJECT} --production-branch main`);
} else {
  console.log(`\nPages project "${PROJECT}" already exists.`);
}

// 5. Deploy the static export to production.
run(`npx wrangler pages deploy ${JSON.stringify(OUT_DIR)} --project-name=${PROJECT}`);

// 6. Custom domain (one-time; idempotent — a failure only means it is likely
//    already attached, so this step is non-fatal).
if (!skipDomain) {
  console.log(`\nEnsuring custom domain ${DOMAIN} (no-op if already attached):`);
  try {
    run(`npx wrangler pages domain add ${DOMAIN} --project-name=${PROJECT}`);
  } catch {
    console.warn(
      `  Could not (re-)attach ${DOMAIN} via API — it is probably already\n` +
        "  attached, or the token lacks the Pages Domains permission. Check the\n" +
        "  dashboard if the domain is not serving yet.",
    );
  }
}

console.log(`\nDeploy complete.`);
console.log(`  Primary:  https://${PROJECT}.pages.dev`);
if (!skipDomain) console.log(`  Custom:   https://${DOMAIN} (after Cloudflare certificate issuance, a few minutes)`);
console.log(`\nSuggested smoke test: fetch the home page, one example photo, and /404, then`);
console.log(`verify WebGPU + API mode in a real browser (https:// gives a secure context).`);
