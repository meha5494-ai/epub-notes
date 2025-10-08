// js/main.js

// دسترسی به کلاس‌ها و توابع از فضای گلوبال
const NotesManager = window.NotesManager;
const EpubManager = window.EpubManager;

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
        // استفاده از تابع محلی (Closure) برای اطمینان از دسترسی به ID صحیح
        card.onclick = () => openBook(book.id); 

        let coverContent;
        if (book.cover) {
            coverContent = `<img src="${book.cover}" alt="جلد کتاب" class="book-cover">`;
        } else {
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
    if (file && (file.type === 'application/epub+zip' || file.name.endsWith('.epub'))) {
        try {
            uploadButton.disabled = true;
            uploadButton.textContent = 'در حال پردازش...';

            const bookData = await EpubManager.extractBookMetadata(file);
            
            await NotesManager.addBook(bookData, file);
            
            renderBooks();
            console.log(`Book "${bookData.title}" added successfully.`);
            
        } catch (error) {
            alert('خطا در آپلود و پردازش فایل EPUB. لطفا فایل دیگری را امتحان کنید.');
            console.error('Error in file upload pipeline:', error);
        } finally {
            uploadButton.textContent = 'افزودن کتاب';
            uploadButton.disabled = false;
            fileInput.value = ''; 
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
    
    const epubFile = await NotesManager.getEpubFile(bookId);

    if (!epubFile) {
        alert('فایل کتاب در حافظه پیدا نشد. ممکن است پاک شده باشد.');
        return;
    }

    await EpubManager.loadEpub(bookId, epubFile, currentBookMetadata.title);

    libraryView.classList.remove('active');
    readerView.classList.add('active');
    
    await renderNotesList(bookId);
};

backButton.addEventListener('click', () => {
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

    notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    notes.forEach(note => {
        const item = document.createElement('div');
        item.className = 'note-item';
        item.setAttribute('data-note-id', note.id);
        
        const date = new Date(note.timestamp).toLocaleDateString('fa-IR', {
             year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });

        item.innerHTML = `
            <div class="note-text">${note.text}</div>
            <div class="note-context">**متن انتخاب‌شده:** ${note.context}</div>
            <div class="note-date">${date}</div>
        `;
        
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
    
    const { cfiRange, contextText } = EpubManager.getCurrentNoteData();
    const bookId = EpubManager.getCurrentBookId();
    
    if (noteText && bookId && cfiRange && contextText) {
        await NotesManager.saveNote(bookId, cfiRange, noteText, contextText);
        
        if (notesSheet.classList.contains('visible')) {
            await renderNotesList(bookId);
        }
        
        const rendition = EpubManager.getCurrentRendition();
        if (rendition) {
            rendition.annotations.highlight(cfiRange, { 'fill': 'yellow', 'opacity': '0.3' }, () => EpubManager.showNotesSheet(), 'epub-note-highlight');
        }
        
        EpubManager.clearSelection();
    } else {
        alert('لطفا متن یادداشت را وارد کنید.');
    }
});

cancelNoteButton.addEventListener('click', () => {
    EpubManager.clearSelection();
});


// Initialize the application
document.addEventListener('DOMContentLoaded', renderBooks);
