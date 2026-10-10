' 后台静默启动博客本地服务（供开机自启调用，也可以直接双击）
Option Explicit

Dim fso, shell, here, server, logFile, cmd, exec, out

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

here = fso.GetParentFolderName(WScript.ScriptFullName)
server = here & "\tools\blog-server.py"

If Not fso.FileExists(server) Then
  MsgBox "找不到 tools\blog-server.py，无法启动服务。", 16, "博客服务"
  WScript.Quit 1
End If

' 8765 已经在监听就不重复启动
Set exec = shell.Exec("cmd /c netstat -ano -p tcp")
out = exec.StdOut.ReadAll()
If InStr(out, ":8765 ") > 0 Then WScript.Quit 0

logFile = here & "\服务日志.txt"
cmd = "cmd /c cd /d """ & here & """ && python -u """ & server & """ > """ & logFile & """ 2>&1"
shell.Run cmd, 0, False
