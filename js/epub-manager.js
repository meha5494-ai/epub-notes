const bookContainer = document.getElementById('book-container');
const loadingOverlay = document.getElementById('loading-overlay');

let currentBook = null;
let currentRendition = null;

const EpubManager = {
    loadEpub: async (id, file, title) => {
        loadingOverlay.style.display = 'flex';
        bookContainer.innerHTML = '';
        
        try {
            // ایجاد یک div ساده برای محتوای کتاب
            const contentDiv = document.createElement('div');
            contentDiv.style.width = '100%';
            contentDiv.style.height = '600px';
            bookContainer.appendChild(contentDiv);
            
            // ✅ تبدیل فایل به URL برای epub.js
            const fileUrl = URL.createObjectURL(file);
            currentBook = ePub(fileUrl);
            
            // رندر کتاب با ساده‌ترین تنظیمات ممکن
            currentRendition = currentBook.renderTo(contentDiv, {
                width: '100%',
                height: '100%',
                flow: 'scrolled'
            });
            
            // نمایش کتاب
            await currentRendition.display();

            // آزاد کردن blob URL برای جلوگیری از memory leak
            URL.revokeObjectURL(fileUrl);
            
            // پنهان کردن لودینگ با تاخیر کوتاه
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 800);
            
            return currentRendition;
        } catch (e) {
            console.error('Error loading EPUB:', e);

            // ✅ اگر خطا رخ داد، لودینگ را حتماً پنهان کن
            loadingOverlay.style.display = 'none';

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
        // ✅ از URL برای متادیتا استفاده کن
        const fileUrl = URL.createObjectURL(file);
        const book = ePub(fileUrl);

        const bookId = file.name + file.size + file.lastModified;
        await book.opened;
        let coverData = null;
        try {
            coverData = await book.coverUrl();
        } catch (e) {
            console.warn('no cover', e);
        }

        // آزاد کردن blob URL
        URL.revokeObjectURL(fileUrl);

        return {
            id: bookId,
            title: file.name.replace('.epub', ''),
            author: 'ناشناس',
            cover: coverData,
            epubFile: file
        };
    }
};

// ✅ در دسترس قرار دادن برای سایر فایل‌ها
window.EpubManager = EpubManager;
