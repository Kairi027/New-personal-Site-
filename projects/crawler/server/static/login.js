function $(id) { return document.getElementById(id); }

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

async function login() {
  const password = $("password").value;
  if (!password) {
    $("error").textContent = "请输入口令";
    show($("error"));
    return;
  }
  hide($("error"));
  $("loginBtn").disabled = true;
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.status === 200) {
      location.href = "/";
      return;
    }
    let msg = "登录失败，请重试";
    try {
      const d = await res.json();
      if (d.message) msg = d.message;
    } catch (e) { /* ignore */ }
    $("error").textContent = msg;
    show($("error"));
  } catch (e) {
    $("error").textContent = "网络异常，请确认服务已启动";
    show($("error"));
  } finally {
    $("loginBtn").disabled = false;
  }
}

$("loginBtn").addEventListener("click", login);
$("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    login();
  }
});
