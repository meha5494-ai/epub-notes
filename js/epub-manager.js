const bookContainer = document.getElementById('book-container');
const loadingOverlay = document.getElementById('loading-overlay');

let currentBook = null;
let currentRendition = null;

const EpubManager = {
    loadEpub: async (id, file, title) => {
        loadingOverlay.style.display = 'flex';
        bookContainer.innerHTML = '';
        
        try {
            // ایجاد یک div با اندازه مشخص برای محتوای کتاب
            const contentDiv = document.createElement('div');
            contentDiv.id = 'epub-content';
            contentDiv.style.width = '100%';
            contentDiv.style.height = '100%';
            contentDiv.style.minHeight = '70vh';
            contentDiv.style.position = 'relative';
            bookContainer.appendChild(contentDiv);
            
            currentBook = ePub(file);
            
            // صبر برای آماده شدن کتاب
            await currentBook.ready;
            
            // تنظیمات رندر با روش متفاوت
            currentRendition = currentBook.renderTo(contentDiv, {
                width: '100%',
                height: '100%',
                spread: 'none',
                flow: 'scrolled-doc',
                manager: 'continuous'
            });
            
            // رویداد برای اطمینان از بارگذاری کامل
            let sectionsLoaded = 0;
            currentRendition.on('rendered', (section) => {
                sectionsLoaded++;
                console.log(`Section ${sectionsLoaded} rendered`);
                
                // بعد از رندر شدن اولین بخش، لودینگ را پنهان کن
                if (sectionsLoaded === 1) {
                    setTimeout(() => {
                        loadingOverlay.style.display = 'none';
                    }, 300);
                }
            });
            
            // تلاش برای نمایش کتاب
            await currentRendition.display();
            
            // تنظیم مجدد اندازه بعد از نمایش
            setTimeout(() => {
                if (currentRendition) {
                    currentRendition.resize();
                }
                
                // اگر لودینگ هنوز نمایش داده می‌شود، آن را پنهان کن
                if (loadingOverlay.style.display === 'flex') {
                    loadingOverlay.style.display = 'none';
                }
            }, 1000);
            
            return currentRendition;
        } catch (e) {
            console.error('Error loading EPUB:', e);
            loadingOverlay.innerHTML = `
                <div class="loading-card">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>خطا در بارگذاری کتاب</h3>
                    <p>متاسفانه در بارگذاری کتاب مشکلی پیش آمد</p>
                    <button class="primary-btn" onclick="location.reload()">
                        <i class="fas fa-redo"></i> تلاش مجدد
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

window.EpubManager = EpubManager;
