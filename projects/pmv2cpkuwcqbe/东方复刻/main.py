# 1.头部导入库
import pygame
import random
import os # 操作系统接口库
import subprocess #进程管理库，启动和管理外部进程
import sys
import math
import traceback # 反馈错误信息


def main():
    # 只初始化一次音频与pygame
    pygame.mixer.pre_init(frequency=44100, size=-16, channels=2, buffer=512)
    pygame.init()
    pygame.mixer.set_num_channels(128)
    pygame.key.stop_text_input()

    # info = pygame.display.Info()
    # width, height = info.current_w, info.current_h
    width,height=700,700
    # 创建游戏画面
    screen = pygame.display.set_mode((width, height), pygame.DOUBLEBUF)
    pygame.display.set_caption("东方复刻")

    # 帧率控制器
    clock = pygame.time.Clock()
    FPS = 60

    # ========== 加载画面函数 ==========
    def show_loading_screen(duration=1.0):
        """显示加载画面，显示"东方复刻"标题和进度条 """
        loading = True
        progress = 0
        font_path = r"C:\Windows\Fonts\simsun.ttc"

        while loading:
            clock.tick(FPS)
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()

            # 先快后慢的进度增长
            if progress < 30:
                progress += 1.5
            elif progress < 60:
                progress += 0.8
            elif progress < 80:
                progress += 0.4
            elif progress < 95:
                progress += 0.2
            elif progress < 100:
                progress += 0.05

            if progress >= 100:
                progress = 100
                loading = False

            screen.fill((0, 0, 0))

            # 标题 - 统一显示"东方复刻"
            ft_title = pygame.font.Font(font_path, 80)
            title_render = ft_title.render("东方复刻", True, (255, 215, 0))
            title_rect = title_render.get_rect(center=(width // 2, height // 2 - 80))
            screen.blit(title_render, title_rect)

            # 进度条背景
            bar_width = 400
            bar_height = 20
            bar_x = (width - bar_width) // 2
            bar_y = height // 2 + 20
            pygame.draw.rect(screen, (60, 60, 60), (bar_x, bar_y, bar_width, bar_height))

            # 进度条填充
            fill_width = int(bar_width * (progress / 100))
            pygame.draw.rect(screen, (255, 215, 0), (bar_x, bar_y, fill_width, bar_height))

            # 进度百分比
            ft_progress = pygame.font.Font(font_path, 24)
            progress_text = ft_progress.render(f"{int(progress)}%", True, (200, 200, 200))
            progress_rect = progress_text.get_rect(center=(width // 2, bar_y + bar_height + 30))
            screen.blit(progress_text, progress_rect)

            pygame.display.flip() # 刷新，重绘画面

        # 加载完成后短暂停留
        total_frames = int(duration * FPS)
        for frame in range(total_frames):
            clock.tick(FPS)
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
            screen.fill((0, 0, 0))
            ft_title = pygame.font.Font(font_path, 80)
            title_render = ft_title.render("东方复刻", True, (255, 215, 0))
            title_rect = title_render.get_rect(center=(width // 2, height // 2 - 80))
            screen.blit(title_render, title_rect)

            bar_width = 400
            bar_height = 20
            bar_x = (width - bar_width) // 2
            bar_y = height // 2 + 20
            pygame.draw.rect(screen, (60, 60, 60), (bar_x, bar_y, bar_width, bar_height))
            pygame.draw.rect(screen, (255, 215, 0), (bar_x, bar_y, bar_width, bar_height))

            ft_progress = pygame.font.Font(font_path, 24)
            progress_text = ft_progress.render("100%", True, (200, 200, 200))
            progress_rect = progress_text.get_rect(center=(width // 2, bar_y + bar_height + 30))
            screen.blit(progress_text, progress_rect)
            pygame.display.flip()

    # 显示初始加载画面 (这个只在程序刚启动时显示)
    show_loading_screen(0.5)

    # ========== 难度配置 ==========
    DIFFICULTY_CONFIG = {
        'EASY': {'life': 50, 'ex': 20},
        'NORMAL': {'life': 30, 'ex': 15},
        'HARD': {'life': 20, 'ex': 7},
        'INSANE': {'life': 15, 'ex': 5},
        'HELL': {'life': 8, 'ex': 3}
    }

    # 默认难度
    selected_difficulty = 'NORMAL'

    # ========== 启动页面 ==========
    font_path = r"C:\Windows\Fonts\simsun.ttc"

    # 加载并播放音乐
    try:
        pygame.mixer.music.load("bgm/theme.wav")
        pygame.mixer.music.play(-1, 2)
        pygame.mixer.music.set_volume(0.6)
    except Exception as e:
        print(f"BGM加载失败: {e}")

    show_title = True
    title_timer = 0
    title_alpha = 255

    # 难度选择状态
    selecting_difficulty = False
    difficulty_index = 1  # 默认NORMAL
    difficulty_names = ['EASY', 'NORMAL', 'HARD', 'INSANE', 'HELL']

    # 主菜单选项
    menu_index = 0
    menu_options = ['START', '???', 'EXIT']

    while show_title:
        clock.tick(FPS)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if selecting_difficulty:
                        selecting_difficulty = False
                if event.key == pygame.K_UP or event.key == pygame.K_w:
                    if selecting_difficulty:
                        difficulty_index = (difficulty_index - 1) % len(difficulty_names)
                    else:
                        menu_index = (menu_index - 1) % len(menu_options)
                elif event.key == pygame.K_DOWN or event.key == pygame.K_s:
                    if selecting_difficulty:
                        difficulty_index = (difficulty_index + 1) % len(difficulty_names)
                    else:
                        menu_index = (menu_index + 1) % len(menu_options)
                elif event.key == pygame.K_RETURN or event.key == pygame.K_SPACE:
                    if selecting_difficulty:
                        selected_difficulty = difficulty_names[difficulty_index]
                        show_title = False
                    else:
                        if menu_index == 0:  # START
                            selecting_difficulty = True
                        elif menu_index == 1:  # VPATCH
                            try:
                                vpatch_path = r"real\vpatch.exe"

                                # 静音
                                current_volume = pygame.mixer.music.get_volume()
                                pygame.mixer.music.set_volume(0)

                                # 启动 vpatch.exe（非阻塞）
                                os.startfile(vpatch_path)
                                print("已启动 vpatch.exe")

                                # 立即恢复音量（因为 os.startfile 不会阻塞，音乐继续播放）
                                # 如果你希望 vpatch 窗口打开期间音乐静音，可以使用 subprocess.Popen 并等待
                                # 但这里使用 os.startfile 无法检测窗口何时关闭，所以直接恢复

                            except Exception as e:
                                print(f"启动 vpatch.exe 失败: {e}")
                                pygame.mixer.music.set_volume(current_volume)  # 恢复音量
                        elif menu_index == 2:  # EXIT
                            pygame.quit()
                            sys.exit()
        # 标题渐变效果
        title_timer += 1
        if title_timer > 30 and title_timer < 60:
            title_alpha = 255 - (title_timer - 30) * 8
        elif title_timer >= 60:
            title_timer = 0
            title_alpha = 255

        screen.fill((0, 0, 0))

        if not selecting_difficulty:
            # 主标题
            ft_title = pygame.font.Font(font_path, 80)
            title_text = ft_title.render("东方复刻", True, (255, 215, 0))
            title_text.set_alpha(title_alpha)
            title_rect = title_text.get_rect(center=(width // 2, height // 2 - 100))
            screen.blit(title_text, title_rect)

            # 副标题
            ft_sub = pygame.font.Font(font_path, 30)
            sub_text = ft_sub.render("v2.58", True, (200, 200, 200))
            sub_rect = sub_text.get_rect(center=(width // 2, height // 2 - 40))
            screen.blit(sub_text, sub_rect)

            # 菜单选项 enumerate() 同时返回索引和元素值
            for i, option in enumerate(menu_options):
                y_pos = height // 2 + 20 + i * 50
                if i == menu_index:
                    color = (255, 215, 0)
                    prefix = "▶ "
                else:
                    color = (200, 200, 200)
                    prefix = "  "

                ft_option = pygame.font.Font(font_path, 30)
                option_text = ft_option.render(f"{prefix}{option}", True, color)
                option_rect = option_text.get_rect(center=(width // 2, y_pos))
                screen.blit(option_text, option_rect)

        else:
            # 难度选择界面
            ft_title = pygame.font.Font(font_path, 60)
            title_text = ft_title.render("选择难度", True, (255, 215, 0))
            title_rect = title_text.get_rect(center=(width // 2, height // 2 - 180))
            screen.blit(title_text, title_rect)

            ft_note = pygame.font.Font(font_path, 18)
            note_text = ft_note.render("↑ ↓ 选择  ENTER/SPACE 确认  ESC 返回", True, (200, 200, 200))
            note_rect = note_text.get_rect(center=(width // 2, height // 2 - 130))
            screen.blit(note_text, note_rect)

            # 显示所有难度选项
            for i, name in enumerate(difficulty_names):
                y_pos = height // 2 - 60 + i * 50
                config = DIFFICULTY_CONFIG[name]

                # 高亮当前选中的选项
                if i == difficulty_index:
                    color = (255, 215, 0)
                    prefix = "▶ "
                else:
                    color = (200, 200, 200)
                    prefix = "  "

                ft_option = pygame.font.Font(font_path, 30)
                option_text = ft_option.render(
                    f"{prefix}{name}  (Life: {config['life']}  EX: {config['ex']})",
                    True, color
                )
                option_rect = option_text.get_rect(center=(width // 2, y_pos))
                screen.blit(option_text, option_rect)

        ft_copyright = pygame.font.Font(font_path, 14)
        copyright_text1 = ft_copyright.render("请勿未经允许用于商用", True, (150, 150, 150))
        copyright_text2 = ft_copyright.render("Do not use for commercial purposes without permission", True,
                                              (150, 150, 150))
        rect1 = copyright_text1.get_rect(center=(width // 2, height - 40))
        rect2 = copyright_text2.get_rect(center=(width // 2, height - 20))
        screen.blit(copyright_text1, rect1)
        screen.blit(copyright_text2, rect2)

        pygame.display.flip()

    # 应用难度设置
    difficulty_config = DIFFICULTY_CONFIG[selected_difficulty]
    max_hp = difficulty_config['life']
    hp = max_hp
    EX_MAX_COUNT = difficulty_config['ex']
    ex_count = EX_MAX_COUNT

    print(f"难度: {selected_difficulty}, 生命: {max_hp}, EX: {EX_MAX_COUNT}")

    MISSION_SHOW_TIME = 2 * FPS
    mission_timer = 0
    # EX清怪后的延迟再生计时器
    ex_respawn_timer = 0
    EX_RESPAWN_DELAY = 2 * FPS  # 2秒延迟

    # ========== EX必杀系统 ==========
    EX_FLASH_TIME = 1 * FPS  # 白闪1秒
    EX_DURATION = 7 * FPS
    ex_flash_timer = 0
    ex_power_timer = 0

    # 背景渐变（第一关：蓝色）
    bg_blue_max = 100
    bg_blue_min = 0
    bg_blue_val = bg_blue_max
    bg_blue_step = 0.5
    bg_darken = True

    # 第二关背景渐变（灰色 -> 暗灰色 -> 黑色 -> 暗灰色 -> 灰色）
    bg_gray_max = 150
    bg_gray_min = 30
    bg_gray_val = bg_gray_max
    bg_gray_step = 0.5
    bg_gray_darken = True

    # 第三关背景（岩浆红）- 不再使用，改为黑色
    bg_red_val = 180
    bg_red_target = 220
    bg_red_step = 1

    # 打雷
    lightning_timer = 0
    lightning_interval = random.randint(8, 12) * FPS
    lightning_flash_frames = 0
    LIGHTNING_FLASH_MAX = 80
    thunder_played = False  # 标记当前雷声是否已播放

    # 星空（第一关使用）
    stars = []
    for _ in range(160):
        x = random.randint(0, width)
        y = random.randint(0, height)
        speed = random.uniform(0.4, 2.2)
        size = random.randint(1, 3)
        stars.append([x, y, speed, size])

    # 月亮参数
    moon_x = width * 0.75
    moon_y = height * 0.12
    moon_radius = 45
    moon_glow_radius = 70

    # ========== 雨滴系统（第二关） ==========
    raindrops = []
    for _ in range(300):
        x = random.randint(0, width)
        y = random.randint(-height, height)
        speed = random.uniform(7, 16)
        length = random.randint(8, 22)
        wind_offset = random.uniform(-1.5, 0.5)
        raindrops.append([x, y, speed, length, wind_offset])

    # ========== 岩浆气泡系统（第三关 - 俯视图火山） ==========
    lava_bubbles_left = []
    for _ in range(40):
        x = width * 0.15 + random.randint(-40, 40)
        y = random.randint(0, height)
        radius = random.randint(4, 10)
        speed = random.uniform(0.8, 2)
        phase = random.uniform(0, 2 * math.pi)
        lava_bubbles_left.append([x, y, radius, speed, phase])

    lava_bubbles_right = []
    for _ in range(40):
        x = width * 0.85 + random.randint(-40, 40)
        y = random.randint(0, height)
        radius = random.randint(4, 10)
        speed = random.uniform(0.8, 2)
        phase = random.uniform(0, 2 * math.pi)
        lava_bubbles_right.append([x, y, radius, speed, phase])

    # 颜色
    WHITE = (255, 255, 255)
    RED = (255, 0, 0)
    BLUE = (0, 0, 255)
    BLACK = (0, 0, 0)
    GRAY = (128, 128, 128)
    BOSS_RED = (200, 20, 20)
    BULLET_ORANGE = (255, 170, 0)
    MOON_COLOR = (255, 240, 210)
    MOON_GLOW = (180, 200, 255)
    LAVA_COLOR = (255, 100, 20)
    LAVA_DARK = (180, 50, 10)
    ROCK_COLOR = (60, 40, 30)

    # 音效加载
    def load_sound(path, vol=0.4):
        try:
            snd = pygame.mixer.Sound(path)
            snd.set_volume(vol)
            return snd
        except Exception as e:
            print(f"音效 {path} 加载失败，静音替代: {e}")
            return None

    SND_SHOOT = load_sound("sound/shoot.mp3", 1)
    SND_ENEMY_DEATH = load_sound("sound/enemy_death.mp3", 1)
    SND_BOSS_HIT = load_sound("sound/boss_hit.mp3", 1)
    SND_THUNDER = load_sound("sound/thunder.mp3", 3)

    def play_sound(sound_obj):
        if sound_obj is not None:
            sound_obj.play()

    # 贴图加载
    def load_img(path, w=None, h=None):
        try:
            img = pygame.image.load(path).convert_alpha()
            if w and h:
                img = pygame.transform.scale(img, (w, h))
            return img
        except Exception as err:
            print(f"素材 {path} 加载失败，启用纯色替代: {err}")
            if "player" in path:
                surf = pygame.Surface((40, 50)).convert_alpha()
                surf.fill(BLUE)
            elif "bullet" in path:
                surf = pygame.Surface((6, 18)).convert_alpha()
                surf.fill(WHITE)
            elif "enemy2" in path:
                surf = pygame.Surface((35, 45)).convert_alpha()
                surf.fill((0, 200, 0))
            elif "enemy" in path:
                surf = pygame.Surface((35, 45)).convert_alpha()
                surf.fill(RED)
            elif "enemy3" in path:
                surf = pygame.Surface((35, 45)).convert_alpha()
                surf.fill((255, 100, 0))
            elif "enemy4" in path:
                surf = pygame.Surface((50, 55)).convert_alpha()
                surf.fill((150, 0, 255))
            elif "enemy4bullet" in path:
                surf = pygame.Surface((12, 12)).convert_alpha()
                surf.fill((255, 0, 255))
            elif "dark_boss" in path:
                surf = pygame.Surface((70, 70)).convert_alpha()
                surf.fill((80, 0, 80))
            elif "dark_boss2" in path:
                surf = pygame.Surface((80, 80)).convert_alpha()
                surf.fill((50, 0, 100))
            elif "darkbossbullet" in path:
                surf = pygame.Surface((22, 22)).convert_alpha()
                surf.fill((150, 0, 200))
            elif "darkboss2bullet" in path:
                surf = pygame.Surface((18, 30)).convert_alpha()
                surf.fill((200, 0, 200))
            elif "darkboss2bullet2" in path:
                surf = pygame.Surface((16, 32)).convert_alpha()
                surf.fill((180, 50, 180))
            elif "boss2bullet2" in path:
                surf = pygame.Surface((14, 30)).convert_alpha()
                surf.fill((100, 50, 200))
            elif "boss2bullet" in path:
                surf = pygame.Surface((16, 28)).convert_alpha()
                surf.fill((160, 0, 220))
            elif "boss" in path:
                surf = pygame.Surface((60, 60)).convert_alpha()
                surf.fill(BOSS_RED)
            elif "boss2" in path:
                surf = pygame.Surface((70, 70)).convert_alpha()
                surf.fill((100, 100, 255))
            elif "bossbullet" in path:
                surf = pygame.Surface((20, 20)).convert_alpha()
                surf.fill(BULLET_ORANGE)
            elif "unknown" in path:
                surf = pygame.Surface((80, 80)).convert_alpha()
                surf.fill((255, 215, 0))
            elif "dark_player" in path:
                surf = pygame.Surface((60, 70)).convert_alpha()
                surf.fill((100, 0, 100))
            else:
                surf = pygame.Surface((30, 30)).convert_alpha()
                surf.fill((200, 200, 200))
            return surf

    IMG_PLAYER = load_img("img/player.png", 40, 50)
    IMG_BULLET = load_img("img/bullet.png", 6, 18)
    IMG_ENEMY = load_img("img/enemy.png", 35, 45)
    IMG_ENEMY2 = load_img("img/enemy2.jpeg", 35, 45)
    IMG_ENEMY3 = load_img("img/enemy3.jpg", 35, 45)
    IMG_ENEMY4 = load_img("img/enemy4.jpeg", 50, 55)
    IMG_ENEMY4_BULLET = load_img("img/enemy4bullet.png", 12, 12)
    IMG_DARK_BOSS = load_img("img/dark_boss.png", 70, 70)
    IMG_DARK_BOSS2 = load_img("img/dark_boss2.png", 80, 80)
    IMG_DARK_BOSS_BULLET = load_img("img/darkbossbullet.png", 22, 22)
    IMG_DARK_BOSS2_BULLET = load_img("img/darkboss2bullet.png", 18, 30)
    IMG_DARK_BOSS2_BULLET2 = load_img("img/darkboss2bullet2.png", 16, 32)
    IMG_BOSS = load_img("img/boss.png", 60, 60)
    IMG_BOSS2 = load_img("img/boss2.png", 70, 70)
    IMG_BOSS_BULLET = load_img("img/bossbullet.png", 20, 20)
    IMG_BOSS2_BULLET = load_img("img/boss2bullet.png", 16, 28)
    IMG_BOSS2_BULLET2 = load_img("img/boss2bullet2.png", 14, 30)
    IMG_PLAYER_PIC = load_img("img/player_pic.png", 40, 50)
    IMG_UNKNOWN = load_img("img/unknown.webp", 80, 80)
    IMG_DARK_PLAYER = load_img("img/dark_player.png", 60, 70)

    # 分数
    score = 0

    # 字体
    font = pygame.font.Font(font_path, 16)
    gameover_font = pygame.font.Font(font_path, 80)
    score_font = pygame.font.Font(font_path, 40)

    # 无敌帧
    invincible_frame = 0
    INVINCIBLE_SEC = 4
    INVINCIBLE_FRAME_TOTAL = INVINCIBLE_SEC * FPS

    # ========== 关卡过渡系统 ==========
    stage_transition = False  # 是否正在显示关卡标题过渡
    stage_transition_timer = 0
    STAGE_TRANSITION_DELAY = 2 * FPS
    stage_title = ""

    # 阶段标记
    stage2 = False
    stage3 = False

    # 关卡加载状态
    is_loading_stage = True  # 初始为True，进入第一关前先加载图二
    need_spawn_after_load = False  # 标记加载图二完成后是否生怪并转图三

    # BOSS1参数
    kill_enemy_target = 30
    kill_enemy_count = 0
    boss_exist = False
    boss_max_hp = 120
    boss_current_hp = boss_max_hp
    boss_move_timer = 0
    BOSS_DOWN_TIME_FRAME = 20 * FPS
    boss_shot_timer = 0
    BOSS_SHOT_INTERVAL = 5 * FPS

    # BOSS2参数
    kill_enemy2_target = 50
    kill_enemy2_count = 0
    boss2_exist = False
    boss2_max_hp = 160
    boss2_current_hp = boss2_max_hp
    BOSS2_MOVE_SPEED = 2
    # 召唤敌机
    BOSS2_SPAWN_ENEMY2_DELAY = 2 * FPS
    BOSS2_SPAWN_ENEMY2_INTERVAL = 15 * FPS

    # 散射
    BOSS2_SCATTER_DELAY = 5 * FPS
    BOSS2_SCATTER_INTERVAL = 10 * FPS

    # 直射
    BOSS2_DOWN_BULLET_DELAY = 9 * FPS
    BOSS2_DOWN_BULLET_INTERVAL = 10 * FPS
    BOSS2_SCATTER_GAP = int(0.8 * FPS)

    # ========== 第三关参数 ==========
    kill_enemy3_target = 50
    kill_enemy3_count = 0
    enemy3_spawn_timer = 0
    ENEMY3_SPAWN_INTERVAL = 15
    # 双BOSS生成计时器
    dark_boss_spawn_timer = 0

    # enemy4 参数
    enemy4_spawned = False
    enemy4_hp = [30, 30, 30]
    enemy4_max_hp = 30
    enemy4_shot_timer = [0, 0, 0]
    ENEMY4_SHOT_INTERVAL = 2 * FPS
    enemy4_death_count = 0

    # 双BOSS参数
    dark_boss_exist = False
    dark_boss2_exist = False
    dark_boss_hp = 200
    dark_boss_max_hp = 200
    dark_boss2_hp = 200
    dark_boss2_max_hp = 200
    dark_boss_move_timer = 0
    dark_boss_shot_timer = 0
    DARK_BOSS_SHOT_INTERVAL = 1.5 * FPS
    dark_boss_defeated = False
    dark_boss2_defeated = False

    # ========== 隐藏BOSS阶段 ==========
    hidden_boss_phase = False
    giant_enemy3_spawn_timer = 0
    GIANT_ENEMY3_SPAWN_INTERVAL = 20
    giant_enemy3_kill_count = 0
    GIANT_ENEMY3_TARGET = 5

    hidden_boss_exist = False
    hidden_boss_hp = 999999999
    hidden_boss_max_hp = 999999999
    hidden_boss_transformed = False
    hidden_boss_transform_timer = 0

    # ========== 通关状态 ==========
    game_clear = False
    clear_timer = 0
    clear_phase = 0  # 0=显示MISSION3 COMPLETE, 1=显示EXCELLENT
    CLEAR_PHASE1_DURATION = 2 * FPS  # 2秒

    game_over = False
    mission_complete = False
    mission2_complete = False
    mission2_timer = 0
    MISSION2_SHOW_TIME = 2 * FPS
    mission3_complete = False
    mission3_timer = 0
    MISSION3_SHOW_TIME = 2 * FPS

    # ========== 暂停状态 ==========
    game_paused = False
    pause_menu_index = 0
    pause_options = ['CONTINUE', 'BACK MENU']

    # -----------------------玩家类------------------------
    class Player(pygame.sprite.Sprite):
        def __init__(self):
            super().__init__()
            self.image = IMG_PLAYER
            self.rect = self.image.get_rect()
            self.rect.centerx = width / 2
            self.rect.bottom = height - 30
            self.speed = 7

        def update(self):
            key = pygame.key.get_pressed()
            if key[pygame.K_LEFT] and self.rect.left > 0:
                self.rect.x -= self.speed
            if key[pygame.K_RIGHT] and self.rect.right < width:
                self.rect.x += self.speed
            if key[pygame.K_UP] and self.rect.top > 0:
                self.rect.y -= self.speed
            if key[pygame.K_DOWN] and self.rect.bottom < height:
                self.rect.y += self.speed

        def shoot_normal(self):
            b = Bullet(self.rect.centerx, self.rect.top)
            all_sprites.add(b)
            bullets.add(b)
            play_sound(SND_SHOOT)

        def shoot_ex(self):
            angle_list = [-10, 0, 10]
            cx = self.rect.centerx
            cy = self.rect.top
            for ang in angle_list:
                rad = math.radians(ang)
                b = Bullet(cx, cy)
                b.vx = math.sin(rad) * 10
                b.vy = -math.cos(rad) * 10
                all_sprites.add(b)
                bullets.add(b)
            play_sound(SND_SHOOT)

    # -------------------------子弹类----------------------------
    class Bullet(pygame.sprite.Sprite):
        def __init__(self, x, y):
            super().__init__()
            self.image = IMG_BULLET
            self.rect = self.image.get_rect(center=(x, y))
            self.vx = 0
            self.vy = -10

        def update(self):
            self.rect.x += self.vx
            self.rect.y += self.vy
            if self.rect.bottom < 0 or self.rect.left < 0 or self.rect.right > width:
                self.kill()

    # -------------------------第一关敌机类----------------------------
    class Enemy(pygame.sprite.Sprite):
        def __init__(self):
            super().__init__()
            self.image = IMG_ENEMY
            self.rect = self.image.get_rect()
            self.rect.x = random.randint(0, width - self.rect.width)
            self.rect.y = random.randint(-100, -40)
            self.speed = random.randint(3, 6)

        def update(self):
            self.rect.y += self.speed
            if self.rect.top > height:
                self.rect.x = random.randint(0, width - self.rect.width)
                self.rect.y = random.randint(-100, -40)

    # -------------------------第二关敌机enemy2----------------------------
    class Enemy2(pygame.sprite.Sprite):
        boss2_exist = False

        def __init__(self):
            super().__init__()
            self.image = IMG_ENEMY2
            self.rect = self.image.get_rect()
            self.rect.x = random.randint(0, width - self.rect.width)
            self.rect.y = random.randint(-100, -40)
            self.speed = random.randint(2, 5)

        def update(self):
            self.rect.y += self.speed
            if self.rect.top > height:
                if Enemy2.boss2_exist:
                    self.kill()
                else:
                    self.rect.x = random.randint(0, width - self.rect.width)
                    self.rect.y = random.randint(-100, -40)

    # ===================== 第三关敌机 enemy3 =====================
    class Enemy3(pygame.sprite.Sprite):
        def __init__(self):
            super().__init__()
            self.image = IMG_ENEMY3
            self.rect = self.image.get_rect()
            side = random.choice(['top', 'left', 'right'])
            if side == 'top':
                self.rect.x = random.randint(0, width - self.rect.width)
                self.rect.y = random.randint(-100, -40)
                self.vx = random.uniform(-1, 1)
                self.vy = random.uniform(2, 4)
            elif side == 'left':
                self.rect.x = random.randint(-100, -40)
                self.rect.y = random.randint(0, height // 2)
                self.vx = random.uniform(2, 4)
                self.vy = random.uniform(1, 3)
            else:
                self.rect.x = random.randint(width + 40, width + 100)
                self.rect.y = random.randint(0, height // 2)
                self.vx = random.uniform(-4, -2)
                self.vy = random.uniform(1, 3)

        def update(self):
            self.rect.x += self.vx
            self.rect.y += self.vy
            if (self.rect.top > height + 50 or self.rect.bottom < -50 or
                    self.rect.left > width + 50 or self.rect.right < -50):
                self.kill()

    # ===================== 巨大化 Enemy3（隐藏BOSS阶段） =====================
    class GiantEnemy3(pygame.sprite.Sprite):
        def __init__(self):
            super().__init__()
            self.image = pygame.transform.scale(IMG_ENEMY3, (105, 135))
            self.rect = self.image.get_rect()
            self.rect.x = random.randint(0, width - self.rect.width)
            self.rect.y = random.randint(-150, -50)
            self.speed = random.randint(1, 3)
            self.hp = 30
            self.max_hp = 30

        def update(self):
            self.rect.y += self.speed
            if self.rect.top > height:
                self.kill()

    # ===================== 暗黑灵梦 暗影结界 =====================
    class DarkRingBullet(pygame.sprite.Sprite):
        def __init__(self, x, y):
            super().__init__()
            self.radius = 30
            self.max_radius = 630
            self.grow_speed = 3  # 稍微加快扩张速度
            self.damage_radius = 0
            self.center_x = x
            self.center_y = y
            self.active = True
            self.image = pygame.Surface((1, 1), pygame.SRCALPHA)
            self.rect = self.image.get_rect(center=(x, y))

        def update(self):
            if not self.active:
                return

            self.radius += self.grow_speed
            self.damage_radius = self.radius - 5
            self.rect = pygame.Rect(self.center_x - self.radius,
                                    self.center_y - self.radius,
                                    self.radius * 2, self.radius * 2)

            if self.radius <= self.max_radius and self.radius > 0:
                # ★★★ 白色粗环形光圈 ★★★
                size = int(self.radius * 2)
                surf = pygame.Surface((size, size), pygame.SRCALPHA)

                # 外层白色光环（粗线，宽度8像素）
                pygame.draw.circle(surf, (255, 255, 255, 120),  # 白色，半透明
                                   (int(self.radius), int(self.radius)),
                                   int(self.radius), 8)  # 线宽8像素

                # 内层白色亮光（更亮，稍细，增加层次感）
                pygame.draw.circle(surf, (255, 255, 255, 200),
                                   (int(self.radius), int(self.radius)),
                                   int(self.radius - 4), 4)

                self.image = surf
            else:
                self.image = pygame.Surface((1, 1), pygame.SRCALPHA)

            if self.radius > self.max_radius:
                self.kill()

        def check_collision(self, player_rect):
            dx = player_rect.centerx - self.center_x
            dy = player_rect.centery - self.center_y
            dist = math.sqrt(dx * dx + dy * dy)
            # 伤害范围在光圈边缘附近
            return self.damage_radius - 15 < dist < self.damage_radius - 5

    # ===================== 暗黑灵梦 百箭齐发子弹 =====================
    class DarkArrowBullet(pygame.sprite.Sprite):
        def __init__(self, x, y, angle, speed):
            super().__init__()
            self.image = pygame.Surface((8, 24), pygame.SRCALPHA)
            points = [(4, 0), (8, 8), (6, 8), (6, 24), (2, 24), (2, 8), (0, 8)] # 根据点位置绘制箭头
            pygame.draw.polygon(self.image, (200, 0, 255), points) # 填充箭头颜色
            pygame.draw.polygon(self.image, (255, 150, 255), [(p[0] - 1, p[1] - 1) for p in points], 1) # 描边
            self.rect = self.image.get_rect(center=(x, y))
            rad = math.radians(angle)
            self.vx = math.sin(rad) * speed
            self.vy = math.cos(rad) * speed
            self.image = pygame.transform.rotate(self.image, -angle)

        def update(self):
            self.rect.x += self.vx
            self.rect.y += self.vy
            if self.rect.top > height + 50 or self.rect.bottom < -50 or \
                    self.rect.left > width + 50 or self.rect.right < -50:
                self.kill()

    # ===================== 暗黑灵梦 旋转弹幕子弹 =====================
    class DarkRingBullet2(pygame.sprite.Sprite):
        def __init__(self, x, y, angle, speed, color_variant):
            super().__init__()
            size = 12
            self.image = pygame.Surface((size, size), pygame.SRCALPHA)
            colors = [(200, 50, 200), (180, 50, 255), (150, 50, 255)]
            color = colors[color_variant % 3]
            pygame.draw.circle(self.image, color, (size // 2, size // 2), size // 2)
            pygame.draw.circle(self.image, (255, 200, 255), (size // 2, size // 2), size // 3, 1)
            self.rect = self.image.get_rect(center=(x, y))
            rad = math.radians(angle)
            self.vx = math.sin(rad) * speed
            self.vy = math.cos(rad) * speed

        def update(self):
            self.rect.x += self.vx
            self.rect.y += self.vy
            if self.rect.top > height + 50 or self.rect.bottom < -50 or \
                    self.rect.left > width + 50 or self.rect.right < -50:
                self.kill()

    # ===================== 暗黑灵梦 分身子弹 =====================
    class DarkCloneBullet(pygame.sprite.Sprite):
        def __init__(self, x, y, target_x, target_y):
            super().__init__()
            self.image = pygame.Surface((12, 12), pygame.SRCALPHA)
            pygame.draw.circle(self.image, (255, 100, 255), (6, 6), 6)
            pygame.draw.circle(self.image, (255, 200, 255), (6, 6), 3, 1)
            self.rect = self.image.get_rect(center=(x, y))
            dx = target_x - x
            dy = target_y - y
            dist = math.sqrt(dx * dx + dy * dy)
            if dist > 0:
                self.vx = (dx / dist) * 5
                self.vy = (dy / dist) * 5
            else:
                self.vx = 0
                self.vy = 5

        def update(self):
            self.rect.x += self.vx
            self.rect.y += self.vy
            if self.rect.top > height + 50 or self.rect.bottom < -50 or \
                    self.rect.left > width + 50 or self.rect.right < -50:
                self.kill()

    # ===================== 暗黑灵梦 分身类 =====================
    class DarkClone(pygame.sprite.Sprite):
        def __init__(self, x, y, index, boss):
            super().__init__()
            self.image = pygame.transform.scale(IMG_DARK_PLAYER, (40, 50))
            self.rect = self.image.get_rect(center=(x, y))
            self.hp = 40
            self.max_hp = 40
            self.index = index
            self.boss = boss
            self.shoot_timer = 0
            self.move_timer = 0
            self.dir_x = random.choice([-2, 2])
            self.dir_y = random.choice([-1, 1])

        def update(self):
            self.move_timer += 1
            if self.move_timer > 60:
                self.move_timer = 0
                self.dir_x = random.choice([-2, -1, 1, 2])
                self.dir_y = random.choice([-1, 0, 1])

            self.rect.x += self.dir_x
            self.rect.y += self.dir_y
            if self.rect.left < 50 or self.rect.right > width - 50:
                self.dir_x *= -1
            if self.rect.top < 50 or self.rect.bottom > height // 2:
                self.dir_y *= -1

            self.shoot_timer += 1
            if self.shoot_timer >= 60:
                self.shoot_timer = 0
                bullet = DarkCloneBullet(self.rect.centerx, self.rect.centery,
                                         player.rect.centerx, player.rect.centery)
                all_sprites.add(bullet)
                dark_clone_bullet_group.add(bullet)

    # ===================== 隐藏Boss "？？？" =====================
    class HiddenBoss(pygame.sprite.Sprite):
        def __init__(self):
            super().__init__()
            self.image = IMG_UNKNOWN
            self.rect = self.image.get_rect()
            self.rect.centerx = width // 2
            self.rect.centery = height // 3
            self.hp = 999999999
            self.max_hp = 999999999
            self.hit = False
            self.flash_timer = 0
            self.transformed = False
            self.dark_player_img = IMG_DARK_PLAYER

            # 技能相关
            self.skill_timer = 0
            self.skill_index = 0
            self.shield_timer = 0
            self.shield_active = False
            self.teleport_timer = 0
            self.teleport_active = False
            self.burst_timer = 0
            self.burst_count = 0
            self.is_bursting = False
            self.clones = []
            self.is_teleporting = False

            # 登场徘徊参数
            self.wander_timer = 0
            self.wander_direction = 1  # 1=右, -1=左
            self.wander_speed = 2
            self.is_wandering = True  # 是否在徘徊状态

            # 技能间隔（帧数）
            self.SKILL_INTERVALS = [
                600,  # 暗影结界 - 10秒
                720,  # 镜面反射 - 12秒
                420,  # 百箭齐发 - 7秒
                420,  # 瞬移突袭 - 7秒
                240,  # 暗黑旋转弹幕 - 4秒
                480  # 分身术 - 8秒
            ]
            self.SKILL_NAMES = ['结界', '护盾', '百箭', '瞬移', '旋转', '分身']
            self.current_skill = 0
            self.SHIELD_DURATION = 8 * FPS  # 护盾持续8秒

        def update(self):
            if self.hit and not self.transformed:
                self.flash_timer += 1
                if self.flash_timer % 10 < 5:
                    self.image.set_alpha(255)
                else:
                    self.image.set_alpha(50)
                if self.flash_timer >= 5 * FPS:
                    self.transformed = True
                    self.image = self.dark_player_img
                    self.image.set_alpha(255)
                    nonlocal hidden_boss_transformed
                    hidden_boss_transformed = True
                    self.hp = 500
                    self.max_hp = 500
                    # 注意：不停止徘徊，继续左右移动
                return

            if not self.transformed:
                return

            # ========== 左右徘徊（一直持续，瞬移时暂停） ==========
            if self.is_wandering and not self.teleport_active:
                self.wander_timer += 1
                # 左右移动
                self.rect.x += self.wander_speed * self.wander_direction
                # 边界反弹
                if self.rect.right > width - 50:
                    self.wander_direction = -1
                elif self.rect.left < 50:
                    self.wander_direction = 1
                # 每5秒改变一次速度方向（增加随机性）
                if self.wander_timer % (5 * FPS) == 0:
                    self.wander_direction = random.choice([-1, 1])
                    self.wander_speed = random.uniform(1, 3)

            # ========== 技能系统 ==========
            self.skill_timer += 1

            hp_ratio = self.hp / self.max_hp
            if hp_ratio < 0.3:
                speed_mult = 0.6
            elif hp_ratio < 0.6:
                speed_mult = 0.8
            else:
                speed_mult = 1.0

            if self.skill_timer >= self.SKILL_INTERVALS[self.skill_index] * speed_mult:
                self.skill_timer = 0
                self._execute_skill(self.skill_index)
                next_skill = self.skill_index
                while next_skill == self.skill_index:
                    next_skill = random.randint(0, len(self.SKILL_NAMES) - 1)
                self.skill_index = next_skill
            # 护盾 - 持续8秒
            if self.shield_active:
                self.shield_timer += 1
                if self.shield_timer >= self.SHIELD_DURATION:
                    self.shield_active = False
                    self.shield_timer = 0

            # 瞬移突袭 - 瞬移时暂停徘徊
            if self.teleport_active:
                self.teleport_timer += 1
                if self.teleport_timer >= 60:
                    self.teleport_active = False
                    self.teleport_timer = 0
                    self.is_teleporting = False
                    self.rect.centerx = player.rect.centerx
                    self.rect.centery = player.rect.top - 100
                    self.image.set_alpha(255)

            # 旋转弹幕
            if self.is_bursting:
                self.burst_timer += 1
                if self.burst_timer >= 12:
                    self.burst_timer = 0
                    if self.burst_count < 12:
                        self._fire_ring_burst()
                        self.burst_count += 1
                    else:
                        self.is_bursting = False
                        self.burst_count = 0

            if self.clones:
                for clone in self.clones[:]:
                    if clone.hp <= 0:
                        clone.kill()
                        self.clones.remove(clone)

        def _execute_skill(self, skill_id):
            if skill_id == 0:
                self._skill_dark_ring()
            elif skill_id == 1:
                self._skill_shield()
            elif skill_id == 2:
                self._skill_arrows()
            elif skill_id == 3:
                self._skill_teleport()
            elif skill_id == 4:
                self._skill_ring_burst()
            elif skill_id == 5:
                self._skill_clone()

        # 技能1: 暗影结界
        def _skill_dark_ring(self):
            ring = DarkRingBullet(self.rect.centerx, self.rect.centery)
            all_sprites.add(ring)
            dark_ring_group.add(ring)

        # 技能2: 镜面反射 - 持续8秒
        def _skill_shield(self):
            self.shield_active = True
            self.shield_timer = 0

        # 技能3: 百箭齐发 - 500支箭，360度覆盖
        def _skill_arrows(self):
            # BOSS回到屏幕正中间偏下位置
            self.rect.centerx = width // 2
            self.rect.centery = height * 0.4

            # 360度发射，每30度一个方向，每个方向发射多支
            for angle in range(0, 360, 30):
                for j in range(4):
                    offset = random.uniform(-5, 5)
                    final_angle = angle + offset
                    speed = random.uniform(3, 6)
                    arrow = DarkArrowBullet(self.rect.centerx, self.rect.top - 20, final_angle, speed)
                    all_sprites.add(arrow)
                    dark_arrow_group.add(arrow)

            # 再随机补一些箭
            for _ in range(200):
                angle = random.randint(0, 360)
                speed = random.uniform(2, 6)
                arrow = DarkArrowBullet(self.rect.centerx, self.rect.top - 20, angle, speed)
                all_sprites.add(arrow)
                dark_arrow_group.add(arrow)

        # 技能4: 瞬移突袭
        def _skill_teleport(self):
            self.teleport_active = True
            self.teleport_timer = 0
            self.is_teleporting = True
            self.image.set_alpha(0)

        # 技能5: 暗黑旋转弹幕
        def _skill_ring_burst(self):
            self.is_bursting = True
            self.burst_count = 0
            self.burst_timer = 0

        def _fire_ring_burst(self):
            angle_offset = self.burst_count * 45
            for i in range(12):
                angle = i * 45 + angle_offset
                speed = 0.6 + (self.burst_count % 3) * 0.5
                bullet = DarkRingBullet2(self.rect.centerx, self.rect.centery, angle, speed, self.burst_count % 3)
                all_sprites.add(bullet)
                dark_ring2_group.add(bullet)

        # 技能6: 分身术
        def _skill_clone(self):
            for clone in self.clones:
                clone.kill()
            self.clones = []

            positions = [
                (self.rect.centerx - 150, self.rect.centery),
                (self.rect.centerx, self.rect.centery - 80),
                (self.rect.centerx + 150, self.rect.centery)
            ]
            for i, pos in enumerate(positions):
                clone = DarkClone(pos[0], pos[1], i, self)
                all_sprites.add(clone)
                dark_clone_group.add(clone)
                self.clones.append(clone)

    # ===================== enemy4子弹 =====================
    class Enemy4Bullet(pygame.sprite.Sprite):
        def __init__(self, x, y, angle):
            super().__init__()
            self.image = IMG_ENEMY4_BULLET
            self.rect = self.image.get_rect(center=(x, y))
            spd = 8
            rad = math.radians(angle)
            self.vx = math.sin(rad) * spd
            self.vy = math.cos(rad) * spd

        def update(self):
            self.rect.x += self.vx
            self.rect.y += self.vy
            if (self.rect.top > height + 50 or self.rect.bottom < -50 or
                    self.rect.left > width + 50 or self.rect.right < -50):
                self.kill()

    # ===================== enemy4 =====================
    class Enemy4(pygame.sprite.Sprite):
        def __init__(self, x, y, index):
            super().__init__()
            self.image = IMG_ENEMY4
            self.rect = self.image.get_rect(center=(x, y))
            self.target_y = height * 0.15
            self.index = index
            self.arrived = False
            self.shoot_timer = 0

        def update(self):
            if not self.arrived:
                if self.rect.y < self.target_y:
                    self.rect.y += 2
                else:
                    self.arrived = True

    # ===================== BOSS1子弹 =====================
    class BossBullet(pygame.sprite.Sprite):
        def __init__(self, x, y, angle):
            super().__init__()
            self.image = IMG_BOSS_BULLET
            self.rect = self.image.get_rect(center=(x, y))
            spd = random.randint(1, 5)
            rad = math.radians(angle)
            self.vx = math.sin(rad) * spd
            self.vy = math.cos(rad) * spd

        def update(self):
            self.rect.x += self.vx
            self.rect.y += self.vy
            if self.rect.top > height or self.rect.left < 0 or self.rect.right > width:
                self.kill()

    # ===================== BOSS2散射子弹 =====================
    class Boss2Bullet(pygame.sprite.Sprite):
        def __init__(self, x, y, angle):
            super().__init__()
            self.image = IMG_BOSS2_BULLET
            self.rect = self.image.get_rect(center=(x, y))
            spd = 4
            rad = math.radians(angle)
            self.vx = math.sin(rad) * spd
            self.vy = math.cos(rad) * spd

        def update(self):
            self.rect.x += self.vx
            self.rect.y += self.vy
            if self.rect.top > height or self.rect.left < 0 or self.rect.right > width:
                self.kill()

    # ===================== BOSS2向下高速子弹 =====================
    class Boss2Bullet2(pygame.sprite.Sprite):
        def __init__(self, x, y):
            super().__init__()
            self.image = IMG_BOSS2_BULLET2
            self.rect = self.image.get_rect(center=(x, y))
            self.vx = 0
            self.vy = 7

        def update(self):
            self.rect.y += self.vy
            if self.rect.top > height:
                self.kill()

    # ===================== Dark Boss 子弹 =====================
    class DarkBossBullet(pygame.sprite.Sprite):
        def __init__(self, x, y, angle):
            super().__init__()
            self.image = IMG_DARK_BOSS_BULLET
            self.rect = self.image.get_rect(center=(x, y))
            spd = random.randint(2, 6)
            rad = math.radians(angle)
            self.vx = math.sin(rad) * spd
            self.vy = math.cos(rad) * spd

        def update(self):
            self.rect.x += self.vx
            self.rect.y += self.vy
            if self.rect.top > height or self.rect.left < 0 or self.rect.right > width:
                self.kill()

    # ===================== Dark Boss2 散射子弹 =====================
    class DarkBoss2Bullet(pygame.sprite.Sprite):
        def __init__(self, x, y, angle):
            super().__init__()
            self.image = IMG_DARK_BOSS2_BULLET
            self.rect = self.image.get_rect(center=(x, y))
            spd = 4
            rad = math.radians(angle)
            self.vx = math.sin(rad) * spd
            self.vy = math.cos(rad) * spd

        def update(self):
            self.rect.x += self.vx
            self.rect.y += self.vy
            if self.rect.top > height or self.rect.left < 0 or self.rect.right > width:
                self.kill()

    # ===================== Dark Boss2 向下高速子弹 =====================
    class DarkBoss2Bullet2(pygame.sprite.Sprite):
        def __init__(self, x, y):
            super().__init__()
            self.image = IMG_DARK_BOSS2_BULLET2
            self.rect = self.image.get_rect(center=(x, y))
            self.vx = 0
            self.vy = 7

        def update(self):
            self.rect.y += self.vy
            if self.rect.top > height:
                self.kill()

    # ===================== BOSS1 魔理沙 =====================
    class Boss(pygame.sprite.Sprite):
        def __init__(self):
            super().__init__()
            self.image = IMG_BOSS
            self.rect = self.image.get_rect()
            self.rect.centerx = random.randint(self.rect.width, width - self.rect.width)
            self.rect.y = -10
            self.dir_x = 3
            self.dir_y = 0.55

        def update(self):
            nonlocal boss_move_timer
            self.rect.x += self.dir_x
            self.rect.y += self.dir_y
            if self.rect.left <= 0 or self.rect.right >= width:
                self.dir_x *= -1
            boss_move_timer += 1
            if boss_move_timer < BOSS_DOWN_TIME_FRAME:
                self.rect.y += self.dir_y
            else:
                self.rect.y -= self.dir_y
            if self.rect.top > height:
                self.rect.centerx = width // 2
                self.rect.y = -self.rect.height
                boss_move_timer = 0
            if self.rect.bottom < 0:
                self.rect.centerx = width // 2
                self.rect.y = -self.rect.height
                boss_move_timer = 0

    # ===================== BOSS2 十六夜咲夜 =====================
    class Boss2(pygame.sprite.Sprite):
        def __init__(self, all_sp, e2_group, b2b_group, b2b2_group):
            super().__init__()
            self.image = IMG_BOSS2
            self.rect = self.image.get_rect()
            self.rect.centerx = width // 2
            self.rect.y = 70
            self.dir_x = BOSS2_MOVE_SPEED
            self.timer = 0
            self.shoot_scatter_count = 0
            self.all_sp = all_sp
            self.e2_group = e2_group
            self.b2b_group = b2b_group
            self.b2b2_group = b2b2_group
            self.burst_timer = 0
            self.burst_count = 0
            self.is_bursting = False
            self.BURST_INTERVAL = int(0.2 * FPS)
            self.BURST_MAX = 15

        def update(self):
            self.rect.x += self.dir_x
            if self.rect.left <= 0 or self.rect.right >= width - self.rect.width:
                self.dir_x *= -1
            self.timer += 1

            if self.timer >= BOSS2_SPAWN_ENEMY2_DELAY:
                offset = self.timer - BOSS2_SPAWN_ENEMY2_DELAY
                if offset % BOSS2_SPAWN_ENEMY2_INTERVAL == 0:
                    for _ in range(5):
                        e2 = Enemy2()
                        self.all_sp.add(e2)
                        self.e2_group.add(e2)

            if self.timer >= BOSS2_SCATTER_DELAY:
                base_offset = self.timer - BOSS2_SCATTER_DELAY
                if base_offset % BOSS2_SCATTER_INTERVAL == 0:
                    self.shoot_scatter_count = 0
                gap = base_offset % BOSS2_SCATTER_INTERVAL
                target_gap = self.shoot_scatter_count * BOSS2_SCATTER_GAP
                if gap == target_gap and self.shoot_scatter_count < 3:
                    for deg in range(0, 360, 15):
                        bb = Boss2Bullet(self.rect.centerx, self.rect.centery, deg)
                        self.all_sp.add(bb)
                        self.b2b_group.add(bb)
                    self.shoot_scatter_count += 1

            if self.timer >= BOSS2_DOWN_BULLET_DELAY:
                offset = self.timer - BOSS2_DOWN_BULLET_DELAY
                if offset % BOSS2_DOWN_BULLET_INTERVAL == 0 and not self.is_bursting:
                    self.is_bursting = True
                    self.burst_count = 0
                    self.burst_timer = 0
                    bb2 = Boss2Bullet2(self.rect.centerx, self.rect.bottom)
                    self.all_sp.add(bb2)
                    self.b2b2_group.add(bb2)
                    self.burst_count += 1

                if self.is_bursting:
                    self.burst_timer += 1
                    if self.burst_timer >= self.BURST_INTERVAL:
                        self.burst_timer = 0
                        if self.burst_count < self.BURST_MAX:
                            bb2 = Boss2Bullet2(self.rect.centerx, self.rect.bottom)
                            self.all_sp.add(bb2)
                            self.b2b2_group.add(bb2)
                            self.burst_count += 1
                        else:
                            self.is_bursting = False
                            self.burst_count = 0

    # ===================== Dark Boss =====================
    class DarkBoss(pygame.sprite.Sprite):
        def __init__(self):
            super().__init__()
            self.image = IMG_DARK_BOSS
            self.rect = self.image.get_rect()
            self.rect.centerx = width * 0.3
            self.rect.y = -10
            self.dir_x = 3
            self.dir_y = 0.55
            self.is_dead = False
            self.is_fully_dead = False  # 完全死亡标记，防止复活

        def update(self):
            if self.is_dead or self.is_fully_dead:
                return

            nonlocal dark_boss_move_timer
            self.rect.x += self.dir_x
            self.rect.y += self.dir_y
            if self.rect.left <= 0 or self.rect.right >= width * 0.5:
                self.dir_x *= -1
            dark_boss_move_timer += 1
            if dark_boss_move_timer < BOSS_DOWN_TIME_FRAME:
                self.rect.y += self.dir_y
            else:
                self.rect.y -= self.dir_y
            if self.rect.top > height:
                self.rect.centerx = width * 0.3
                self.rect.y = -self.rect.height
                dark_boss_move_timer = 0
            if self.rect.bottom < 0:
                self.rect.centerx = width * 0.3
                self.rect.y = -self.rect.height
                dark_boss_move_timer = 0

    # ===================== Dark Boss2 =====================
    class DarkBoss2(pygame.sprite.Sprite):
        def __init__(self):
            super().__init__()
            self.image = IMG_DARK_BOSS2
            self.rect = self.image.get_rect()
            self.rect.centerx = width * 0.7
            self.rect.y = 30
            self.dir_x = BOSS2_MOVE_SPEED
            self.timer = 0
            self.shoot_scatter_count = 0
            self.is_bursting = False
            self.burst_timer = 0
            self.burst_count = 0
            self.BURST_INTERVAL = int(0.2 * FPS)
            self.BURST_MAX = 20
            self.is_dead = False
            self.is_fully_dead = False  # 完全死亡标记，防止复活

        def update(self):
            if self.is_dead or self.is_fully_dead:
                return

            self.rect.x += self.dir_x
            if self.rect.left <= width * 0.5 or self.rect.right >= width - self.rect.width:
                self.dir_x *= -1
            self.timer += 1

            # 散射机制 - 增加散射子弹数
            if self.timer >= BOSS2_SCATTER_DELAY:
                base_offset = self.timer - BOSS2_SCATTER_DELAY
                if base_offset % BOSS2_SCATTER_INTERVAL == 0:
                    self.shoot_scatter_count = 0
                gap = base_offset % BOSS2_SCATTER_INTERVAL
                target_gap = self.shoot_scatter_count * BOSS2_SCATTER_GAP
                if gap == target_gap and self.shoot_scatter_count < 8:
                    for deg in range(0, 360, 10):
                        bb = DarkBoss2Bullet(self.rect.centerx, self.rect.centery, deg)
                        all_sprites.add(bb)
                        dark_boss2_bullet_group.add(bb)
                    self.shoot_scatter_count += 1

            # 连射机制
            if self.timer >= BOSS2_DOWN_BULLET_DELAY:
                offset = self.timer - BOSS2_DOWN_BULLET_DELAY
                if offset % BOSS2_DOWN_BULLET_INTERVAL == 0 and not self.is_bursting:
                    self.is_bursting = True
                    self.burst_count = 0
                    self.burst_timer = 0
                    bb2 = DarkBoss2Bullet2(self.rect.centerx, self.rect.bottom)
                    all_sprites.add(bb2)
                    dark_boss2_bullet2_group.add(bb2)
                    self.burst_count += 1

                if self.is_bursting:
                    self.burst_timer += 1
                    if self.burst_timer >= self.BURST_INTERVAL:
                        self.burst_timer = 0
                        if self.burst_count < self.BURST_MAX:
                            bb2 = DarkBoss2Bullet2(self.rect.centerx, self.rect.bottom)
                            all_sprites.add(bb2)
                            dark_boss2_bullet2_group.add(bb2)
                            self.burst_count += 1
                        else:
                            self.is_bursting = False
                            self.burst_count = 0

    # 精灵分组
    player = Player()
    bullets = pygame.sprite.Group()
    enemies = pygame.sprite.Group()
    enemy2_group = pygame.sprite.Group()
    enemy3_group = pygame.sprite.Group()
    enemy4_group = pygame.sprite.Group()
    boss_group = pygame.sprite.Group()
    boss2_group = pygame.sprite.Group()
    dark_boss_group = pygame.sprite.Group()
    dark_boss2_group = pygame.sprite.Group()
    boss_bullets = pygame.sprite.Group()
    boss2_bullet_group = pygame.sprite.Group()
    boss2_bullet2_group = pygame.sprite.Group()
    dark_boss_bullet_group = pygame.sprite.Group()
    dark_boss2_bullet_group = pygame.sprite.Group()
    dark_boss2_bullet2_group = pygame.sprite.Group()
    enemy4_bullet_group = pygame.sprite.Group()
    giant_enemy3_group = pygame.sprite.Group()
    hidden_boss_group = pygame.sprite.Group()
    dark_ring_group = pygame.sprite.Group()
    dark_arrow_group = pygame.sprite.Group()
    dark_ring2_group = pygame.sprite.Group()
    dark_clone_bullet_group = pygame.sprite.Group()
    dark_clone_group = pygame.sprite.Group()

    all_sprites = pygame.sprite.Group()
    all_sprites.add(player)
    all_sprites.add(bullets)
    all_sprites.add(enemies)
    all_sprites.add(enemy2_group)
    all_sprites.add(enemy3_group)
    all_sprites.add(enemy4_group)
    all_sprites.add(boss_group)
    all_sprites.add(boss2_group)
    all_sprites.add(dark_boss_group)
    all_sprites.add(dark_boss2_group)
    all_sprites.add(boss_bullets)
    all_sprites.add(boss2_bullet_group)
    all_sprites.add(boss2_bullet2_group)
    all_sprites.add(dark_boss_bullet_group)
    all_sprites.add(dark_boss2_bullet_group)
    all_sprites.add(dark_boss2_bullet2_group)
    all_sprites.add(enemy4_bullet_group)
    all_sprites.add(giant_enemy3_group)
    all_sprites.add(hidden_boss_group)
    all_sprites.add(dark_ring_group)
    all_sprites.add(dark_arrow_group)
    all_sprites.add(dark_ring2_group)
    all_sprites.add(dark_clone_bullet_group)
    all_sprites.add(dark_clone_group)

    shoot_timer = 0
    shoot_cd = 6

    # ----------------------主循环------------------------------
    running = True
    while running:
        clock.tick(FPS)
        shoot_timer += 1

        # EX倒计时更新
        if ex_flash_timer > 0:
            ex_flash_timer -= 1
        if ex_power_timer > 0:
            ex_power_timer -= 1

        # EX延迟再生计时器
        if ex_respawn_timer > 0:
            ex_respawn_timer -= 1
            if ex_respawn_timer == 0:
                if not stage2 and not stage3 and not boss_exist:
                    for _ in range(random.randint(5, 9)):
                        new_e = Enemy()
                        all_sprites.add(new_e)
                        enemies.add(new_e)
                elif stage2 and not boss2_exist:
                    for _ in range(random.randint(5, 10)):
                        new_e2 = Enemy2()
                        all_sprites.add(new_e2)
                        enemy2_group.add(new_e2)
                elif stage3 and not enemy4_spawned and not dark_boss_exist and not hidden_boss_phase and not game_clear:
                    for _ in range(random.randint(3, 6)):
                        new_e3 = Enemy3()
                        all_sprites.add(new_e3)
                        enemy3_group.add(new_e3)

        # ========== 关卡过渡更新 ==========
        if is_loading_stage:
            # 关键修正：直接调用加载画面函数，它内部包含动画循环和渲染
            show_loading_screen(0.5)
            # 动画播放完，状态变更为准备显示图三标题
            is_loading_stage = False
            need_spawn_after_load = True

        if need_spawn_after_load:
            need_spawn_after_load = False
            # 加载结束，切换为图三（关卡标题过渡）
            stage_transition = True
            stage_transition_timer = 0

            # 在这里生成该关卡的第一波敌人，并切换BGM（图三显示时音乐就响起）
            if not stage2 and not stage3:
                stage_title = "STAGE 1 - Night Galaxy"
                for _ in range(random.randint(5, 9)):
                    e = Enemy()
                    all_sprites.add(e)
                    enemies.add(e)
                # 播放第一关音乐
                try:
                    pygame.mixer.music.load("bgm/Level 1.mp3")  # 假设你的第一关音乐叫Level 1.mp3，如果你的叫badapple，请改回来
                    pygame.mixer.music.play(-1,1.7)
                    pygame.mixer.music.set_volume(0.6)
                except Exception as e:
                    print(f"第一关BGM加载失败: {e}")
            elif stage2:
                stage_title = "STAGE 2 - Midnight Storm"
                for _ in range(random.randint(5, 10)):
                    e2 = Enemy2()
                    all_sprites.add(e2)
                    enemy2_group.add(e2)
                # 播放第二关音乐
                try:
                    pygame.mixer.music.load("bgm/Level 2.wav")
                    pygame.mixer.music.play(-1)
                    pygame.mixer.music.set_volume(0.6)
                except Exception as e:
                    print(f"第二关BGM加载失败: {e}")
            elif stage3:
                stage_title = "STAGE 3 - Lava Hell"
                for _ in range(random.randint(3, 6)):
                    e3 = Enemy3()
                    all_sprites.add(e3)
                    enemy3_group.add(e3)
                # 播放第三关音乐
                try:
                    pygame.mixer.music.load("bgm/Level 3.wav")
                    pygame.mixer.music.play(-1, 6)
                    pygame.mixer.music.set_volume(0.6)
                except Exception as e:
                    print(f"第三关BGM加载失败: {e}")

        elif stage_transition:
            # 正在显示图三：关卡标题过渡（STAGE X - XXX）
            stage_transition_timer += 1
            if stage_transition_timer >= STAGE_TRANSITION_DELAY:
                stage_transition = False  # 图三结束，正式开始游戏

        # 背景渐变
        if not stage2 and not stage3:
            if bg_darken:
                bg_blue_val -= bg_blue_step
                if bg_blue_val <= bg_blue_min:
                    bg_darken = False
            else:
                bg_blue_val += bg_blue_step
                if bg_blue_val >= bg_blue_max:
                    bg_darken = True
            bg_color = (0, 0, int(bg_blue_val))
        elif stage2:
            if bg_gray_darken:
                bg_gray_val -= bg_gray_step
                if bg_gray_val <= bg_gray_min:
                    bg_gray_darken = False
            else:
                bg_gray_val += bg_gray_step
                if bg_gray_val >= bg_gray_max:
                    bg_gray_darken = True
            val = int(bg_gray_val)
            bg_color = (val, val, val)
        else:
            # 第三关：纯黑色背景
            bg_color = (0, 0, 0)

        # 打雷计时（第二关和第三关）
        if stage2 or stage3:
            lightning_timer += 1
            if lightning_flash_frames > 0:
                lightning_flash_frames -= 1
                if not thunder_played:
                    play_sound(SND_THUNDER)
                    thunder_played = True
            else:
                thunder_played = False
                if lightning_timer >= lightning_interval:
                    lightning_timer = 0
                    lightning_interval = random.randint(8, 12) * FPS
                    lightning_flash_frames = LIGHTNING_FLASH_MAX

        # ========== 第三关逻辑 ==========
        if stage3 and not stage_transition and not game_clear and not game_paused:
            # 生成enemy3 - 只在非隐藏BOSS阶段且非双BOSS阶段
            if not hidden_boss_phase and not enemy4_spawned and not dark_boss_exist:
                enemy3_spawn_timer += 1
                if enemy3_spawn_timer >= ENEMY3_SPAWN_INTERVAL and len(enemy3_group) < 20:
                    enemy3_spawn_timer = 0
                    e3 = Enemy3()
                    all_sprites.add(e3)
                    enemy3_group.add(e3)

            # 检查是否击败50只enemy3 - 只在非隐藏BOSS阶段
            if not hidden_boss_phase and kill_enemy3_count >= kill_enemy3_target and not enemy4_spawned and not dark_boss_exist:
                enemy4_spawned = True
                positions = [width * 0.25, width * 0.5, width * 0.75]
                for i, pos in enumerate(positions):
                    e4 = Enemy4(pos, -50, i)
                    all_sprites.add(e4)
                    enemy4_group.add(e4)
                    enemy4_hp[i] = enemy4_max_hp

            # enemy4射击逻辑 - 只在非隐藏BOSS阶段
            if not hidden_boss_phase:
                for i, e4 in enumerate(enemy4_group):
                    if e4.arrived:
                        enemy4_shot_timer[i] += 1
                        if enemy4_shot_timer[i] >= ENEMY4_SHOT_INTERVAL:
                            enemy4_shot_timer[i] = 0
                            for deg in range(0, 360, 30):
                                b = Enemy4Bullet(e4.rect.centerx, e4.rect.centery, deg)
                                all_sprites.add(b)
                                enemy4_bullet_group.add(b)

            # 检查enemy4是否全部被击败 - 只在非隐藏BOSS阶段
            if not hidden_boss_phase and enemy4_spawned and len(enemy4_group) == 0 and not dark_boss_exist:
                dark_boss_spawn_timer += 1
                if dark_boss_spawn_timer >= 3 * FPS:
                    db = DarkBoss()
                    all_sprites.add(db)
                    dark_boss_group.add(db)
                    dark_boss_exist = True
                    dark_boss_hp = dark_boss_max_hp
                    dark_boss_move_timer = 0
                    dark_boss_shot_timer = 0
                    db2 = DarkBoss2()
                    all_sprites.add(db2)
                    dark_boss2_group.add(db2)
                    dark_boss2_exist = True
                    dark_boss2_hp = dark_boss2_max_hp
                    dark_boss_spawn_timer = 0
                    for e3 in enemy3_group:
                        e3.kill()
                    enemy4_bullet_group.empty()

            # ========== 隐藏BOSS阶段逻辑 ==========
            if hidden_boss_phase and not hidden_boss_transformed:
                if giant_enemy3_kill_count < GIANT_ENEMY3_TARGET and not hidden_boss_exist:
                    giant_enemy3_spawn_timer += 1
                    if giant_enemy3_spawn_timer >= GIANT_ENEMY3_SPAWN_INTERVAL and len(giant_enemy3_group) < 10:
                        giant_enemy3_spawn_timer = 0
                        ge = GiantEnemy3()
                        all_sprites.add(ge)
                        giant_enemy3_group.add(ge)
                else:
                    for ge in giant_enemy3_group:
                        ge.kill()

                for ge in giant_enemy3_group:
                    if ge.rect.top > height:
                        ge.kill()

                if giant_enemy3_kill_count >= GIANT_ENEMY3_TARGET and not hidden_boss_exist:
                    hidden_boss_exist = True
                    hb = HiddenBoss()
                    all_sprites.add(hb)
                    hidden_boss_group.add(hb)
                    for ge in giant_enemy3_group:
                        ge.kill()

        # 事件
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if game_over or game_clear:
                        # gameover或excellent界面按ESC无反应
                        pass
                    elif game_paused:
                        # 暂停界面按ESC关闭暂停（继续游戏）
                        game_paused = False
                    else:
                        # 游戏中按ESC暂停
                        game_paused = True
                        pause_menu_index = 0
                if event.key == pygame.K_UP or event.key == pygame.K_w:
                    if game_paused:
                        pause_menu_index = (pause_menu_index - 1) % len(pause_options)
                if event.key == pygame.K_DOWN or event.key == pygame.K_s:
                    if game_paused:
                        pause_menu_index = (pause_menu_index + 1) % len(pause_options)
                if event.key == pygame.K_RETURN or event.key == pygame.K_SPACE:
                    if game_over or game_clear:
                        # gameover或excellent界面按空格/回车返回标题界面
                        show_title = True
                        game_over = False
                        game_clear = False
                        running = False
                    elif game_paused:
                        if pause_menu_index == 0:  # CONTINUE
                            game_paused = False
                        elif pause_menu_index == 1:  # BACK MENU
                            show_title = True
                            game_paused = False
                            running = False
                if event.key == pygame.K_RETURN:
                    if ex_count > 0 and not game_over and not mission_complete and not mission2_complete and not mission3_complete and not game_clear and not game_paused:
                        ex_count -= 1
                        ex_flash_timer = EX_FLASH_TIME
                        ex_power_timer = EX_DURATION

                        enemy_copy = enemies.sprites().copy()
                        for enemy in enemy_copy:
                            score += 10
                            kill_enemy_count += 1
                            play_sound(SND_ENEMY_DEATH)
                            enemy.kill()

                        enemy2_copy = enemy2_group.sprites().copy()
                        for e2 in enemy2_copy:
                            score += 10
                            kill_enemy2_count += 1
                            play_sound(SND_ENEMY_DEATH)
                            e2.kill()

                        enemy3_copy = enemy3_group.sprites().copy()
                        for e3 in enemy3_copy:
                            score += 10
                            kill_enemy3_count += 1
                            play_sound(SND_ENEMY_DEATH)
                            e3.kill()

                        # 清除所有子弹（保留分身）
                        boss_bullets.empty()
                        boss2_bullet_group.empty()
                        boss2_bullet2_group.empty()
                        dark_boss_bullet_group.empty()
                        dark_boss2_bullet_group.empty()
                        dark_boss2_bullet2_group.empty()
                        enemy4_bullet_group.empty()
                        giant_enemy3_group.empty()

                        # 清除暗黑灵梦的子弹（保留分身）
                        dark_ring_group.empty()  # 暗影结界
                        dark_arrow_group.empty()  # 百箭齐发
                        dark_ring2_group.empty()  # 旋转弹幕
                        dark_clone_bullet_group.empty()  # 分身子弹
                        # 注意：不清除 dark_clone_group（保留分身）

                        if not stage2 and not stage3 and not boss_exist:
                            ex_respawn_timer = EX_RESPAWN_DELAY
                        elif stage2 and not boss2_exist:
                            ex_respawn_timer = EX_RESPAWN_DELAY
                        elif stage3 and not enemy4_spawned and not dark_boss_exist and not hidden_boss_phase:
                            ex_respawn_timer = EX_RESPAWN_DELAY

        # 如果游戏结束或通关，回到主菜单
        if (game_over or game_clear) and not running:
            # 已经在事件中处理了
            pass

        if not game_over:
            # 第一关通关倒计时
            if mission_complete:
                mission_timer += 1
                if mission_timer >= MISSION_SHOW_TIME:
                    mission_complete = False
                    mission_timer = 0
                    enemies.empty()
                    boss_group.empty()
                    boss_bullets.empty()
                    stage2 = True
                    # 修改此处：关闭图三状态，打开加载状态（图二）
                    stage_transition = False
                    is_loading_stage = True
                    need_spawn_after_load = False
                    stage_title = "STAGE 2 - Midnight Storm"
                    bg_gray_val = bg_gray_max
                    bg_gray_darken = True

            # 第二关通关倒计时 -> 进入第三关
            if mission2_complete:
                mission2_timer += 1
                if mission2_timer >= MISSION2_SHOW_TIME:
                    mission2_complete = False
                    mission2_timer = 0
                    stage2 = False
                    stage3 = True
                    # 修改此处：关闭图三状态，打开加载状态（图二）
                    stage_transition = False
                    is_loading_stage = True
                    need_spawn_after_load = False
                    stage_title = "STAGE 3 - Lava Hell"
                    enemy2_group.empty()
                    boss2_group.empty()
                    boss2_bullet_group.empty()
                    boss2_bullet2_group.empty()

            # ========== 通关状态 ==========
            if game_clear:
                clear_timer += 1
                if clear_phase == 0:
                    # 显示 MISSION3 COMPLETE
                    if clear_timer >= CLEAR_PHASE1_DURATION:
                        clear_timer = 0
                        clear_phase = 1
                # phase 1 持续显示 EXCELLENT，不自动消失

            # 第三关通关倒计时（隐藏BOSS阶段不触发通关）
            if mission3_complete and not hidden_boss_phase and not game_clear:
                mission3_timer += 1
                if mission3_timer >= MISSION3_SHOW_TIME:
                    mission3_complete = False
                    mission3_timer = 0
                    print("游戏通关！")

            # 无敌帧倒计时
            if invincible_frame > 0:
                invincible_frame -= 1

            # 射击判定（暂停时不射击）
            key_state = pygame.key.get_pressed()

            if ex_power_timer > 0:
                current_shoot_cd = 2.5
            else:
                current_shoot_cd = shoot_cd

            if not stage_transition and key_state[
                pygame.K_SPACE] and shoot_timer > current_shoot_cd and not mission_complete and not mission2_complete and not mission3_complete and not game_clear and not game_paused:
                if ex_power_timer > 0:
                    player.shoot_ex()
                else:
                    player.shoot_normal()
                shoot_timer = 0

            # ========== 第一阶段碰撞逻辑 ==========
            if not stage2 and not stage3 and not game_clear and not game_paused:
                hit_enemy = pygame.sprite.groupcollide(enemies, bullets, True, True)
                need_spawn_boss = False
                for _ in hit_enemy:
                    score += 10
                    kill_enemy_count += 1
                    play_sound(SND_ENEMY_DEATH)
                    if not boss_exist:
                        new_e = Enemy()
                        all_sprites.add(new_e)
                        enemies.add(new_e)
                    if kill_enemy_count >= kill_enemy_target and not boss_exist:
                        need_spawn_boss = True

                if need_spawn_boss:
                    b = Boss()
                    all_sprites.add(b)
                    boss_group.add(b)
                    boss_exist = True
                    boss_current_hp = boss_max_hp
                    boss_move_timer = 0
                    ex_respawn_timer = 0

                hit_boss = pygame.sprite.groupcollide(boss_group, bullets, False, True)
                for _ in hit_boss:
                    boss_current_hp -= 1
                    play_sound(SND_BOSS_HIT)
                    if boss_current_hp <= 0:
                        boss_group.empty()
                        play_sound(SND_ENEMY_DEATH)
                        boss_exist = False
                        score += 500
                        kill_enemy_count = 0
                        mission_complete = True
                        mission_timer = 0
                        enemies.empty()

                if boss_exist:
                    boss_shot_timer += 1
                    if boss_shot_timer >= BOSS_SHOT_INTERVAL:
                        boss_shot_timer = 0
                        bx = boss_group.sprites()[0].rect.centerx
                        by = boss_group.sprites()[0].rect.bottom
                        # 减少第一关BOSS散射子弹数
                        for i in range(random.randint(8, 15)):
                            ang = random.randint(0, 360)
                            bb = BossBullet(bx, by, ang)
                            all_sprites.add(bb)
                            boss_bullets.add(bb)

                if invincible_frame <= 0:
                    hit1 = pygame.sprite.spritecollide(player, enemies, True)
                    hit2 = pygame.sprite.spritecollide(player, boss_group, False)
                    hit3 = pygame.sprite.spritecollide(player, boss_bullets, True)
                    if hit1 or hit2 or hit3:
                        hp -= 1
                        invincible_frame = INVINCIBLE_FRAME_TOTAL
                        if hp <= 0:
                            game_over = True
                            all_sprites.empty()

            # ========== 第二阶段碰撞逻辑 ==========
            elif stage2 and not game_clear and not game_paused:
                hit_e2 = pygame.sprite.groupcollide(enemy2_group, bullets, True, True)
                for _ in hit_e2:
                    score += 10
                    kill_enemy2_count += 1
                    play_sound(SND_ENEMY_DEATH)
                    if not boss2_exist:
                        new_e2 = Enemy2()
                        all_sprites.add(new_e2)
                        enemy2_group.add(new_e2)
                    if kill_enemy2_count >= kill_enemy2_target and not boss2_exist:
                        Enemy2.boss2_exist = True
                        b2 = Boss2(all_sprites, enemy2_group, boss2_bullet_group, boss2_bullet2_group)
                        all_sprites.add(b2)
                        boss2_group.add(b2)
                        boss2_exist = True
                        boss2_current_hp = boss2_max_hp
                        ex_respawn_timer = 0

                hit_boss2 = pygame.sprite.groupcollide(boss2_group, bullets, False, True)
                for _ in hit_boss2:
                    boss2_current_hp -= 1
                    play_sound(SND_BOSS_HIT)
                    if boss2_current_hp <= 0:
                        Enemy2.boss2_exist = False
                        for b2 in boss2_group:
                            b2.kill()
                        boss2_group.empty()
                        play_sound(SND_ENEMY_DEATH)
                        boss2_exist = False
                        score += 1000
                        kill_enemy2_count = 0
                        enemy2_group.empty()
                        mission2_complete = True
                        mission2_timer = 0

                if invincible_frame <= 0:
                    hit1 = pygame.sprite.spritecollide(player, enemy2_group, True)
                    hit2 = pygame.sprite.spritecollide(player, boss2_group, False)
                    hit3 = pygame.sprite.spritecollide(player, boss2_bullet_group, True)
                    hit4 = pygame.sprite.spritecollide(player, boss2_bullet2_group, True)
                    if hit1 or hit2 or hit3 or hit4:
                        hp -= 1
                        invincible_frame = INVINCIBLE_FRAME_TOTAL
                        if hp <= 0:
                            game_over = True
                            all_sprites.empty()

            # ========== 第三阶段碰撞逻辑 ==========
            elif stage3 and not game_clear and not game_paused:
                # enemy3碰撞
                if not hidden_boss_phase and invincible_frame <= 0:
                    hit_e3_player = pygame.sprite.spritecollide(player, enemy3_group, True)
                    if hit_e3_player:
                        hp -= 1
                        invincible_frame = INVINCIBLE_FRAME_TOTAL
                        if hp <= 0:
                            game_over = True
                            all_sprites.empty()

                if not hidden_boss_phase:
                    hit_e3 = pygame.sprite.groupcollide(enemy3_group, bullets, True, True)
                    for _ in hit_e3:
                        score += 10
                        kill_enemy3_count += 1
                        play_sound(SND_ENEMY_DEATH)

                if not hidden_boss_phase and invincible_frame <= 0:
                    hit_e4_player = pygame.sprite.spritecollide(player, enemy4_group, False)
                    if hit_e4_player:
                        hp -= 1
                        invincible_frame = INVINCIBLE_FRAME_TOTAL
                        if hp <= 0:
                            game_over = True
                            all_sprites.empty()

                if not hidden_boss_phase:
                    hit_e4 = pygame.sprite.groupcollide(enemy4_group, bullets, False, True)
                    for e4, bullet_list in hit_e4.items():
                        for i, enemy in enumerate(enemy4_group):
                            if enemy == e4:
                                enemy4_hp[i] -= 1
                                play_sound(SND_BOSS_HIT)
                                if enemy4_hp[i] <= 0:
                                    enemy.kill()
                                    score += 50
                                    enemy4_death_count += 1
                                break

                if not hidden_boss_phase and invincible_frame <= 0:
                    hit = pygame.sprite.spritecollide(player, enemy4_bullet_group, True)
                    if hit:
                        hp -= 1
                        invincible_frame = INVINCIBLE_FRAME_TOTAL
                        if hp <= 0:
                            game_over = True
                            all_sprites.empty()

                # Dark Boss逻辑
                if not hidden_boss_phase and dark_boss_exist:
                    dark_boss_shot_timer += 1
                    if dark_boss_shot_timer >= DARK_BOSS_SHOT_INTERVAL:
                        dark_boss_shot_timer = 0
                        db = dark_boss_group.sprites()[0]
                        for i in range(random.randint(20, 40)):
                            ang = random.randint(0, 360)
                            bb = DarkBossBullet(db.rect.centerx, db.rect.bottom, ang)
                            all_sprites.add(bb)
                            dark_boss_bullet_group.add(bb)

                    hit_db = pygame.sprite.groupcollide(dark_boss_group, bullets, False, True)
                    for _ in hit_db:
                        dark_boss_hp -= 1
                        play_sound(SND_BOSS_HIT)
                        if dark_boss_hp <= 0:
                            for db in dark_boss_group:
                                db.is_dead = True
                                db.is_fully_dead = True
                                db.kill()
                            dark_boss_group.empty()
                            play_sound(SND_ENEMY_DEATH)
                            dark_boss_exist = False
                            dark_boss_defeated = True
                            score += 800
                            dark_boss_hp = -1

                    if invincible_frame <= 0:
                        hit = pygame.sprite.spritecollide(player, dark_boss_bullet_group, True)
                        if hit:
                            hp -= 1
                            invincible_frame = INVINCIBLE_FRAME_TOTAL
                            if hp <= 0:
                                game_over = True
                                all_sprites.empty()

                        # 玩家碰到Dark Boss - 不播放音效
                        hit_db_player = pygame.sprite.spritecollide(player, dark_boss_group, False)
                        if hit_db_player:
                            hp -= 1
                            invincible_frame = INVINCIBLE_FRAME_TOTAL
                            if hp <= 0:
                                game_over = True
                                all_sprites.empty()

                # Dark Boss2逻辑
                if not hidden_boss_phase and dark_boss2_exist:
                    hit_db2 = pygame.sprite.groupcollide(dark_boss2_group, bullets, False, True)
                    for _ in hit_db2:
                        dark_boss2_hp -= 1
                        play_sound(SND_BOSS_HIT)
                        if dark_boss2_hp <= 0:
                            for b2 in dark_boss2_group:
                                b2.is_dead = True
                                b2.is_fully_dead = True
                                b2.kill()
                            dark_boss2_group.empty()
                            play_sound(SND_ENEMY_DEATH)
                            dark_boss2_exist = False
                            dark_boss2_defeated = True
                            score += 1200
                            dark_boss2_hp = -1

                    if invincible_frame <= 0:
                        hit1 = pygame.sprite.spritecollide(player, dark_boss2_bullet_group, True)
                        hit2 = pygame.sprite.spritecollide(player, dark_boss2_bullet2_group, True)
                        if hit1 or hit2:
                            hp -= 1
                            invincible_frame = INVINCIBLE_FRAME_TOTAL
                            if hp <= 0:
                                game_over = True
                                all_sprites.empty()

                        # 玩家碰到Dark Boss2 - 不播放音效
                        hit_db2_player = pygame.sprite.spritecollide(player, dark_boss2_group, False)
                        if hit_db2_player:
                            hp -= 1
                            invincible_frame = INVINCIBLE_FRAME_TOTAL
                            if hp <= 0:
                                game_over = True
                                all_sprites.empty()

                # 检查双BOSS是否都被击败 -> 进入隐藏BOSS阶段
                if dark_boss_defeated and dark_boss2_defeated and not hidden_boss_phase:
                    hidden_boss_phase = True
                    enemy3_group.empty()
                    enemy4_group.empty()
                    enemy4_bullet_group.empty()
                    dark_boss_bullet_group.empty()
                    dark_boss2_bullet_group.empty()
                    dark_boss2_bullet2_group.empty()
                    for _ in range(3):
                        ge = GiantEnemy3()
                        all_sprites.add(ge)
                        giant_enemy3_group.add(ge)

                # 巨大化enemy3被子弹击中
                if hidden_boss_phase:
                    hit_giant = pygame.sprite.groupcollide(giant_enemy3_group, bullets, False, True)
                    for ge, bullet_list in hit_giant.items():
                        ge.hp -= 1
                        if ge.hp <= 0:
                            ge.kill()
                            giant_enemy3_kill_count += 1
                            score += 30
                            play_sound(SND_ENEMY_DEATH)

                    if invincible_frame <= 0:
                        hit_giant_player = pygame.sprite.spritecollide(player, giant_enemy3_group, True)
                        if hit_giant_player:
                            hp -= 1
                            invincible_frame = INVINCIBLE_FRAME_TOTAL
                            if hp <= 0:
                                game_over = True
                                all_sprites.empty()

                    # 隐藏Boss碰撞
                    if hidden_boss_exist:
                        # 子弹碰撞 - 播放音效
                        hit_hidden = pygame.sprite.groupcollide(hidden_boss_group, bullets, False, True)
                        for hb in hit_hidden:
                            # 镜面反射
                            if hb.shield_active:
                                for bullet in hit_hidden[hb]:
                                    reflect_bullet = Bullet(bullet.rect.centerx, bullet.rect.centery)
                                    reflect_bullet.vy = 10
                                    reflect_bullet.vx = bullet.vx * 0.5
                                    all_sprites.add(reflect_bullet)
                                    bullets.add(reflect_bullet)
                                continue

                            if not hb.hit:
                                hb.hit = True
                                hb.hp = 0
                                score += 9999
                                play_sound(SND_BOSS_HIT)  # 第一次击中"？？？"
                            elif hb.transformed:
                                hb.hp -= 1
                                play_sound(SND_BOSS_HIT)  # 击中暗黑灵梦
                                if hb.hp <= 0:
                                    hb.kill()
                                    score += 10000
                                    play_sound(SND_ENEMY_DEATH)
                                    # 进入通关状态，清除所有敌人和子弹
                                    game_clear = True
                                    clear_timer = 0
                                    clear_phase = 0
                                    # 清除所有敌人和子弹
                                    enemy3_group.empty()
                                    enemy4_group.empty()
                                    enemy4_bullet_group.empty()
                                    dark_boss_bullet_group.empty()
                                    dark_boss2_bullet_group.empty()
                                    dark_boss2_bullet2_group.empty()
                                    dark_ring_group.empty()
                                    dark_arrow_group.empty()
                                    dark_ring2_group.empty()
                                    dark_clone_bullet_group.empty()
                                    dark_clone_group.empty()
                                    giant_enemy3_group.empty()
                                    boss_bullets.empty()
                                    boss2_bullet_group.empty()
                                    boss2_bullet2_group.empty()
                                    bullets.empty()
                                    # 清除隐藏BOSS组
                                    hidden_boss_group.empty()
                                    # 清除所有敌人
                                    enemies.empty()
                                    enemy2_group.empty()
                                    enemy3_group.empty()
                                    enemy4_group.empty()
                                    # 清除分身
                                    for hb2 in hidden_boss_group:
                                        if hasattr(hb2, 'clones'):
                                            hb2.clones = []
                                    mission3_complete = False

                        # 玩家碰到隐藏Boss - 不播放音效
                        if invincible_frame <= 0:
                            hit_boss_player = pygame.sprite.spritecollide(player, hidden_boss_group, False)
                            if hit_boss_player:
                                hp -= 1
                                invincible_frame = INVINCIBLE_FRAME_TOTAL
                                if hp <= 0:
                                    game_over = True
                                    all_sprites.empty()

                        # 分身碰撞
                        hit_clone = pygame.sprite.groupcollide(dark_clone_group, bullets, False, True)
                        for clone, bullet_list in hit_clone.items():
                            clone.hp -= 1
                            if clone.hp <= 0:
                                clone.kill()
                                score += 50
                                if clone in hidden_boss_group.sprites()[0].clones:
                                    hidden_boss_group.sprites()[0].clones.remove(clone)

                        # 暗影结界碰撞
                        for ring in dark_ring_group:
                            if ring.check_collision(player.rect) and invincible_frame <= 0:
                                hp -= 1
                                invincible_frame = INVINCIBLE_FRAME_TOTAL
                                if hp <= 0:
                                    game_over = True
                                    all_sprites.empty()

                        # 其他子弹碰撞
                        if invincible_frame <= 0:
                            hit_arrow = pygame.sprite.spritecollide(player, dark_arrow_group, True)
                            if hit_arrow:
                                hp -= 1
                                invincible_frame = INVINCIBLE_FRAME_TOTAL

                            hit_ring2 = pygame.sprite.spritecollide(player, dark_ring2_group, True)
                            if hit_ring2:
                                hp -= 1
                                invincible_frame = INVINCIBLE_FRAME_TOTAL

                            hit_clone_bullet = pygame.sprite.spritecollide(player, dark_clone_bullet_group, True)
                            if hit_clone_bullet:
                                hp -= 1
                                invincible_frame = INVINCIBLE_FRAME_TOTAL

                            if hp <= 0:
                                game_over = True
                                all_sprites.empty()

            # 更新精灵（通关时不更新，暂停时也不更新）
            if not stage_transition and not game_clear and not game_paused:
                all_sprites.update()
            elif not game_clear:
                player.update()
                if not game_paused:
                    bullets.update()

        # ============ 分层绘制 ============
        screen.fill(bg_color)

        # 第一关：绘制星空和月亮
        if not stage2 and not stage3:
            for star in stars:
                x, y, s, size = star
                y += s
                if y > height:
                    y = -5
                    x = random.randint(0, width)
                star[1] = y
                star[0] = x
                flick = random.randint(85, 100) / 100
                c = (int(255 * flick), int(255 * flick), 255)
                pygame.draw.circle(screen, c, (int(x), int(y)), size)

            for i in range(3):
                glow_radius = moon_glow_radius + i * 15
                glow_alpha = 20 - i * 5
                glow_surf = pygame.Surface((glow_radius * 2, glow_radius * 2), pygame.SRCALPHA)
                pygame.draw.circle(glow_surf, (180, 200, 255, glow_alpha), (glow_radius, glow_radius), glow_radius)
                screen.blit(glow_surf, (moon_x - glow_radius, moon_y - glow_radius))

            pygame.draw.circle(screen, MOON_COLOR, (int(moon_x), int(moon_y)), moon_radius)
            shadow_surf = pygame.Surface((moon_radius * 2, moon_radius * 2), pygame.SRCALPHA)
            pygame.draw.circle(shadow_surf, (200, 180, 150, 80), (moon_radius + 10, moon_radius - 5), moon_radius)
            screen.blit(shadow_surf, (int(moon_x) - moon_radius, int(moon_y) - moon_radius))

            crater_positions = [
                (moon_x - 15, moon_y - 10, 8),
                (moon_x + 20, moon_y + 5, 6),
                (moon_x - 5, moon_y + 18, 10),
                (moon_x + 10, moon_y - 20, 5),
                (moon_x - 25, moon_y + 8, 7)
            ]
            for cx, cy, cr in crater_positions:
                crater_surf = pygame.Surface((cr * 2, cr * 2), pygame.SRCALPHA)
                pygame.draw.circle(crater_surf, (220, 200, 180, 60), (cr, cr), cr)
                screen.blit(crater_surf, (int(cx) - cr, int(cy) - cr))

        # 第二关：下雨效果
        elif stage2:
            if bg_gray_val < 80:
                fog_surf = pygame.Surface((width, height), pygame.SRCALPHA)
                fog_alpha = int(15 * (1 - bg_gray_val / 80))
                fog_surf.fill((80, 80, 120, min(fog_alpha, 30)))
                screen.blit(fog_surf, (0, 0))

            for drop in raindrops:
                x, y, speed, length, wind = drop
                y += speed
                x += wind
                if y > height:
                    y = -random.randint(10, 80)
                    x = random.randint(0, width)
                    drop[2] = random.uniform(7, 16)
                if x < -20:
                    x = width + 20
                if x > width + 20:
                    x = -20
                drop[1] = y
                drop[0] = x

                base_bright = 200 + int(bg_gray_val * 0.3)
                if base_bright > 255:
                    base_bright = 255
                color = (base_bright, base_bright, 255)
                end_x = int(x + wind * 2)
                end_y = int(y + length)
                pygame.draw.line(screen, color, (int(x), int(y)), (end_x, end_y), 1)
                pygame.draw.circle(screen, (255, 255, 255), (int(x), int(y)), 1)

        # 第三关：俯视图纵向滚动卷轴 - 岩浆背景
        elif stage3:
            # ========== 滚动参数 ==========
            if not hasattr(sys.modules[__name__], 'scroll_y3'):
                scroll_y3 = 0
            else:
                scroll_y3 = getattr(sys.modules[__name__], 'scroll_y3', 0)

            scroll_speed = 2.5
            scroll_y3 += scroll_speed
            if scroll_y3 >= height:
                scroll_y3 = 0

            setattr(sys.modules[__name__], 'scroll_y3', scroll_y3)

            # ========== 岩石系统 ==========
            if not hasattr(sys.modules[__name__], 'rocks'):
                rocks = []
                for _ in range(25):
                    size = random.randint(15, 55)
                    points = []
                    num_points = random.randint(5, 8)
                    for i in range(num_points):
                        angle = (i / num_points) * 2 * math.pi + random.uniform(-0.3, 0.3)
                        dist = size * random.uniform(0.6, 1.0)
                        px = math.cos(angle) * dist
                        py = math.sin(angle) * dist
                        points.append((px, py))
                    base_color = random.randint(40, 80)
                    color = (base_color + random.randint(-15, 15),
                             base_color - random.randint(-10, 20),
                             base_color - random.randint(20, 40))
                    x = random.randint(20, width - 20)
                    y = random.randint(0, height)
                    rot_speed = random.uniform(-0.02, 0.02)
                    rocks.append({
                        'points': points,
                        'x': x,
                        'y': y,
                        'color': color,
                        'rot': random.uniform(0, 2 * math.pi),
                        'rot_speed': rot_speed,
                        'size': size,
                        'speed_offset': random.uniform(0.7, 1.3)
                    })
                setattr(sys.modules[__name__], 'rocks', rocks)
            else:
                rocks = getattr(sys.modules[__name__], 'rocks')

            # ========== 岩浆气泡 ==========
            if not hasattr(sys.modules[__name__], 'lava_bubbles3'):
                lava_bubbles3 = []
                for _ in range(40):
                    lava_bubbles3.append({
                        'x': random.randint(10, width - 10),
                        'y': random.randint(0, height),
                        'radius': random.randint(3, 12),
                        'speed': random.uniform(0.5, 2.0),
                        'phase': random.uniform(0, 2 * math.pi),
                        'alpha': random.randint(60, 180)
                    })
                setattr(sys.modules[__name__], 'lava_bubbles3', lava_bubbles3)
            else:
                lava_bubbles3 = getattr(sys.modules[__name__], 'lava_bubbles3')

            # ========== 发光粒子 ==========
            if not hasattr(sys.modules[__name__], 'glow_particles3'):
                glow_particles3 = []
                for _ in range(30):
                    glow_particles3.append({
                        'x': random.randint(0, width),
                        'y': random.randint(0, height),
                        'size': random.randint(2, 6),
                        'life': random.randint(20, 60),
                        'max_life': 60,
                        'speed': random.uniform(0.3, 1.0)
                    })
                setattr(sys.modules[__name__], 'glow_particles3', glow_particles3)
            else:
                glow_particles3 = getattr(sys.modules[__name__], 'glow_particles3')

            # ========== 1. 绘制岩浆背景 ==========
            for y in range(height):
                offset_y = (y + scroll_y3) % height
                t = offset_y / height
                if t < 0.3:
                    r = 80 + 60 * (t / 0.3)
                    g = 20 + 30 * (t / 0.3)
                    b = 10 + 10 * (t / 0.3)
                elif t < 0.7:
                    local_t = (t - 0.3) / 0.4
                    r = 140 + 80 * local_t
                    g = 50 + 50 * local_t
                    b = 10 + 10 * local_t
                else:
                    local_t = (t - 0.7) / 0.3
                    r = 220 - 60 * local_t
                    g = 100 - 40 * local_t
                    b = 20 - 10 * local_t

                wave = 15 * math.sin(y * 0.02 + pygame.time.get_ticks() / 1000)
                wave2 = 10 * math.sin(y * 0.035 + pygame.time.get_ticks() / 1500 + 1.0)
                r = min(255, max(20, r + int(wave * 0.3)))
                g = min(200, max(10, g + int(wave2 * 0.2)))
                b = min(60, max(5, b + int(wave * 0.1)))

                pygame.draw.line(screen, (r, g, b), (0, y), (width, y))

            # ========== 2. 岩浆纹理流动线条 ==========
            for i in range(12):
                base_y = (i * (height / 12) + scroll_y3 * 0.5) % height
                for j in range(3):
                    y = base_y + j * 8
                    if y > height:
                        y -= height
                    points = []
                    for x in range(0, width, 5):
                        wave_y = 8 * math.sin(x * 0.02 + i * 1.5 + pygame.time.get_ticks() / 2000)
                        points.append((x, y + wave_y))
                    if len(points) > 1:
                        try:
                            color = (255, 150 + i * 5, 30)
                            for p in range(len(points) - 1):
                                pygame.draw.line(screen, color, points[p], points[p + 1], 1)
                        except:
                            pass

            # ========== 3. 岩浆亮斑 ==========
            for i in range(8):
                x = (i * (width / 8) + scroll_y3 * 0.3) % width
                y = (i * 50 + scroll_y3 * 0.7) % height
                radius = 15 + 10 * math.sin(i * 2.3 + pygame.time.get_ticks() / 1500)
                glow_alpha = 30 + 20 * math.sin(i * 1.7 + pygame.time.get_ticks() / 1000)
                surf = pygame.Surface((int(radius * 4), int(radius * 4)), pygame.SRCALPHA)
                for r in range(int(radius * 2), 0, -1):
                    alpha = int(glow_alpha * (r / (radius * 2)))
                    pygame.draw.circle(surf, (255, 200, 100, alpha), (int(radius * 2), int(radius * 2)), r)
                screen.blit(surf, (int(x - radius * 2), int(y - radius * 2)))

            # ========== 4. 绘制岩石 ==========
            for rock in rocks:
                rock_y = (rock['y'] + scroll_y3 * rock['speed_offset']) % (height + 50) - 25
                rock_x = rock['x'] + 10 * math.sin(rock_y * 0.005 + rock['rot'])

                if rock_y < -50:
                    rock_y = height + 50
                    rock['x'] = random.randint(20, width - 20)
                if rock_x < -50:
                    rock_x = width + 50
                elif rock_x > width + 50:
                    rock_x = -50

                rock['rot'] += rock['rot_speed']

                # 阴影
                shadow_points = []
                for px, py in rock['points']:
                    rot_x = px * math.cos(rock['rot']) - py * math.sin(rock['rot'])
                    rot_y = px * math.sin(rock['rot']) + py * math.cos(rock['rot'])
                    shadow_points.append((rock_x + rot_x + 3, rock_y + rot_y + 3))
                if len(shadow_points) > 2:
                    try:
                        pygame.draw.polygon(screen, (10, 10, 10), shadow_points)
                    except:
                        pass

                # 岩石主体
                points = []
                for px, py in rock['points']:
                    rot_x = px * math.cos(rock['rot']) - py * math.sin(rock['rot'])
                    rot_y = px * math.sin(rock['rot']) + py * math.cos(rock['rot'])
                    points.append((rock_x + rot_x, rock_y + rot_y))

                if len(points) > 2:
                    try:
                        pygame.draw.polygon(screen, rock['color'], points)
                        highlight_color = (min(255, rock['color'][0] + 40),
                                           min(255, rock['color'][1] + 30),
                                           min(255, rock['color'][2] + 20))
                        pygame.draw.polygon(screen, highlight_color, points, 2)

                        if rock['size'] > 30:
                            for _ in range(random.randint(1, 3)):
                                cx = rock_x + random.randint(-rock['size'] // 2, rock['size'] // 2)
                                cy = rock_y + random.randint(-rock['size'] // 2, rock['size'] // 2)
                                crack_len = random.randint(5, 15)
                                crack_angle = random.uniform(0, 2 * math.pi)
                                end_x = cx + math.cos(crack_angle) * crack_len
                                end_y = cy + math.sin(crack_angle) * crack_len
                                pygame.draw.line(screen, (30, 25, 20), (cx, cy), (end_x, end_y), 1)
                    except:
                        pass

                # 大型岩石发光
                if rock['size'] > 40:
                    glow_surf = pygame.Surface((rock['size'] * 2 + 20, rock['size'] * 2 + 20), pygame.SRCALPHA)
                    glow_color = (255, 150, 50, 15)
                    pygame.draw.circle(glow_surf, glow_color, (rock['size'] + 10, rock['size'] + 10), rock['size'] + 10)
                    screen.blit(glow_surf, (int(rock_x - rock['size'] - 10), int(rock_y - rock['size'] - 10)))

            # ========== 5. 岩浆气泡 ==========
            for bubble in lava_bubbles3:
                bubble_y = (bubble['y'] + scroll_y3 * bubble['speed']) % height
                bubble_x = bubble['x'] + 15 * math.sin(bubble_y * 0.01 + bubble['phase'])

                pulse = 1 + 0.2 * math.sin(pygame.time.get_ticks() / 500 + bubble['phase'])
                radius = bubble['radius'] * pulse

                if radius > 1:
                    glow_surf = pygame.Surface((int(radius * 4), int(radius * 4)), pygame.SRCALPHA)
                    for r in range(int(radius * 2), 0, -1):
                        alpha = int(bubble['alpha'] * 0.3 * (r / (radius * 2)))
                        pygame.draw.circle(glow_surf, (255, 200, 100, alpha),
                                           (int(radius * 2), int(radius * 2)), r)
                    screen.blit(glow_surf, (int(bubble_x - radius * 2), int(bubble_y - radius * 2)))

                    color = (255, 180 + int(30 * math.sin(pygame.time.get_ticks() / 400 + bubble['phase'])), 50)
                    pygame.draw.circle(screen, color, (int(bubble_x), int(bubble_y)), int(radius))
                    highlight = (255, 255, 200)
                    pygame.draw.circle(screen, highlight,
                                       (int(bubble_x - radius * 0.3), int(bubble_y - radius * 0.3)),
                                       int(radius * 0.3))

            # ========== 6. 发光粒子 ==========
            for particle in glow_particles3:
                particle['y'] = (particle['y'] + scroll_y3 * 0.8 + particle['speed']) % height
                particle['life'] -= 1

                if particle['life'] <= 0:
                    particle['x'] = random.randint(0, width)
                    particle['y'] = random.randint(0, height)
                    particle['life'] = random.randint(20, 60)
                    particle['size'] = random.randint(2, 6)

                life_ratio = particle['life'] / particle['max_life']
                alpha = int(150 * life_ratio)
                size = int(particle['size'] * (0.3 + 0.7 * life_ratio))

                if size > 0:
                    surf = pygame.Surface((size * 2, size * 2), pygame.SRCALPHA)
                    color = (255, 200 - int(100 * (1 - life_ratio)), 50, alpha)
                    pygame.draw.circle(surf, color, (size, size), size)
                    screen.blit(surf, (int(particle['x'] - size), int(particle['y'] - size)))

            # ========== 7. 岩浆波纹 ==========
            for i in range(5):
                base_x = (i * (width / 5) + scroll_y3 * 0.2) % width
                y_offset = (scroll_y3 * 0.6) % height
                for j in range(3):
                    y = (j * 30 + y_offset + i * 10) % height
                    radius = 20 + 10 * math.sin(i * 2.1 + j * 1.3 + pygame.time.get_ticks() / 800)
                    alpha = 20 + 10 * math.sin(i * 1.7 + pygame.time.get_ticks() / 600)
                    surf = pygame.Surface((int(radius * 2), int(radius * 2)), pygame.SRCALPHA)
                    pygame.draw.circle(surf, (255, 180, 80, alpha), (int(radius), int(radius)), int(radius), 1)
                    screen.blit(surf, (int(base_x - radius + 20 * math.sin(i + j + pygame.time.get_ticks() / 1000)),
                                       int(y - radius)))

            # ========== 8. 底部边缘光晕 ==========
            for i in range(3):
                y_pos = height - i * 20
                alpha = max(60 - i * 15, 5)
                glow_surf = pygame.Surface((width, 40), pygame.SRCALPHA)
                glow_surf.fill((255, 80, 20, alpha))
                screen.blit(glow_surf, (0, y_pos))

            # 保存滚动值
            setattr(sys.modules[__name__], 'scroll_y3', scroll_y3)


        # 绘制精灵（通关时不绘制）
        if not game_over and not game_clear:
            if not stage2 and not stage3:
                enemies.draw(screen)
                boss_group.draw(screen)
                boss_bullets.draw(screen)
            elif stage2:
                enemy2_group.draw(screen)
                boss2_group.draw(screen)
                boss2_bullet_group.draw(screen)
                boss2_bullet2_group.draw(screen)
            elif stage3:
                enemy3_group.draw(screen)
                enemy4_group.draw(screen)
                enemy4_bullet_group.draw(screen)
                dark_boss_group.draw(screen)
                dark_boss2_group.draw(screen)
                dark_boss_bullet_group.draw(screen)
                dark_boss2_bullet_group.draw(screen)
                dark_boss2_bullet2_group.draw(screen)
                giant_enemy3_group.draw(screen)
                hidden_boss_group.draw(screen)
                dark_ring_group.draw(screen)
                dark_arrow_group.draw(screen)
                dark_ring2_group.draw(screen)
                dark_clone_bullet_group.draw(screen)
                dark_clone_group.draw(screen)

            bullets.draw(screen)

            if invincible_frame > 0:
                alpha_val = 255 if (invincible_frame // 10) % 2 == 0 else 60
                player.image.set_alpha(alpha_val)
                screen.blit(player.image, player.rect)
                player.image.set_alpha(255)
            else:
                screen.blit(player.image, player.rect)
        elif game_clear:
            # 通关时只显示玩家
            screen.blit(player.image, player.rect)
        else:
            over_text = gameover_font.render("GAME OVER", True, RED)
            over_rect = over_text.get_rect(center=(width // 2, height * 0.35))
            screen.blit(over_text, over_rect)
            score_text = score_font.render(f"Final Score: {score}", True, WHITE)
            score_rect = score_text.get_rect(center=(width // 2, height * 0.52))
            screen.blit(score_text, score_rect)
            # 只有一个 BACK MENU 选项
            menu_font = pygame.font.Font(font_path, 30)
            menu_text = menu_font.render("▶ BACK MENU", True, (255, 215, 0))
            menu_rect = menu_text.get_rect(center=(width // 2, height * 0.63))
            screen.blit(menu_text, menu_rect)

        # 打雷闪光（第二关和第三关）
        if (stage2 or stage3) and lightning_flash_frames > 0:
            alpha = int(255 * (lightning_flash_frames / LIGHTNING_FLASH_MAX))
            surf = pygame.Surface((width, height)).convert_alpha()
            surf.fill(WHITE)
            surf.set_alpha(alpha)
            screen.blit(surf, (0, 0))

        # EX白闪
        if ex_flash_timer > 0:
            flash_surf = pygame.Surface((width, height)).convert_alpha()
            if ex_flash_timer % 4 < 2:
                flash_surf.set_alpha(90)
            else:
                flash_surf.set_alpha(0)
            flash_surf.fill(WHITE)
            screen.blit(flash_surf, (0, 0))

        # ========== 暂停界面 ==========
        if game_paused:
            # 半透明遮罩
            overlay = pygame.Surface((width, height), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 180))
            screen.blit(overlay, (0, 0))

            # PAUSE 文字
            pause_font = pygame.font.Font(font_path, 80)
            pause_text = pause_font.render("PAUSE", True, (255, 255, 100))
            pause_rect = pause_text.get_rect(center=(width // 2, height // 2 - 120))
            screen.blit(pause_text, pause_rect)

            # 暂停菜单选项
            for i, option in enumerate(pause_options):
                y_pos = height // 2 - 20 + i * 50
                if i == pause_menu_index:
                    color = (255, 215, 0)
                    prefix = "▶ "
                else:
                    color = (200, 200, 200)
                    prefix = "  "

                ft_option = pygame.font.Font(font_path, 30)
                option_text = ft_option.render(f"{prefix}{option}", True, color)
                option_rect = option_text.get_rect(center=(width // 2, y_pos))
                screen.blit(option_text, option_rect)

        # UI文字
        if not game_over and not game_paused:
            screen.blit(font.render(f"Score: {score}", True, WHITE), (10, 10))
            screen.blit(font.render(f"EX剩余：{ex_count} ", True, (255, 180, 180)), (10, height - 40))
            if ex_power_timer > 0:
                t = round(ex_power_timer / FPS, 1)
                screen.blit(font.render(f"强化火力 {t}s", True, (255, 255, 100)), (10, height - 20))

            # 暂停提示（游戏中）
            pause_hint_font = pygame.font.Font(font_path, 16)
            pause_hint = pause_hint_font.render("press ESC to pause", True, (150, 150, 150))
            screen.blit(pause_hint, (width - 180, 10))

            if stage3 and not game_clear:
                if not hidden_boss_phase:
                    screen.blit(
                        font.render(f"击杀enemy3: {kill_enemy3_count}/{kill_enemy3_target}", True, (255, 200, 100)),
                        (10, 40))
                    if enemy4_spawned:
                        screen.blit(font.render(f"击败enemy4: {enemy4_death_count}/3", True, (200, 100, 255)), (10, 60))
                else:
                    if not hidden_boss_exist:
                        screen.blit(
                            font.render(f"击败巨大化敌人: {giant_enemy3_kill_count}/{GIANT_ENEMY3_TARGET}", True,
                                        (255, 200, 100)),
                            (10, 40))
                    else:
                        screen.blit(font.render(f"击败？？？", True, (255, 215, 0)),
                                    (10, 40))

            # ========== 通关画面 ==========
            if game_clear:
                if clear_phase == 0:
                    # 显示 MISSION3 COMPLETE
                    ft = pygame.font.Font(font_path, 50)
                    txt = ft.render("MISSION3 COMPLETE", True, (0, 255, 0))
                    rect = txt.get_rect(center=(width // 2, height // 2 - 80))
                    screen.blit(txt, rect)
                else:
                    # 显示 EXCELLENT!
                    ft1 = pygame.font.Font(font_path, 80)
                    txt1 = ft1.render("EXCELLENT!", True, (255, 215, 0))
                    rect1 = txt1.get_rect(center=(width // 2, height // 2 - 140))
                    screen.blit(txt1, rect1)

                    # 显示分数
                    ft2 = pygame.font.Font(font_path, 40)
                    txt2 = ft2.render(f"Score: {score}", True, WHITE)
                    rect2 = txt2.get_rect(center=(width // 2, height // 2 - 40))
                    screen.blit(txt2, rect2)

                    # 只有一个 BACK MENU 选项
                    ft3 = pygame.font.Font(font_path, 30)
                    txt3 = ft3.render("▶ BACK MENU", True, (255, 215, 0))
                    rect3 = txt3.get_rect(center=(width // 2, height // 2 + 40))
                    screen.blit(txt3, rect3)

            if stage_transition:
                ft = pygame.font.Font(font_path, 60)
                glow_txt = ft.render(stage_title, True, (255, 150, 50))
                glow_rect = glow_txt.get_rect(center=(width // 2 + 3, height // 2 + 3))
                screen.blit(glow_txt, glow_rect)
                txt = ft.render(stage_title, True, (255, 200, 100))
                rect = txt.get_rect(center=(width // 2, height // 2))
                screen.blit(txt, rect)
                ft2 = pygame.font.Font(font_path, 30)
                sub_txt = ft2.render("准备开始...", True, (200, 200, 255))
                sub_rect = sub_txt.get_rect(center=(width // 2, height // 2 + 70))
                screen.blit(sub_txt, sub_rect)
                progress = stage_transition_timer / STAGE_TRANSITION_DELAY
                bar_width = 200
                bar_height = 6
                bar_x = (width - bar_width) // 2
                bar_y = height // 2 + 110
                pygame.draw.rect(screen, GRAY, (bar_x, bar_y, bar_width, bar_height))
                pygame.draw.rect(screen, (255, 200, 100), (bar_x, bar_y, bar_width * progress, bar_height))

            if not stage_transition and not game_clear:
                if stage3:
                    if not hidden_boss_phase:
                        ft = pygame.font.Font(font_path, 40)
                        txt = ft.render("STAGE 3 - Lava Hell", True, (255, 200, 100))
                        rect = txt.get_rect(center=(width // 2, 30))
                        screen.blit(txt, rect)
                elif stage2:
                    ft = pygame.font.Font(font_path, 40)
                    txt = ft.render("STAGE 2 - Midnight Storm", True, (200, 200, 255))
                    rect = txt.get_rect(center=(width // 2, 30))
                    screen.blit(txt, rect)
                elif not stage2 and not stage3:
                    ft = pygame.font.Font(font_path, 30)
                    txt = ft.render("STAGE 1 - Night Galaxy", True, (200, 200, 255))
                    rect = txt.get_rect(center=(width // 2, 30))
                    screen.blit(txt, rect)

            # 血条（通关时不显示）
            if not game_clear:
                bar_w = 80
                bar_h = 16
                ava_size = 32
                base_x = width - bar_w - ava_size - 15
                base_y = height - bar_h - 30
                ava = pygame.transform.scale(IMG_PLAYER_PIC, (ava_size, ava_size))
                ava_y = base_y + 10 - (ava_size - bar_h) // 2
                screen.blit(ava, (base_x, ava_y))
                bar_x = base_x + ava_size + 5
                pygame.draw.rect(screen, GRAY, (bar_x, base_y, bar_w, bar_h))
                fill_w = bar_w * (hp / max_hp)
                pygame.draw.rect(screen, RED, (bar_x, base_y, fill_w, bar_h))
                hp_txt = font.render("博丽灵梦", True, WHITE)
                txt_x = bar_x + (bar_w - hp_txt.get_width()) // 2
                screen.blit(hp_txt, (txt_x, base_y + bar_h + 2))

            # BOSS血条
            if not game_clear:
                if not stage2 and not stage3 and boss_exist:
                    bw = width-20
                    bh = 22
                    bx = (width - bw) // 2
                    by = 50
                    pygame.draw.rect(screen, GRAY, (bx, by, bw, bh))
                    fill = bw * (boss_current_hp / boss_max_hp)
                    pygame.draw.rect(screen, BOSS_RED, (bx, by, fill, bh))
                    boss_txt = font.render(f"雾雨魔理沙 HP: {boss_current_hp}/{boss_max_hp}", True, WHITE)
                    rect = boss_txt.get_rect(center=(width // 2, by + bh // 2))
                    screen.blit(boss_txt, rect)

                if stage2 and boss2_exist:
                    bw = width-20
                    bh = 22
                    bx = (width - bw) // 2
                    by = 50
                    pygame.draw.rect(screen, GRAY, (bx, by, bw, bh))
                    fill = bw * (boss2_current_hp / boss2_max_hp)
                    pygame.draw.rect(screen, (120, 120, 255), (bx, by, fill, bh))
                    boss2_txt = font.render(f"十六夜咲夜 HP: {boss2_current_hp}/{boss2_max_hp}", True, WHITE)
                    rect = boss2_txt.get_rect(center=(width // 2, by + bh // 2))
                    screen.blit(boss2_txt, rect)

                if stage3 and dark_boss_exist:
                    bw = width-20
                    bh = 22
                    bx = (width - bw) // 2
                    by = 50
                    pygame.draw.rect(screen, GRAY, (bx, by, bw, bh))
                    fill = bw * (dark_boss_hp / dark_boss_max_hp)
                    pygame.draw.rect(screen, (150, 0, 200), (bx, by, fill, bh))
                    boss_txt = font.render(f"DARK 雾雨魔理沙 HP: {dark_boss_hp}/{dark_boss_max_hp}", True, WHITE)
                    rect = boss_txt.get_rect(center=(bx + bw // 2, by + bh // 2))
                    screen.blit(boss_txt, rect)

                if stage3 and dark_boss2_exist:
                    bw = width-20
                    bh = 22
                    bx = (width - bw) // 2
                    by = 75
                    pygame.draw.rect(screen, GRAY, (bx, by, bw, bh))
                    fill = bw * (dark_boss2_hp / dark_boss2_max_hp)
                    pygame.draw.rect(screen, (80, 0, 160), (bx, by, fill, bh))
                    boss2_txt = font.render(f"DARK 十六夜咲夜 HP: {dark_boss2_hp}/{dark_boss2_max_hp}", True, WHITE)
                    rect = boss2_txt.get_rect(center=(bx + bw // 2, by + bh // 2))
                    screen.blit(boss2_txt, rect)

                # 隐藏Boss血条（紫色->黑色->紫色渐变）
                if hidden_boss_exist:
                    bw = width-20
                    bh = 22
                    bx = (width - bw) // 2
                    by = 100

                    hb = hidden_boss_group.sprites()[0] if hidden_boss_group else None
                    if hb:
                        # 计算当前渐变位置（随时间变化）
                        gradient_time = pygame.time.get_ticks() / 2000  # 每2秒一个循环
                        gradient_pos = (math.sin(gradient_time) + 1) / 2  # 0-1之间循环

                        # 紫色和黑色混合
                        purple = (180, 0, 255)
                        black = (20, 0, 30)
                        r = int(purple[0] * (1 - gradient_pos) + black[0] * gradient_pos)
                        g = int(purple[1] * (1 - gradient_pos) + black[1] * gradient_pos)
                        b = int(purple[2] * (1 - gradient_pos) + black[2] * gradient_pos)
                        bar_color = (r, g, b)

                        # 血条背景也用渐变
                        bg_purple = (80, 0, 120)
                        bg_black = (10, 0, 15)
                        bg_r = int(bg_purple[0] * (1 - gradient_pos) + bg_black[0] * gradient_pos)
                        bg_g = int(bg_purple[1] * (1 - gradient_pos) + bg_black[1] * gradient_pos)
                        bg_b = int(bg_purple[2] * (1 - gradient_pos) + bg_black[2] * gradient_pos)
                        bg_color = (bg_r, bg_g, bg_b)

                        pygame.draw.rect(screen, bg_color, (bx, by, bw, bh))

                        if hb.transformed:
                            fill = bw * (hb.hp / hb.max_hp) if hb.max_hp > 0 else 0
                            pygame.draw.rect(screen, bar_color, (bx, by, fill, bh))
                            boss_txt = font.render(f"暗黑灵梦 HP: {hb.hp}/{hb.max_hp}", True, WHITE)
                        else:
                            fill = bw * (hb.hp / hb.max_hp) if hb.hp > 0 else 0
                            pygame.draw.rect(screen, bar_color, (bx, by, fill, bh))
                            boss_txt = font.render(f"？？？ HP: {hb.hp}/{hb.max_hp}", True, WHITE)
                        rect = boss_txt.get_rect(center=(width // 2, by + bh // 2))
                        screen.blit(boss_txt, rect)

            if mission_complete:
                ft = pygame.font.Font(font_path, 50)
                txt = ft.render("MISSION1 COMPLETE", True, (0, 255, 0))
                rect = txt.get_rect(center=(width // 2, height // 2))
                screen.blit(txt, rect)

            if mission2_complete:
                ft = pygame.font.Font(font_path, 50)
                txt = ft.render("MISSION2 COMPLETE", True, (0, 255, 0))
                rect = txt.get_rect(center=(width // 2, height // 2))
                screen.blit(txt, rect)

            if mission3_complete and not hidden_boss_phase and not game_clear:
                ft = pygame.font.Font(font_path, 50)
                txt = ft.render("MISSION3 COMPLETE - 通关！", True, (255, 215, 0))
                rect = txt.get_rect(center=(width // 2, height // 2))
                screen.blit(txt, rect)

        pygame.display.flip()

    # 如果游戏结束或通关后按下空格/回车，回到主菜单
    if show_title:
        # 重新开始游戏循环
        main()
        return

    pygame.mixer.music.stop()
    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    try:
        main()
    except Exception as err:
        traceback.print_exc()
        input("程序出错，按回车关闭窗口...")