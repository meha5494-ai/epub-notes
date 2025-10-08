document.addEventListener('DOMContentLoaded', function() {
    const bookGrid = document.getElementById('book-grid');
    const fileInput = document.getElementById('epub-file-input');
    const uploadBtn = document.getElementById('upload-button');
    const themeToggle = document.getElementById('theme-toggle');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsBtnMobile = document.getElementById('settings-btn-mobile');
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
    
    // دکمه‌های نمایش
    const continuousViewBtn = document.getElementById('continuous-view-btn');
    const pagedViewBtn = document.getElementById('paged-view-btn');
    const mindmapBtn = document.getElementById('mindmap-btn');
    const closeMindmapBtn = document.getElementById('close-mindmap');
    const settingsSheet = document.getElementById('settings-sheet');
    const closeSettingsBtn = document.getElementById('close-settings');
    
    // بارگذاری کتاب‌ها از localStorage
    let books = JSON.parse(localStorage.getItem('epubBooks')) || [];

    // اضافه کردن رویداد به دکمه بازگشت
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            readerView.classList.remove('active');
            libraryView.classList.add('active');
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

    // اضافه کردن رویداد به دکمه‌های تنظیمات
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            settingsSheet.classList.toggle('visible');
            loadSettings();
        });
    }

    if (settingsBtnMobile) {
        settingsBtnMobile.addEventListener('click', () => {
            settingsSheet.classList.toggle('visible');
            loadSettings();
        });
    }

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsSheet.classList.remove('visible');
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

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        const bookData = await window.EpubManager.extractBookMetadata(file);
        books.push(bookData);
        
        // ذخیره کتاب‌ها در localStorage
        localStorage.setItem('epubBooks', JSON.stringify(books));
        
        renderLibrary();
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
            
            // دکمه حذف کتاب با ظاهر بهتر
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-book-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'حذف کتاب';
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
        
        // بارگذاری کتاب با فایل صحیح
        try {
            console.log('Loading book...');
            await window.EpubManager.loadEpub(book.id, book.epubFile, book.title);
            console.log('Book loaded successfully');
        } catch (error) {
            console.error('Error opening book:', error);
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

    // تابع بارگذاری تنظیمات
    function loadSettings() {
        const fontSize = localStorage.getItem('fontSize') || 'medium';
        const pageColor = localStorage.getItem('pageColor') || 'light';
        const fontFamily = localStorage.getItem('fontFamily') || 'vazirmatn';
        const readingMode = localStorage.getItem('readingMode') || 'continuous';
        
        // به‌روزرسانی حالت فعال دکمه‌ها
        document.querySelectorAll('.setting-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.setting === 'font-size' && btn.dataset.value === fontSize) {
                btn.classList.add('active');
            }
            if (btn.dataset.setting === 'page-color' && btn.dataset.value === pageColor) {
                btn.classList.add('active');
            }
            if (btn.dataset.setting === 'font-family' && btn.dataset.value === fontFamily) {
                btn.classList.add('active');
            }
            if (btn.dataset.setting === 'reading-mode' && btn.dataset.value === readingMode) {
                btn.classList.add('active');
            }
        });
        
        // اعمال تنظیمات
        applySettings();
    }

    // تابع اعمال تنظیمات
    function applySettings() {
        const fontSize = localStorage.getItem('fontSize') || 'medium';
        const pageColor = localStorage.getItem('pageColor') || 'light';
        const fontFamily = localStorage.getItem('fontFamily') || 'vazirmatn';
        const readingMode = localStorage.getItem('readingMode') || 'continuous';
        
        // اعمال اندازه فونت
        document.documentElement.style.setProperty('--font-size', getFontSizeValue(fontSize));
        
        // اعمال رنگ صفحه
        document.body.classList.remove('light', 'sepia', 'dark');
        document.body.classList.add(pageColor);
        
        // اعمال فونت
        document.body.style.fontFamily = getFontFamilyValue(fontFamily);
        
        // اعامل حالت خواندن
        if (continuousViewBtn && pagedViewBtn) {
            if (readingMode === 'continuous') {
                continuousViewBtn.classList.add('active');
                pagedViewBtn.classList.remove('active');
            } else {
                pagedViewBtn.classList.add('active');
                continuousViewBtn.classList.remove('active');
            }
        }
    }

    function getFontSizeValue(size) {
        switch(size) {
            case 'small': return '14px';
            case 'medium': return '16px';
            case 'large': return '18px';
            default: return '16px';
        }
    }

    function getFontFamilyValue(family) {
        switch(family) {
            case 'vazirmatn': return 'Vazirmatn, sans-serif';
            case 'yekan': return 'Yekan, sans-serif';
            case 'samim': return 'Samim, sans-serif';
            default: return 'Vazirmatn, sans-serif';
        }
    }

    // رویدادهای تغییر تنظیمات
    document.querySelectorAll('.setting-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const setting = this.dataset.setting;
            const value = this.dataset.value;
            
            // ذخیره در localStorage
            localStorage.setItem(setting, value);
            
            // به‌روزرسانی حالت فعال
            document.querySelectorAll(`.setting-btn[data-setting="${setting}"]`).forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
            
            // اعمال تنظیمات
            applySettings();
        });
    });

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
