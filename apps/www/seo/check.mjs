#!/usr/bin/env node
// SEO-CRITICAL. The one Google Search checker for every Pensieve Labs property.
// Master copy: ~/pensievelabs/seo/check.mjs. seo/sync.mjs copies it, with
// registry.json, into every repo; a vendored copy edited in place is overwritten
// and flagged as stale. Rules: ~/pensievelabs/seo/MASTER.md.
//
//   node seo/check.mjs --property <id> --dir <build output>  built HTML, no network
//   node seo/check.mjs --property <id> --live [origin]         robots, sitemaps, every listed page
//   node seo/check.mjs --all                                    home page of every live property
//   flags: --limit <n> pages (live, default 1500)  --warn-only (always exit 0)  --json <file>
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const reg = JSON.parse(readFileSync(join(HERE, 'registry.json'), 'utf8'));
const R = reg.rules;
const ORG = reg.organization;
const MASTER = process.env.PENSIEVE_SEO_MASTER || join(homedir(), 'pensievelabs', 'seo');
const UA = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const argv = process.argv.slice(2);
const has = (n) => argv.includes(`--${n}`);
const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : undefined; };

const errors = [];
const warnings = [];
let mode = 'live'; // 'dir' while reading a local build, whose env may point at local hosts
const err = (rule, where, msg) => errors.push({ rule, where, msg });
const warn = (rule, where, msg) => warnings.push({ rule, where, msg });

// ---------- registry integrity and vendored-copy drift ----------
function checkRegistry() {
  const seen = new Map();
  for (const p of reg.properties) {
    const kws = [...p.keywords, ...(p.pages || []).flatMap((x) => x.keywords)];
    for (const k of kws) {
      if (seen.has(k)) err('registry', k, `keyword owned twice: ${seen.get(k)} and ${p.id}`);
      seen.set(k, p.id);
    }
    if (!p.origin.startsWith('https://')) err('registry', p.id, `origin must be https: ${p.origin}`);
  }
  if (HERE === MASTER) return;
  for (const f of ['registry.json', 'check.mjs']) {
    const master = join(MASTER, f);
    if (existsSync(master) && readFileSync(master, 'utf8') !== readFileSync(join(HERE, f), 'utf8')) {
      err('stale', f, `differs from ${master}. Run: node ${join(MASTER, 'sync.mjs')}`);
    }
  }
}

