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
            
            // رسم نودها
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
        const toBase64 = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        try {
            const bookDataUrl = await toBase64(file);
            const bookId = file.name + file.size + file.lastModified;
            const book = ePub(file);
            await book.opened;
            let coverData = null;
            try {
                coverData = await book.coverUrl();
            } catch (e) {
                console.warn('No cover found:', e);
            }
            return {
                id: bookId,
                title: file.name.replace('.epub', ''),
                author: 'ناشناس',
                cover: coverData,
                content: bookDataUrl, // Store Base64 content for persistence
                fileName: file.name,
                fileType: file.type
            };
        } catch (e) {
            console.error('Error extracting metadata:', e);
            throw e;
        }
    },

    // تابع برای بازیابی کتاب پس از رفرش صفحه
    restoreBook: async () => {
        try {
            // بازیابی اطلاعات کتاب فعلی
            const savedBookInfo = localStorage.getItem(STORAGE_KEYS.CURRENT_BOOK);
            if (!savedBookInfo) {
                console.log('No current book found in localStorage');
                return false;
            }
            
            const bookInfo = JSON.parse(savedBookInfo);
            
            // پیدا کردن کتاب در کتابخانه
            const books = JSON.parse(localStorage.getItem('epubBooks')) || [];
            const bookData = books.find(book => book.id === bookInfo.id);
            
            if (!bookData || !bookData.content) {
                console.warn('Book not found in library or missing content');
                return false;
            }
            
            // تبدیل Base64 به Blob
            const response = await fetch(bookData.content);
            const blob = await response.blob();
            const file = new File([blob], bookData.fileName, { type: bookData.fileType || 'application/epub+zip' });
            
            // بارگذاری کتاب
            await EpubManager.loadEpub(bookInfo.id, file, bookInfo.title);
            
            // نمایش صفحه خواندن
            document.getElementById('library-view').classList.remove('active');
            document.getElementById('reader-view').classList.add('active');
            
            return true;
        } catch (error) {
            console.error('Error restoring book:', error);
            document.getElementById('library-view').classList.add('active');
            document.getElementById('reader-view').classList.remove('active');
            return false;
        }
    }
};

window.EpubManager = EpubManager;

