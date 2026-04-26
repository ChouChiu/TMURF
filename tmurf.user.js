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

(() => {
	const API_PATH = "/api/v0/chat/completion";
	const COOLDOWN = 5000;

	let lastNotifyTime = 0;
	let lastDingTime = 0;
	let audioCtx = null;

	const origOpen = XMLHttpRequest.prototype.open;
	const origSend = XMLHttpRequest.prototype.send;

	/**
	 * 播放提示音（简化单音）
	 */
	function playDing() {
		const now = Date.now();
		if (now - lastDingTime < COOLDOWN) return;
		lastDingTime = now;

		try {
			if (!audioCtx) {
				audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			}
			if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});

			const t = audioCtx.currentTime;
			const osc = audioCtx.createOscillator();
			const gain = audioCtx.createGain();
			osc.type = "sine";
			osc.frequency.setValueAtTime(1200, t);
			gain.gain.setValueAtTime(0.6, t);
			gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
			osc.connect(gain).connect(audioCtx.destination);
			osc.start(t);
			osc.stop(t + 0.3);
		} catch (e) {
			console.log("[TMURF] 音效播放失败:", e.message);
		}
	}

	/**
	 * 发送通知（页面不可见时 + 冷却期内）
	 */
	function notify(title, body) {
		if (document.hidden) {
			const now = Date.now();
			if (now - lastNotifyTime < COOLDOWN) return;
			lastNotifyTime = now;

			if (Notification.permission === "granted") {
				new Notification(title, {
					body,
					icon: "https://fe-static.deepseek.com/chat/favicon.svg",
				});
			} else if (Notification.permission === "default") {
				Notification.requestPermission();
			} else if (typeof GM_notification !== "undefined") {
				GM_notification({ title, text: body, timeout: 5000 });
			}
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
			this._tmurfMethod.toUpperCase() === "POST" &&
			this._tmurfURL.includes(API_PATH)
		) {
			this.onreadystatechange = function () {
				if (
					this.readyState === 4 &&
					!this._tmurfNotified &&
					this.status >= 200 &&
					this.status < 300
				) {
					this._tmurfNotified = true;
					notify("TMURF - 任务完成", "Deepseek 已完成你的请求！");
					playDing();
				}
			};
		}
		return origSend.apply(this, args);
	};

	Notification.requestPermission();
	console.log("[TMURF] 脚本已加载，正在监听 Deepseek 任务...");
})();
