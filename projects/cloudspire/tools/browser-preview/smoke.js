const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';
const SHOT_DIR = path.join(__dirname, 'screenshots');

async function launch() {
  try {
    return await chromium.launch({ channel: 'msedge', headless: true });
  } catch (err) {
    console.log('msedge not available, falling back to bundled chromium');
    return chromium.launch({ headless: true });
  }
}

async function clickAt(page, x, y) {
  const box = await page.locator('#game').boundingBox();
  await page.mouse.click(box.x + (box.width * x) / 720, box.y + (box.height * y) / 1280);
}

async function typeInto(page, text) {
  await page.waitForTimeout(120);
  await page.fill('#keyboard-input', text);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(260);
}

async function main() {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 460, height: 800 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text());
  });

  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.removeItem('cloudspire_auth_v1');
    localStorage.removeItem('cloudspire_save_v1');
  });
  await page.reload();
  await page.waitForFunction(() => {
    const scene = window.__cloudspireGame.sceneManager.current;
    return scene && scene.ready === true;
  }, null, { timeout: 20000 });
  await page.screenshot({ path: path.join(SHOT_DIR, '00-loading.png') });
  await clickAt(page, 360, 852);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SHOT_DIR, '01-auth.png') });

  await clickAt(page, 360, 554);
  await typeInto(page, '测试者');
  await clickAt(page, 360, 674);
  await typeInto(page, '110105199001011232');
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(SHOT_DIR, '02-title.png') });

  await clickAt(page, 360, 652);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOT_DIR, '03-difficulty.png') });
  await clickAt(page, 360, 367);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOT_DIR, '04-story.png') });

  await clickAt(page, 636, 1206);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(SHOT_DIR, '05-stage.png') });
  await page.waitForTimeout(7500);
  await page.screenshot({ path: path.join(SHOT_DIR, '06-stage-wave.png') });

  await clickAt(page, 680, 40);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOT_DIR, '07-pause.png') });
  await clickAt(page, 360, 531);
  await page.waitForTimeout(300);

  const blank = await page.evaluate(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let nonBlack = 0;
    for (let i = 0; i < data.length; i += 16) {
      if (data[i] + data[i + 1] + data[i + 2] > 30) nonBlack += 1;
    }
    return nonBlack < 200;
  });

  console.log('canvas blank check:', blank ? 'FAIL' : 'pass');
  console.log('console/page errors:', errors.length);
  for (const error of errors.slice(0, 5)) console.log('  ' + error);
  await browser.close();
  if (blank || errors.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
