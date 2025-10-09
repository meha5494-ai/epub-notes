document.addEventListener('DOMContentLoaded', function() {
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

    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const continuousViewBtn = document.getElementById('continuous-view-btn');
    const pagedViewBtn = document.getElementById('paged-view-btn');
    const mindmapBtn = document.getElementById('mindmap-btn');
    const closeMindmapBtn = document.getElementById('close-mindmap');

    // 📚 بارگذاری کتاب‌ها از localStorage
    let books = JSON.parse(localStorage.getItem('epubBooks')) || [];

    // 🔙 دکمه بازگشت به کتابخانه
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            readerView.classList.remove('active');
            libraryView.classList.add('active');
        });
    }

    // 📖 ناوبری صفحات
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => window.EpubManager.prev());
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => window.EpubManager.next());

    // 📤 آپلود کتاب جدید
    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;

        const bookData = await window.EpubManager.extractBookMetadata(file);
        books.push(bookData);
        localStorage.setItem('epubBooks', JSON.stringify(books));
        renderLibrary();
    });

    // 📚 رندر لیست کتابخانه
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

            // ❌ حذف کتاب
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

    // 📖 باز کردن کتاب
    async function openBook(book) {
        console.log('Opening book:', book.title);
        libraryView.classList.remove('active');
        readerView.classList.add('active');
        document.getElementById('reader-title').textContent = book.title;

        continuousViewBtn.classList.add('active');
        pagedViewBtn.classList.remove('active');

        try {
            console.log('Loading book...');

            // ✅ تشخیص نوع منبع (فایل یا Base64)
            let epubSource;
            if (book.epubFile) {
                epubSource = book.epubFile; // تازه آپلود شده
            } else if (book.dataUrl) {
                epubSource = book.dataUrl; // از localStorage
            } else {
                throw new Error("EPUB source not found");
            }

            await window.EpubManager.loadEpub(book.id, epubSource, book.title);
            console.log('Book loaded successfully');
        } catch (error) {
            console.error('Error opening book:', error);
            bookContainer.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>خطا در باز کردن کتاب</h3>
                    <p>مشکلی در بارگذاری کتاب پیش آمد</p>
                    <button class="retry-btn" onclick="location.reload()">
                        <i class="fas fa-redo"></i> تلاش مجدد
                    </button>
                </div>`;
        }

        window.NotesManager.clear();
        renderNotes();
    }

    // 🗒 مدیریت یادداشت‌ها
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

    // 🗒 رویدادهای یادداشت‌ها
    toggleNotesBtn.addEventListener('click', () => {
        notesSheet.classList.toggle('visible');
        renderNotes();
    });

    closeNotesBtn.addEventListener('click', () => notesSheet.classList.remove('visible'));
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

    // 🌙 تم تاریک
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

    renderLibrary();
});

// 🗒 NotesManager
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

window.addEventListener('DOMContentLoaded', () => {
    window.NotesManager.loadFromStorage();
});