// تابعی برای اجرا پس از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', async () => {
    const bookGrid = document.getElementById('book-grid');
    const fileInput = document.getElementById('epub-file-input');
    const uploadBtn = document.getElementById('upload-button');
    const themeToggle = document.getElementById('theme-toggle');
    const backBtn = document.getElementById('back-button');
    const readerView = document.getElementById('reader-view');
    const libraryView = document.getElementById('library-view');
    const toggleNotesBtn = document.getElementById('toggle-notes');
    const notesSheet = document.getElementById('notes-sheet');
    const closeNotesBtn = document.getElementById('close-notes');
    const addNotePopover = document.getElementById('add-note-popover');
    const cancelNoteBtn = document.getElementById('cancel-note');
    const saveNoteBtn = document.getElementById('save-note');
    const noteText = document.getElementById('note-text');
    const addNoteBtn = document.getElementById('add-note-btn');
    
    // دکمه‌های ناوبری صفحات
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    
    // دکمه‌های نمایش
    const continuousViewBtn = document.getElementById('continuous-view-btn');
    const pagedViewBtn = document.getElementById('paged-view-btn');
    const mindmapBtn = document.getElementById('mindmap-btn');
    const closeMindmapBtn = document.getElementById('close-mindmap');
    
    // بارگذاری کتاب‌ها از localStorage
    let books = JSON.parse(localStorage.getItem('epubBooks')) || [];

    // تلاش برای بازیابی کتاب قبلی
    const restored = await EpubManager.restoreBook();
    
    if (!restored) {
        // اگر کتابی بازیابی نشد، کتابخانه را نمایش بده
        document.getElementById('library-view').classList.add('active');
    }

    // اضافه کردن رویداد به دکمه بازگشت
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            readerView.classList.remove('active');
            libraryView.classList.add('active');
        });
    }

    // اضافه کردن رویداد به دکمه‌های ناوبری (فقط در دسکتاپ)
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            window.EpubManager.prev();
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            window.EpubManager.next();
        });
    }

    // اضافه کردن رویداد به دکمه‌های نمایش
    if (continuousViewBtn) {
        continuousViewBtn.addEventListener('click', function() {
            window.EpubManager.setViewMode('continuous');
            continuousViewBtn.classList.add('active');
            pagedViewBtn.classList.remove('active');
        });
    }

    if (pagedViewBtn) {
        pagedViewBtn.addEventListener('click', function() {
            window.EpubManager.setViewMode('paged');
            pagedViewBtn.classList.add('active');
            continuousViewBtn.classList.remove('active');
        });
    }

    // اضافه کردن رویداد به دکمه مایند مپ
    if (mindmapBtn) {
        mindmapBtn.addEventListener('click', function() {
            window.EpubManager.showMindmap();
            document.getElementById('mindmap-panel').classList.add('visible');
        });
    }

    if (closeMindmapBtn) {
        closeMindmapBtn.addEventListener('click', function() {
            document.getElementById('mindmap-panel').classList.remove('visible');
        });
    }

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const bookData = await window.EpubManager.extractBookMetadata(file);
            books.push(bookData);
            localStorage.setItem('epubBooks', JSON.stringify(books));
            renderLibrary();
        } catch (error) {
            console.error('Error uploading book:', error);
            alert('خطا در بارگذاری کتاب. لطفاً دوباره امتحان کنید.');
        }
    });

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
            
            // دکمه حذف کتاب
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

    async function openBook(book) {
        console.log('Opening book:', book.title);
        libraryView.classList.remove('active');
        readerView.classList.add('active');
        document.getElementById('reader-title').textContent = book.title;
        
        // ریست کردن حالت نمایش
        continuousViewBtn.classList.add('active');
        pagedViewBtn.classList.remove('active');
        
        try {
            console.log('Loading book...');
            let file = book.epubFile;
            if (!file && book.content) {
                // اگر فایل اصلی موجود نیست، از Base64 بازسازی کن
                const response = await fetch(book.content);
                const blob = await response.blob();
                file = new File([blob], book.fileName, { type: book.fileType || 'application/epub+zip' });
            }
            if (!file) {
                throw new Error('No EPUB file or content available');
            }
            await window.EpubManager.loadEpub(book.id, file, book.title);
            console.log('Book loaded successfully');
        } catch (error) {
            console.error('Error opening book:', error);
            bookContainer.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>خطا در بارگذاری کتاب</h3>
                    <p>متاسفانه در بارگذاری کتاب مشکلی پیش آمد: ${error.message}</p>
                    <button class="retry-btn" onclick="location.reload()">
                        <i class="fas fa-redo"></i> تلاش مجدد
                    </button>
                </div>`;
        }
        
        window.NotesManager.clear();
        renderNotes();
    }

    function renderNotes() {
        const notesList = document.getElementById('notes-list');
        const noNotesMsg = document.getElementById('no-notes-message');
        notesList.innerHTML = '';
        const notes = window.NotesManager.getAll();
        
        if (notes.length === 0) {
            noNotesMsg.style.display = 'flex';
            return;
        }
        
        noNotesMsg.style.display = 'none';
        notes.forEach((note, index) => {
            const div = document.createElement('div');
            div.className = 'note-item';
            div.innerHTML = `
                <div class="note-content">${note}</div>
                <button class="delete-note" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            notesList.appendChild(div);
        });
        
        document.querySelectorAll('.delete-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                window.NotesManager.delete(index);
                renderNotes();
            });
        });
    }

    toggleNotesBtn.addEventListener('click', () => {
        notesSheet.classList.toggle('visible');
        renderNotes();
    });

    closeNotesBtn.addEventListener('click', () => {
        notesSheet.classList.remove('visible');
    });

    addNoteBtn.addEventListener('click', () => {
        addNotePopover.classList.add('visible');
        noteText.focus();
    });

    cancelNoteBtn.addEventListener('click', () => {
        addNotePopover.classList.remove('visible');
        noteText.value = '';
    });

    saveNoteBtn.addEventListener('click', () => {
        const note = noteText.value.trim();
        if (note) {
            window.NotesManager.add(note);
            renderNotes();
            addNotePopover.classList.remove('visible');
            noteText.value = '';
        }
    });

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

    // بارگذاری تنظیمات تم از localStorage
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        const icon = themeToggle.querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }

    renderLibrary();
});

window.NotesManager = {
    notes: [],
    
    add(note) {
        if (note && note.trim() !== "") {
            this.notes.push(note);
            this.saveToStorage();
        }
    },
    
    getAll() {
        return this.notes;
    },
    
    delete(index) {
        if (index >= 0 && index < this.notes.length) {
            this.notes.splice(index, 1);
            this.saveToStorage();
        }
    },
    
    clear() {
        this.notes = [];
        this.saveToStorage();
    },
    
    saveToStorage() {
        localStorage.setItem('epubNotes', JSON.stringify(this.notes));
    },
    
    loadFromStorage() {
        const saved = localStorage.getItem('epubNotes');
        if (saved) {
            this.notes = JSON.parse(saved);
        }
    }
};

// بارگذاری یادداشت‌ها از localStorage هنگام بارگذاری صفحه
window.addEventListener('DOMContentLoaded', () => {
    window.NotesManager.loadFromStorage();
});
