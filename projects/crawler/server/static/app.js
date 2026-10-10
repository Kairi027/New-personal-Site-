function $(id) { return document.getElementById(id); }

const PLATFORM_NAMES = {
  bilibili: "B站",
  douyin: "抖音",
  kuaishou: "快手",
};

function fmtDuration(sec) {
  if (!sec) return "";
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${m}:${pad(ss)}`;
}

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

function setStatus(text, busy) {
  const box = $("status");
  const txt = $("statusText");
  if (!busy) { hide(box); return; }
  txt.textContent = text;
  show(box);
}

function showError(msg) {
  const box = $("error");
  box.textContent = msg;
  show(box);
}

function clearResult() {
  hide($("result"));
  hide($("error"));
  $("formats").innerHTML = "";
}

async function parseNow() {
  const text = $("input").value.trim();
  if (!text) {
    showError("请先粘贴视频链接");
    return;
  }
  clearResult();
  setStatus("正在解析，请稍候…", true);
  $("parseBtn").disabled = true;
  try {
    const res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.status === 401) {
      location.href = "/";
      return;
    }
    const data = await res.json();
    if (!data.ok) {
      showError(data.message || "解析失败，请稍后重试");
      return;
    }
    renderResult(data);
  } catch (e) {
    showError("网络异常，请确认服务已启动");
  } finally {
    setStatus("", false);
    $("parseBtn").disabled = false;
  }
}

function renderResult(data) {
  const meta = data.meta || {};
  const badge = $("platformBadge");
  badge.textContent = PLATFORM_NAMES[meta.platform] || meta.platform || "";
  badge.className = "badge " + (meta.platform || "");

  const note = $("note");
  if (meta.note) {
    note.textContent = meta.note;
    show(note);
  } else {
    hide(note);
  }

  $("title").textContent = meta.title || "";
  $("author").textContent = meta.author ? "UP主 / 作者：" + meta.author : "";
  $("duration").textContent = fmtDuration(meta.duration) ? "时长：" + fmtDuration(meta.duration) : "";

  const cover = $("cover");
  if (meta.cover) {
    const u = new URL(meta.cover, location.href);
    cover.src = "/api/proxy?u=" + encodeURIComponent(u.href);
    show(cover);
  } else {
    hide(cover);
  }

  const wrap = $("formats");
  wrap.innerHTML = "";
  (data.formats || []).forEach((f) => {
    const row = document.createElement("div");
    row.className = "format-row";

    const info = document.createElement("div");
    info.className = "format-info";
    const label = document.createElement("div");
    label.className = "format-label";
    label.textContent = f.label || "下载";
    info.appendChild(label);
    if (f.note) {
      const n = document.createElement("div");
      n.className = "format-note";
      n.textContent = f.note;
      info.appendChild(n);
    }

    const a = document.createElement("a");
    a.className = "btn download";
    a.href = f.download_url;
    a.textContent = "下载";
    a.setAttribute("download", "");

    row.appendChild(info);
    row.appendChild(a);
    wrap.appendChild(row);
  });
  show($("result"));
}

$("parseBtn").addEventListener("click", parseNow);
$("input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    parseNow();
  }
});

$("pasteBtn").addEventListener("click", async () => {
  try {
    const t = await navigator.clipboard.readText();
    if (t) $("input").value = t.trim();
  } catch (e) {
    showError("无法读取剪贴板（浏览器限制），请手动粘贴");
  }
});

$("logoutBtn").addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch (err) { /* ignore */ }
  location.href = "/";
});
