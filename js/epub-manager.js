const bookContainer = document.getElementById('book-container');

let currentBook = null;
let currentRendition = null;
let currentPage = 0;
let totalPages = 0;
let isPaginatedView = false;

const EpubManager = {
    loadEpub: async (id, file, title) => {
        bookContainer.innerHTML = '';
        
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
            console.log(`Total pages: ${totalPages}`);
            
            // رندر کتاب با تنظیمات پیش‌فرض
            currentRendition = currentBook.renderTo(contentDiv, {
                width: "100%",
                height: "100%",
                flow: isPaginatedView ? "paginated" : "scrolled-doc",
                manager: "default"
            });
            
            // رویداد برای به‌روزرسانی اطلاعات صفحه
            currentRendition.on('relocated', (location) => {
                console.log('Relocated to:', location);
                updatePageInfo();
                updateProgress();
            });
            
            // نمایش کتاب
            await currentRendition.display();
            
            // به‌روزرسانی اطلاعات صفحه و پیشرفت
            updatePageInfo();
            updateProgress();
            
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

    // تابع برای رفتن به صفحه بعد
    next: function() {
        if (currentRendition) {
            currentRendition.next().then(() => {
                console.log('Moved to next page');
                updatePageInfo();
                updateProgress();
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
                updateProgress();
            }).catch(e => {
                console.error('Error going to previous page:', e);
            });
        }
    },

    // تابع برای تغییر حالت نمایش
    toggleViewMode: function() {
        if (!currentRendition) return;
        
        isPaginatedView = !isPaginatedView;
        
        // دریافت تنظیمات فعلی
        const currentLocation = currentRendition.currentLocation();
        
        // رندر مجدد با حالت جدید
        currentRendition.destroy();
        
        const contentDiv = document.getElementById('epub-content');
        currentRendition = currentBook.renderTo(contentDiv, {
            width: "100%",
            height: "100%",
            flow: isPaginatedView ? "paginated" : "scrolled-doc",
            manager: "default"
        });
        
        // نمایش کتاب در محل قبلی
        currentRendition.display(currentLocation).then(() => {
            updatePageInfo();
            updateProgress();
            
            // به‌روزرسانی دکمه تغییر حالت
            const viewToggleBtn = document.getElementById('view-toggle-btn');
            if (viewToggleBtn) {
                if (isPaginatedView) {
                    viewToggleBtn.innerHTML = '<i class="fas fa-file-alt"></i>';
                    viewToggleBtn.title = 'نمای پیوسته';
                } else {
                    viewToggleBtn.innerHTML = '<i class="fas fa-columns"></i>';
                    viewToggleBtn.title = 'نمای صفحه‌ای';
                }
            }
        });
    },

    // تابع برای دریافت فهرست مطالب
    getOutline: async function() {
        if (!currentBook) return [];
        
        try {
            const nav = await currentBook.loaded.navigation;
            const outline = [];
            
            // دریافت فصل‌ها
            const toc = await nav.toc();
            
            function processTocItem(item, level = 0) {
                if (item.label) {
                    outline.push({
                        label: item.label,
                        level: level,
                        href: item.href
                    });
                }
                
                if (item.subitems) {
                    item.subitems.forEach(subitem => processTocItem(subitem, level + 1));
                }
            }
            
            if (toc) {
                processTocItem(toc);
            }
            
            return outline;
        } catch (e) {
            console.error('Error getting outline:', e);
            return [];
        }
    },

    // تابع برای رفتن به یک بخش خاص
    goToSection: function(href) {
        if (currentRendition && href) {
            currentRendition.rended.then(() => {
                currentRendition.display(href);
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

// توابع کمکی برای به‌روزرسانی UI
function updatePageInfo() {
    const pageInfo = document.getElementById('page-info');
    const progressText = document.getElementById('progress-text');
    
    if (pageInfo && currentRendition) {
        currentRendition.location().then(location => {
            const current = location.start.displayed.page;
            const total = location.start.displayed.total;
            pageInfo.textContent = `صفحه ${current} از ${total}`;
            progressText.textContent = `صفحه ${current} از ${total}`;
        }).catch(e => {
            console.error('Error getting page info:', e);
            pageInfo.textContent = 'صفحه 1 از 1';
            progressText.textContent = 'صفحه 1 از 1';
        });
    }
}

function updateProgress() {
    const progressFill = document.getElementById('progress-fill');
    
    if (progressFill && currentRendition) {
        currentRendition.location().then(location => {
            const current = location.start.displayed.page;
            const total = location.start.displayed.total;
            const percentage = total > 0 ? (current / total) * 100 : 0;
            progressFill.style.width = `${percentage}%`;
        }).catch(e => {
            console.error('Error updating progress:', e);
            progressFill.style.width = '0%';
        });
    }
}

window.EpubManager = EpubManager;
