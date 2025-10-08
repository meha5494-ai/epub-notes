const bookContainer = document.getElementById('book-container');

let currentBook = null;
let currentRendition = null;

const EpubManager = {
    loadEpub: async (id, file, title) => {
        bookContainer.innerHTML = '';
        
        try {
            // ایجاد یک div برای محتوای کتاب با ارتفاع کامل
            const contentDiv = document.createElement('div');
            contentDiv.style.width = '100%';
            contentDiv.style.height = '100%';
            contentDiv.style.minHeight = '500px';
            bookContainer.appendChild(contentDiv);
            
            currentBook = ePub(file);
            
            // رندر کتاب با تنظیمات بهینه برای نمایش محتوا
            currentRendition = currentBook.renderTo(contentDiv, {
                width: '100%',
                height: '100%',
                method: 'scrolled-doc',
                flow: 'scrolled-doc',
                manager: 'continuous'
            });
            
            // نمایش کتاب
            await currentRendition.display();
            
            // تنظیم مجدد اندازه بعد از نمایش
            setTimeout(() => {
                if (currentRendition) {
                    currentRendition.resize();
                }
            }, 100);
            
            return currentRendition;
        } catch (e) {
            console.error('Error loading EPUB:', e);
            // نمایش پیام خطا در container کتاب
            bookContainer.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>خطا در بارگذاری کتاب</h3>
                    <p>متاسفانه در بارگذاری کتاب مشکلی پیش آمد</p>
                    <button class="primary-btn" onclick="location.reload()">
                        <i class="fas fa-redo"></i> تلاش مجدد
                    </button>
                </div>`;
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

window.EpubManager = EpubManager;
