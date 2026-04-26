// ==UserScript==
// @name         TMURF - Tell Me yoU aRe Finish
// @namespace    https://github.com/ChouChiu/TMURF
// @version      1.1.0
// @description  当 AI 完成工作时通知你 - 适配 Deepseek
// @author       Chou Chiu, a2cheng
// @match        https://chat.deepseek.com/*
// @icon         https://raw.githubusercontent.com/ChouChiu/TMURF/refs/heads/master/icon.png
// @grant        GM_notification
// @grant        GM_addStyle
// @run-at       document-start
// @license      Apache-2.0
// ==/UserScript==

/* jshint esversion: 11 */

(function () {
  "use strict";

  const API_PATH = "/api/v0/chat/completion";
  const COOLDOWN = 5000; // 5 秒冷却

  // 状态
  let lastNotifyTime = 0;
  let lastDingTime = 0;
  let audioCtx = null;

  // 保存原始 XHR 方法
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  /**
   * 获取 AudioContext（懒加载 + 自动恢复）
   */
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  /**
   * 播放叮咚提示音（双音正弦波）
   */
  function playDing() {
    const now = Date.now();
    if (now - lastDingTime < COOLDOWN) return;
    lastDingTime = now;

    try {
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") return;

      const t = ctx.currentTime;
      const v = 0.6;

      // 叮
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1200, t);
      gain1.gain.setValueAtTime(v, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.28);

      // 咚
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, t + 0.09);
      gain2.gain.setValueAtTime(0.001, t);
      gain2.gain.setValueAtTime(v * 0.85, t + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.54);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(t + 0.09);
      osc2.stop(t + 0.54);
    } catch (e) {
      console.log("[TMURF] 音效播放失败:", e.message);
    }
  }

  /**
   * 发送浏览器通知（带去重 + 页面可见性检查）
   */
  function notify(title, body) {
    if (!document.hidden) return;

    const now = Date.now();
    if (now - lastNotifyTime < COOLDOWN) return;
    lastNotifyTime = now;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "https://fe-static.deepseek.com/chat/favicon.svg",
      });
    } else if (typeof GM_notification !== "undefined") {
      GM_notification({ title, text: body, timeout: 5000 });
    }
  }

  // 拦截 XHR
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._tmurfMethod = method;
    this._tmurfURL = url;
    this._tmurfNotified = false;
    return origOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    if (
      this._tmurfMethod?.toUpperCase() === "POST" &&
      typeof this._tmurfURL === "string" &&
      this._tmurfURL.includes(API_PATH)
    ) {
      const origHandler = this.onreadystatechange;
      this.onreadystatechange = function () {
        if (this.readyState === 4 && !this._tmurfNotified && this.status >= 200 && this.status < 300) {
          this._tmurfNotified = true;
          notify("TMURF - 任务完成", "Deepseek 已完成你的请求！");
          playDing();
        }
        if (origHandler) origHandler.apply(this, arguments);
      };
    }
    return origSend.apply(this, args);
  };

  // 初始化：请求通知权限
  Notification.requestPermission();
  console.log("[TMURF] 脚本已加载，正在监听 Deepseek 任务...");
})();
