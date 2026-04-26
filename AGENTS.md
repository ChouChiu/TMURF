# AGENTS.md - TMURF 项目 AI 代理指南

> 本文件帮助 AI 编码代理快速理解 TMURF 项目并立即提高工作效率。

## 项目概述

TMURF (Tell Me yoU aRe Finish) 是一个 **基于 WXT 框架的 Chrome/Firefox 浏览器扩展**，用于监听 Deepseek 聊天页面的 API 请求。当 AI 完成请求时，自动发送浏览器通知并播放提示音。

**核心功能**：
- 拦截 XMLHttpRequest 监听 /api/v0/chat/completion API 请求
- 请求完成时发送浏览器通知（带去重和页面可见性检查）
- 播放"叮咚"提示音（使用 Web Audio API）
- 使用扩展 notifications API 发送系统通知

## 关键文件

| 文件 | 用途 |
|------|------|
| entrypoints/background.ts | Background Service Worker（通知发送） |
| entrypoints/deepseek-interceptor.content.ts | Content Script（注入+事件监听+提示音） |
| entrypoints/deepseek-main-world.ts | Main World Script（XHR 拦截） |
| wxt.config.ts | WXT 扩展配置和 manifest 定义 |
| tsconfig.json | TypeScript 配置 |
| package.json | 项目配置和构建脚本 |
| biome.json | Biome 格式化和 lint 配置 |
| LICENSE | Apache 2.0 许可证 |

## 架构设计

```
Content Script (isolated world)
  - runAt: document_start
  - 使用 injectScript 注入主世界脚本
  - 监听 CustomEvent 接收 XHR 完成信号
  - 播放提示音 (Web Audio API)
  - 发送消息到 Background Script 触发通知

Main World Script (injected via injectScript)
  - Monkey-patch XMLHttpRequest
  - 监听 readyState === 4
  - 通过 CustomEvent 通知 Content Script

Background Script (Service Worker)
  - 接收 Content Script 消息
  - 使用 browser.notifications API 发送系统通知
  - 管理通知权限
```

## 开发约定

### 技术栈
- **WXT 0.20+**：浏览器扩展框架
- **TypeScript**：严格模式，ES2020 目标
- **Biome**：代码格式化和 lint

### 代码模式
- **Content Script**：使用 defineContentScript，配置 runAt: 'document_start'
- **Main World Script**：使用 defineUnlistedScript，通过 injectScript 注入
- **Background Script**：使用 defineBackground，监听 browser.runtime.onMessage
- **XHR 拦截**：保存原始 XMLHttpRequest.prototype.open/send，在 send 中监听 readystatechange
- **去重机制**：COOLDOWN = 5000（5 秒冷却时间）
- **页面可见性**：仅在 document.hidden === true 时发送通知
- **提示音**：使用 Web Audio API 生成 1200Hz 正弦波

### 命名约定
- 私有变量/方法使用 _tmurf 前缀（如 _tmurfMethod, _tmurfURL）
- 常量使用 UPPER_SNAKE_CASE（如 COOLDOWN, API_PATH）
- 函数使用 camelCase（如 playDing, sendNotification）
- 自定义事件使用 tmurf: 前缀（如 tmurf:completion）

### 代码质量工具
- **Biome**：用于代码格式化和 lint
- 运行 pnpm lint 检查代码问题
- 运行 pnpm format 自动格式化代码
- 配置：Tab 缩进，双引号

## 重要注意事项

### 开发环境
- **WXT 构建系统**：基于 Vite，支持 HMR
- **开发模式**：pnpm dev（Chrome）或 pnpm dev:firefox（Firefox）
- **构建命令**：pnpm build / pnpm build:firefox
- **包管理**：使用 pnpm 管理依赖

### 常见陷阱
1. **主世界注入**：Content Script 运行在隔离世界，必须使用 injectScript 注入主世界才能拦截页面 XHR
2. **注入时机**：必须在 document_start 时注入，否则可能错过早期请求
3. **通知权限**：首次使用需要用户允许通知权限
4. **跨浏览器差异**：Chrome 使用 MV3，Firefox 使用 MV2，WXT 会自动转换
5. **Web Audio API**：某些浏览器需要用户交互后才能播放音频

### 修改建议
- 添加新站点支持时，修改 Content Script 的 matches 数组
- 修改提示音时，注意 Web Audio API 的浏览器兼容性
- 修改通知逻辑时，保留去重和页面可见性检查
- 添加新功能时，优先使用 WXT 提供的 API（如 browser.*）

## 测试方法

1. 运行 pnpm dev 启动 Chrome 开发模式
2. 打开 https://chat.deepseek.com/ 并发送消息
3. 切换到其他标签页，等待通知和提示音
4. 验证 5 秒冷却机制生效

## 构建和发布

| 命令 | 描述 |
|------|------|
| pnpm dev | Chrome 开发模式 |
| pnpm dev:firefox | Firefox 开发模式 |
| pnpm build | 构建 Chrome 扩展 |
| pnpm build:firefox | 构建 Firefox 扩展 |
| pnpm zip | 构建并打包 Chrome 扩展 |
| pnpm zip:firefox | 构建并打包 Firefox 扩展 |

## 相关文档

- [README.md](README.md) - 完整安装步骤和使用说明
- [WXT 文档](https://wxt.dev/) - API 参考和最佳实践

## AI 代理快速参考

### 添加新站点支持
1. 复制 `entrypoints/deepseek-interceptor.content.ts` 为 `{site}-interceptor.content.ts`
2. 复制 `entrypoints/deepseek-main-world.ts` 为 `{site}-main-world.ts`
3. 修改 `matches` 数组为目标站点 URL
4. 修改 `API_PATH` 常量为目标 API 路径
5. 在 `wxt.config.ts` 中添加对应权限（如需要）

### 扩展功能模式
- **多站点支持**：每个站点独立的 content script + main world script 对
- **自定义提示音**：修改 `playDing()` 函数中的频率和波形
- **通知增强**：在 `sendNotification()` 中添加更多上下文信息
- **配置界面**：使用 `browser.storage` API 存储用户偏好

### 调试技巧
- Content Script 日志：`[TMURF]` 前缀
- 主世界脚本日志：`[TMURF] Main world` 前缀
- Background Script 日志：`[TMURF] Background` 前缀
- 使用 Chrome DevTools 的 Service Worker 调试面板查看 Background Script
