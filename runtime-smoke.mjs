import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, firefox } from 'playwright';

const STORAGE_KEY = 'mars1.portal.data.v1';
const TIMER_KEY = 'mars1.portal.timer.v1';

function parseTimerText(text) {
  const [mm, ss] = text.trim().split(':').map(Number);
  return (mm * 60) + ss;
}

function contentTypeFor(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.woff2')) return 'font/woff2';
  return 'application/octet-stream';
}

async function startStaticServer() {
  const root = process.cwd();
  const server = http.createServer(async (req, res) => {
    try {
      const rawPath = (req.url || '/').split('?')[0];
      const safePath = decodeURIComponent(rawPath === '/' ? '/index.html' : rawPath);
      const filePath = path.resolve(root, `.${safePath}`);
      if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentTypeFor(filePath) });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}`;
  return { server, url };
}

async function fillSection2(page) {
  await page.fill('#fullName', 'Alex Carter');
  await page.fill('#email', 'alex.carter@example.com');
  await page.selectOption('#specialisation', 'Geomatics');
  await page.fill('#university', 'UPV');
  await page.fill('#country', 'Spain');
  await page.fill('#linkedin', 'https://www.linkedin.com/in/alex-carter');
  const unitText = await page.locator('#unitIdText').textContent();
  assert.match((unitText || '').trim(), /^UNIT-[A-Z0-9]{8}$/);
  return (unitText || '').trim();
}

async function fillSection3(page) {
  await page.fill('#summary', 'Motivated geomatics graduate focused on spatial analysis, field data workflows, and mission-ready reporting for interdisciplinary teams.');
  await page.click('button[data-next="4"]');
  await page.waitForSelector('#section-4.active');
}

async function fillSection4(page) {
  await page.fill('#section-4 .entry-card input[data-field="institution"]', 'Polytechnic University of Valencia');
  await page.fill('#section-4 .entry-card input[data-field="degree"]', 'BSc Geomatics Engineering');
  await page.fill('#section-4 .entry-card input[data-field="startYear"]', '2022');
  await page.fill('#section-4 .entry-card input[data-field="endYear"]', '2026');
  await page.fill('#section-4 .entry-card input[data-field="grade"]', '8.7/10');
  const modulesInput = page.locator('#section-4 .modules-holder .tag-input-wrap input').first();
  await modulesInput.fill('Remote Sensing');
  await modulesInput.press('Enter');
  await page.click('button[data-next="5"]');
  await page.waitForSelector('#section-5.active');
}

async function fillSection5(page) {
  await page.fill('#section-5 .entry-card input[data-field="title"]', 'Campus GNSS Control Network');
  await page.fill('#section-5 .entry-card input[data-field="role"]', 'Lead Surveyor');
  await page.fill('#section-5 .entry-card input[data-field="period"]', '2025');

  const toolsInput = page.locator('#section-5 .project-tools .tag-input-wrap input').first();
  await toolsInput.fill('QGIS');
  await toolsInput.press('Enter');
  await toolsInput.fill('GNSS receivers');
  await toolsInput.press('Enter');

  await page.selectOption('#section-5 .entry-card select[data-field="actionVerb"]', 'Conducted');
  await page.fill('#section-5 .entry-card input[data-field="did"]', 'Conducted topographic control point calibration');
  await page.fill('#section-5 .entry-card input[data-field="toolsText"]', 'GNSS receivers and QGIS');
  await page.fill('#section-5 .entry-card input[data-field="outcome"]', 'improved positional consistency by 18%');

  const bullet = (await page.locator('#section-5 .entry-card textarea[data-field="bullet"]').inputValue()).trim();
  assert.ok(bullet.length > 20);

  await page.click('button[data-next="6"]');
  await page.waitForSelector('#section-6.active');
}

async function fillSection6(page) {
  await page.getByRole('button', { name: 'QGIS' }).first().click();
  await page.getByRole('button', { name: 'Python' }).first().click();
  await page.fill('#customSkillInput', 'PostgreSQL/PostGIS');
  await page.press('#customSkillInput', 'Enter');

  const selectedCount = await page.locator('#selectedSkillsList .tag').count();
  assert.ok(selectedCount >= 3);

  await page.click('button[data-next="7"]');
  await page.waitForSelector('#section-7.active');
}

async function fillSection7(page) {
  await page.click('#addLanguageBtn');
  const cards = page.locator('#languagesContainer .entry-card');
  const count = await cards.count();
  const second = cards.nth(count - 1);
  await second.locator('input[data-field="language"]').fill('Spanish');
  await second.locator('select[data-field="level"]').selectOption('Native');

  await page.click('button[data-next="8"]');
  await page.waitForSelector('#section-8.active');
}

async function fillSection8(page) {
  await page.getByRole('button', { name: 'Team leadership' }).click();
  await page.getByRole('button', { name: 'Project management' }).click();
  await page.fill('#customSoftSkill', 'Public speaking');

  const counter = await page.locator('#softCounter').textContent();
  assert.match(counter || '', /2\/5 selected/);

  await page.click('button[data-next="9"]');
  await page.waitForSelector('#section-9.active');
}

async function verifyPreview(page, unitId) {
  const previewText = await page.locator('#cvPreview').textContent();
  assert.ok((previewText || '').includes('Alex Carter'));
  assert.ok((previewText || '').includes(unitId));
  assert.ok((previewText || '').includes('Geomatics'));
}

async function verifyPersistenceAndTimer(page) {
  const beforeReload = await page.evaluate(({ storageKey, timerKey }) => {
    const app = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const timer = JSON.parse(localStorage.getItem(timerKey) || '{}');
    return {
      fullName: app?.personal?.fullName,
      currentStep: app?.currentStep,
      timerStart: timer?.startedAt
    };
  }, { storageKey: STORAGE_KEY, timerKey: TIMER_KEY });

  assert.equal(beforeReload.fullName, 'Alex Carter');
  assert.equal(beforeReload.currentStep, 9);
  assert.ok(Number.isFinite(beforeReload.timerStart));

  const t1 = parseTimerText(await page.locator('#timer').textContent());
  await page.waitForTimeout(2200);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#section-9.active');
  const t2 = parseTimerText(await page.locator('#timer').textContent());

  const afterReload = await page.evaluate(({ storageKey, timerKey }) => {
    const app = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const timer = JSON.parse(localStorage.getItem(timerKey) || '{}');
    return {
      fullName: app?.personal?.fullName,
      currentStep: app?.currentStep,
      timerStart: timer?.startedAt
    };
  }, { storageKey: STORAGE_KEY, timerKey: TIMER_KEY });

  assert.equal(afterReload.fullName, 'Alex Carter');
  assert.equal(afterReload.currentStep, 9);
  assert.equal(afterReload.timerStart, beforeReload.timerStart);
  assert.ok(t2 <= t1 - 1, `Timer did not continue countdown: before=${t1}, after=${t2}`);
}

async function verifySubmissionAndDownload(page) {
  await page.click('button[data-next="10"]');
  await page.waitForSelector('#section-10.active');
  await page.click('#startSubmissionBtn');

  await page.waitForSelector('#submissionOverlay.active', { timeout: 5000 });
  await page.waitForSelector('#downloadDocxBtn', { timeout: 55000 });
  await page.waitForFunction(
    () => {
      const t = document.querySelector('#terminal');
      return !!t &&
        t.textContent.includes('CANDIDATE: Alex Carter') &&
        t.textContent.includes('SPECIALISATION: Geomatics') &&
        t.textContent.includes('Transmission End.');
    },
    undefined,
    { timeout: 45000 }
  );
  await page.waitForFunction(() => typeof window.docx !== 'undefined', undefined, { timeout: 60000 });

  const terminalText = await page.locator('#terminal').textContent();
  assert.ok((terminalText || '').includes('CANDIDATE: Alex Carter'));
  assert.ok((terminalText || '').includes('SPECIALISATION: Geomatics'));

  await page.evaluate(() => {
    window.__docxBlobCount = 0;
    window.__docxBlobSize = 0;
    window.__lastDownloadName = '';
    window.__lastAlert = '';
    if (!window.__origCreateObjectURL) {
      window.__origCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = function patchedCreateObjectURL(blob) {
        window.__docxBlobCount += 1;
        window.__docxBlobSize = blob?.size || 0;
        return window.__origCreateObjectURL.call(this, blob);
      };
    }
    if (!window.__origAnchorClick) {
      window.__origAnchorClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function patchedClick() {
        window.__lastDownloadName = this.download || '';
        return window.__origAnchorClick.call(this);
      };
    }
    if (!window.__origAlert) {
      window.__origAlert = window.alert;
      window.alert = function patchedAlert(message) {
        window.__lastAlert = String(message || '');
      };
    }
  });

  let exportTriggered = false;
  for (let i = 0; i < 60; i++) {
    await page.click('#downloadDocxBtn');
    await page.waitForTimeout(500);
    exportTriggered = await page.evaluate(() => {
      return (window.__docxBlobCount > 0 && window.__docxBlobSize > 0 && window.__lastDownloadName.endsWith('.docx')) || !!window.__lastAlert;
    });
    if (exportTriggered) break;
  }

  assert.ok(exportTriggered, 'DOCX export did not trigger after repeated clicks.');

  const diag = await page.evaluate(() => ({
    count: window.__docxBlobCount,
    size: window.__docxBlobSize,
    name: window.__lastDownloadName,
    alert: window.__lastAlert,
    hasDocx: typeof window.docx !== 'undefined'
  }));

  assert.equal(diag.alert, '', `DOCX export raised alert: ${diag.alert}`);
  assert.ok(diag.count > 0);
  assert.ok(diag.size > 0);
  assert.ok(diag.name.startsWith('MARS1_Application_Alex_Carter'));
  assert.ok(diag.name.endsWith('.docx'));

  await page.click('#reviewCvBtn');
  await page.waitForSelector('#section-9.active');
}

async function runFor(browserType, browserName, appUrl) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 980 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[console] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(`[pageerror] ${err.message}`);
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.includes('unpkg.com/docx') || url.includes('cdnjs.cloudflare.com') || url.includes('fonts.googleapis.com')) {
      consoleErrors.push(`[requestfailed] ${url} :: ${req.failure()?.errorText || 'unknown'}`);
    }
  });

  await page.goto(appUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#introView.active');
  await page.click('#accessPortalBtn');
  await page.waitForSelector('#section-2.active');

  const unitId = await fillSection2(page);
  await page.click('button[data-next="3"]');
  await page.waitForSelector('#section-3.active');

  await fillSection3(page);
  await fillSection4(page);
  await fillSection5(page);
  await fillSection6(page);
  await fillSection7(page);
  await fillSection8(page);
  await verifyPreview(page, unitId);
  await verifyPersistenceAndTimer(page);
  await verifySubmissionAndDownload(page);

  const unexpectedErrors = consoleErrors.filter((msg) => {
    const isKnownDocxPrimaryFailure =
      msg.includes('unpkg.com/docx@8.5.0/build/index.js :: net::ERR_BLOCKED_BY_ORB') ||
      msg.includes('unpkg.com/docx@8.5.0/build/index.js :: NS_ERROR_CORRUPTED_CONTENT') ||
      (msg.includes('unpkg.com/docx@8.5.0/build/index.js') && msg.includes('MIME type') && msg.includes('nosniff'));
    return !isKnownDocxPrimaryFailure;
  });

  if (unexpectedErrors.length) {
    throw new Error(`${browserName} console errors:\n${unexpectedErrors.join('\n')}`);
  }

  await context.close();
  await browser.close();
}

async function main() {
  const { server, url } = await startStaticServer();
  const results = [];

  try {
    for (const [type, name] of [[chromium, 'chromium'], [firefox, 'firefox']]) {
      process.stdout.write(`Running smoke test in ${name}...\n`);
      await runFor(type, name, `${url}/index.html`);
      results.push(name);
      process.stdout.write(`${name}: PASS\n`);
    }

    process.stdout.write(`All runtime smoke tests passed: ${results.join(', ')}\n`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
