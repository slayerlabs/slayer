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
 * Zero runtime dependencies. Reads <cwd>/i18n.check.json; a missing config or
 * absent dictionary files means "not checked yet" (exit 0) so E1-E3 can land
 * dictionaries without a red CI.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = 'i18n.check.json';
const PLURAL_CATEGORIES = { pl: ['one', 'few', 'many', 'other'], en: ['one', 'other'] };

function readConfig() {
  const file = path.join(process.cwd(), CONFIG_FILE);
  if (!fs.existsSync(file)) {
    console.log(`i18n-check: no ${CONFIG_FILE} in repo root — nothing to check.`);
    return null;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function expand(pattern) {
  if (!pattern.includes('*')) return [pattern];
  const dir = pattern.includes('/') ? pattern.slice(0, pattern.lastIndexOf('/')) : '.';
  const prefix = pattern.slice(pattern.lastIndexOf('/') + 1).split('*')[0];
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f.startsWith(prefix));
}

function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

function loadLocale(files) {
  const merged = {};
  for (const f of files) {
    if (!fs.existsSync(path.join(process.cwd(), f))) return null;
    Object.assign(merged, JSON.parse(fs.readFileSync(path.join(process.cwd(), f), 'utf8')));
  }
  return flatten(merged, '', {});
}

function icuErrors(value, key, locale) {
  const out = [];
  if (typeof value !== 'string' || !/{(?:[a-zA-Z0-9_]+),\s*(?:plural|select)/.test(value)) return out;
  const categories = PLURAL_CATEGORIES[locale];
  if (!categories) return out;
  const present = [...value.matchAll(/\b(?:one|few|many|other|=\d+)\s*\{/g)].map((m) => m[0].trim().split(/\s/)[0]);
  for (const c of categories) {
    if (!present.includes(c)) out.push(`key "${key}" (${locale}): ICU plural misses category "${c}"`);
  }
  return out;
}

function main() {
  const config = readConfig();
  if (!config) return;
  const dictionaries = config.dictionaries || {};
  const locales = Object.keys(dictionaries);
  if (locales.length < 2) {
    console.error(`i18n-check: ${CONFIG_FILE} needs at least two locales; got [${locales.join(', ')}]`);
    process.exit(1);
  }

  const flat = {};
  let missing = 0;
  for (const loc of locales) {
    const files = dictionaries[loc].map((p) => path.join(process.cwd(), p));
    let found = [];
    for (const f of files) {
      if (f.includes('*')) found = found.concat(expand(f));
      else if (fs.existsSync(f)) found.push(f);
    }
    if (found.length === 0) { missing += 1; continue; }
    const merged = {};
    for (const f of found) Object.assign(merged, JSON.parse(fs.readFileSync(f, 'utf8')));
    flat[loc] = flatten(merged, '', {});
  }

  if (missing > 0) {
    console.log(`i18n-check: dictionary files not present yet (${missing} locale set(s) missing) — skipping; E1-E3 adds them.`);
    return;
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
      if (key.split('.').some((s) => !/^[a-z][A-Za-z0-9]*$/.test(s))) {
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