// ---------- HTML reading ----------
const ENT = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
const attrs = (tag) => {
  const o = {};
  for (const m of tag.matchAll(/([a-zA-Z:_-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) o[m[1].toLowerCase()] = decode(m[3] ?? m[4] ?? '');
  return o;
};
const text = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

function parse(html) {
  const noSvg = html.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  const headEnd = noSvg.search(/<\/head>/i);
  const head = headEnd >= 0 ? noSvg.slice(0, headEnd) : noSvg;
  const t = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || noSvg.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const meta = {};
  for (const m of noSvg.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    const key = (a.name || a.property || '').toLowerCase();
    if (key && !(key in meta)) meta[key] = a.content ?? '';
  }
  const canon = [...noSvg.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0])).filter((a) => (a.rel || '').toLowerCase() === 'canonical');
  const ld = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const h1 = [...noSvg.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => text(m[1]));
  const links = [...noSvg.matchAll(/<a\b[^>]*>/gi)].map((m) => attrs(m[0]).href).filter(Boolean);
  const lang = (noSvg.match(/<html\b[^>]*>/i) || [''])[0].match(/\blang=/i);
  return { title: t ? text(t[1]) : '', titleInHead: Boolean(head.match(/<title/i)), meta, canon, ld, h1, links, lang: Boolean(lang) };
}

// ---------- the rules for one page ----------
const lower = (s) => (s || '').toLowerCase();
const banned = (s) => R.bannedInSearchText.filter((c) => (s || '').includes(c));
const sameSet = (a, b) => { const x = [].concat(a || []).sort(); const y = [].concat(b || []).sort(); return JSON.stringify(x) === JSON.stringify(y); };
const byId = (id) => reg.properties.find((x) => x.id === id);
const propHosts = new Set(reg.properties.map((x) => new URL(x.origin).host));

function normPath(pathname, p) {
  let s = decodeURI(pathname);
  if (p.basePath && s.startsWith(p.basePath)) s = s.slice(p.basePath.length);
  if (!s.startsWith('/')) s = `/${s}`;
  return s.length > 1 ? s.replace(/\/+$/, '') : '/';
}

function hostCheck(u, where, ctx) {
  let url;
  try { url = new URL(u); } catch { return; }
  if (!/^https?:$/.test(url.protocol)) return;
  if (R.forbiddenHosts.includes(url.host)) err('host', where, `${ctx} uses ${url.host}: ${u}`);
  else if (R.platformHostPatterns.some((re) => new RegExp(re).test(url.host))) err('host', where, `${ctx} uses a platform host: ${u}`);
  else if (url.protocol === 'http:' && propHosts.has(url.host)) err('host', where, `${ctx} uses http: ${u}`);
}

function checkJsonLd(p, where, d, isHome) {
  let website = null;
  let orgDefined = false;
  const walk = (n) => {
    if (typeof n === 'string') return /^https?:\/\//.test(n) && hostCheck(n, where, 'JSON-LD');
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== 'object') return;
    const types = [].concat(n['@type'] || []);
    if (types.some((t) => t === 'Organization' || t === 'Corporation')) {
      const id = n['@id'];
      if (id === ORG['@id']) {
        for (const k of ['name', 'legalName', 'url', 'description', 'email', 'logo']) {
          if (k in n && n[k] !== ORG[k]) err('org', where, `${k} is "${n[k]}", registry says "${ORG[k]}"`);
        }
        for (const k of ['alternateName', 'sameAs']) if (k in n && !sameSet(n[k], ORG[k])) err('org', where, `${k} differs from the registry`);
        if ('legalName' in n && 'sameAs' in n) orgDefined = true;
      } else if (!id && /^pensieve( labs)?$/i.test(n.name || '')) {
        err('org-anon', where, `an Organization named "${n.name}" without @id: reference ${ORG['@id']}`);
      } else if (id && /^https?:\/\/(www\.)?pensievelabs\.(org|com)\/?#organi[sz]ation$/.test(id)) {
        err('org-id', where, `@id ${id} is not ${ORG['@id']}`);
      }
    }
    if (types.includes('WebSite') && n.url) website = n;
    Object.values(n).forEach(walk);
  };
  for (const block of d.ld) {
    try { walk(JSON.parse(block)); } catch (e) { err('jsonld', where, `unparseable JSON-LD: ${e.message}`); }
  }
  if (!isHome) return;
  const home = `${p.origin}${p.basePath}/`;
  if (!website) err('website', where, 'home page has no WebSite node');
  else {
    if (website.name !== p.name) err('website', where, `WebSite name "${website.name}", registry says "${p.name}"`);
    if (website.url !== home) err('website', where, `WebSite url "${website.url}", expected "${home}"`);
    if (p.alternateName && !sameSet(website.alternateName, p.alternateName)) warn('website', where, 'WebSite alternateName differs from the registry');
  }
  if (p.relation === 'company' && !orgDefined) err('org', where, `home page must publish the full ${ORG['@id']} node (from the registry)`);
}

