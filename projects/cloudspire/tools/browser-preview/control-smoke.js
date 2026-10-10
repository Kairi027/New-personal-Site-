const { chromium } = require('playwright');

async function clickAt(page, x, y) {
  const box = await page.locator('#game').boundingBox();
  await page.mouse.click(box.x + (box.width * x) / 720, box.y + (box.height * y) / 1280);
}

async function main() {
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
    if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text());
  });

  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.setItem(
      'cloudspire_auth_v1',
      JSON.stringify({ verified: true, verifiedAt: Date.now(), name: '测试者' })
    );
  });
  await page.reload();
  await page.waitForFunction(() => {
    const scene = window.__cloudspireGame.sceneManager.current;
    return scene && scene.ready === true;
  }, null, { timeout: 20000 });
  await clickAt(page, 360, 852);
  await page.waitForTimeout(500);
  await clickAt(page, 360, 652);
  await page.waitForTimeout(300);
  await clickAt(page, 360, 367);
  await page.waitForTimeout(300);
  await clickAt(page, 636, 1206);
  await page.waitForTimeout(1600);

  const before = await page.evaluate(() => {
    const player = window.__cloudspireGame.sceneManager.current.player;
    return { x: player.x, y: player.y };
  });

  const box = await page.locator('#game').boundingBox();
  const toPage = (x, y) => ({
    x: box.x + (box.width * x) / 720,
    y: box.y + (box.height * y) / 1280,
  });
  const start = toPage(300, 900);
  const end = toPage(520, 620);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i += 1) {
    await page.mouse.move(
      start.x + ((end.x - start.x) * i) / 10,
      start.y + ((end.y - start.y) * i) / 10
    );
    await page.waitForTimeout(40);
  }
  await page.mouse.up();
  await page.waitForTimeout(300);

  const after = await page.evaluate(() => {
    const player = window.__cloudspireGame.sceneManager.current.player;
    return { x: player.x, y: player.y };
  });
  const moved = Math.hypot(after.x - before.x, after.y - before.y);
  console.log('player moved px:', moved.toFixed(1), before, after);

  const hit = await page.evaluate(() => {
    const stage = window.__cloudspireGame.sceneManager.current;
    const player = stage.player;
    player.damage(1000);
    const afterHit = {
      alive: player.alive,
      lives: player.lives,
      hp: player.hp,
      scene: window.__cloudspireGame.sceneManager.current === stage ? 'stage' : 'other',
    };
    return afterHit;
  });
  await page.waitForTimeout(1800);
  const recovered = await page.evaluate(() => {
    const stage = window.__cloudspireGame.sceneManager.current;
    return {
      alive: stage.player.alive,
      lives: stage.player.lives,
      hp: stage.player.hp,
      invuln: stage.player.invuln,
    };
  });
  console.log('hit state:', hit);
  console.log('recovered state:', recovered);

  await page.waitForTimeout(2200);
  const nonLethal = await page.evaluate(() => {
    const stage = window.__cloudspireGame.sceneManager.current;
    stage.player.damage(20);
    return stage.player.hp;
  });
  console.log('non-lethal hp after 20 dmg:', nonLethal);

  console.log('console/page errors:', errors.length);
  for (const error of errors.slice(0, 5)) console.log('  ' + error);
  await browser.close();

  const ok =
    moved > 40 &&
    hit.alive === false &&
    hit.lives === 2 &&
    hit.scene === 'stage' &&
    recovered.alive === true &&
    recovered.lives === 2 &&
    nonLethal === 80 &&
    errors.length === 0;
  if (!ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
