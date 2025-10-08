const bookContainer = document.getElementById('book-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const pageInfo = document.getElementById('page-info');

let currentBook = null;
let currentRendition = null;
let currentLocation = null;
let totalPages = 0;
let currentPage = 0;
let readingProgress = 0;

const EpubManager = {
    loadEpub: async (id, file, title) => {
        bookContainer.innerHTML = '';
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
        pageInfo.textContent = 'صفحه 1 از 1';
        
        try {
            // ایجاد یک div با ID مشخص برای محتوای کتاب
            const contentDiv = document.createElement('div');
            contentDiv.id = 'epub-content';
            contentDiv.style.cssText = `
                width: 100%;
                height: 600px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: auto;
                padding: 20px;
            `;
            bookContainer.appendChild(contentDiv);
            
            currentBook = ePub(file);
            
            // صبر برای آماده شدن کتاب
            await currentBook.ready;
            
            // دریافت تعداد صفحات
            const spine = currentBook.spine;
            totalPages = spine.length;
            
            // رندر کتاب با تنظیمات بهینه
            currentRendition = currentBook.renderTo("epub-content", {
                width: "100%",
                height: "100%",
                flow: "scrolled-doc",
                manager: "default"
            });
            
            // رویداد برای به‌روزرسانی پیشرفت
            currentRendition.on('relocated', (location) => {
                currentLocation = location;
                updateProgress();
                updatePageInfo();
            });
            
            // نمایش کتاب
            await currentRendition.display();
            
            // به‌روزرسانی اطلاعات صفحه
            updateProgress();
            updatePageInfo();
            
            return currentRendition;
        } catch (e) {
            console.error('Error loading EPUB:', e);
            bookContainer.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    text-align: center;
                    color: #64748b;
                    height: 600px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                ">
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: rgba(236, 72, 153, 0.1);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 24px;
                        color: #ec4899;
                        font-size: 2rem;
                    ">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 style="font-size: 1.5rem; margin-bottom: 8px; color: #1e293b;">خطا در بارگذاری کتاب</h3>
                    <p style="margin-bottom: 24px; max-width: 400px;">متاسفانه در بارگذاری کتاب مشکلی پیش آمد</p>
                    <button style="
                        background: linear-gradient(135deg, #6366f1, #8b5cf6);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 50px;
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    " onclick="location.reload()">
                        <i class="fas fa-redo"></i> تلاش مجدد
                    </button>
                </div>`;
        }
    },

    // تابع برای به‌روزرسانی پیشرفت
    updateProgress: function() {
        if (currentBook && currentLocation) {
            // محاسبه درصد پیشرفت
            const percentage = Math.round((currentLocation.end.percentage || 0) * 100);
            readingProgress = percentage;
            progressFill.style.width = percentage + '%';
            progressText.textContent = percentage + '%';
        }
    },

    // تابع برای به‌روزرسانی اطلاعات صفحه
    updatePageInfo: function() {
        if (currentRendition) {
            currentRendition.location().then(location => {
                const current = location.start.displayed.page;
                const total = location.start.displayed.total;
                pageInfo.textContent = `صفحه ${current} از ${total}`;
            }).catch(e => {
                console.error('Error getting page info:', e);
                pageInfo.textContent = 'صفحه 1 از 1';
            });
        }
    },

    // تابع برای رفتن به صفحه بعد
    next: function() {
        if (currentRendition) {
            currentRendition.next().then(() => {
                console.log('Moved to next page');
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
            }).catch(e => {
                console.error('Error going to previous page:', e);
            });
        }
    },

    // تابع برای تغییر حالت نمایش
    setViewMode: function(mode) {
        if (currentRendition) {
            if (mode === 'continuous') {
                currentRendition.settings.flow = 'scrolled-doc';
            } else if (mode === 'paged') {
                currentRendition.settings.flow = 'paginated';
            }
            currentRendition.clear();
            currentRendition.display();
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
