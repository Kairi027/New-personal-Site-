# 成品贴图命名

把透明背景 PNG 放入本目录并保持文件名一致，游戏会自动替换程序占位。当前目录已经包含从 ssets/reference/bullets.jpg 裁出的子弹贴图，覆盖同名文件即可换图。推荐单颗子弹图片以弹丸中心居中，四周留少量透明边距。

## 子弹贴图

- `player_bullet.png`：自机曳光弹。
- `enemy_bullet_small.png`：敌机小型子弹。
- `enemy_bullet_medium.png`：敌机中型子弹（重型机使用）。
- `enemy_bullet_large.png`：敌机大型子弹。
- `boss_bullet_1.png`：Boss 技能 1 旋转花弹。
- `boss_bullet_2.png`：Boss 技能 2 放射弹。
- `boss_bullet_3.png`：Boss 技能 3 激光弹（横向切片或整根竖条均可）。
- `boss_bullet_4.png`：Boss 技能 4 追踪弹。
- `boss_bullet_5.png`：Boss 技能 5 弹幕阵列。
- `boss_bullet_6.png`：Boss 技能 6 召唤敌机预留弹种。
- `boss_laser.png`：Boss 激光束贴图。

## 战机与背景贴图

- `player.png`、`enemy_s.png`、`enemy_m.png`、`enemy_h.png`、`boss.png`、`mountain_bg.png`。

## 已生成的透明战机素材

ssets/images/cut/ 内已包含从原图抠好的自机与敌机透明 PNG：player.png、nemy_s.png、nemy_m.png、nemy_h.png、oss.png，游戏默认读取该目录。

## 如果是整张精灵图

如果是包含多种子弹的一张精灵图，请把文件命名为 `bullets_sheet.png` 放入本目录，并告诉我每种子弹在精灵图中的格子位置与尺寸（例如 `boss_bullet_1 第 2 行第 3 格，64x64`），我会按坐标裁剪接入。
