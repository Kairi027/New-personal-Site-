@echo off
chcp 936 >nul
setlocal

rem ====================================================================
rem  启动博客（自动播放背景音乐）
rem
rem  为什么需要它：Chrome / Edge 默认不允许"页面没被点过就出声"。登录是就地
rem  登录，点「进入」那一下把音乐带起来了；但刷新（F5）会换成一个全新文档，
rem  点击记录清零，浏览器直接拒绝播放，所以刷新后要再点一下才有音乐。
rem  本文件用「独立配置 + 允许自动播放」启动浏览器，打开和刷新都会自动响起
rem  背景音乐，一下都不用点（实测 Chrome 154，file:// 与 http 都有效）。
rem
rem  默认打开的就是你平时双击的那个文件：本文件所在目录里的 index.html
rem  用的是给博客单独准备的浏览器配置 %LOCALAPPDATA%\KairiBlog，
rem  不会动你平时用的 Chrome（书签 / 扩展 / 登录都还在自己的配置里）；
rem  代价是第一次要在这个窗口里登录一次（访客或开发者都行），之后一直自动播放。
rem
rem  用法：
rem    双击本文件                     打开 file:// 首页（和双击 index.html 一样，但自动播放）
rem    启动博客-自动播放.bat --http    改成打开 http://127.0.0.1:8765/
rem    启动博客-自动播放.bat --echo    只打印将要执行的命令，不启动浏览器（自检用）
rem
rem  不想用了：删掉本文件即可；想清理配置就删 %LOCALAPPDATA%\KairiBlog
rem ====================================================================

set "HERE=%~dp0"
set "PAGE=%HERE%index.html"
set "SITE=http://127.0.0.1:8765/"
set "PROFILE=%LOCALAPPDATA%\KairiBlog\browser-profile"
set "FLAGS=--no-first-run --no-default-browser-check --autoplay-policy=no-user-gesture-required"
set "PF86=%ProgramFiles(x86)%"
set "ECHO_ONLY="

rem ---------- 0) 认参数（--http / --echo，顺序随意）----------
:parse_args
if "%~1"=="" goto parsed_args
if /i "%~1"=="--echo" set "ECHO_ONLY=1"
if /i "%~1"=="--http" set "PAGE=%SITE%"
if /i "%~1"=="--serve" set "PAGE=%SITE%"
shift
goto parse_args
:parsed_args

rem ---------- 1) 本地服务在跑吗（评论 / 点赞 / 保存项目要用）----------
rem  只有浏览和听音乐是纯静态的，服务没起来也能看；起不来就只提醒一句，继续打开。
netstat -ano | findstr /r /c:":8765 " | findstr /r /c:"LISTENING" >nul 2>&1
if errorlevel 1 goto start_service
goto find_browser

:start_service
echo [i] 本地服务没在跑，先帮你把它拉起来...
if not exist "%HERE%后台启动博客服务.vbs" goto no_service_script
start "" wscript.exe "%HERE%后台启动博客服务.vbs"
ping -n 3 127.0.0.1 >nul
goto find_browser

:no_service_script
echo [x] 找不到「后台启动博客服务.vbs」：评论、点赞、保存项目会不可用。
echo     浏览文章和自动播放音乐不受影响，继续打开...
ping -n 2 127.0.0.1 >nul
goto find_browser

rem ---------- 2) 找浏览器（优先 Chrome，其次 Edge）----------
rem  这里刻意不用 for(...) 块：%ProgramFiles(x86)% 里的括号会破坏 cmd 的解析
:find_browser
set "BROWSER="
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
echo [x] 没找到 Chrome 或 Edge，请手动打开 %PAGE%
pause
exit /b 1

:launch
if defined ECHO_ONLY goto echo_only
echo 正在用「允许自动播放」的方式打开：%PAGE%
echo 第一次需要在这个窗口里登录一次，之后打开 / 刷新都会自动播放背景音乐。
ping -n 3 127.0.0.1 >nul
start "" "%BROWSER%" %FLAGS% --user-data-dir="%PROFILE%" "%PAGE%"
endlocal
exit /b 0

:echo_only
rem 自检用：只打印将要执行的命令、不启动浏览器（用法：启动博客-自动播放.bat --echo）
echo [echo] "%BROWSER%" %FLAGS% --user-data-dir="%PROFILE%" "%PAGE%"
endlocal
exit /b 0
