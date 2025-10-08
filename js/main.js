// js/main.js
import { notesManagerInstance } from './notes-manager.js';
import { EPUBManager } from './epub-manager.js';

// نمونه از EPUBManager
const epubManager = new EPUBManager('book-container');

// انتخاب فایل EPUB و بارگذاری
const fileInput = document.getElementById('epub-file-input');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        await epubManager.loadBook(file);
    }
});

// افزودن یادداشت نمونه
notesManagerInstance.addNote("اولین یادداشت");

// Listener برای پیام‌های async (مثلاً از Extension)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.action) {
        sendResponse({ success: false, error: "Invalid message" });
        return;
    }

    switch (message.action) {
        case "getNotes":
            (async () => {
                sendResponse({ success: true, notes: notesManagerInstance.getNotes() });
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
