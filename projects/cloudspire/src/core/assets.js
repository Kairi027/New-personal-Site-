const ASSETS = {
  player: 'assets/images/web/player.png',
  enemy_s: 'assets/images/web/enemy_s.png',
  enemy_m: 'assets/images/web/enemy_m.png',
  enemy_h: 'assets/images/web/enemy_h.png',
  enemy_tuxi: 'assets/images/web/enemy_tuxi.png',
  enemy_hudun: 'assets/images/web/enemy_hudun.png',
  enemy_juji: 'assets/images/web/enemy_juji.png',
  enemy_fengwei_a: 'assets/images/web/enemy_fengwei_a.png',
  enemy_fengwei_b: 'assets/images/web/enemy_fengwei_b.png',
  boss: 'assets/images/web/boss.png',
  boss2: 'assets/images/web/boss2.png',
  boss3: 'assets/images/web/boss3.png',
  bullets: 'assets/images/bullets.png',
  mountain_bg: 'assets/images/mountain_bg.png',
  player_bullet: 'assets/images/player_bullet.png',
  enemy_bullet_small: 'assets/images/enemy_bullet_small.png',
  enemy_bullet_medium: 'assets/images/enemy_bullet_medium.png',
  enemy_bullet_large: 'assets/images/enemy_bullet_large.png',
  boss_bullet_1: 'assets/images/boss_bullet_1.png',
  boss_bullet_2: 'assets/images/boss_bullet_2.png',
  boss_bullet_3: 'assets/images/boss_bullet_3.png',
  boss_bullet_4: 'assets/images/boss_bullet_4.png',
  boss_bullet_5: 'assets/images/boss_bullet_5.png',
  boss_bullet_6: 'assets/images/boss_bullet_6.png',
  boss3_bullet_1: 'assets/images/boss3_bullet_1.png',
  boss3_bullet_2: 'assets/images/boss3_bullet_2.png',
  boss3_bullet_3: 'assets/images/boss3_bullet_3.png',
  boss3_bullet_4: 'assets/images/boss3_bullet_4.png',
  boss3_bullet_5: 'assets/images/boss3_bullet_5.png',
  boss3_bullet_6: 'assets/images/boss3_bullet_6.png',
  be01: 'assets/images/web/be01.jpg',
  be02: 'assets/images/web/be02.jpg',
  be03: 'assets/images/web/be03.jpg',
  be04: 'assets/images/web/be04.jpg',
  he00: 'assets/images/he00.jpg',
  he01: 'assets/images/he01.jpg',
  he02: 'assets/images/he02.jpg',
  he03: 'assets/images/he03.jpg',
  he04: 'assets/images/he04.jpg',
  he05: 'assets/images/he05.jpg',
  enemy_es: 'assets/images/web/enemy_es.png',
  enemy_em: 'assets/images/web/enemy_em.png',
  enemy_eh: 'assets/images/web/enemy_eh.png',
  enemy_ek: 'assets/images/web/enemy_ek.png',
  enemy_en: 'assets/images/web/enemy_en.png',
  enemy_ed: 'assets/images/web/enemy_ed.png',
  ufo_m: 'assets/images/web/ufo_m.png',
  ufo_l: 'assets/images/web/ufo_l.png',
  ufo_gen: 'assets/images/web/ufo_gen.png',
  meteor_small: 'assets/images/web/meteor_small.png',
  meteor_medium: 'assets/images/web/meteor_medium.png',
  meteor_large: 'assets/images/web/meteor_large.png',
  mothership: 'assets/images/web/mothership.png',
  boss_laser: 'assets/images/boss_laser.png',
};

function loadImage(path) {
  return new Promise((resolve) => {
    const wxApi = typeof wx !== 'undefined' ? wx : null;
    let image;
    if (wxApi && wxApi.createImage) {
      image = wxApi.createImage();
    } else if (typeof Image !== 'undefined') {
      image = new Image();
    } else {
      resolve(null);
      return;
    }
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = path;
  });
}

async function loadAssets(callback, onProgress) {
  const images = {};
  const entries = Object.entries(ASSETS);
  let loaded = 0;
  await Promise.all(
    entries.map(async ([key, path]) => {
      images[key] = await loadImage(path);
      loaded += 1;
      if (onProgress) onProgress({ loaded, total: entries.length });
    })
  );
  if (callback) callback(images);
  return images;
}

module.exports = {
  ASSETS,
  loadImage,
  loadAssets,
};
