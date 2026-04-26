import { defineConfig } from "wxt";

export default defineConfig({
	manifest: {
		name: "TMURF - Tell Me yoU aRe Finish",
		description: "当 AI 完成工作时通知你 - 适配 Deepseek 聊天页面",
		version: "2.0.0",
		permissions: ["notifications"],
		host_permissions: ["https://chat.deepseek.com/*"],
		icons: {
			"16": "/icon-16.png",
			"48": "/icon-48.png",
			"128": "/icon-128.png",
		},
	},
});
