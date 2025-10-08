// js/main.js

import { NotesManager } from './notes-manager.js';
import { EpubManager } from './epub-manager.js';

// DOM Elements
const libraryView = document.getElementById('library-view');
const readerView = document.getElementById('reader-view');
const bookGrid = document.getElementById('book-grid');
const emptyMessage = document.getElementById('empty-message');
const uploadButton = document.getElementById('upload-button');
const fileInput = document.getElementById('epub-file-input');
const backButton = document.getElementById('back-to-library');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const toggleNotesButton = document.getElementById('toggle-notes');
const notesSheet = document.getElementById('notes-sheet');
const closeNotesSheetButton = document.getElementById('close-notes-sheet');
const notesList = document.getElementById('notes-list');
const noNotesMessage = document.getElementById('no-notes-message');
const popover = document.getElementById('add-note-popover');
const saveNoteButton = document.getElementById('save-note');
const cancelNoteButton = document.getElementById('cancel-note');
const noteTextInput = document.getElementById('note-text-input');

let books = [];
let currentBookMetadata = null;

// ====================================================================
// Theme Management
// ====================================================================

const loadTheme = () => {
    const isDark = localStorage.getItem('theme') === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    themeIcon.textContent = isDark ? '☀️' : '🌙';
};

const toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeIcon.textContent = isDark ? '☀️' : '🌙';
};

themeToggle.addEventListener('click', toggleTheme);
loadTheme();


// ====================================================================
// Library View Functions
// ====================================================================

// نمایش کتاب‌ها در گرید
const renderBooks = () => {
    books = NotesManager.getBooks();
    bookGrid.innerHTML = '';
    
    if (books.length === 0) {
        emptyMessage.style.display = 'block';
        return;
    }
    emptyMessage.style.display = 'none';

    books.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.setAttribute('data-id', book.id);
        card.onclick = () => openBook(book.id);

        let coverContent;
        if (book.cover) {
            coverContent = `<img src="${book.cover}" alt="جلد کتاب" class="book-cover">`;
        } else {
            // Placeholder text cover
            coverContent = `<div class="book-cover-text">${book.title.substring(0, 15)}...</div>`;
        }

        card.innerHTML = `
            <div class="book-cover-container">
                ${coverContent}
            </div>
            <div class="book-title">${book.title}</div>
        `;
        bookGrid.appendChild(card);
    });
};

// ====================================================================
// Upload and File Handling
// ====================================================================

uploadButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/epub+zip' || file.name.endsWith('.epub')) {
        try {
            uploadButton.disabled = true;
            uploadButton.textContent = 'در حال پردازش...';

            // 1. Extract metadata (title, cover)
            const bookData = await EpubManager.extractBookMetadata(file);
            
            // 2. Save metadata (localStorage) and EPUB file (IndexedDB)
            await NotesManager.addBook(bookData, file);
            
            // 3. Update UI
            renderBooks();
            console.log(`Book "${bookData.title}" added successfully.`);
            
        } catch (error) {
            alert('خطا در آپلود و پردازش فایل EPUB. لطفا فایل دیگری را امتحان کنید.');
            console.error('Error in file upload pipeline:', error);
        } finally {
            uploadButton.textContent = 'افزودن کتاب';
            uploadButton.disabled = false;
            fileInput.value = ''; // Reset input
        }
    } else {
        alert('لطفا یک فایل معتبر EPUB (.epub) انتخاب کنید.');
    }
});


// ====================================================================
// Reader View and Navigation
// ====================================================================

const openBook = async (bookId) => {
    currentBookMetadata = books.find(b => b.id === bookId);
    if (!currentBookMetadata) {
        alert('اطلاعات کتاب پیدا نشد.');
        return;
    }
    
    // 1. Get the EPUB file (Blob) from IndexedDB
    const epubFile = await NotesManager.getEpubFile(bookId);

    if (!epubFile) {
        alert('فایل کتاب در حافظه پیدا نشد. ممکن است پاک شده باشد.');
        return;
    }

    // 2. Load the book into the reader
    await EpubManager.loadEpub(bookId, epubFile, currentBookMetadata.title);

    // 3. Switch views
    libraryView.classList.remove('active');
    readerView.classList.add('active');
    
    // 4. Update Notes Sheet for the new book
    await renderNotesList(bookId);
};

