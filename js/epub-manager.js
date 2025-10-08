const bookContainer = document.getElementById('book-container');

let currentBook = null;
let currentRendition = null;

const EpubManager = {
    loadEpub: async (id, file, title) => {
        bookContainer.innerHTML = '';
        
        try {
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
            
            currentRendition = currentBook.renderTo("epub-content", {
                width: "100%",
                height: "100%",
                flow: "scrolled-doc",
                manager: "continuous"
            });
            
            await currentRendition.display();
            
            // افزودن رویداد برای ردیابی پیشرفت
            currentRendition.on('relocated', location => {
                updateProgress(location.start / location.total * 100);
                updatePageInfo(location.start, location.total);
            });
            
            // تنظیمات استایل
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
                        iframeDoc.body.style.fontFamily = 'Vazirmatn, sans-serif';
                        iframeDoc.body.style.lineHeight = '1.8';
                        iframeDoc.body.style.fontSize = '16px';
                        iframeDoc.body.style.color = '#1e293b';
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

    // متدهای جدید برای مدیریت پیشرفت
    updateProgress: (percent) => {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        if (progressText) {
            progressText.textContent = `${Math.round(percent)}%`;
        }
    },

    updatePageInfo: (current, total) => {
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            pageInfo.textContent = `صفحه ${current} از ${total}`;
        }
    },

    // متدهای جدید برای ناوبری
    prev: () => {
        if (currentRendition) {
            currentRendition.prev();
        }
    },

    next: () => {
        if (currentRendition) {
            currentRendition.next();
        }
    },

    // متد جدید برای نمایش مایند مپ
    showMindmap: async () => {
        if (!currentBook) return;
        
        try {
            const toc = await currentBook.loaded.spine.getToc();
            const mindmapContent = document.querySelector('.mindmap-content');
            
            // ایجاد ساختار ساده مایند مپ
            mindmapContent.innerHTML = `
                <div class="mindmap-tree">
                    ${toc.map(item => `
                        <div class="mindmap-node">
                            <div class="node-content">
                                <i class="fas fa-bookmark"></i>
                                <span>${item.label}</span>
                            </div>
                            <div class="node-children">
                                ${item.subitems ? item.subitems.map(sub => `
                                    <div class="node-child">
                                        <i class="fas fa-file-alt"></i>
                                        <span>${sub.label}</span>
                                    </div>
                                `).join('') : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            // نمایش پنل مایند مپ
            document.getElementById('mindmap-panel').classList.add('visible');
        } catch (error) {
            console.error('Error generating mindmap:', error);
            document.querySelector('.mindmap-content').innerHTML = `
                <div class="mindmap-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>در ایجاد مایند مپ خطایی رخ داد</p>
                </div>
            `;
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
