// main.js
import { notesManagerInstance } from './notesManager.js';

// افزودن یک یادداشت نمونه
notesManagerInstance.addNote("اولین یادداشت");

// Listener برای پیام‌های async (مثلاً از extension یا دیگر اسکریپت‌ها)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.action) {
        sendResponse({ success: false, error: "Invalid message" });
        return;
    }

    switch (message.action) {
        case "getNotes":
            (async () => {
                const notes = notesManagerInstance.getNotes();
                sendResponse({ success: true, notes });
            })();
            return true;

        case "addNote":
            (async () => {
                if (message.note) {
                    notesManagerInstance.addNote(message.note);
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: "No note provided" });
                }
            })();
            return true;

        case "removeNote":
            (async () => {
                if (typeof message.index === 'number') {
                    notesManagerInstance.removeNote(message.index);
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: "Invalid index" });
                }
            })();
            return true;

        default:
            sendResponse({ success: false, error: "Unknown action" });
    }
});