backButton.addEventListener('click', () => {
    // Clear selection, hide popover/sheet, and switch views
    EpubManager.clearSelection();
    EpubManager.hideNotesSheet();
    readerView.classList.remove('active');
    libraryView.classList.add('active');
    currentBookMetadata = null;
});


// ====================================================================
// Notes Management (UI)
// ====================================================================

const renderNotesList = async (bookId) => {
    const notes = await NotesManager.getNotes(bookId);
    notesList.innerHTML = '';
    
    if (notes.length === 0) {
        noNotesMessage.style.display = 'block';
        return;
    }
    noNotesMessage.style.display = 'none';

    // Sort by timestamp (newest first)
    notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    notes.forEach(note => {
        const item = document.createElement('div');
        item.className = 'note-item';
        item.setAttribute('data-note-id', note.id);
        
        // Format date in Persian
        const date = new Date(note.timestamp).toLocaleDateString('fa-IR', {
             year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });

        item.innerHTML = `
            <div class="note-text">${note.text}</div>
            <div class="note-context">**متن انتخاب‌شده:** ${note.context}</div>
            <div class="note-date">${date}</div>
        `;
        
        // Add click listener to navigate to the note's location
        item.addEventListener('click', () => {
            const rendition = EpubManager.getCurrentRendition();
            if (rendition && note.cfiRange) {
                rendition.display(note.cfiRange);
                EpubManager.hideNotesSheet();
            }
        });
        
        notesList.appendChild(item);
    });
};

// Toggle Notes Sheet
toggleNotesButton.addEventListener('click', async () => {
    if (notesSheet.classList.contains('visible')) {
        EpubManager.hideNotesSheet();
    } else {
        const bookId = EpubManager.getCurrentBookId();
        if (bookId) {
            await renderNotesList(bookId);
            EpubManager.showNotesSheet();
        }
    }
});

closeNotesSheetButton.addEventListener('click', EpubManager.hideNotesSheet);


// Popover (Add Note) Handlers
saveNoteButton.addEventListener('click', async () => {
    const noteText = noteTextInput.value.trim();
    const cfiRange = window.currentCfiRange; // Accessing temporary globals from epub-manager scope
    const contextText = window.currentContextText;
    const bookId = EpubManager.getCurrentBookId();
    
    if (noteText && bookId && cfiRange && contextText) {
        await NotesManager.saveNote(bookId, cfiRange, noteText, contextText);
        
        // Re-render notes list if sheet is open
        if (notesSheet.classList.contains('visible')) {
            await renderNotesList(bookId);
        }
        
        // Re-highlight in the book
        const rendition = EpubManager.getCurrentRendition();
        if (rendition) {
            rendition.annotations.highlight(cfiRange, { 'fill': 'yellow', 'opacity': '0.3' }, () => EpubManager.showNotesSheet(), 'epub-note-highlight');
        }
        
        // Clean up
        EpubManager.clearSelection(); // This also hides the popover
        window.currentCfiRange = null;
        window.currentContextText = null;
    } else {
        alert('لطفا متن یادداشت را وارد کنید.');
    }
});

cancelNoteButton.addEventListener('click', () => {
    EpubManager.clearSelection();
    window.currentCfiRange = null;
    window.currentContextText = null;
});

// For simplicity in sharing data between modules without explicit exports/imports
// We attach the popover functions to the window object's scope.
window.showAddNotePopover = (cfiRange, contextText, contents) => {
    // Position Popover in epub-manager logic
    const iframeRect = contents.iframe.getBoundingClientRect();
    const selection = contents.window.getSelection();
    
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        const posX = iframeRect.left + rect.left + (rect.width / 2);
        const posY = iframeRect.top + rect.bottom;
        
        popover.style.left = '50%';
        popover.style.transform = 'translate(-50%, -50%)';
        popover.style.top = `${posY + 20}px`;
        
        if (posY + popover.offsetHeight > window.innerHeight) {
            popover.style.top = `${iframeRect.top + rect.top - popover.offsetHeight - 20}px`;
        }
    }
    
    popover.classList.add('visible');
    noteTextInput.value = '';
    noteTextInput.focus();
    
    window.currentCfiRange = cfiRange;
    window.currentContextText = contextText;
};
window.hideAddNotePopover = () => {
    popover.classList.remove('visible');
    window.currentCfiRange = null;
    window.currentContextText = null;
};


// Initialize the application
document.addEventListener('DOMContentLoaded', renderBooks);
