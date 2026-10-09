#!/usr/bin/env node
'use strict';

/*
 * i18n-check — E0 dictionary CI (task 822).
 * Compares language dictionaries per repo, fails on key drift or schema
 * violations per the glossary conventions (docs/i18n/glossary.md):
 *   - identical key sets across locales (no missing / extra keys),
 *   - dot-nested keys with lowerCamelCase segments (stable identifiers),
 *   - ICU plural shapes carry the CLDR categories the locale needs
 *     (pl: one/few/many/other, en: one/other).
 * Zero runtime dependencies. Reads <cwd>/i18n.check.json; a missing config means
 * "no check" (exit 0). If SOME locales have dictionaries and others do not,
 * that is a failure — the tool exists to catch drift the moment it appears.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = 'i18n.check.json';
const PLURAL_CATEGORIES = { pl: ['one', 'few', 'many', 'other'], en: ['one', 'other'] };
const KEY_SEGMENT = /^[a-z][A-Za-z0-9]*$/;
const ICU_PLURAL = /\{\s*[a-zA-Z0-9_]+,\s*plural\b/;
const ICU_CATEGORY = /\b(one|few|many|other|=\d+)\s*\{/g;

function readConfig() {
  const file = path.join(process.cwd(), CONFIG_FILE);
  if (!fs.existsSync(file)) {
    console.log(`i18n-check: no ${CONFIG_FILE} in repo root — nothing to check.`);
    return null;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function globToRegex(pattern) {
  const base = pattern.split('*')[0];
  const dir = base.includes('/') ? base.slice(0, base.lastIndexOf('/')) : '.';
  const suffix = pattern.slice(base.lastIndexOf('*'));
  const rx = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$');
  return { dir, suffix, rx };
}

function expand(pattern) {
  const { dir, rx } = globToRegex(pattern);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => {
      const rel = dir === '.' ? f : `${dir}/${f}`;
      return f.endsWith('.json') && f !== CONFIG_FILE && rx.test(rel);
    })
    .map((f) => path.join(process.cwd(), dir, f))
    .sort();
}

function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length > 0) {
      flatten(v, key, out);
    } else {
      out[key] = v;
    }
  }
  return out;
}

function resolveLocale(entries, locale) {
  const found = [];
  const missing = [];
  for (const f of entries) {
    if (f.includes('*')) {
      const hits = expand(f);
      if (hits.length === 0) missing.push(`pattern "${f}"`);
      else found.push(...hits);
    } else {
      const p = path.join(process.cwd(), f);
      if (fs.existsSync(p)) found.push(p);
      else missing.push(`file "${f}"`);
    }
  }
  return { found: [...new Set(found)].sort(), missing };
}

function parseAll(files) {
  const merged = {};
  for (const p of files) {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
      console.error(`i18n-check: FAILED\n  - cannot parse ${path.relative(process.cwd(), p)}: ${e.message}`);
      process.exit(1);
    }
    Object.assign(merged, parsed);
  }
  return flatten(merged, '', {});
}

function icuErrors(value, key, locale) {
  const out = [];
  if (typeof value !== 'string') return out;
  const unquoted = value.replace(/'[^']*'/g, '');
  if (!ICU_PLURAL.test(unquoted)) return out;
  const categories = PLURAL_CATEGORIES[locale];
  const present = [...unquoted.matchAll(ICU_CATEGORY)].map((m) => m[1]);
  for (const c of categories) {
    if (!present.includes(c)) out.push(`key "${key}" (${locale}): ICU plural misses category "${c}"`);
  }
  return out;
}

function main() {
  const config = readConfig();
  if (!config) return;
  const dictionaries = config.dictionaries || {};
  const locales = Object.keys(dictionaries).filter(Boolean);
  if (locales.length < 2) {
    console.error(`i18n-check: FAILED\n  - ${CONFIG_FILE} needs at least two locales; got [${locales.join(', ')}]`);
    process.exit(1);
  }
  const unsupported = locales.filter((l) => !(l in PLURAL_CATEGORIES));
  if (unsupported.length) {
    console.error(`i18n-check: FAILED\n  - unsupported locales (no CLDR category table): ${unsupported.join(', ')}`);
    process.exit(1);
  }

  const flat = {};
  const resolved = {};
  let totalFound = 0;
  for (const loc of locales) {
    const entries = Array.isArray(dictionaries[loc]) ? dictionaries[loc] : [dictionaries[loc]];
    if (entries.length === 0) continue;
    const r = resolveLocale(entries, loc);
    resolved[loc] = r;
    totalFound += r.found.length;
  }

  if (totalFound === 0) {
    console.log('i18n-check: no dictionaries present yet — skipping; E1-E3 adds them.');
    return;
  }
  const problems = [];
  for (const loc of locales) {
    const r = resolved[loc];
    if (!r) continue;
    if (r.found.length === 0) problems.push(`${loc}: no dictionary (${r.missing.join(', ')})`);
    else if (r.missing.length) problems.push(`${loc}: missing declared files: ${r.missing.join(', ')}`);
  }
  if (problems.length) {
    console.error('i18n-check: FAILED');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  for (const loc of locales) {
    if (resolved[loc]) flat[loc] = parseAll(resolved[loc].found);
  }

  const base = locales[0];
  const baseKeys = Object.keys(flat[base]).sort();
  const errors = [];
  for (const loc of locales.slice(1)) {
    const keys = Object.keys(flat[loc]).sort();
    const missingKeys = baseKeys.filter((k) => !(k in flat[loc]));
    const extraKeys = keys.filter((k) => !(k in flat[base]));
    if (missingKeys.length) errors.push(`${loc}: missing keys vs ${base}: ${missingKeys.join(', ')}`);
    if (extraKeys.length) errors.push(`${loc}: extra keys not in ${base}: ${extraKeys.join(', ')}`);
  }
  for (const loc of locales) {
    for (const [key, value] of Object.entries(flat[loc])) {
      if (key.split('.').some((s) => !KEY_SEGMENT.test(s))) {
        errors.push(`${loc}: key "${key}" violates lowerCamelCase dot-nested format`);
      }
      errors.push(...icuErrors(value, key, loc));
    }
  }

  if (errors.length === 0) {
    console.log(`i18n-check: OK — [${locales.join('/')}], ${baseKeys.length} keys, no drift, schema clean.`);
  } else {
    console.error('i18n-check: FAILED');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

main();