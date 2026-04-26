export default defineBackground(() => {
	// Request notification permission on install
	browser.runtime.onInstalled.addListener(() => {
		// Request permission via content script injection
		console.log("[TMURF] Extension installed");
	});

	// Listen for messages from content script
	browser.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
		if (message.type === "notify") {
			browser.notifications.create({
				type: "basic",
				title: message.title,
				message: message.body,
				iconUrl: "https://fe-static.deepseek.com/chat/favicon.svg",
			});
		}
	});

	console.log("[TMURF] Background service worker loaded");
});
