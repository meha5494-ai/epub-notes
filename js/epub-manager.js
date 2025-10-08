const bookContainer = document.getElementById('book-container');
const loadingOverlay = document.getElementById('loading-overlay');

let currentBook = null;
let currentRendition = null;

const EpubManager = {
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
                flow: 'scrolled-doc',
                spread: 'none'
            });
            
            // اضافه کردن رویداد برای نمایش خطا در صورت عدم بارگذاری
            currentRendition.on('relocated', (location) => {
                console.log('Book loaded to location:', location);
            });
            
            await currentRendition.display();
            currentRendition.resize();
            loadingOverlay.style.display = 'none';
            return currentRendition;
        } catch (e) {
            console.error('Error loading EPUB', e);
            loadingOverlay.innerHTML = `
                <div class="error-message">
                    <span class="material-icons">error</span>
                    <p>خطا در بارگذاری کتاب</p>
                    <button class="mdc-button mdc-button--outlined" onclick="location.reload()">
                        تلاش مجدد
                    </button>
                </div>`;
            loadingOverlay.style.display = 'flex';
        }
    },

    extractBookMetadata: async (file) => {
        const book = ePub(file);
        const bookId = file.name + file.size + file.lastModified;
        await book.opened;
        let coverData = null;
        try {
            coverData = await book.coverUrl();
        } catch (e) {
            console.warn('no cover', e);
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

// اضافه کردن به شیء window برای دسترسی در main.js
window.EpubManager = EpubManager;
