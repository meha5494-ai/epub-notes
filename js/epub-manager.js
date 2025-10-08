import { notesManagerInstance } from './notes-manager.js';

const bookContainer = document.getElementById('book-container');
const loadingOverlay = document.getElementById('loading-overlay');

let currentBook = null;
let currentRendition = null;

export const EpubManager = {
    loadEpub: async (id, file, title) => {
        loadingOverlay.style.display = 'flex';
        bookContainer.innerHTML = '';
        try {
            currentBook = ePub(file);
            currentRendition = currentBook.renderTo('book-container', {
                width: '100%',
                height: '100%',
                method: 'scrolled-doc',
                manager: 'default',
                flow: 'scrolled-doc'
            });
            await currentRendition.display();
            loadingOverlay.style.display = 'none';
            return currentRendition;
        } catch (e) {
            console.error('Error loading EPUB', e);
            loadingOverlay.innerHTML = `
                <div class="error-message">
                    <p>خطا در بارگذاری کتاب</p>
                    <button onclick="location.reload()">تلاش مجدد</button>
                </div>`;
            return null;
        }
    },

    extractBookMetadata: async (file) => {
        const book = ePub(file);
        const bookId = `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await book.opened;
        let coverData = null;
        try {
            coverData = await book.coverUrl();
        } catch (e) {
            console.warn('No cover found', e);
        }
        return {
            id: bookId,
            title: file.name.replace('.epub', ''),
            author: 'ناشناس',
            cover: coverData,
            epubFile: file
        };
    }
};
