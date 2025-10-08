// ✅ EpubManager — نسخه‌ی ثابت با حفظ ساختار اصلی اپ
let currentBook = null;
let currentRendition = null;

const EpubManager = {
    loadEpub: async (id, file, title) => {
        const bookContainer = document.getElementById('book-container');
        const loadingOverlay = document.getElementById('loading-overlay');

        loadingOverlay.style.display = 'flex';
        bookContainer.innerHTML = '';

        try {
            // ⚙️ فقط این بخش تغییر کرده: استفاده از URL برای سازگاری با مرورگر و GitHub Pages
            const fileUrl = URL.createObjectURL(file);
            currentBook = ePub(fileUrl);

            currentRendition = currentBook.renderTo('book-container', {
                width: '100%',
                height: '100%',
            });

            await currentRendition.display();

            // آزاد کردن URL موقت
            URL.revokeObjectURL(fileUrl);

            // ✨ با تاخیر جزئی لودینگ رو ببند تا ظاهر حفظ بشه
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 400);

            return currentRendition;

        } catch (e) {
            console.error('Error loading EPUB:', e);

            // ✅ اگر خطا رخ داد، مطمئن شو لودینگ از روی صفحه برداشته میشه
            loadingOverlay.style.display = 'none';

            loadingOverlay.innerHTML = `
                <div class="loading-card">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>خطا در بارگذاری کتاب</h3>
                    <p>در بارگذاری کتاب مشکلی پیش آمد</p>
                    <button class="primary-btn" onclick="location.reload()">
                        <i class="fas fa-redo"></i> تلاش مجدد
                    </button>
                </div>`;
            loadingOverlay.style.display = 'flex';
        }
    },

    extractBookMetadata: async (file) => {
        // ⚙️ سازگار با GitHub Pages (بدون تغییر ظاهر)
        const fileUrl = URL.createObjectURL(file);
        const book = ePub(fileUrl);
        await book.opened;

        let coverData = null;
        try {
            coverData = await book.coverUrl();
        } catch (err) {
            console.warn('No cover found for book:', file.name);
        }

        URL.revokeObjectURL(fileUrl);

        return {
            id: file.name + file.size + file.lastModified,
            title: file.name.replace('.epub', ''),
            author: 'ناشناس',
            cover: coverData,
            epubFile: file,
        };
    }
};

// ✅ در دسترس برای سایر فایل‌ها (مثل main.js)
window.EpubManager = EpubManager;
