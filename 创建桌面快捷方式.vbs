' 创建桌面快捷方式：指向「启动博客-自动播放.bat」
' 为什么需要它：Chrome / Edge 默认不允许"页面没被点过就出声"，直接双击
' index.html 的窗口刷新后要再点一下；用自动播放启动器打开的窗口才会
' 打开和刷新都自动响起背景音乐。
Option Explicit

Dim fso, shell, here, launcher, desktop, lnkPath, lnk

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

here = fso.GetParentFolderName(WScript.ScriptFullName)
launcher = here & "\启动博客-自动播放.bat"

If Not fso.FileExists(launcher) Then
  MsgBox "找不到「启动博客-自动播放.bat」，请确认它和本文件在同一个文件夹里。", 16, "创建快捷方式"
  WScript.Quit 1
End If

desktop = shell.SpecialFolders("Desktop")
lnkPath = desktop & "\Kairi 的小站.lnk"

Set lnk = shell.CreateShortcut(lnkPath)
lnk.TargetPath = launcher
lnk.WorkingDirectory = here
lnk.WindowStyle = 1
lnk.Description = "打开 Kairi 的小站（允许自动播放背景音乐，打开 / 刷新都会自动响起）"
lnk.Save()

MsgBox "已创建桌面快捷方式：" & vbCrLf & lnkPath & vbCrLf & vbCrLf & _
       "以后双击桌面上这个「Kairi 的小站」就能打开博客，" & vbCrLf & _
       "打开和刷新都会自动播放背景音乐，一下都不用点。" & vbCrLf & vbCrLf & _
       "它用的是给博客单独准备的浏览器配置，不会动你平时用的浏览器；" & vbCrLf & _
       "第一次需要在弹出的窗口里登录一次（访客或开发者都行）。" & vbCrLf & vbCrLf & _
       "不想用了：删掉桌面上的快捷方式即可。", 64, "创建快捷方式"