function checkPage(p, url, html, headers = {}) {
  const path = normPath(url.pathname, p);
  const where = `${p.id}${path}`;
  const d = parse(html);
  const robots = lower([d.meta.robots, d.meta.googlebot, headers['x-robots-tag']].filter(Boolean).join(','));
  const noindex = /noindex|\bnone\b/.test(robots);
  const allowed = (p.noindex || []).some((x) => path === x || path.startsWith(`${x}/`));
  if (noindex && !allowed && p.status !== 'retiring') err('noindex', where, `noindex on an indexable page (${robots})`);
  for (const h of d.links) hostCheck(h, where, 'link');
  const isHome = path === '/';
  checkJsonLd(p, where, d, isHome && !noindex);
  if (noindex) return null;

  // A page that declares another host's copy canonical is indexed there, not here:
  // only its canonical is checked. A local build may point it at a local host.
  const elsewhere = (p.canonicalElsewhere || []).find((c) => path.startsWith(c.pathPrefix) && !(c.except || []).includes(path));
  if (elsewhere) {
    const href = d.canon[0]?.href || '';
    if (!href.startsWith(`https://${elsewhere.host}/`)) (mode === 'dir' ? warn : err)('canonical', where, `expected a canonical on ${elsewhere.host}, found "${href}"`);
    return null;
  }

  const title = d.title;
  const desc = d.meta.description || '';
  if (!title) err('title', where, 'no <title>');
  else {
    if (!d.titleInHead) err('title', where, '<title> is not in <head>');
    if (title.length > R.titleMax) err('title-length', where, `${title.length} chars: ${title}`);
  }
  if (!desc) err('description', where, 'no meta description');
  else if (desc.length < R.descriptionMin || desc.length > R.descriptionMax) err('description-length', where, `${desc.length} chars: ${desc}`);
  for (const [k, v] of [['title', title], ['description', desc], ['og:title', d.meta['og:title']], ['og:description', d.meta['og:description']], ['og:site_name', d.meta['og:site_name']]]) {
    const b = banned(v);
    if (b.length) err('banned-chars', where, `${k} contains ${b.map((c) => JSON.stringify(c)).join(' ')}: ${v}`);
  }
  if (!d.meta['og:site_name']) warn('site-name', where, 'no og:site_name');
  else if (d.meta['og:site_name'] !== p.name) err('site-name', where, `og:site_name "${d.meta['og:site_name']}", registry says "${p.name}"`);

  if (d.canon.length !== 1) err('canonical', where, d.canon.length ? 'more than one canonical' : 'no canonical');
  else {
    let cu;
    try { cu = new URL(d.canon[0].href); } catch { err('canonical', where, `not absolute: ${d.canon[0].href}`); }
    const host = new URL(p.origin).host;
    if (cu && cu.protocol !== 'https:') err('canonical', where, `not https: ${cu.href}`);
    if (cu && cu.host !== host) err('canonical', where, `on ${cu.host}, expected ${host}`);
    else if (cu && normPath(cu.pathname, p) !== path) err('canonical', where, `points to ${cu.pathname}`);
    if (cu && d.meta['og:url'] && new URL(d.meta['og:url'], cu).href !== cu.href) warn('og-url', where, `og:url ${d.meta['og:url']} differs from canonical ${cu.href}`);
  }
  if (d.h1.length !== 1) warn('h1', where, `${d.h1.length} h1 elements`);
  if (!d.lang) warn('lang', where, '<html> has no lang');

  // Keyword ownership: the owner page carries its words, no other page leads with them.
  const hay = lower([title, desc, d.h1.join(' '), d.meta['og:site_name']].join(' '));
  const owned = isHome ? p.keywords : (p.pages || []).find((x) => x.path === path)?.keywords || [];
  owned.forEach((k, i) => {
    const missing = k.split(/\s+/).filter((w) => !hay.includes(w));
    if (missing.length) (i === 0 ? err : warn)('keyword', where, `"${k}" missing ${missing.join(', ')} in title, description, h1`);
  });
  const t = lower(title);
  const target = p.frontDoors && byId(p.frontDoors[path]);
  if (target) {
    for (const k of target.keywords) if (t.includes(k)) err('cannibal', where, `front door title contains "${k}", which ${target.id} owns`);
    if (target.status === 'live' && !d.links.some((h) => h.startsWith(target.origin))) err('front-door', where, `no link to ${target.origin}`);
  }
  if (isHome) {
    for (const q of reg.properties) {
      const k = q.keywords[0];
      if (q.id !== p.id && k && t.includes(k) && !p.keywords.some((own) => own.includes(k))) err('cannibal', where, `home title contains "${k}", which ${q.id} owns`);
    }
  }
  return { path, title, desc };
}

// Every file the registry lists as SEO-critical must carry the SEO-CRITICAL warning,
// so nobody edits one without being told what it controls.
function checkMarkers(p) {
  let root = HERE;
  while (!existsSync(join(root, '.git')) && dirname(root) !== root) root = dirname(root);
  for (const f of p.critical || []) {
    const file = join(root, f);
    if (!existsSync(file)) err('marker', f, 'listed as SEO-critical but missing');
    else if (!readFileSync(file, 'utf8').includes('SEO-CRITICAL')) err('marker', f, 'has no SEO-CRITICAL warning comment');
  }
}

function checkDuplicates(rows) {
  for (const key of ['title', 'desc']) {
    const m = new Map();
    for (const r of rows.filter(Boolean)) if (r[key]) m.set(r[key], [...(m.get(r[key]) || []), r.path]);
    for (const [v, paths] of m) if (paths.length > 1) err(`duplicate-${key}`, paths.slice(0, 4).join(' '), `${paths.length} pages share: ${v}`);
  }
}

// ---------- modes ----------
function walkHtml(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const f = join(dir, name);
    if (statSync(f).isDirectory()) out.push(...walkHtml(f));
    else if (name.endsWith('.html')) out.push(f);
  }
  return out;
}

function runDir(p, dir) {
  mode = 'dir';
  if (!existsSync(dir)) { err('dir', dir, 'build output not found: build first'); return; }
  const skip = /(^|\/)(_not-found|_global-error|_error|404|500|not-found)(\/index)?\.html$|(^|\/)(des|dev|api)(\/|\.html)/;
  const rows = [];
  for (const f of walkHtml(dir)) {
    const rel = relative(dir, f).split(sep).join('/');
    if (skip.test(rel)) continue;
    const path = `/${rel.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '')}`;
    const html = readFileSync(f, 'utf8');
    // Next writes a redirect or notFound() route as an error shell: not a page.
    if (/<html[^>]*id="__next_error__"/.test(html)) continue;
    rows.push(checkPage(p, new URL(`${p.origin}${p.basePath}${path}`), html));
  }
  if (!rows.length) warn('dir', dir, 'no prerendered HTML found: run --live against a local server');
  checkDuplicates(rows);
  console.log(`checked ${rows.length} built pages of ${p.id}`);
}

