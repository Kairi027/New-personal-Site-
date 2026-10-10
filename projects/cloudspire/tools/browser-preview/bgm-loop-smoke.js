const { chromium } = require('playwright');

const BASE = process.env.PREVIEW_BASE || 'http://localhost:5173';

async function launch() {
  const args = ['--autoplay-policy=no-user-gesture-required', '--mute-audio'];
  for (const channel of ['msedge', 'chrome', undefined]) {
    try {
      return await chromium.launch(channel ? { channel, headless: true, args } : { headless: true, args });
    } catch (err) {
      console.log(`launch failed (${channel || 'bundled'}): ${err.message.split('\n')[0]}`);
    }
  }
  throw new Error('no chromium available');
}

async function main() {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 460, height: 800 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));

  await page.goto(BASE);
  await page.waitForFunction(() => {
    const game = window.__cloudspireGame;
    const scene = game && game.sceneManager.current;
    return scene && scene.ready === true;
  }, null, { timeout: 30000 });

  const report = await page.evaluate(async () => {
    const audio = window.__cloudspireGame.audio;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    audio.unlock();
    await sleep(300);

    const entries = [
      ['title', 'playTitleBgm'],
      ['stage1', 'playStageBgm'],
      ['stage2', 'playStage2Bgm'],
      ['stage3', 'playStage3Bgm'],
      ['stage4', 'playStage4Bgm'],
      ['boss4', 'playBoss4Bgm'],
      ['he', 'playHeBgm'],
    ];

    // every BGM must request loop and survive several full passes
    const loops = [];
    for (const [label, method] of entries) {
      audio[method]();
      await sleep(200);
      const track = audio.current;
      const info = { label, src: track && track.src, loop: null, ended: false };
      if (track && track.source) {
        info.loop = track.source.loop;
        const source = track.source;
        let endedDuringPlayback = false;
        source.addEventListener('ended', () => {
          endedDuringPlayback = true;
        });
        source.playbackRate.value = 40;
        await sleep(6000); // > 2 passes of the longest BGM at 40x
        source.playbackRate.value = 1;
        info.ended = endedDuringPlayback;
      }
      loops.push(info);
      // stopping a source fires `ended` later, so the flag above is captured as a value
      audio.stopBgm();
      await sleep(150);
    }

    // a runtime that drops the loop flag must still not leave the BGM silent
    audio.playStage4Bgm();
    await sleep(250);
    const stage4 = audio.current;
    const before = stage4.source;
    before.playbackRate.value = 60;
    before.loop = false;
    await sleep(5000);
    const after = stage4.source;
    const resurrected = !!after && after !== before && after.loop === true && audio.current === stage4;
    if (after) after.playbackRate.value = 1;

    return { loops, resurrected };
  });

  const failures = [];
  for (const row of report.loops) {
    if (row.loop !== true || row.ended) failures.push(`${row.label} (${row.src}) loop=${row.loop} ended=${row.ended}`);
  }
  if (!report.resurrected) failures.push('stage4 BGM did not recover after the loop flag was dropped');
  if (errors.length) failures.push(...errors);

  console.log(JSON.stringify({ report, errors }, null, 2));
  await browser.close();
  if (failures.length) {
    console.error('BGM LOOP SMOKE FAILED:\n' + failures.join('\n'));
    process.exit(1);
  }
  console.log('BGM LOOP SMOKE OK');
}

main().catch((err) => {
  console.error('BGM LOOP SMOKE FAILED', err);
  process.exit(1);
});
