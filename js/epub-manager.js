const bookContainer = document.getElementById('book-container');

let currentBook = null;
let currentRendition = null;

const EpubManager = {
    loadEpub: async (id, file, title) => {
        bookContainer.innerHTML = '';
        
        try {
            // ایجاد یک div با استایل‌های مشخص برای محتوای کتاب
            const contentDiv = document.createElement('div');
            contentDiv.style.cssText = `
                width: 100%;
                height: 100%;
                min-height: 600px;
                background: white;
                border-radius: 8px;
                overflow: auto;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            `;
            bookContainer.appendChild(contentDiv);
            
            currentBook = ePub(file);
            
            // صبر برای آماده شدن کتاب
            await currentBook.ready;
            
            // رندر کتاب با روش ساده و مستقیم
            currentRendition = currentBook.renderTo(contentDiv, {
                width: "100%",
                height: "100%",
                flow: "scrolled",
                manager: "default"
            });
            
            // نمایش کتاب
            await currentRendition.display();
            
            // تنظیم مجدد اندازه بعد از نمایش
            setTimeout(() => {
                if (currentRendition) {
                    currentRendition.resize();
                    // اطمینان از اینکه محتوا قابل مشاهده است
                    const iframe = contentDiv.querySelector('iframe');
                    if (iframe) {
                        iframe.style.height = '100%';
                        iframe.style.width = '100%';
                        iframe.style.border = 'none';
                        iframe.style.overflow = 'auto';
                    }
                }
            }, 500);
            
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
                    height: 100%;
                    min-height: 600px;
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
