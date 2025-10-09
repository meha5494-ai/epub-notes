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
                height: 100%;
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

    // ✅ تبدیل فایل به Base64 و ذخیره پایدار
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
            dataUrl: bookDataUrl // ذخیره نسخه base64 فایل
        };
    },

    updateProgress: (percent) => {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `${Math.round(percent)}%`;
    },

    updatePageInfo: (current, total) => {
        const pageInfo = document.getElementById('page-info');
        const pageInfoNav = document.getElementById('page-info-nav');
        
        if (pageInfo) pageInfo.textContent = `صفحه ${current} از ${total}`;
        if (pageInfoNav) pageInfoNav.textContent = `صفحه ${current} از ${total}`;
    },

    showMindmap: async () => {
        if (!currentBook) return;
        try {
            const toc = await currentBook.loaded.spine.getToc();
            const mindmapContent = document.getElementById('mindmap-content');
            const mindmapData = {
                name: "کتاب",
                children: toc.map(item => ({
                    name: item.label,
                    children: item.subitems ? item.subitems.map(sub => ({
                        name: sub.label
                    })) : []
                }))
            };
            const width = 300;
            const height = 400;
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
            svg.selectAll(".link")
                .data(root.links())
                .enter()
                .append("path")
                .attr("class", "link")
                .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y));
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

    prev: () => { if (currentRendition) currentRendition.prev(); },
    next: () => { if (currentRendition) currentRendition.next(); },
};

window.EpubManager = EpubManager;


// ---------------------------
//     مدیریت رابط کاربری
// ---------------------------

document.addEventListener('DOMContentLoaded', function() {
    const bookGrid = document.getElementById('book-grid');
    const fileInput = document.getElementById('epub-file-input');
    const uploadBtn = document.getElementById('upload-button');
    const backBtn = document.getElementById('back-button');
    const readerView = document.getElementById('reader-view');
    const libraryView = document.getElementById('library-view');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const continuousViewBtn = document.getElementById('continuous-view-btn');
    const pagedViewBtn = document.getElementById('paged-view-btn');
    const mindmapBtn = document.getElementById('mindmap-btn');
    const closeMindmapBtn = document.getElementById('close-mindmap');
    const themeToggle = document.getElementById('theme-toggle');
    
    let books = JSON.parse(localStorage.getItem('epubBooks')) || [];

    if (backBtn) backBtn.addEventListener('click', () => {
        readerView.classList.remove('active');
        libraryView.classList.add('active');
    });

    if (prevPageBtn) prevPageBtn.addEventListener('click', () => window.EpubManager.prev());
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => window.EpubManager.next());

    if (mindmapBtn) mindmapBtn.addEventListener('click', () => {
        window.EpubManager.showMindmap();
        document.getElementById('mindmap-panel').classList.add('visible');
    });

    if (closeMindmapBtn) closeMindmapBtn.addEventListener('click', () => {
        document.getElementById('mindmap-panel').classList.remove('visible');
    });

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        const bookData = await window.EpubManager.extractBookMetadata(file);
        books.push(bookData);
        localStorage.setItem('epubBooks', JSON.stringify(books));
        renderLibrary();
    });

    async function openBook(book) {
        console.log('Opening book:', book.title);
        libraryView.classList.remove('active');
        readerView.classList.add('active');
        document.getElementById('reader-title').textContent = book.title;

        let epubSource;
        if (book.epubFile) {
            epubSource = book.epubFile;
        } else if (book.dataUrl) {
            const res = await fetch(book.dataUrl);
            const blob = await res.blob();
            epubSource = blob;
        }

        try {
            await window.EpubManager.loadEpub(book.id, epubSource, book.title);
        } catch (error) {
            console.error('Error opening book:', error);
        }
    }

    function renderLibrary() {
        bookGrid.innerHTML = '';
        if (books.length === 0) {
            bookGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-book"></i>
                    </div>
                    <h3>کتابخانه شما خالی است</h3>
                    <p>برای شروع، یک کتاب EPUB اضافه کنید</p>
                    <button class="secondary-btn" onclick="document.getElementById('upload-button').click()">
                        <i class="fas fa-upload"></i> افزودن کتاب
                    </button>
                </div>`;
            return;
        }
        
        books.forEach((book, index) => {
            const div = document.createElement('div');
            div.className = 'book-card';
            
            if (book.cover) {
                const img = document.createElement('img');
                img.src = book.cover;
                img.alt = book.title;
                div.appendChild(img);
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'book-placeholder';
                placeholder.innerHTML = '<i class="fas fa-book-open"></i>';
                div.appendChild(placeholder);
            }
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'book-title';
            titleDiv.textContent = book.title;
            div.appendChild(titleDiv);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-book-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm('آیا از حذف این کتاب مطمئن هستید؟')) {
                    books.splice(index, 1);
                    localStorage.setItem('epubBooks', JSON.stringify(books));
                    renderLibrary();
                }
            };
            div.appendChild(deleteBtn);
            
            div.onclick = () => openBook(book);
            bookGrid.appendChild(div);
        });
    }

    renderLibrary();

    // تم تاریک
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('dark')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        const icon = themeToggle.querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
});
