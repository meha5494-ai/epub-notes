const bookContainer = document.getElementById('book-container');
const loadingOverlay = document.getElementById('loading-overlay');

let currentBook = null;
let currentRendition = null;

const EpubManager = {
    loadEpub: async (id, file, title) => {
        loadingOverlay.style.display = 'flex';
        bookContainer.innerHTML = '';
        
        try {
            // ایجاد یک div برای محتوای کتاب
            const contentDiv = document.createElement('div');
            contentDiv.style.width = '100%';
            contentDiv.style.height = '100%';
            contentDiv.style.minHeight = '500px';
            bookContainer.appendChild(contentDiv);
            
            currentBook = ePub(file);
            
            // اطمینان از اینکه کتاب به درستی باز شده
            await currentBook.ready;
            
            currentRendition = currentBook.renderTo(contentDiv, {
                width: '100%',
                height: '100%',
                method: 'continuous',
                flow: 'scrolled',
                manager: 'continuous'
            });
            
            // اضافه کردن رویداد برای اطمینان از بارگذاری کامل
            currentRendition.on('rendered', (section) => {
                console.log('Section rendered:', section);
                // پنهان کردن لودینگ بعد از رندر اولین بخش
                if (loadingOverlay.style.display === 'flex') {
                    setTimeout(() => {
                        loadingOverlay.style.display = 'none';
                    }, 500);
                }
            });
            
            currentRendition.on('relocated', (location) => {
                console.log('Book relocated to:', location);
            });
            
            await currentRendition.display();
            
            // تنظیم مجدد اندازه پس از نمایش
            setTimeout(() => {
                currentRendition.resize();
                window.dispatchEvent(new Event('resize'));
            }, 200);
            
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
