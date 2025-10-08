// js/notes-manager.js

// دسترسی به idbKeyval از فضای گلوبال UMD
const { get, set, keys, del, createStore } = idbKeyval;

const notesStore = createStore('epubNotesDB', 'notesStore');
const booksStore = createStore('epubNotesDB', 'booksStore'); 

const BOOK_LIST_KEY = 'epub_library_books';

/**
 * مدیریت لیست کتاب‌ها (LocalStorage) و یادداشت‌ها (IndexedDB)
 * تعریف شیء NotesManager در فضای گلوبال (window)
 */
window.NotesManager = {
    // ------------------- کتاب‌ها (Local Storage) -------------------
    
    getBooks: () => {
        const booksJson = localStorage.getItem(BOOK_LIST_KEY);
        return booksJson ? JSON.parse(booksJson) : [];
    },

    saveBooks: (books) => {
        localStorage.setItem(BOOK_LIST_KEY, JSON.stringify(books));
    },

    addBook: async (bookData, epubFile) => {
        const books = window.NotesManager.getBooks();
        if (books.some(b => b.id === bookData.id)) {
            console.warn('Book ID already exists. Overwriting.');
        }

        books.push(bookData);
        window.NotesManager.saveBooks(books);

        await set(bookData.id, epubFile, booksStore);
        return books;
    },

    getEpubFile: (bookId) => {
        return get(bookId, booksStore);
    },

    // ------------------- یادداشت‌ها (IndexedDB) -------------------

    getNotes: async (bookId) => {
        const noteKeys = (await keys(notesStore)).filter(key => key.startsWith(`${bookId}_`));
        const notes = await Promise.all(noteKeys.map(key => get(key, notesStore)));
        return notes.map((note, index) => ({ id: noteKeys[index], ...note }));
    },

    saveNote: async (bookId, cfiRange, text, context) => {
        const noteId = `${bookId}_${Date.now()}`;
        const note = {
            bookId,
            cfiRange,
            text, 
            context, 
            timestamp: new Date().toISOString()
        };
        await set(noteId, note, notesStore);
        return note;
    },
    
    deleteNote: async (noteId) => {
        await del(noteId, notesStore);
    }
};
