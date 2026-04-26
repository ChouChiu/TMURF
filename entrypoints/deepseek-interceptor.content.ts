export default defineContentScript({
	matches: ["https://chat.deepseek.com/*"],
	runAt: "document_start",
	async main(_ctx) {
		const COOLDOWN = 5000;
		let lastNotifyTime = 0;
		let lastDingTime = 0;
		let audioCtx: AudioContext | null = null;

		// Inject the main world script to intercept XHR
		await injectScript("/deepseek-main-world.js", {
			keepInDom: true,
		});

		/**
		 * Play a ding sound using Web Audio API
		 */
		function playDing() {
			const now = Date.now();
			if (now - lastDingTime < COOLDOWN) return;
			lastDingTime = now;

			try {
				if (!audioCtx) {
					audioCtx = new (
						window.AudioContext ||
						(window as unknown as { webkitAudioContext: typeof AudioContext })
							.webkitAudioContext
					)();
				}
				if (audioCtx.state === "suspended") {
					audioCtx.resume().catch(() => {});
				}

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
				console.log("[TMURF] Audio playback failed:", (e as Error).message);
			}
		}

		/**
		 * Send notification message to background script
		 */
		function sendNotification(title: string, body: string) {
			const now = Date.now();
			if (now - lastNotifyTime < COOLDOWN) return;
			lastNotifyTime = now;

			// Only notify when page is hidden
			if (document.hidden) {
				browser.runtime
					.sendMessage({
						type: "notify",
						title,
						body,
					})
					.catch(() => {});
			}
		}

		// Listen for XHR completion events from main world script
		document.addEventListener("tmurf:completion", () => {
			playDing();
			sendNotification("TMURF - 任务完成", "Deepseek 已完成你的请求！");
		});

		console.log("[TMURF] Content script loaded, listening for API requests...");
	},
});
