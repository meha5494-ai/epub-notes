// js/notes-manager.js

// Using idb-keyval global object (UMD build)
const { get, set, keys, del, createStore } = idbKeyval;

// Separate IndexedDB store for notes
const notesStore = createStore('epubNotesDB', 'notesStore');
// Separate IndexedDB store for book files (Blobs)
const booksStore = createStore('epubNotesDB', 'booksStore'); 

const BOOK_LIST_KEY = 'epub_library_books'; // localStorage key

/**
 * مدیریت لیست کتاب‌ها (LocalStorage)
 */
export const NotesManager = {
    // ------------------- کتاب‌ها (Local Storage) -------------------
    
    // بازیابی لیست کتاب‌ها از LocalStorage
    getBooks: () => {
        const booksJson = localStorage.getItem(BOOK_LIST_KEY);
        return booksJson ? JSON.parse(booksJson) : [];
    },

    // ذخیره لیست کتاب‌ها در LocalStorage
    saveBooks: (books) => {
        localStorage.setItem(BOOK_LIST_KEY, JSON.stringify(books));
    },

    // افزودن یک کتاب جدید به لیست و ذخیره فایل آن
    addBook: async (bookData, epubFile) => {
        const books = NotesManager.getBooks();
        // Check for duplicate ID (though unlikely with File.lastModified)
        if (books.some(b => b.id === bookData.id)) {
            console.warn('Book ID already exists. Overwriting.');
        }

        // Save book metadata to LocalStorage
        books.push(bookData);
        NotesManager.saveBooks(books);

        // Save the EPUB file (Blob) to IndexedDB
        await set(bookData.id, epubFile, booksStore);

        return books;
    },

    // دریافت فایل EPUB (Blob) از IndexedDB
    getEpubFile: (bookId) => {
        return get(bookId, booksStore);
    },

    // ------------------- یادداشت‌ها (IndexedDB) -------------------

    // دریافت یادداشت‌ها برای یک کتاب خاص
    getNotes: async (bookId) => {
        const noteKeys = (await keys(notesStore)).filter(key => key.startsWith(`${bookId}_`));
        const notes = await Promise.all(noteKeys.map(key => get(key, notesStore)));
        // Add the key (used as noteId) back into the note object
        return notes.map((note, index) => ({ id: noteKeys[index], ...note }));
    },

    // ذخیره یک یادداشت جدید
    saveNote: async (bookId, cfiRange, text, context) => {
        const noteId = `${bookId}_${Date.now()}`;
        const note = {
            bookId,
            cfiRange,
            text, // متن یادداشت کاربر
            context, // متن هایلایت شده در کتاب
            timestamp: new Date().toISOString()
        };
        await set(noteId, note, notesStore);
        return note;
    },
    
    // حذف یک یادداشت
    deleteNote: async (noteId) => {
        await del(noteId, notesStore);
    }
};
