<div align="center">
    <h1>TMURF</h1>
    <img src="./icon.png" width="200" alt="TMURF 图标">
    <p>
        <a href="https://github.com/ChouChiu/TMURF/raw/refs/heads/master/tmurf.user.js">
            <img src="https://img.shields.io/badge/GithubRaw-安装-black" alt="从 Github 安装"></a>
        <a href="https://greasyfork.org/zh-CN/scripts/575386">
            <img src="https://img.shields.io/badge/GreasyFork-安装-red" alt="从 GreasyFork 安装"></a>
    </p>
    <p>TMURF（<strong>T</strong>ell <strong>Me</strong> yo<strong>U</strong> a<strong>R</strong>e <strong>F</strong>inish） 是一个 Tampermonkey 用户脚本，用于监听 Deepseek 聊天页面的 API 请求。当 AI 完成你的请求时，自动发送浏览器通知并播放音效，让你可以放心切换到其他标签页工作，不再需要一直盯着屏幕等待</p>
</div>

## 功能特性

- **自动通知**：拦截 Deepseek `/api/v0/chat/completion` API 请求，在响应完成后发送通知
- **智能去重**：5 秒冷却时间，避免重复通知
- **页面感知**：仅在当前标签页不可见（`document.hidden`）时发送通知，避免打扰正在使用的用户
- **双重通知支持**：优先使用浏览器原生 `Notification` API（支持自定义图标），回退到 `GM_notification`
- **自动权限请求**：页面加载时自动请求通知权限

## 使用方法

1. 在 Deepseek 聊天页面发送你的消息
2. 切换到其他标签页或窗口
3. 当 AI 回复完成时，你会收到一条浏览器通知并听到“叮咚”

## 技术实现

- 通过拦截 `XMLHttpRequest.prototype.open` 和 `XMLHttpRequest.prototype.send` 监听网络请求
- 监听 `readyState === 4` 判断请求完成状态
- 使用 `GM_notification` 和原生 `Notification` API 发送通知

## 注意事项

- 首次使用时浏览器会请求通知权限，请点击"允许"
- 脚本仅在 `https://chat.deepseek.com/*` 页面生效
- 如果通知不生效，请检查浏览器设置中是否已授予该站点通知权限

## 许可证

Apache 2.0
