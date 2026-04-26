export default defineUnlistedScript(() => {
	const API_PATH = "/api/v0/chat/completion";

	const origOpen = XMLHttpRequest.prototype.open;
	const origSend = XMLHttpRequest.prototype.send;

	XMLHttpRequest.prototype.open = function (
		method: string,
		url: string | URL,
		...rest: unknown[]
	) {
		// Store method and URL on the XHR instance for later access
		(
			this as XMLHttpRequest & { _tmurfMethod?: string; _tmurfURL?: string }
		)._tmurfMethod = typeof method === "string" ? method : "";
		(
			this as XMLHttpRequest & { _tmurfMethod?: string; _tmurfURL?: string }
		)._tmurfURL = typeof url === "string" ? url : url.toString();
		// biome-ignore lint/suspicious/noExplicitAny: XHR open has variable signature
		return origOpen.apply(this, [method, url, ...rest] as any);
	};

	XMLHttpRequest.prototype.send = function (
		body?: Document | XMLHttpRequestBodyInit | null,
	) {
		const xhr = this as XMLHttpRequest & {
			_tmurfMethod?: string;
			_tmurfURL?: string;
		};
		const method = xhr._tmurfMethod?.toUpperCase() ?? "";
		const url = xhr._tmurfURL ?? "";

		if (method === "POST" && url.includes(API_PATH)) {
			this.addEventListener("readystatechange", function () {
				if (this.readyState === 4 && this.status >= 200 && this.status < 300) {
					// Dispatch custom event to notify content script
					document.dispatchEvent(
						new CustomEvent("tmurf:completion", {
							detail: { url, status: this.status },
						}),
					);
				}
			});
		}

		return origSend.apply(this, [body]);
	};

	console.log("[TMURF] Main world XHR interceptor loaded");
});