async function get(u) {
  try {
    const r = await fetch(u, { redirect: 'manual', headers: { 'user-agent': UA, accept: 'text/html,application/xml;q=0.9,*/*;q=0.8' } });
    return { status: r.status, headers: Object.fromEntries(r.headers), location: r.headers.get('location'), body: r.status === 200 ? await r.text() : '' };
  } catch (e) { return { status: 0, headers: {}, body: '', error: e.message }; }
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

async function runLive(p, base, limit) {
  const local = base !== p.origin;
  mode = local ? 'dir' : 'live';
  const map = (u) => (local ? u.replace(p.origin, base) : u);
  // robots.txt lives at the host root, which a basePath property does not control.
  const robots = await get(`${base}/robots.txt`);
  const sitemaps = [];
  if (robots.status !== 200) warn('robots', base, `robots.txt answered ${robots.status}`);
  else {
    let star = false;
    for (const line of robots.body.split('\n').map((l) => l.trim())) {
      if (/^user-agent:\s*\*/i.test(line)) star = true;
      else if (/^user-agent:/i.test(line)) star = false;
      if (star && /^disallow:\s*\/\s*$/i.test(line)) err('robots', base, 'robots.txt disallows the whole site');
      const s = line.match(/^sitemap:\s*(\S+)/i);
      if (s) sitemaps.push(s[1]);
    }
  }
  if (!sitemaps.length) { warn('sitemap', base, 'robots.txt names no sitemap; trying /sitemap.xml'); sitemaps.push(`${p.origin}${p.basePath}/sitemap.xml`); }
  const locs = new Set();
  const queue = [...sitemaps];
  while (queue.length) {
    const sm = queue.shift();
    const r = await get(map(sm));
    if (r.status !== 200) { err('sitemap', sm, `answered ${r.status}`); continue; }
    for (const m of r.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
      const u = decode(m[1]);
      if (/<sitemapindex/i.test(r.body)) queue.push(u);
      else locs.add(u);
    }
  }
  const list = [...locs].slice(0, limit);
  for (const u of list) if (!u.startsWith(`${p.origin}${p.basePath}`)) err('sitemap', u, `listed URL is not on ${p.origin}${p.basePath}`);
  const rows = await pool(list, 4, async (u) => {
    const r = await get(map(u));
    if (r.status !== 200) { err('status', u, r.status >= 300 && r.status < 400 ? `sitemap URL redirects to ${r.location}` : `answered ${r.status || r.error}`); return null; }
    return checkPage(p, new URL(u), r.body, r.headers);
  });
  checkDuplicates(rows);
  if (!local) {
    for (const a of p.aliases || []) {
      const r = await get(`https://${a.host}/`);
      if (![301, 308].includes(r.status) || r.location !== a.to) err('alias', a.host, `answered ${r.status} ${r.location || ''}, expected 301/308 to ${a.to}`);
    }
  }
  console.log(`crawled ${list.length} sitemap URLs of ${p.id}${locs.size > limit ? ` (of ${locs.size})` : ''}`);
}

async function runAll() {
  for (const p of reg.properties.filter((x) => x.status === 'live')) {
    const home = `${p.origin}${p.basePath}/`;
    const r = await get(home);
    if (r.status !== 200) { err('status', home, `answered ${r.status || r.error}`); continue; }
    checkPage(p, new URL(home), r.body, r.headers);
  }
  console.log(`checked the home page of ${reg.properties.filter((x) => x.status === 'live').length} live properties`);
}

function report() {
  const group = (list) => list.reduce((m, x) => m.set(x.rule, [...(m.get(x.rule) || []), x]), new Map());
  for (const [label, list] of [['ERROR', errors], ['warning', warnings]]) {
    for (const [rule, xs] of group(list)) {
      console.log(`\n${label} ${rule} (${xs.length})`);
      for (const x of xs.slice(0, 8)) console.log(`  ${x.where}  ${x.msg}`);
      if (xs.length > 8) console.log(`  ... ${xs.length - 8} more`);
    }
  }
  if (opt('json')) writeFileSync(opt('json'), JSON.stringify({ errors, warnings }, null, 1));
  console.log(`\nSEO check: ${errors.length} errors, ${warnings.length} warnings`);
  process.exit(errors.length && !has('warn-only') ? 1 : 0);
}

checkRegistry();
if (has('all')) await runAll();
else {
  const p = byId(opt('property'));
  if (!p) { console.error(`unknown --property. One of: ${reg.properties.map((x) => x.id).join(', ')}`); process.exit(2); }
  checkMarkers(p);
  if (opt('dir')) runDir(p, opt('dir'));
  if (has('live')) await runLive(p, (opt('live') || p.origin).replace(/\/$/, ''), Number(opt('limit') || 1500));
}
report();
