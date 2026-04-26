# AGENTS.md - TMURF 项目 AI 代理指南

> 本文件帮助 AI 编码代理快速理解 TMURF 项目并立即提高工作效率。

## 项目概述

TMURF (Tell Me yoU aRe Finish) 是一个 **Tampermonkey 用户脚本**，用于监听 Deepseek 聊天页面的 API 请求。当 AI 完成请求时，自动发送浏览器通知并播放提示音。

**核心功能**：
- 拦截 `XMLHttpRequest` 监听 `/api/v0/chat/completion` API 请求
- 请求完成时发送浏览器通知（带去重和页面可见性检查）
- 播放"叮咚"提示音（使用 Web Audio API）
- 双重通知支持：原生 `Notification` API → `GM_notification` 回退

## 关键文件

| 文件 | 用途 |
|------|------|
| `tmurf.user.js` | 核心用户脚本（唯一源代码文件） |
| `README.md` | 项目文档、安装步骤、使用说明 |
| `package.json` | 项目配置（Biome 代码质量工具） |
| `biome.json` | Biome 格式化和 lint 配置 |
| `LICENSE` | Apache 2.0 许可证 |

## 开发约定

### 脚本元数据
- `@run-at document-start`：在页面加载前注入
- `@match https://chat.deepseek.com/*`：仅匹配 Deepseek 聊天页面
- `@grant GM_notification`：声明 Tampermonkey API 权限

### 代码模式
- **IIFE 封装**：使用 `(function() { "use strict"; })()` 避免全局污染
- **XHR 拦截**：保存原始 `XMLHttpRequest.prototype.open/send`，在 `send` 中监听 `readyState === 4`
- **去重机制**：`COOLDOWN = 5000`（5 秒冷却时间）
- **页面可见性**：仅在 `document.hidden === true` 时发送通知
- **提示音**：使用 Web Audio API 生成 1200Hz 正弦波

### 命名约定
- 私有变量/方法使用 `_tmurf` 前缀（如 `_tmurfMethod`, `_tmurfURL`, `_tmurfNotified`）
- 常量使用 `UPPER_SNAKE_CASE`（如 `COOLDOWN`, `API_PATH`）
- 函数使用 `camelCase`（如 `notify`, `playDing`）

### 代码质量工具
- **Biome**：用于代码格式化和 lint
- 运行 `pnpm lint` 检查代码问题
- 运行 `pnpm format` 自动格式化代码
- 配置：Tab 缩进，双引号

## 重要注意事项

### ⚠️ 开发环境
- **无构建系统**：这是纯 JavaScript 文件，直接编辑 `tmurf.user.js` 即可
- **无测试框架**：手动在浏览器中测试（安装 Tampermonkey 扩展后加载脚本）
- **无包管理**：不依赖 npm 或其他包管理器（仅用 pnpm 管理 Biome 开发依赖）

### ⚠️ 常见陷阱
1. **流式响应**：Deepseek 使用流式响应，但脚本监听 `readyState === 4`（请求完全完成）
2. **通知权限**：首次使用需要用户允许通知权限，脚本已自动请求
3. **XHR 拦截顺序**：必须在 `document-start` 时注入，否则可能错过早期请求
4. **URL 类型**：拦截时 `url` 可能是字符串或 `URL` 对象

### ⚠️ 修改建议
- 添加新功能时，保持 IIFE 封装和严格模式
- 拦截逻辑修改后，确保调用原始方法（`origOpen.apply`, `origSend.apply`）
- 通知逻辑修改时，保留去重和页面可见性检查
- 提示音修改时，注意 Web Audio API 的浏览器兼容性

## 测试方法

1. 在浏览器中安装 [Tampermonkey](https://www.tampermonkey.net/)
2. 创建新脚本，粘贴 `tmurf.user.js` 内容
3. 打开 `https://chat.deepseek.com/` 并发送消息
4. 切换到其他标签页，等待通知和提示音

## 相关文档

- [README.md](README.md) - 完整安装步骤和使用说明
- [Tampermonkey 文档](https://www.tampermonkey.net/documentation.php) - API 参考
