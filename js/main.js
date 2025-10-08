// js/main.js
import { notesManagerInstance } from './notes-manager.js';
import { EpubManager } from './epub-manager.js';

// دکمه‌ها و input‌ها
const fileInput = document.getElementById('epub-file-input');
const uploadButton = document.getElementById('upload-button');
const backButton = document.getElementById('back-to-library');
const toggleNotesButton = document.getElementById('toggle-notes');
const closeNotesButton = document.getElementById('close-notes-sheet');

// بارگذاری فایل EPUB
uploadButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const bookData = await EpubManager.extractBookMetadata(file);
    await EpubManager.loadEpub(bookData.id, file, bookData.title);
});

// مدیریت نماهای کتابخانه و خواننده
backButton.addEventListener('click', () => {
    document.getElementById('reader-view').classList.remove('active');
    document.getElementById('library-view').classList.add('active');
});
toggleNotesButton.addEventListener('click', () => EpubManager.showNotesSheet());
closeNotesButton.addEventListener('click', () => EpubManager.hideNotesSheet());
