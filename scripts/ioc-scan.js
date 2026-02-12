#!/usr/bin/env node
/**
 * IOC Scanner — defensive only.
 * Scans the local source tree for known indicators of compromise:
 *   - cryptominer keywords (xmrig, stratum, coinhive …)
 *   - suspicious runtime execution (child_process + curl/wget, eval, atob …)
 *   - install-time script hooks (postinstall, preinstall …)
 *   - binary blobs outside node_modules
 *
 * Usage:  node scripts/ioc-scan.js
 * Exit 0  = clean
 * Exit 1  = findings detected
 */

const fs   = require('fs');
const path = require('path');

// ── directories / extensions to skip ──────────────────────────────────────
const SKIP_DIRS = new Set([
  'node_modules', '.next', '.git', 'coverage',
  'prisma', // generated binaries are expected
]);

// Skip this scanner itself to avoid self-triggering
const SKIP_FILES = new Set([
  path.resolve(__dirname, 'ioc-scan.js'),
]);

const SCAN_EXTENSIONS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
  '.json', '.yml', '.yaml', '.sh', '.env',
  'Dockerfile', '.dockerignore',
]);

// ── IOC patterns ───────────────────────────────────────────────────────────
const PATTERNS = [
  // Crypto-mining
  { name: 'cryptominer-keyword',   re: /\b(xmrig|xmr|monero|stratum|cryptonight|cpuminer|minerd|nicehash|coinhive|hashrate)\b/i },
  { name: 'mining-pool-connect',   re: /stratum\+tcp/i },

  // Suspicious execution
  { name: 'child_process-exec',    re: /child_process.*\b(exec|spawn|fork|execSync)\b/ },
  { name: 'shell-download',        re: /(curl|wget)\s.*\|\s*(sh|bash)/ },
  { name: 'chmod-execute',         re: /chmod\s*\+x/ },
  { name: 'crontab-write',         re: /crontab\s*-/ },

  // Obfuscation / injection
  // Match standalone eval() but not method calls like redis.eval() or r.eval()
  { name: 'eval-call',             re: /(?<![.\w])eval\s*\(/ },
  { name: 'new-Function',          re: /new\s+Function\s*\(/ },
  { name: 'atob-decode',           re: /\batob\s*\(/ },
  { name: 'base64-decode',         re: /Buffer\.from\s*\(\s*['"][A-Za-z0-9+/=]{40,}/ },
  { name: 'fromCharCode',          re: /String\.fromCharCode/ },

  // Install-time hooks in package.json
  { name: 'install-hook',          re: /"(preinstall|postinstall|prepare|prepublish)"\s*:/ },
];

// ── binary file extensions that should NOT exist in src/ ──────────────────
const SUSPECT_BIN_EXT = new Set(['.so', '.dll', '.exe', '.node']);

// ── walker ─────────────────────────────────────────────────────────────────
const findings = [];

function scanFile(filePath) {
  let content;
  try { content = fs.readFileSync(filePath, 'utf8'); }
  catch (_) { return; } // skip unreadable / binary

  const lines = content.split('\n');
  lines.forEach((line, i) => {
    PATTERNS.forEach(({ name, re }) => {
      if (re.test(line)) {
        findings.push({ severity: 'WARN', rule: name, file: filePath, line: i + 1, snippet: line.trim().slice(0, 120) });
      }
    });
  });
}

function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (_) { return; }

  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);

    if (e.isDirectory()) {
      walk(full);
      continue;
    }
    if (SKIP_FILES.has(path.resolve(full))) continue;

    // check for suspect binaries in src/
    const ext = path.extname(e.name).toLowerCase();
    if (SUSPECT_BIN_EXT.has(ext) && !full.includes('node_modules')) {
      findings.push({ severity: 'INFO', rule: 'suspect-binary', file: full, line: 0, snippet: `binary file (${ext})` });
    }

    // scan text files
    if (SCAN_EXTENSIONS.has(ext) || SCAN_EXTENSIONS.has(e.name)) {
      scanFile(full);
    }
  }
}

// ── main ───────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
console.log(`[IOC-SCAN] Scanning ${ROOT} …\n`);
walk(ROOT);

if (findings.length === 0) {
  console.log('[IOC-SCAN] ✓ Clean — no indicators of compromise found.');
  process.exit(0);
} else {
  console.log('[IOC-SCAN] Findings:\n');
  console.log('Sev    | Rule                  | File:Line');
  console.log('-------+-----------------------+--------------------------------------------');
  findings.forEach(({ severity, rule, file, line, snippet }) => {
    const rel = path.relative(ROOT, file);
    console.log(`${severity.padEnd(6)} | ${rule.padEnd(21)} | ${rel}:${line}`);
    if (snippet) console.log(`       |                       |   ${snippet}`);
  });
  console.log(`\n[IOC-SCAN] ${findings.length} finding(s). Review and remediate.`);
  process.exit(1);
}
