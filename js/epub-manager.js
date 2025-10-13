const bookContainer = document.getElementById('book-container');

let currentBook = null;
let currentRendition = null;

// کلیدهای ذخیره‌سازی در localStorage
const STORAGE_KEYS = {
    CURRENT_BOOK: 'epubReader_currentBook',
    CURRENT_LOCATION: 'epubReader_currentLocation',
    VIEW_MODE: 'epubReader_viewMode'
};

const EpubManager = {
    loadEpub: async (id, file, title) => {
        bookContainer.innerHTML = '';
        
        try {
            // ایجاد container با تنظیمات صحیح
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
            `;
            bookContainer.appendChild(contentDiv);
            
            // ایجاد کتاب با فایل صحیح
            currentBook = ePub(file);
            
            // تنظیمات رندر بهینه
            currentRendition = currentBook.renderTo("epub-content", {
                width: "100%",
                height: "100%",
                flow: "scrolled-doc",
                manager: "continuous"
            });
            
            // ذخیره اطلاعات کتاب فعلی در localStorage
            const bookInfo = { id, title };
            localStorage.setItem(STORAGE_KEYS.CURRENT_BOOK, JSON.stringify(bookInfo));
            
            // تبدیل فایل به Base64 و ذخیره در localStorage
            if (typeof file === 'object' && file instanceof File) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const bookData = {
                            id,
                            title,
                            fileName: file.name,
                            fileType: file.type,
                            content: reader.result // Base64 string
                        };
                        let books = JSON.parse(localStorage.getItem('epubBooks')) || [];
                        books = books.filter(book => book.id !== id); // حذف کتاب قبلی با همین id
                        books.push(bookData);
                        localStorage.setItem('epubBooks', JSON.stringify(books));
                    } catch (e) {
                        console.error('Error saving book to localStorage:', e);
                    }
                };
                reader.onerror = () => {
                    console.error('Error reading file:', reader.error);
                };
                reader.readAsDataURL(file);
            } else if (typeof file === 'string') {
                // اگر فایل یک URL باشد، آن را به Blob تبدیل کرده و ذخیره کنیم
                try {
                    const response = await fetch(file);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const bookData = {
                                id,
                                title,
                                fileName: `${id}.epub`,
                                fileType: blob.type,
                                content: reader.result // Base64 string
                            };
                            let books = JSON.parse(localStorage.getItem('epubBooks')) || [];
                            books = books.filter(book => book.id !== id); // حذف کتاب قبلی با همین id
                            books.push(bookData);
                            localStorage.setItem('epubBooks', JSON.stringify(books));
                        } catch (e) {
                            console.error('Error saving URL-based book to localStorage:', e);
                        }
                    };
                    reader.onerror = () => {
                        console.error('Error reading URL-based file:', reader.error);
                    };
                    reader.readAsDataURL(blob);
                } catch (e) {
                    console.error('Error fetching file from URL:', e);
                }
            }
            
            await currentRendition.display();
            
            // بازیابی مکان قبلی اگر وجود داشته باشد
            const savedLocation = localStorage.getItem(STORAGE_KEYS.CURRENT_LOCATION);
            if (savedLocation) {
                try {
                    const location = JSON.parse(savedLocation);
                    if (location.cfi) {
                        await currentRendition.display(location.cfi);
                    }
                } catch (e) {
                    console.warn('Error restoring location:', e);
                }
            }
            
            // تنظیم رویداد برای ذخیره مکان فعلی
            currentRendition.on('relocated', (location) => {
                localStorage.setItem(STORAGE_KEYS.CURRENT_LOCATION, JSON.stringify({
                    cfi: location.start.cfi,
                    href: location.start.href
                }));
            });
            
            // تنظیمات استایل iframe با تأخیر بیشتر
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
                        iframeDoc.body.style.padding = '20px';
                        
                        // پنهان کردن اسکرول‌بارهای اضافی
                        iframeDoc.documentElement.style.overflow = 'hidden';
                        iframeDoc.body.style.overflow = 'auto';
                    }
                }
            }, 1000);
            
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
        const pageInfoNav = document.getElementById('page-info-nav');
        
        if (pageInfo) {
            pageInfo.textContent = `صفحه ${current} از ${total}`;
        }
        if (pageInfoNav) {
            pageInfoNav.textContent = `صفحه ${current} از ${total}`;
        }
    },

    showMindmap: async () => {
        if (!currentBook) return;
        
        try {
            const toc = await currentBook.loaded.spine.getToc();
            const mindmapContent = document.getElementById('mindmap-content');
            
            // ساختار داده برای مایند مپ
            const mindmapData = {
                name: "کتاب",
                children: toc.map(item => ({
                    name: item.label,
                    children: item.subitems ? item.subitems.map(sub => ({
                        name: sub.label
                    })) : []
                }))
            };
            
            // ایجاد SVG برای مایند مپ
            const width = 300;
            const height = 400;
            
            // پاک کردن محتوای قبلی
            mindmapContent.innerHTML = '';
            
            const svg = d3.select("#mindmap-content")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${width/2}, 20)`);
            
            const root = d3.hierarchy(mindmapData);
            const treeLayout = d3.tree().size([width - 100, height - 100]);
            treeLayout(root);
            
            // رسم خطوط اتصال
            svg.selectAll(".link")
                .data(root.links())
                .enter()
                .append("path")
                .attr("class", "link")
                .attr("d", d3.linkVertical()
                    .x(d => d.x)
                    .y(d => d.y));
            
            //绘制节点
            const node = svg.selectAll(".node")
                .data(root.descendants())
                .enter()
                .append("g")
                .attr("class", "node")
                .attr("transform", d => `translate(${d.x},${d.y})`);
            
            node.append("circle")
                .attr("r", 6)
                .style("fill", d => d.children ? "#6366f1" : "#ec4899");
            
            node.append("text")
                .attr("dy", "0.31em")
                .attr("x", d => d.children ? -10 : 10)
                .style("text-anchor", d => d.children ? "end" : "start")
                .text(d => d.data.name)
                .style("font-size", "12px");
            
        } catch (error) {
            console.error('Error generating mindmap:', error);
            document.getElementById('mindmap-content').innerHTML = `
                <div class="mindmap-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>در ایجاد مایند مپ خطایی رخ داد</p>
                </div>
            `;
        }
    },

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
    },

    // تابع اصلاح‌شده برای بازیابی کتاب پس از رفرش صفحه
    restoreBook: async () => {
        try {
           
