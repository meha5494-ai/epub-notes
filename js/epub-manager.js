const bookContainer = document.getElementById('book-container');

let currentBook = null;
let currentRendition = null;
let currentBookId = null;

const EpubManager = {
    // 📚 بارگذاری و نمایش EPUB
    loadEpub: async (id, file, title) => {
        bookContainer.innerHTML = '';
        currentBookId = id;

        try {
            // ایجاد ناحیه نمایش کتاب
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
                position: relative;
            `;
            bookContainer.appendChild(contentDiv);

            // ✅ دکمه بوکمارک بالا سمت راست
            const bookmarkBtn = document.createElement('button');
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
            bookmarkBtn.title = 'افزودن به نشانک‌ها';
            bookmarkBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 100;
                background: #facc15;
                color: #1e293b;
                border: none;
                border-radius: 8px;
                padding: 8px 12px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s ease;
            `;
            bookmarkBtn.addEventListener('mouseenter', () => bookmarkBtn.style.background = '#eab308');
            bookmarkBtn.addEventListener('mouseleave', () => bookmarkBtn.style.background = '#facc15');
            bookmarkBtn.addEventListener('click', () => EpubManager.addBookmark());
            contentDiv.appendChild(bookmarkBtn);

            // ایجاد کتاب EPUB
            currentBook = ePub(file);
            currentRendition = currentBook.renderTo("epub-content", {
                width: "100%",
                height: "100%",
                flow: "scrolled-doc",
                manager: "continuous"
            });

            // ✅ بررسی موقعیت آخر مطالعه
            const lastLocation = localStorage.getItem(`book_progress_${id}`);
            if (lastLocation) {
                await currentRendition.display(lastLocation);
            } else {
                await currentRendition.display();
            }

            // ✅ ذخیره موقعیت مطالعه هنگام تغییر صفحه
            currentRendition.on("relocated", (location) => {
                if (location && location.start && location.start.cfi) {
                    localStorage.setItem(`book_progress_${id}`, location.start.cfi);
                }
            });

            // ✅ استایل‌دهی به iframe داخلی EPUB
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

    // ✅ افزودن نشانک جدید
    addBookmark: async () => {
        if (!currentRendition || !currentBookId) return;
        const loc = currentRendition.currentLocation();
        if (!loc || !loc.start || !loc.start.cfi) return;

        const cfi = loc.start.cfi;
        const bookmarksKey = `bookmarks_${currentBookId}`;
        const bookmarks = JSON.parse(localStorage.getItem(bookmarksKey) || '[]');

        const newBookmark = {
            cfi,
            label: `صفحه ${bookmarks.length + 1}`,
            date: new Date().toLocaleString('fa-IR')
        };

        bookmarks.push(newBookmark);
        localStorage.setItem(bookmarksKey, JSON.stringify(bookmarks));

        // افکت ساده برای دکمه
        const btn = document.querySelector('#epub-content button');
        btn.style.background = '#4ade80';
        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            btn.style.background = '#facc15';
            btn.innerHTML = '<i class="fas fa-bookmark"></i>';
        }, 1000);
    },

    // ✅ نمایش لیست بوکمارک‌ها (در آینده می‌تونی در منو نشون بدی)
    getBookmarks: () => {
        if (!currentBookId) return [];
        return JSON.parse(localStorage.getItem(`bookmarks_${currentBookId}`) || '[]');
    },

    // ✅ رفتن به نشانک خاص
    goToBookmark: async (cfi) => {
        if (currentRendition) {
            await currentRendition.display(cfi);
        }
    },

    // 📄 استخراج متادیتا و ذخیره فایل به Base64
    extractBookMetadata: async (file) => {
        const toBase64 = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const bookDataUrl = await toBase64(file);
        const bookId = file.name + file.size + file.lastModified;
        const book = ePub(file);
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
            dataUrl: bookDataUrl
        };
    },

    prev: () => { if (currentRendition) currentRendition.prev(); },
    next: () => { if (currentRendition) currentRendition.next(); },
};

window.EpubManager = EpubManager;
