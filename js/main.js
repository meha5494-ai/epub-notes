// js/main.js
import { notesManagerInstance } from './notes-manager.js';
import { EpubManager } from './epub-manager.js';

// DOM Elements
const fileInput = document.getElementById('epub-file-input');
const uploadButton = document.getElementById('upload-button');
const backButton = document.getElementById('back-to-library');
const toggleNotesButton = document.getElementById('toggle-notes');
const closeNotesButton = document.getElementById('close-notes-sheet');
const themeToggleButton = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const libraryView = document.getElementById('library-view');
const readerView = document.getElementById('reader-view');

// حالت تم پیش‌فرض
let darkMode = false;

// -----------------------
// Toggle Dark/Light Theme
// -----------------------
themeToggleButton.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-theme', darkMode);
    themeIcon.textContent = darkMode ? '☀️' : '🌙';
});

// -----------------------
// Upload EPUB File
// -----------------------
uploadButton.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const bookData = await EpubManager.extractBookMetadata(file);

    await EpubManager.loadEpub(bookData.id, file, bookData.title);

    // نمایش نما کتابخوان و مخفی کردن کتابخانه
    libraryView.classList.remove('active');
    readerView.classList.add('active');
});

// -----------------------
// Navigation Buttons
// -----------------------
backButton.addEventListener('click', () => {
    readerView.classList.remove('active');
    libraryView.classList.add('active');
});

toggleNotesButton.addEventListener('click', () => EpubManager.showNotesSheet());
closeNotesButton.addEventListener('click', () => EpubManager.hideNotesSheet());

// -----------------------
// Optional: Cancel/Save Note Buttons
// -----------------------
const cancelNoteBtn = document.getElementById('cancel-note');
const saveNoteBtn = document.getElementById('save-note');
const noteTextInput = document.getElementById('note-text-input');

cancelNoteBtn.addEventListener('click', () => EpubManager.hideAddNotePopover());

saveNoteBtn.addEventListener('click', () => {
    const noteText = noteTextInput.value.trim();
    if (noteText.length === 0) return;
    const noteData = EpubManager.getCurrentNoteData();
    notesManagerInstance.addNote({
        text: noteText,
        bookId: noteData.cfiRange ? EpubManager.getCurrentBookId() : null,
        cfiRange: noteData.cfiRange,
        context: noteData.contextText
    });
    EpubManager.hideAddNotePopover();
    EpubManager.showNotesSheet();
});
