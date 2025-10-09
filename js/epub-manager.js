const bookContainer = document.getElementById('book-container');

let currentBook = null;
let currentRendition = null;
let currentBookId = null;

const EpubManager = {
    loadEpub: async (id, file, title) => {
        bookContainer.innerHTML = '';
        currentBookId = id;

        try {
            const contentDiv = document.createElement('div');
            contentDiv.id = 'epub-content';
            contentDiv.style.cssText = `
                width: 100%;
                height: 100%;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
            `;
            bookContainer.appendChild(contentDiv);

            currentBook = ePub(file);

            // اینجا renderTo با flow: "paginated" یا "scrolled-doc"
            currentRendition = currentBook.renderTo("epub-content", {
                width: "100%",
                height: "100%",
                flow: "scrolled-doc",
                manager: "continuous",
            });

            // اعمال CSS بعد از لود واقعی محتوا
            currentRendition.hooks.content.register((contents) => {
                const doc = contents.document;
                if (!doc) return;
                doc.documentElement.style.overflow = 'hidden';
                doc.body.style.direction = 'rtl';
                doc.body.style.fontFamily = 'Vazirmatn, sans-serif';
                doc.body.style.lineHeight = '1.8';
                doc.body.style.fontSize = '16px';
                doc.body.style.color = '#1e293b';
                doc.body.style.padding = '20px';
                doc.body.style.overflow = 'auto';
            });

            // نمایش آخرین موقعیت مطالعه
            const lastLocation = localStorage.getItem(`book_progress_${id}`);
            if (lastLocation) {
                await currentRendition.display(lastLocation);
            } else {
                await currentRendition.display();
            }

            // ذخیره موقعیت مطالعه
            currentRendition.on("relocated", (location) => {
                if (location && location.start && location.start.cfi) {
                    localStorage.setItem(`book_progress_${currentBookId}`, location.start.cfi);
                }
            });

            // اطمینان از نمایش بعد از resize
            window.addEventListener('resize', async () => {
                if (currentRendition) {
                    const loc = localStorage.getItem(`book_progress_${currentBookId}`);
                    if (loc) await currentRendition.display(loc);
                }
            });

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

    prev: () => { if (currentRendition) currentRendition.prev(); },
    next: () => { if (currentRendition) currentRendition.next(); },
};

window.EpubManager = EpubManager;
