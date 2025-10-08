import { notesManagerInstance } from './notes-manager.js';
import { EpubManager } from './epub-manager.js';

const fileInput = document.getElementById('epub-file-input');
const uploadButton = document.getElementById('upload-button');
const backButton = document.getElementById('back-to-library');
const libraryView = document.getElementById('library-view');
const readerView = document.getElementById('reader-view');
const themeToggle = document.getElementById('theme-toggle');

let isDark = false;

themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    document.body.classList.toggle('dark-theme', isDark);
    document.getElementById('theme-icon').textContent = isDark ? '☀️' : '🌙';
});

uploadButton.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const metadata = await EpubManager.extractBookMetadata(file);

    // اضافه کردن کارت کتاب
    const grid = document.getElementById('book-grid');
    const card = document.createElement('div');
    card.classList.add('book-card');
    card.textContent = metadata.title;
    card.addEventListener('click', async () => {
        libraryView.classList.remove('active');
        readerView.classList.add('active');
        await EpubManager.loadEpub(metadata.id, file, metadata.title);
    });
    grid.appendChild(card);

    await EpubManager.loadEpub(metadata.id, file, metadata.title);
});

backButton.addEventListener('click', () => {
    readerView.classList.remove('active');
    libraryView.classList.add('active');
});

document.getElementById('toggle-notes').addEventListener('click', () => EpubManager.showNotesSheet());
document.getElementById('close-notes-sheet').addEventListener('click', () => EpubManager.hideNotesSheet());

// Chrome Extension async listener
if (chrome && chrome.runtime) {
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        try {
            if (!message || !message.action) return sendResponse({ success: false, error: 'Invalid message' });
            if (message.action === 'getNotes') sendResponse({ success: true, notes: notesManagerInstance.getNotes() });
            else if (message.action === 'addNote') {
                if (message.note) notesManagerInstance.addNote(message.note);
                sendResponse({ success: true });
            } else if (message.action === 'removeNote') {
                if (typeof message.index === 'number') notesManagerInstance.removeNote(message.index);
                sendResponse({ success: true });
            } else sendResponse({ success: false, error: 'Unknown action' });
        } catch (err) { sendResponse({ success: false, error: err.message }); }
        return true;
    });
}
