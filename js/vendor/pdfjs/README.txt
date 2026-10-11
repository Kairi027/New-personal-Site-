pdf.js（第三方库，随站内置）
=====================================

版本   ：pdfjs-dist 3.11.174（UMD 构建，用 <script src> 加载，不依赖 ES Module）
来源   ：https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/
许可   ：Apache License 2.0，见同目录 LICENSE（Mozilla / pdf.js contributors）

文件说明
--------
pdf.min.js             PDF 解析与渲染（暴露全局 pdfjsLib）
pdf.worker.min.js      渲染 worker 的源码。因为 file:// 下浏览器不允许直接
                       以 Worker 方式加载本地脚本，js/material-reader.js 会先把
                       这段源码取回来，再用 Blob URL 起 worker（file:// 下走本地服务）
cmaps/                 中文 / 日文 / 韩文等 CJK 预定义 CMap（.bcmap）。
                       缺了它们，用 GBK、UniGB-UCS2-H、Identity 之类编码的中文 PDF
                       会整段中文画不出来（只有英文数字）。
standard_fonts/        未内嵌字体时用的替代字体（Liberation / Foxit 系列）

为什么内置而不是走 CDN
---------------------
本站默认是双击 index.html 用 file:// 打开的，那时浏览器不允许跨文件 fetch、
也不允许 ES Module，所以这些资源必须在本目录里，再由本地服务（127.0.0.1:8765）
用 http 提供给页面；服务没启动时阅读器会退回浏览器自带的 PDF 阅读器。
线上（GitHub Pages 等）则直接按相对路径同源加载。

怎么更新
--------
换版本时，重新下载 pdf.min.js、pdf.worker.min.js、cmaps/、standard_fonts/
与 LICENSE，覆盖本目录即可。前端只在 js/material-reader.js 里引用路径。
