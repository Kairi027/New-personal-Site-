' 安装开机自启：在「启动」文件夹放一个指向 后台启动博客服务.vbs 的快捷方式
Option Explicit

Dim fso, shell, here, launcher, startupDir, lnkPath, lnk

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

here = fso.GetParentFolderName(WScript.ScriptFullName)
launcher = here & "\后台启动博客服务.vbs"

If Not fso.FileExists(launcher) Then
  MsgBox "找不到「后台启动博客服务.vbs」，请确认它和本文件在同一个文件夹里。", 16, "安装开机自启"
  WScript.Quit 1
End If

startupDir = shell.SpecialFolders("Startup")
lnkPath = startupDir & "\Kairi博客服务.lnk"

Set lnk = shell.CreateShortcut(lnkPath)
lnk.TargetPath = "wscript.exe"
lnk.Arguments = """" & launcher & """"
lnk.WorkingDirectory = here
lnk.WindowStyle = 7
lnk.Description = "开机自动启动 Kairi 的小站本地服务（只监听本机 127.0.0.1）"
lnk.Save()

' 立刻先启动一次
shell.Run """" & launcher & """", 0, False

MsgBox "已安装开机自启。" & vbCrLf & vbCrLf & _
       "以后每次登录 Windows 都会在后台自动启动本地服务，" & vbCrLf & _
       "新建项目、打包下载、点赞评论都不需要再手动开任何东西。" & vbCrLf & vbCrLf & _
       "快捷方式位置：" & vbCrLf & lnkPath & vbCrLf & vbCrLf & _
       "想取消就双击「卸载开机自启.vbs」。", 64, "安装开机自启"
