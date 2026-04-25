// ==UserScript==
// @name         TMURF - Tell Me yoU aRe Finish
// @namespace    https://github.com/ChouChiu/TMURF
// @version      1.0.0
// @description  当 AI 完成工作时通知你 - 适配 Deepseek
// @author       Chou Chiu
// @match        https://chat.deepseek.com/*
// @icon         https://raw.githubusercontent.com/ChouChiu/TMURF/refs/heads/master/icon.png
// @grant        GM_notification
// @grant        GM_addStyle
// @run-at       document-start
// @license      Apache-2.0
// ==/UserScript==

(function () {
  "use strict";

  // 保存原始的 XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  // 通知去重：记录最近通知的时间戳
  let lastNotificationTime = 0;
  const NOTIFICATION_COOLDOWN = 5000; // 5秒内不重复通知

  /**
   * 发送浏览器通知（带去重）
   */
  function sendNotification(title, body) {
    // 如果页面可见（用户在当前窗口），则不发送通知
    if (!document.hidden) {
      return;
    }

    const now = Date.now();
    if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
      console.log("[TMURF] 通知冷却中，跳过");
      return;
    }
    lastNotificationTime = now;

    // 请求通知权限
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // 优先使用浏览器原生通知（支持自定义图标）
    if (Notification.permission === "granted") {
      new Notification(title, {
        body: body,
        icon: "https://fe-static.deepseek.com/chat/favicon.svg",
      });
    } else if (typeof GM_notification !== "undefined") {
      // 回退到 GM_notification（无图标支持）
      GM_notification({
        title: title,
        text: body,
        timeout: 5000,
      });
    }
  }

  /**
   * 判断是否是 Deepseek 的聊天完成 API 请求
   */
  function isChatAPIRequest(url) {
    const targetPath = "/api/v0/chat/completion";
    if (typeof url === "string") {
      return url.includes(targetPath);
    }
    if (url instanceof URL) {
      return url.pathname === targetPath;
    }
    return false;
  }

  // 拦截 XMLHttpRequest
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._tmurfMethod = method;
    this._tmurfURL = url;
    this._tmurfNotified = false; // 标记是否已发送通知
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    const method = this._tmurfMethod?.toUpperCase();
    const url = this._tmurfURL;

    if (isChatAPIRequest(url) && method === "POST") {
      const xhr = this;

      // 监听流式响应
      const originalOnReadyStateChange = this.onreadystatechange;
      this.onreadystatechange = function () {
        // readyState 4 表示请求完成
        if (this.readyState === 4 && !this._tmurfNotified) {
          if (this.status >= 200 && this.status < 300) {
            this._tmurfNotified = true;
            sendNotification(
              "TMURF - 任务完成",
              "Deepseek 已完成你的请求！"
            );
          }
        }
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.apply(this, arguments);
        }
      };
    }

    return originalXHRSend.apply(this, args);
  };

  // 页面加载时请求通知权限
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      Notification.requestPermission();
    });
  } else {
    Notification.requestPermission();
  }

  console.log("[TMURF] 脚本已加载，正在监听 Deepseek 任务...");
})();
