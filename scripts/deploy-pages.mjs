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
const ZONE = "avpclub.eu.org";
const DOMAINS = ["wdus.avpclub.eu.org", "wdustesting.avpclub.eu.org"];
const OUT_DIR = path.resolve(process.cwd(), "out");

async function cf(endpoint, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${res.status} ${JSON.stringify(body.errors ?? body.message ?? "")}`);
  }
  return body;
}

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
  const listeners = execSync("ss -tlnp | grep -E ':(3000|3103)\\b'", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (listeners.trim()) {
    console.warn(
      "WARNING: a server is listening on port 3000/3103 (local next start?).\n" +
        "  build:export replaces .next; restart that server afterwards\n" +
        "  (npm run build && npm start).",
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

// 6. Custom domain (one-time; idempotent). wrangler CLI has no pages-domain
//    command, so this goes through the REST API directly (token from env).
//    Endpoint: POST /accounts/{acct}/pages/projects/{project}/domains with
//    body {"name": "<domain>"} ("name", not "domain" — the legacy
//    /custom-domains endpoint was removed from the public API).
//    Zone is on Cloudflare nameservers, so a proxied CNAME to the pages.dev
//    alias is enough for Cloudflare to verify + issue the TLS certificate.
if (!skipDomain) {
  try {
    const acctId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const projBase = `accounts/${acctId}/pages/projects/${PROJECT}`;

    const zoneRes = await cf(`zones?status=active&name=${ZONE}`);
    const zone = zoneRes.result?.[0];
    if (!zone) throw new Error(`zone ${ZONE} not found in this account`);

    const listed = await cf(`${projBase}/domains`);
    const attached = listed.result ?? [];
    const target = `${PROJECT}.pages.dev`;

    for (const domain of DOMAINS) {
      console.log(`\nEnsuring custom domain ${domain} (no-op if already attached):`);
      const existing = attached.find((d) => d.name === domain);
      if (existing) {
        console.log(`  Already attached (status: ${existing.status}).`);
        continue;
      }
      const recs = await cf(`zones/${zone.id}/dns_records?name=${domain}`);
      const rec = recs.result[0];
      if (rec?.type === "CNAME" && rec?.content === target) {
        console.log("  DNS CNAME already in place.");
      } else if (rec) {
        await cf(`zones/${zone.id}/dns_records/${rec.id}`, {
          method: "PUT",
          body: JSON.stringify({ type: "CNAME", content: target, proxied: true }),
        });
        console.log(`  Replaced existing record ${rec.type} -> CNAME ${target} (proxied).`);
      } else {
        await cf(`zones/${zone.id}/dns_records`, {
          method: "POST",
          body: JSON.stringify({ type: "CNAME", name: domain, content: target, proxied: true, ttl: 1 }),
        });
        console.log(`  Created CNAME ${domain} -> ${target} (proxied).`);
      }
      const add = await cf(`${projBase}/domains`, {
        method: "POST",
        body: JSON.stringify({ name: domain }),
      });
      console.log(`  Attached domain (status: ${add.result?.status ?? "?"}).`);
    }
  } catch (e) {
    console.warn(
      `  Custom-domain step failed: ${e.message}\n` +
        "  Check the Cloudflare dashboard if a domain is not serving yet.",
    );
  }
}

console.log(`\nDeploy complete.`);
console.log(`  Primary:  https://${PROJECT}.pages.dev`);
if (!skipDomain) for (const d of DOMAINS) console.log(`  Custom:   https://${d} (after Cloudflare certificate issuance, a few minutes)`);
console.log(`\nSuggested smoke test: fetch the home page, one example photo, and /404, then`);
console.log(`verify WebGPU + API mode in a real browser (https:// gives a secure context).`);
