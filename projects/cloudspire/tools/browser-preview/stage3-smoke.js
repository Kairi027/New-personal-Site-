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
  await clickAt(page, 360, 765);
  await page.waitForTimeout(300);
  await clickAt(page, 636, 1206);
  await page.waitForTimeout(800);

  const info = await page.evaluate(() => {
    const game = window.__cloudspireGame;
    game.go('stage', { mode: 'new', difficulty: 'hard', stage: 3 });
    return true;
  });
  await page.waitForTimeout(1500);

  const stageInfo = await page.evaluate(() => {
    const game = window.__cloudspireGame;
    const scene = game.sceneManager.current;
    return {
      hasScene: !!scene,
      hasStage: !!scene.stage,
      episodeCount: scene.stage ? scene.stage.episodes.length : -1,
      state: scene.state,
      enemyTypes: scene.stage ? Object.keys(scene.stage.enemyDefs).join(',') : '',
      playerAlive: scene.player ? scene.player.alive : false,
    };
  });

  const twinInfo = await page.evaluate(() => {
    const game = window.__cloudspireGame;
    const scene = game.sceneManager.current;
    scene.state = 'miniBoss';
    scene.ensureMiniBoss();
    const boss = scene.boss;
    return {
      custom: boss ? boss.custom : null,
      parts: boss && boss.parts ? boss.parts.map((p) => ({ key: p.key, hp: p.hp, x: p.x, y: p.y })) : [],
    };
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tools/browser-preview/screenshots/11-stage3-twin.png' });

  const finalInfo = await page.evaluate(() => {
    const game = window.__cloudspireGame;
    const scene = game.sceneManager.current;
    scene.state = 'boss';
    scene.ensureBoss();
    const boss = scene.boss;
    boss.update(1 / 60, scene.bullets, scene.player);
    return {
      custom: boss ? boss.custom : null,
      hp: boss ? boss.hp : 0,
      phase: boss ? boss.phase : 0,
      turrets: boss && boss.turrets ? boss.turrets.map((t) => t.side + ':' + Math.round(t.hp)) : [],
      enemyBullets: scene.bullets.enemy.length,
    };
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'tools/browser-preview/screenshots/12-stage3-finalboss.png' });

  await page.evaluate(() => {
    const game = window.__cloudspireGame;
    game.go('fakeending', { difficulty: 'hard', score: 123456 });
    return true;
  });
  await page.waitForTimeout(2500);
  const endingState = await page.evaluate(() => {
    const scene = window.__cloudspireGame.sceneManager.current;
    return { ready: scene.ready, be01: !!scene.images.be01, page: scene.page, phase: scene.phase };
  });
  await page.screenshot({ path: 'tools/browser-preview/screenshots/13-fakeending.png' });
  await page.evaluate(() => {
    const scene = window.__cloudspireGame.sceneManager.current;
    scene.page = 3;
    scene.chars = 9999;
  });
  await clickAt(page, 360, 640);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: 'tools/browser-preview/screenshots/14-fakeending-end.png' });
  const endingFinish = await page.evaluate(() => {
    const scene = window.__cloudspireGame.sceneManager.current;
    return { phase: scene.phase, timer: scene.timer };
  });

  console.log('stage info:', JSON.stringify(stageInfo));
  console.log('twin info:', JSON.stringify(twinInfo));
  console.log('final info:', JSON.stringify(finalInfo));
  console.log('ending info:', JSON.stringify(endingState), JSON.stringify(endingFinish));
  console.log('console/page errors:', errors.length);
  for (const error of errors.slice(0, 8)) console.log('  ' + error);
  await browser.close();

  const ok =
    stageInfo.hasStage &&
    stageInfo.episodeCount === 20 &&
    stageInfo.enemyTypes.indexOf('D') !== -1 &&
    twinInfo.custom === 'twinGuards' &&
    twinInfo.parts.length === 2 &&
    finalInfo.custom === 'finalLord' &&
    finalInfo.hp === 21000 &&
    finalInfo.phase === 1 &&
    finalInfo.turrets.length === 2 &&
    endingState.ready === true &&
    endingState.be01 === true &&
    errors.length === 0;
  if (!ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
