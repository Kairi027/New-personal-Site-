' 卸载开机自启，并可选停止正在运行的服务
Option Explicit

Dim fso, shell, startupDir, lnkPath, oldLnk, answer

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

startupDir = shell.SpecialFolders("Startup")
lnkPath = startupDir & "\Kairi博客服务.lnk"
oldLnk = startupDir & "\视频原画提取服务.lnk"

If fso.FileExists(lnkPath) Then
  fso.DeleteFile lnkPath, True
  MsgBox "已取消开机自启。", 64, "卸载开机自启"
Else
  MsgBox "没有找到开机自启的快捷方式，可能已经取消过了。", 64, "卸载开机自启"
End If

' 顺手清掉旧版留下的快捷方式
If fso.FileExists(oldLnk) Then fso.DeleteFile oldLnk, True

answer = MsgBox("是否同时停止当前正在运行的本地服务？", 4 + 32, "卸载开机自启")
If answer = 6 Then
  shell.Run "powershell -NoProfile -Command ""Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }""", 0, True
  MsgBox "已停止服务。", 64, "卸载开机自启"
End If
