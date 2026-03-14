#!/usr/bin/env node
/**
 * AtlasAiDev Tracker Data Comprehensive Analysis
 * Analyzes all 3 exported CSV tables for business insights.
 *
 * Usage: node analyze-tracker-data.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DOWNLOADS = path.join(process.env.USERPROFILE || 'C:/Users/ASUS', 'Downloads');
const OWN_PLUGINS = new Set([
  'Text To Speech TTS', 'AtlasAR', 'AtlasVoice', 'AR Try-On', 'Text To Speech TTS Pro'
]);

// Simple CSV parser that handles quoted fields with commas
function parseCSVLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(field);
        field = '';
      } else {
        field += ch;
      }
    }
  }
  fields.push(field);
  return fields;
}

async function readCSV(filename) {
  const filepath = path.join(DOWNLOADS, filename);
  const rows = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filepath, { encoding: 'utf-8' }),
    crlfDelay: Infinity
  });
  let headers = null;
  for await (const line of rl) {
    const fields = parseCSVLine(line);
    if (!headers) {
      headers = fields;
    } else {
      const obj = {};
      for (let i = 0; i < headers.length; i++) {
        obj[headers[i]] = fields[i] || '';
      }
      rows.push(obj);
    }
  }
  return rows;
}

// Stream-based reader for large CSV (details table - 315MB)
async function streamCSV(filename, callback) {
  const filepath = path.join(DOWNLOADS, filename);
  const rl = readline.createInterface({
    input: fs.createReadStream(filepath, { encoding: 'utf-8' }),
    crlfDelay: Infinity
  });
  let headers = null;
  let count = 0;
  let buffer = '';
  let inMultiline = false;

  for await (const line of rl) {
    if (!headers) {
      headers = parseCSVLine(line);
      continue;
    }

    // Handle multiline JSON fields - count quotes
    buffer += (buffer ? '\n' : '') + line;
    const quoteCount = (buffer.match(/"/g) || []).length;

    if (quoteCount % 2 !== 0) {
      inMultiline = true;
      continue;
    }

    inMultiline = false;
    const fields = parseCSVLine(buffer);
    buffer = '';

    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = fields[i] || '';
    }
    callback(obj);
    count++;
    if (count % 5000 === 0) {
      process.stdout.write(`  Processed ${count} records...\r`);
    }
  }

  // Handle any remaining buffer
  if (buffer) {
    const fields = parseCSVLine(buffer);
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = fields[i] || '';
    }
    callback(obj);
    count++;
  }

  return count;
}

function parseSerializedPHP(details) {
  const result = {};
  if (!details) return result;

  const extract = (key) => {
    const re = new RegExp(`"${key}";s:\\d+:"([^"]+)"`, 'i');
    const m = details.match(re);
    return m ? m[1] : null;
  };

  result.reason_id = extract('reason_id');
  result.locale = extract('locale');
  result.wp_version = extract('wp_version') || (() => {
    // Try the wp section version
    const m = details.match(/"version";s:\d+:"(\d+\.\d+[^"]*)"/);
    return m ? m[1] : null;
  })();
  result.php_version = extract('php_version');
  result.software = extract('software');
  result.mysql_version = extract('mysql_version');
  result.memory_limit = extract('memory_limit');
  result.multisite = extract('multisite');
  result.ip_address = extract('ip_address');
  result.plugin_version = (() => {
    // Get plugin version (last "version" match usually)
    const matches = [...details.matchAll(/"version";s:\d+:"([^"]+)"/g)];
    return matches.length > 0 ? matches[matches.length - 1][1] : null;
  })();

  return result;
}

function counter(arr) {
  const c = {};
  for (const item of arr) {
    c[item] = (c[item] || 0) + 1;
  }
  return c;
}

function topN(counterObj, n = 20) {
  return Object.entries(counterObj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function majorMinor(version) {
  if (!version) return 'unknown';
  const m = version.match(/^(\d+\.\d+)/);
  return m ? m[1] : 'unknown';
}

// ============================================================
// ANALYSIS 1: Tracking table (installs)
// ============================================================
async function analyzeTracking() {
  console.log('='.repeat(80));
  console.log('ANALYSIS 1: TRACKING TABLE (INSTALLS)');
  console.log('='.repeat(80));

  const rows = await readCSV('wpxr_plugin_tracking.csv');
  console.log(`\nTotal rows: ${rows.length}`);

  const own = rows.filter(r => OWN_PLUGINS.has(r.plugin));
  console.log(`Own plugin rows: ${own.length}`);

  const tts = own.filter(r => r.plugin === 'Text To Speech TTS');

  // Repeat installs
  console.log('\n--- REPEAT INSTALLS (same email, multiple records) ---');
  const emailCounts = counter(tts.map(r => r.admin_email));
  const repeats = Object.entries(emailCounts).filter(([, c]) => c > 1);
  console.log(`Unique emails: ${Object.keys(emailCounts).length}`);
  console.log(`Emails with multiple installs: ${repeats.length}`);
  const topRepeats = repeats.sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log('Top repeat installers:');
  for (const [email, count] of topRepeats) {
    console.log(`  ${email}: ${count} installs`);
  }

  // Repeat site URLs
  console.log('\n--- REPEAT SITES (same URL, multiple records) ---');
  const siteCounts = counter(tts.map(r => r.url));
  const repeatSites = Object.entries(siteCounts).filter(([, c]) => c > 1);
  console.log(`Unique site URLs: ${Object.keys(siteCounts).length}`);
  console.log(`Sites with multiple installs: ${repeatSites.length}`);
  const topRepeatSites = repeatSites.sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log('Top repeat sites:');
  for (const [url, count] of topRepeatSites) {
    console.log(`  ${url}: ${count} installs`);
  }

  // TLD analysis
  console.log('\n--- TLD ANALYSIS (Geographic Distribution) ---');
  const tlds = {};
  for (const r of tts) {
    const url = (r.url || '').toLowerCase().replace(/\/+$/, '');
    const m = url.match(/\.([a-z]{2,6})$/);
    if (m) tlds[m[1]] = (tlds[m[1]] || 0) + 1;
  }
  console.log('Top 30 TLDs:');
  for (const [tld, count] of topN(tlds, 30)) {
    const pct = (count / tts.length * 100).toFixed(1);
    console.log(`  .${tld}: ${count} (${pct}%)`);
  }

  // Site type patterns
  console.log('\n--- SITE TYPE PATTERNS ---');
  const patterns = {
    'E-commerce (woo/shop/store)': r => /woo|shop|store|ecommerce|product/i.test(r.url),
    'Blog': r => /blog/i.test(r.url),
    'News/Media': r => /news|media|press|magazine|journal/i.test(r.url),
    'Education': r => /edu|university|school|academy|college|learn/i.test(r.url),
    'Government': r => /\.gov/i.test(r.url),
    'Religious': r => /church|mosque|temple|ministry|parish|bible/i.test(r.url),
    'Health/Medical': r => /health|medical|clinic|doctor|hospital|pharma/i.test(r.url),
    'Podcast/Audio': r => /podcast|audio|radio|music|sound/i.test(r.url),
    'Agency/Studio': r => /agency|studio|design|creative|digital/i.test(r.url),
    'Nonprofit': r => /\.org|nonprofit|charity|foundation/i.test(r.url),
  };
  for (const [label, fn] of Object.entries(patterns)) {
    const count = tts.filter(fn).length;
    const pct = (count / tts.length * 100).toFixed(1);
    console.log(`  ${label}: ${count} (${pct}%)`);
  }
}

// ============================================================
// ANALYSIS 2: Uninstall reasons
// ============================================================
async function analyzeUninstall() {
  console.log('\n' + '='.repeat(80));
  console.log('ANALYSIS 2: UNINSTALL REASONS TABLE');
  console.log('='.repeat(80));

  const rows = await readCSV('wpxr_plugin_tracking_uninstall_reason.csv');
  console.log(`\nTotal rows: ${rows.length}`);

  const tts = rows.filter(r => r.plugin === 'Text To Speech TTS');
  console.log(`TTS uninstall rows: ${tts.length}`);

  const parsed = tts.map(r => {
    const p = parseSerializedPHP(r.details || '');
    p.created_at = r.created_at;
    p.admin_email = r.admin_email;
    p.url = r.url;
    return p;
  });

  // PHP version
  console.log('\n--- UNINSTALLS BY PHP VERSION ---');
  const phpC = counter(parsed.map(p => majorMinor(p.php_version)));
  for (const [ver, count] of topN(phpC, 20)) {
    const pct = (count / parsed.length * 100).toFixed(1);
    console.log(`  PHP ${ver}: ${count} (${pct}%)`);
  }

  // WP version
  console.log('\n--- UNINSTALLS BY WP VERSION ---');
  const wpC = counter(parsed.map(p => majorMinor(p.wp_version)));
  for (const [ver, count] of topN(wpC, 20)) {
    const pct = (count / parsed.length * 100).toFixed(1);
    console.log(`  WP ${ver}: ${count} (${pct}%)`);
  }

  // Locale
  console.log('\n--- UNINSTALLS BY LOCALE ---');
  const locC = counter(parsed.map(p => p.locale || 'unknown'));
  for (const [loc, count] of topN(locC, 30)) {
    const pct = (count / parsed.length * 100).toFixed(1);
    console.log(`  ${loc}: ${count} (${pct}%)`);
  }

  // Web server
  console.log('\n--- UNINSTALLS BY WEB SERVER ---');
  const swC = counter(parsed.map(p => {
    const sw = (p.software || 'unknown').toLowerCase();
    if (sw.includes('apache')) return 'Apache';
    if (sw.includes('nginx')) return 'Nginx';
    if (sw.includes('litespeed')) return 'LiteSpeed';
    if (sw.includes('centos')) return 'CentOS WebPanel';
    if (sw === 'n/a' || sw === 'unknown') return 'Unknown';
    return p.software || 'Unknown';
  }));
  for (const [sw, count] of topN(swC, 15)) {
    const pct = (count / parsed.length * 100).toFixed(1);
    console.log(`  ${sw}: ${count} (${pct}%)`);
  }

  // MySQL
  console.log('\n--- UNINSTALLS BY MYSQL/MARIADB ---');
  const myC = counter(parsed.map(p => majorMinor(p.mysql_version)));
  for (const [ver, count] of topN(myC, 15)) {
    const pct = (count / parsed.length * 100).toFixed(1);
    console.log(`  ${ver}: ${count} (${pct}%)`);
  }

  // Memory limit
  console.log('\n--- MEMORY LIMIT DISTRIBUTION ---');
  const memC = counter(parsed.map(p => p.memory_limit || 'unknown'));
  for (const [mem, count] of topN(memC, 15)) {
    const pct = (count / parsed.length * 100).toFixed(1);
    console.log(`  ${mem}: ${count} (${pct}%)`);
  }

  // Multisite
  console.log('\n--- MULTISITE USAGE ---');
  const msC = counter(parsed.map(p => p.multisite || 'unknown'));
  for (const [ms, count] of topN(msC)) {
    const pct = (count / parsed.length * 100).toFixed(1);
    console.log(`  ${ms}: ${count} (${pct}%)`);
  }

  // Uninstall timing patterns
  console.log('\n--- UNINSTALL DAY OF WEEK ---');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dowC = {};
  const hourC = {};
  for (const r of tts) {
    try {
      const dt = new Date(r.created_at);
      if (!isNaN(dt)) {
        const day = days[dt.getUTCDay()];
        dowC[day] = (dowC[day] || 0) + 1;
        const h = dt.getUTCHours();
        hourC[h] = (hourC[h] || 0) + 1;
      }
    } catch (e) {}
  }
  for (const day of days) {
    const count = dowC[day] || 0;
    const pct = (count / tts.length * 100).toFixed(1);
    console.log(`  ${day}: ${count} (${pct}%)`);
  }

  console.log('\n--- UNINSTALL HOUR OF DAY (UTC) ---');
  for (let h = 0; h < 24; h++) {
    const count = hourC[h] || 0;
    const bar = '#'.repeat(Math.floor(count / 20));
    console.log(`  ${String(h).padStart(2, '0')}:00 - ${count} ${bar}`);
  }

  // Reason by locale cross-analysis
  console.log('\n--- REASON BY TOP 10 LOCALES ---');
  const localeReason = {};
  for (const p of parsed) {
    const loc = p.locale || 'unknown';
    const reason = p.reason_id || 'unknown';
    if (!localeReason[loc]) localeReason[loc] = {};
    localeReason[loc][reason] = (localeReason[loc][reason] || 0) + 1;
  }
  const topLocales = topN(locC, 10);
  for (const [loc, total] of topLocales) {
    console.log(`\n  ${loc} (n=${total}):`);
    const reasons = localeReason[loc] || {};
    for (const [reason, count] of topN(reasons, 5)) {
      const pct = (count / total * 100).toFixed(1);
      console.log(`    ${reason}: ${count} (${pct}%)`);
    }
  }

  // Plugin version at uninstall
  console.log('\n--- PLUGIN VERSION AT UNINSTALL ---');
  const verC = counter(parsed.map(p => p.plugin_version || 'unknown'));
  for (const [ver, count] of topN(verC, 20)) {
    const pct = (count / parsed.length * 100).toFixed(1);
    console.log(`  v${ver}: ${count} (${pct}%)`);
  }
}

// ============================================================
// ANALYSIS 3: Details table (JSON logs - server/WP/plugins)
// ============================================================
async function analyzeDetails() {
  console.log('\n' + '='.repeat(80));
  console.log('ANALYSIS 3: TRACKING DETAILS (Server/WP/Plugin Environment)');
  console.log('='.repeat(80));

  const phpVersions = {};
  const wpVersions = {};
  const webServers = {};
  const mysqlVersions = {};
  const locales = {};
  const multisites = {};
  const memoryLimits = {};
  const pluginCounts = [];
  const coPlugins = {};
  let wooCount = 0;
  const pageBuilders = {};
  let classicEditorCount = 0;
  const seoPlugins = {};
  const cachePlugins = {};
  const translationPlugins = {};
  let totalParsed = 0;

  console.log('Parsing details JSON (315MB file, please wait)...');

  const count = await streamCSV('wpxr_plugin_tracking_details.csv', (row) => {
    const logStr = row.log;
    if (!logStr) return;

    let log;
    try {
      log = JSON.parse(logStr);
    } catch (e) {
      return;
    }

    totalParsed++;

    // Server info
    const server = log.server || {};
    if (typeof server === 'object') {
      const phpV = majorMinor(String(server.php_version || ''));
      phpVersions[phpV] = (phpVersions[phpV] || 0) + 1;

      const mysqlV = majorMinor(String(server.mysql_version || ''));
      mysqlVersions[mysqlV] = (mysqlVersions[mysqlV] || 0) + 1;

      const sw = String(server.software || 'unknown').toLowerCase();
      let swKey;
      if (sw.includes('apache')) swKey = 'Apache';
      else if (sw.includes('nginx')) swKey = 'Nginx';
      else if (sw.includes('litespeed')) swKey = 'LiteSpeed';
      else if (sw.includes('centos')) swKey = 'CentOS WebPanel';
      else if (sw === 'n/a' || sw === 'unknown') swKey = 'Unknown';
      else swKey = server.software || 'Unknown';
      webServers[swKey] = (webServers[swKey] || 0) + 1;
    }

    // WP info
    const wp = log.wp || {};
    if (typeof wp === 'object') {
      const wpV = majorMinor(String(wp.version || ''));
      wpVersions[wpV] = (wpVersions[wpV] || 0) + 1;

      const loc = wp.locale || 'unknown';
      locales[loc] = (locales[loc] || 0) + 1;

      const ms = wp.multisite || 'unknown';
      multisites[ms] = (multisites[ms] || 0) + 1;

      const mem = wp.memory_limit || 'unknown';
      memoryLimits[mem] = (memoryLimits[mem] || 0) + 1;
    }

    // Active plugins analysis
    const active = log.active_plugins || {};
    if (typeof active === 'object' && !Array.isArray(active)) {
      const slugs = Object.keys(active);
      pluginCounts.push(slugs.length);

      for (const [slug, info] of Object.entries(active)) {
        const name = (typeof info === 'object' && info.name) ? info.name : slug;
        coPlugins[name] = (coPlugins[name] || 0) + 1;

        const sl = slug.toLowerCase();
        const nl = String(name).toLowerCase();

        // WooCommerce
        if (sl.includes('woocommerce/woocommerce')) wooCount++;

        // Page builders
        if (sl.includes('elementor/') && sl.includes('elementor')) pageBuilders['Elementor'] = (pageBuilders['Elementor'] || 0) + 1;
        else if (nl.includes('divi')) pageBuilders['Divi'] = (pageBuilders['Divi'] || 0) + 1;
        else if (sl.includes('beaver-builder')) pageBuilders['Beaver Builder'] = (pageBuilders['Beaver Builder'] || 0) + 1;
        else if (sl.includes('wpbakery') || sl.includes('js_composer')) pageBuilders['WPBakery'] = (pageBuilders['WPBakery'] || 0) + 1;
        else if (sl.includes('brizy')) pageBuilders['Brizy'] = (pageBuilders['Brizy'] || 0) + 1;

        if (sl.includes('classic-editor')) classicEditorCount++;

        // SEO
        if (sl.includes('wordpress-seo') || sl.includes('yoast')) seoPlugins['Yoast SEO'] = (seoPlugins['Yoast SEO'] || 0) + 1;
        else if (sl.includes('rank-math')) seoPlugins['Rank Math'] = (seoPlugins['Rank Math'] || 0) + 1;
        else if (sl.includes('all-in-one-seo') || sl.includes('aioseo')) seoPlugins['AIOSEO'] = (seoPlugins['AIOSEO'] || 0) + 1;
        else if (sl.includes('the-seo-framework')) seoPlugins['SEO Framework'] = (seoPlugins['SEO Framework'] || 0) + 1;

        // Cache
        if (sl.includes('wp-super-cache')) cachePlugins['WP Super Cache'] = (cachePlugins['WP Super Cache'] || 0) + 1;
        else if (sl.includes('w3-total-cache')) cachePlugins['W3 Total Cache'] = (cachePlugins['W3 Total Cache'] || 0) + 1;
        else if (sl.includes('wp-fastest-cache')) cachePlugins['WP Fastest Cache'] = (cachePlugins['WP Fastest Cache'] || 0) + 1;
        else if (sl.includes('litespeed-cache')) cachePlugins['LiteSpeed Cache'] = (cachePlugins['LiteSpeed Cache'] || 0) + 1;
        else if (nl.includes('wp rocket')) cachePlugins['WP Rocket'] = (cachePlugins['WP Rocket'] || 0) + 1;
        else if (sl.includes('autoptimize')) cachePlugins['Autoptimize'] = (cachePlugins['Autoptimize'] || 0) + 1;
        else if (sl.includes('sg-cachepress')) cachePlugins['SG Optimizer'] = (cachePlugins['SG Optimizer'] || 0) + 1;

        // Translation
        if (sl.includes('translatepress')) translationPlugins['TranslatePress'] = (translationPlugins['TranslatePress'] || 0) + 1;
        else if (sl.includes('gtranslate')) translationPlugins['GTranslate'] = (translationPlugins['GTranslate'] || 0) + 1;
        else if (sl.includes('sitepress-multilingual') || sl.includes('wpml')) translationPlugins['WPML'] = (translationPlugins['WPML'] || 0) + 1;
        else if (sl.includes('polylang')) translationPlugins['Polylang'] = (translationPlugins['Polylang'] || 0) + 1;
        else if (sl.includes('weglot')) translationPlugins['Weglot'] = (translationPlugins['Weglot'] || 0) + 1;
        else if (sl.includes('loco-translate')) translationPlugins['Loco Translate'] = (translationPlugins['Loco Translate'] || 0) + 1;
      }
    }
  });

  console.log(`\nTotal records parsed: ${totalParsed}`);

  // PHP Version
  console.log('\n--- PHP VERSION DISTRIBUTION (Active Installs) ---');
  for (const [ver, cnt] of topN(phpVersions, 15)) {
    console.log(`  PHP ${ver}: ${cnt} (${(cnt/totalParsed*100).toFixed(1)}%)`);
  }

  // WP Version
  console.log('\n--- WORDPRESS VERSION DISTRIBUTION ---');
  for (const [ver, cnt] of topN(wpVersions, 20)) {
    console.log(`  WP ${ver}: ${cnt} (${(cnt/totalParsed*100).toFixed(1)}%)`);
  }

  // Web Server
  console.log('\n--- WEB SERVER DISTRIBUTION ---');
  for (const [sw, cnt] of topN(webServers, 10)) {
    console.log(`  ${sw}: ${cnt} (${(cnt/totalParsed*100).toFixed(1)}%)`);
  }

  // MySQL
  console.log('\n--- MYSQL/MARIADB VERSION ---');
  for (const [ver, cnt] of topN(mysqlVersions, 15)) {
    console.log(`  ${ver}: ${cnt} (${(cnt/totalParsed*100).toFixed(1)}%)`);
  }

  // Locale
  console.log('\n--- LOCALE/LANGUAGE DISTRIBUTION ---');
  for (const [loc, cnt] of topN(locales, 30)) {
    console.log(`  ${loc}: ${cnt} (${(cnt/totalParsed*100).toFixed(1)}%)`);
  }

  // Multisite
  console.log('\n--- MULTISITE USAGE ---');
  for (const [ms, cnt] of topN(multisites)) {
    console.log(`  ${ms}: ${cnt} (${(cnt/totalParsed*100).toFixed(1)}%)`);
  }

  // Memory
  console.log('\n--- MEMORY LIMIT ---');
  for (const [mem, cnt] of topN(memoryLimits, 15)) {
    console.log(`  ${mem}: ${cnt} (${(cnt/totalParsed*100).toFixed(1)}%)`);
  }

  // Top co-installed plugins
  console.log('\n--- TOP 50 CO-INSTALLED PLUGINS ---');
  const exclude = new Set(['Text To Speech TTS', 'AtlasAR', 'AtlasVoice', 'AR Try-On', 'Text To Speech TTS Pro']);
  let printed = 0;
  for (const [name, cnt] of topN(coPlugins, 100)) {
    if (!exclude.has(name) && printed < 50) {
      console.log(`  ${name}: ${cnt} (${(cnt/totalParsed*100).toFixed(1)}%)`);
      printed++;
    }
  }

  // Plugin count stats
  console.log('\n--- PLUGINS PER SITE ---');
  if (pluginCounts.length) {
    const avg = pluginCounts.reduce((a, b) => a + b, 0) / pluginCounts.length;
    pluginCounts.sort((a, b) => a - b);
    const median = pluginCounts[Math.floor(pluginCounts.length / 2)];
    console.log(`  Average: ${avg.toFixed(1)}`);
    console.log(`  Median: ${median}`);
    console.log(`  Min: ${Math.min(...pluginCounts)}`);
    console.log(`  Max: ${Math.max(...pluginCounts)}`);
    const brackets = [[0,5],[6,10],[11,15],[16,20],[21,30],[31,50],[51,100],[101,999]];
    for (const [low, high] of brackets) {
      const cnt = pluginCounts.filter(c => c >= low && c <= high).length;
      console.log(`  ${low}-${high} plugins: ${cnt} (${(cnt/pluginCounts.length*100).toFixed(1)}%)`);
    }
  }

  // WooCommerce
  console.log('\n--- WOOCOMMERCE USAGE ---');
  console.log(`  Sites with WooCommerce: ${wooCount} (${(wooCount/totalParsed*100).toFixed(1)}%)`);

  // Page builders
  console.log('\n--- PAGE BUILDER USAGE ---');
  for (const [pb, cnt] of topN(pageBuilders)) {
    console.log(`  ${pb}: ${cnt} (${(cnt/totalParsed*100).toFixed(1)}%)`);
  }
  console.log(`  Classic Editor: ${classicEditorCount} (${(classicEditorCount/totalParsed*100).toFixed(1)}%)`);

  // SEO
  console.log('\n--- SEO PLUGIN USAGE ---');
  for (const [name, cnt] of topN(seoPlugins)) {
    console.log(`  ${name}: ${cnt} (${(cnt/totalParsed*100).toFixed(1)}%)`);
  }

  // Cache
  console.log('\n--- CACHE PLUGIN USAGE ---');
  for (const [name, cnt] of topN(cachePlugins)) {
    console.log(`  ${name}: ${cnt} (${(cnt/totalParsed*100).toFixed(1)}%)`);
  }

  // Translation
  console.log('\n--- TRANSLATION PLUGIN USAGE ---');
  for (const [name, cnt] of topN(translationPlugins)) {
    console.log(`  ${name}: ${cnt} (${(cnt/totalParsed*100).toFixed(1)}%)`);
  }
}

// Run all analyses
async function main() {
  console.log('AtlasAiDev Tracker Data - Comprehensive Analysis');
  console.log('Date: ' + new Date().toISOString().split('T')[0]);
  console.log('');

  await analyzeTracking();
  await analyzeUninstall();
  await analyzeDetails();

  console.log('\n\nALL ANALYSES COMPLETE!');
}

main().catch(console.error);
