<div align="center">
    <h1>TMURF</h1>
    <img src="./public/icon.png" width="200" alt="TMURF 图标">
    <p>TMURF（<strong>T</strong>ell <strong>Me</strong> yo<strong>U</strong> a<strong>R</strong>e <strong>F</strong>inish） 是一个基于 WXT 框架的 Chrome/Firefox 浏览器扩展，用于监听 Deepseek 聊天页面的 API 请求。当 AI 完成你的请求时，自动发送浏览器通知并播放音效，让你可以放心切换到其他标签页工作，不再需要一直盯着屏幕等待</p>
</div>

## 功能特性

- **自动通知**：拦截 Deepseek `/api/v0/chat/completion API` 请求，在响应完成后发送通知
- **智能去重**：5 秒冷却时间，避免重复通知
- **页面感知**：仅在当前标签页不可见（document.hidden）时发送通知，避免打扰正在使用的用户
- **扩展通知 API**：使用浏览器扩展 
otifications API 发送系统通知
- **提示音**：使用 Web Audio API 生成 1200Hz "叮咚"提示音
- **跨浏览器支持**：同时支持 Chrome (MV3) 和 Firefox (MV2)

## 安装方法

### 从 GitHub Actions 下载

1. 打开项目的 [Actions](https://github.com/ChouChiu/tmurf/actions) 页面
2. 点击最新的 "Build Extension ZIP" 工作流
3. 在页面底部的 "Artifacts" 区域，下载对应浏览器的扩展包：
   - `tmurf-chrome` - Chrome 版本
   - `tmurf-firefox` - Firefox 版本
4. 安装扩展：
   - **Chrome**: 打开 `chrome://extensions/` → 启用"开发者模式" → 直接将下载的 zip 文件拖入页面
   - **Firefox**: 解压下载的 zip 文件 → 打开 `about:debugging#/runtime/this-firefox` → 点击"临时载入附加组件" → 选择解压目录中的 `manifest.json`

### 开发模式

```bash
# Chrome 开发模式（自动打开浏览器）
pnpm dev

# Firefox 开发模式
pnpm dev:firefox
```

## 使用方法

1. 在 Deepseek 聊天页面发送你的消息
2. 切换到其他标签页或窗口
3. 当 AI 回复完成时，你会收到一条浏览器通知并听到"叮咚"提示音

## 技术实现

- **Content Script**：在 document_start 时注入，使用 injectScript 将拦截脚本注入主世界
- **Main World Script**：Monkey-patch XMLHttpRequest.prototype.open/send，监听请求完成并通过 CustomEvent 通知
- **Background Script**：接收 Content Script 消息，使用扩展 
otifications API 发送系统通知
- **提示音**：使用 Web Audio API 生成 1200Hz 正弦波，0.3 秒衰减

## 项目结构

```
entrypoints/
├── background.ts                    # Background Service Worker
├── deepseek-interceptor.content.ts  # Content Script (隔离世界)
└── deepseek-main-world.ts           # Main World Script (注入页面)
public/
├── icon-16.png                      # 扩展图标
├── icon-48.png
└── icon-128.png
```

## 构建命令

| 命令 | 描述 |
|------|------|
| pnpm dev | Chrome 开发模式 |
| pnpm dev:firefox | Firefox 开发模式 |
| pnpm build | 构建 Chrome 扩展 |
| pnpm build:firefox | 构建 Firefox 扩展 |
| pnpm zip | 构建并打包 Chrome 扩展 |
| pnpm zip:firefox | 构建并打包 Firefox 扩展 |
| pnpm lint | 代码质量检查 |
| pnpm format | 代码格式化 |

## 注意事项

- 首次使用时浏览器会请求通知权限，请点击"允许"
- 扩展仅在 https://chat.deepseek.com/* 页面生效
- 如果通知不生效，请检查浏览器设置中是否已授予该站点通知权限

## 许可证

Apache 2.0
