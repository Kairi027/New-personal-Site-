const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SHOT_DIR = path.join(__dirname, 'screenshots');

async function clickAt(page, x, y) {
  const box = await page.locator('#game').boundingBox();
  await page.mouse.click(box.x + (box.width * x) / 720, box.y + (box.height * y) / 1280);
}

async function main() {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (err) {
    browser = await chromium.launch({ headless: true });
  }
  const page = await browser.newPage({ viewport: { width: 460, height: 800 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
      errors.push(msg.text());
    }
  });

  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.setItem(
      'cloudspire_auth_v1',
      JSON.stringify({ verified: true, verifiedAt: Date.now(), name: '测试者' })
    );
    localStorage.setItem(
      'cloudspire_save_v1',
      JSON.stringify({
        version: 1,
        difficulty: 'easy',
        stage: 1,
        waveIndex: 7,
        bossPhase: 1,
        hp: 100,
        maxHp: 100,
        lives: 3,
        level: 3,
        exp: 0,
        expTotal: 500,
        bombs: 3,
        score: 12000,
        claimedExtras: [],
      })
    );
  });
  await page.reload();
  await page.waitForTimeout(700);
  await clickAt(page, 360, 802);
  await page.waitForTimeout(3500);

  for (let i = 0; i < 6; i += 1) {
    await page.evaluate((index) => {
      const stage = window.__cloudspireGame.sceneManager.current;
      stage.bullets.clearEnemy();
      stage.particles.particles = [];
      stage.particles.rings = [];
      const boss = stage.boss;
      boss.skillIndex = index;
      boss.skillPhase = 'active';
      boss.skillTimer = 0;
      boss.internalTimer = 0;
      boss.rotationAngle = 0;
      boss.laserFired = false;
      boss.summoned = false;
      boss.radialRounds = 0;
      boss.trackRounds = 0;
      boss.showSpell(boss.config.skills[index].label);
    }, i);
    await page.waitForTimeout(i === 2 ? 900 : 700);
    await page.screenshot({ path: path.join(SHOT_DIR, `10-skill-${i + 1}.png`) });
  }

  console.log('console/page errors:', errors.length);
  for (const error of errors.slice(0, 5)) console.log('  ' + error);
  await browser.close();
  if (errors.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
