@echo off
chcp 936 >nul
setlocal

rem ====================================================================
rem  启动在线博客（自动播放背景音乐）· GitHub Pages 版
rem
rem  为什么需要它：Chrome / Edge 默认不允许"页面没被点过就出声"。在线站点
rem  里点「以访客身份进入」那一下能把音乐带起来，但刷新（F5）会换成一份
rem  全新文档，点击记录清零，浏览器直接拒绝播放，所以刷新后要再点一下。
rem  本文件用「独立配置 + 允许自动播放」启动浏览器，直接打开在线站点，
rem  打开和刷新都会自动响起背景音乐，一下都不用点（实测 Chrome / Edge）。
rem
rem  和「启动博客-自动播放.bat」的区别：那个打开本机文件（file:// 或
rem  http://127.0.0.1:8765/，后台功能可用）；这个打开的是线上地址
rem  https://kairi027.github.io/New-personal-Site-/ ，任何人都能访问，
rem  但只有静态浏览（写文章 / 点赞 / 评论仍然需要本机服务）。
rem
rem  用的是给在线博客单独准备的浏览器配置 %LOCALAPPDATA%\KairiBlogOnline，
rem  不会动你平时用的 Chrome（书签 / 扩展 / 登录都还在自己的配置里）；
rem  代价是第一次要在这个窗口里登录一次（访客或开发者都行），之后一直自动播放。
rem
rem  用法：
rem    双击本文件                     打开线上首页（并自动播放背景音乐）
rem    启动博客-自动播放-在线版.bat --echo
rem                                   只打印将要执行的命令，不启动浏览器（自检用）
rem
rem  不想用了：删掉本文件即可；想清理配置就删 %LOCALAPPDATA%\KairiBlogOnline
rem ====================================================================

set "SITE=https://kairi027.github.io/New-personal-Site-/"
set "PROFILE=%LOCALAPPDATA%\KairiBlogOnline\browser-profile"
set "FLAGS=--no-first-run --no-default-browser-check --autoplay-policy=no-user-gesture-required"
set "PF86=%ProgramFiles(x86)%"
set "BROWSER="
set "ECHO_ONLY="

rem ---------- 认参数（--echo）----------
if /i "%~1"=="--echo" set "ECHO_ONLY=1"

rem ---------- 找浏览器（优先 Chrome，其次 Edge）----------
rem  这里刻意不用 for(...) 块：%ProgramFiles(x86)% 里的括号会破坏 cmd 的解析
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if defined BROWSER goto launch
if not defined PF86 goto try_local_chrome
if exist "%PF86%\Google\Chrome\Application\chrome.exe" set "BROWSER=%PF86%\Google\Chrome\Application\chrome.exe"
:try_local_chrome
if defined BROWSER goto launch
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if defined BROWSER goto launch
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if defined BROWSER goto launch
if not defined PF86 goto no_browser
if exist "%PF86%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%PF86%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER goto no_browser
goto launch

:no_browser
echo [x] 没找到 Chrome 或 Edge，请手动在浏览器里打开：
echo     %SITE%
pause
exit /b 1

:launch
if defined ECHO_ONLY goto echo_only
echo 正在用「允许自动播放」的方式打开在线博客：
echo   %SITE%
echo 第一次可能需要在这个窗口里登录一次（访客或开发者都行），之后打开 / 刷新都会自动播放背景音乐。
ping -n 3 127.0.0.1 >nul
start "" "%BROWSER%" %FLAGS% --user-data-dir="%PROFILE%" "%SITE%"
endlocal
exit /b 0

:echo_only
rem 自检用：只打印将要执行的命令、不启动浏览器（用法：本文件 --echo）
echo [echo] "%BROWSER%" %FLAGS% --user-data-dir="%PROFILE%" "%SITE%"
endlocal
exit /b 0
