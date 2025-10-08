// main.js

// بررسی می‌کنیم اگر NotesManager وجود نداشت، تعریف شود
if (typeof NotesManager === 'undefined') {
    class NotesManager {
        constructor() {
            this.notes = [];
        }

        // افزودن یادداشت جدید
        addNote(note) {
            if (note && typeof note === 'string') {
                this.notes.push(note);
            }
        }

        // دریافت همه یادداشت‌ها
        getNotes() {
            return this.notes;
        }

        // حذف یادداشت با اندیس
        removeNote(index) {
            if (index >= 0 && index < this.notes.length) {
                this.notes.splice(index, 1);
            }
        }
    }
}

// ایجاد یک نمونه یکتا
const notesManagerInstance = new NotesManager();

// مثال استفاده از NotesManager
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
            return true; // indicate async response

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
