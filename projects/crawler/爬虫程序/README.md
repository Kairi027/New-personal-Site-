# 视频原画提取（网页工具 · 个人自用）

粘贴视频链接，解析并下载原视频。支持 **B站 / 抖音 / 快手**。

## 特性

- 纯本地运行，不经过任何第三方服务器，链接与视频只在你自己的电脑上处理
- 零依赖：只使用 Python 自带的库，无需安装任何包
- 手机和电脑都能用（同一 WiFi 下，手机浏览器访问电脑的局域网地址）
- 抖音 / 快手自动去除水印；B站支持多清晰度（MP4 直出 + DASH 高清视频流/音频流）
- 访问口令 + 限流：默认开启，首次访问需输入口令（登录后 30 天免输），适合远程共享给亲友

## 运行方式

1. 确保电脑装有 Python 3.9 或更高版本（`python --version` 可查看）
2. 双击 **`启动.bat`**，或在命令行运行：

   ```bat
   python server\app.py
   ```

   > `启动.bat` 内置了访问口令，需要改口令直接编辑该文件里的 `--password` 参数。

3. 浏览器打开 `http://127.0.0.1:8787`
4. 首次访问输入终端打印的“访问口令”，登录后粘贴视频链接，点击“解析视频”
5. 选择清晰度点击“下载”

### 手机使用（可选）

1. 启动后，终端里会打印一行“手机访问: http://xxx.xxx.x.x:8787”
2. 手机与电脑连接**同一个 WiFi**
3. 手机浏览器打开该地址即可使用
4. 首次启动若弹出 Windows 防火墙提示，请勾选允许访问（专用网络）
5. 首次访问同样需要输入口令

## 远程访问（可选 · 仅限本人与亲友）

工具默认开启**访问口令**，适合通过内网穿透给信任的人远程使用，而不是直接暴露公网：

- 固定口令：`python server\app.py --password 你的口令`（推荐），或先设置环境变量 `ACCESS_PASSWORD`
- 不指定口令：每次启动会随机生成一个口令并打印在终端，重启后口令和所有登录状态都会重置
- 纯本机使用可加 `--no-auth` 关闭口令，但**关闭口令时请勿暴露到公网**
- 内置限流（按访问 IP）：登录 60 秒内 5 次、解析 60 秒内 10 次、下载 60 秒内 6 次

### 方案 A：Tailscale（推荐，最简单安全）

1. 电脑和手机都安装 [Tailscale](https://tailscale.com/download) 并登录同一个账号
2. 电脑上正常启动本工具（建议用 `--password` 固定口令）
3. 手机在 Tailscale 客户端里访问 `http://电脑的TailscaleIP:8787`（Tailscale 里能看到电脑 IP）

不需要公网 IP、不需要路由器端口映射、不需要开放防火墙，访问也只限你自己账号下的设备。

### 方案 B：Cloudflare Tunnel

1. 下载 cloudflared（https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/）
2. 临时网址（每次启动会变，适合临时分享）：

   ```bat
   cloudflared tunnel --url http://127.0.0.1:8787
   ```

3. 固定域名：`cloudflared tunnel login` → `cloudflared tunnel create 名字`，写 `config.yml`：

   ```yaml
   tunnel: <隧道ID>
   credentials-file: C:\Users\你的用户名\.cloudflared\<隧道ID>.json
   ingress:
     - hostname: 你的域名
       service: http://127.0.0.1:8787
     - service: http_status:404
   ```

   然后在 Cloudflare DNS 建一条指向该隧道的 CNAME，最后 `cloudflared tunnel run 名字`。

4. 通过隧道访问时，第一次打开页面同样要输入口令。

> 提示：口令用于防止陌生人使用，请分享给信任的亲友，不要在任何公开渠道发布你的访问地址。

## 支持的链接格式

| 平台 | 链接示例 | 说明 |
| --- | --- | --- |
| B站 | `https://www.bilibili.com/video/BVxxxx`、`b23.tv` 短链、`av123456` | 多P视频解析第1P |
| 抖音 | `https://v.douyin.com/xxxx/` 分享短链、`www.douyin.com/video/xxx` | 自动去水印 |
| 快手 | `https://v.kuaishou.com/xxxx` 分享短链、`www.kuaishou.com/short-video/xxx` | 自动去水印 |

直接从 App 里“复制链接”后粘贴即可，文本中混有别的文字也能自动识别。

## 常见问题

- **解析失败提示“页面结构可能已更新”**：平台改版导致，等待工具更新即可；属于这类工具的正常现象。
- **抖音偶尔提示“被风控拦截/接口返回异常”**：抖音风控较严，稍等几分钟重试通常即可恢复；平台也会不定期调整，届时需要更新解析逻辑。
- **B站只有“视频流”和“音频流”**：高清晰度是音画分离的 DASH 流，两个都下载后用剪映或 ffmpeg 合并。低清晰度一般有 MP4 直出。
- **下载到一半失败**：链接有时效（通常 1–3 小时），重新解析后再下载。
- **手机打不开**：确认在同一 WiFi；确认防火墙已放行 Python；确认地址是终端打印的局域网地址。

## 免责声明

本工具仅用于个人学习、备份与测试，请遵守平台服务条款和相关法律法规，勿下载传播他人受版权保护的视频内容。
