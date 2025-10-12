const bookContainer = document.getElementById('book-container');

let currentBook = null;
let currentRendition = null;

// کلیدهای ذخیره‌سازی در localStorage
const STORAGE_KEYS = {
    CURRENT_BOOK: 'epubReader_currentBook',
    CURRENT_LOCATION: 'epubReader_currentLocation',
    VIEW_MODE: 'epubReader_viewMode'
};

const EpubManager = {
    // تبدیل فایل EPUB یا blob URL به Base64 (به صورت async واقعی)
    convertToBase64: async (fileOrUrl) => {
        const response = await fetch(fileOrUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },

    loadEpub: async (id, file, title) => {
        bookContainer.innerHTML = '';
        
        try {
            const contentDiv = document.createElement('div');
            contentDiv.id = 'epub-content';
            contentDiv.style.cssText = `
                width: 100%;
                height: 100%;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: auto;
                padding: 20px;
            `;
            bookContainer.appendChild(contentDiv);

            currentBook = ePub(file);
            currentRendition = currentBook.renderTo("epub-content", {
                width: "100%",
                height: "100%",
                flow: "scrolled-doc",
                manager: "continuous"
            });

            const bookInfo = { id, title };
            localStorage.setItem(STORAGE_KEYS.CURRENT_BOOK, JSON.stringify(bookInfo));

            // ✅ تبدیل به Base64 و ذخیره پایدار (بلوک‌شده)
            const base64Data = await EpubManager.convertToBase64(file);
            const books = JSON.parse(localStorage.getItem('epubBooks')) || [];
            const existing = books.find(b => b.id === id);
            if (!existing) {
                books.push({
                    id,
                    title,
                    fileName: title + '.epub',
                    fileType: 'application/epub+zip',
                    content: base64Data
                });
                localStorage.setItem('epubBooks', JSON.stringify(books));
            }

            await currentRendition.display();

            // بازیابی مکان قبلی
            const savedLocation = localStorage.getItem(STORAGE_KEYS.CURRENT_LOCATION);
            if (savedLocation) {
                try {
                    const location = JSON.parse(savedLocation);
                    if (location.cfi) {
                        await currentRendition.display(location.cfi);
                    }
                } catch (e) {
                    console.warn('Error restoring location:', e);
                }
            }

            currentRendition.on('relocated', (location) => {
                localStorage.setItem(STORAGE_KEYS.CURRENT_LOCATION, JSON.stringify({
                    cfi: location.start.cfi,
                    href: location.start.href
                }));
            });

            setTimeout(() => {
                const iframe = document.querySelector('#epub-content iframe');
                if (iframe) {
                    iframe.style.cssText = `
                        width: 100%;
                        height: 100%;
                        border: none;
                        overflow: auto;
                        background: white;
                    `;
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc && iframeDoc.body) {
                        iframeDoc.body.style.direction = 'rtl';
                        iframeDoc.body.style.fontFamily = 'Vazirmatn', sans-serif;
                        iframeDoc.body.style.lineHeight = '1.8';
                        iframeDoc.body.style.fontSize = '16px';
                        iframeDoc.body.style.color = '#1e293b';
                        iframeDoc.body.style.padding = '20px';
                        iframeDoc.documentElement.style.overflow = 'hidden';
                        iframeDoc.body.style.overflow = 'auto';
                    }
                }
            }, 1000);

            return currentRendition;
        } catch (e) {
            console.error('Error loading EPUB:', e);
            bookContainer.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>خطا در بارگذاری کتاب</h3>
                    <p>متاسفانه در بارگذاری کتاب مشکلی پیش آمد</p>
                    <button class="retry-btn" onclick="location.reload()">
                        <i class="fas fa-redo"></i> تلاش مجدد
                    </button>
                </div>`;
        }
    },

    restoreBook: async () => {
        try {
            const savedBookInfo = localStorage.getItem(STORAGE_KEYS.CURRENT_BOOK);
            if (!savedBookInfo) return false;
            
            const bookInfo = JSON.parse(savedBookInfo);
            const books = JSON.parse(localStorage.getItem('epubBooks')) || [];
            const bookData = books.find(book => book.id === bookInfo.id);
            
            if (!bookData) {
                console.warn('Book not found in library');
                return false;
            }

            // ✅ استفاده از Base64 پایدار
            const response = await fetch(bookData.content);
            const blob = await response.blob();
            const file = new File([blob], bookData.fileName, { type: bookData.fileType });
            const blobUrl = URL.createObjectURL(file);
            
            await EpubManager.loadEpub(bookInfo.id, blobUrl, bookInfo.title);

            document.getElementById('library-view').classList.remove('active');
            document.getElementById('reader-view').classList.add('active');

            return true;
        } catch (error) {
            console.error('Error restoring book:', error);
            return false;
        }
    }
};

window.EpubManager = EpubManager;

document.addEventListener('DOMContentLoaded', async () => {
    const restored = await EpubManager.restoreBook();
    if (!restored) {
        document.getElementById('library-view').classList.add('active');
    }
});
