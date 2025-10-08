const bookContainer = document.getElementById('book-container');

let currentBook = null;
let currentRendition = null;
let currentPage = 0;
let totalPages = 0;

const EpubManager = {
    loadEpub: async (id, file, title) => {
        bookContainer.innerHTML = '';
        currentPage = 0;
        totalPages = 0;
        
        try {
            // ایجاد یک div برای محتوای کتاب
            const contentDiv = document.createElement('div');
            contentDiv.style.width = '100%';
            contentDiv.style.height = '100%';
            contentDiv.style.minHeight = '500px';
            bookContainer.appendChild(contentDiv);
            
            currentBook = ePub(file);
            
            // صبر برای آماده شدن کتاب
            await currentBook.ready;
            
            // دریافت تعداد صفحات
            const spine = currentBook.spine;
            totalPages = spine.length;
            console.log(`Total pages: ${totalPages}`);
            
            // رندر کتاب با تنظیمات بهینه
            currentRendition = currentBook.renderTo(contentDiv, {
                width: '100%',
                height: '100%',
                flow: 'paginated',
                manager: 'default'
            });
            
            // رویداد برای به‌روزرسانی اطلاعات صفحه
            currentRendition.on('relocated', (location) => {
                console.log('Relocated to:', location);
                currentPage = location.start.cfi;
                updatePageInfo();
            });
            
            // نمایش کتاب
            await currentRendition.display();
            
            // به‌روزرسانی اطلاعات صفحه
            updatePageInfo();
            
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
                    <button class="primary-btn" onclick="location.reload()">
                        <i class="fas fa-redo"></i> تلاش مجدد
                    </button>
                </div>`;
        }
    },

    // تابع برای رفتن به صفحه بعد
    next: function() {
        if (currentRendition) {
            currentRendition.next().then(() => {
                console.log('Moved to next page');
                updatePageInfo();
            }).catch(e => {
                console.error('Error going to next page:', e);
            });
        }
    },

    // تابع برای رفتن به صفحه قبل
    prev: function() {
        if (currentRendition) {
            currentRendition.prev().then(() => {
                console.log('Moved to previous page');
                updatePageInfo();
            }).catch(e => {
                console.error('Error going to previous page:', e);
            });
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

// تابع برای به‌روزرسانی اطلاعات صفحه
function updatePageInfo() {
    const pageInfo = document.getElementById('page-info');
    if (pageInfo && currentRendition) {
        currentRendition.location().then(location => {
            const current = location.start.displayed.page;
            const total = location.start.displayed.total;
            pageInfo.textContent = `صفحه ${current} از ${total}`;
        }).catch(e => {
            console.error('Error getting page info:', e);
            pageInfo.textContent = 'صفحه 1 از 1';
        });
    }
}

window.EpubManager = EpubManager;
