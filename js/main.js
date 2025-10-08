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
    
    // دکمه‌های ناوبری صفحات
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');

    // بارگذاری کتاب‌ها از localStorage
    let books = JSON.parse(localStorage.getItem('epubBooks')) || [];

    // اضافه کردن رویداد به دکمه بازگشت
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            console.log('Back button clicked');
            readerView.classList.remove('active');
            libraryView.classList.add('active');
        });
        console.log('Back button event listener added successfully');
    } else {
        console.error('Back button element not found');
    }

    // اضافه کردن رویداد به دکمه‌های ناوبری
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            console.log('Previous page button clicked');
            window.EpubManager.prev();
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            console.log('Next page button clicked');
            window.EpubManager.next();
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
        
        books.forEach(book => {
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
            
            div.onclick = () => openBook(book);
            bookGrid.appendChild(div);
        });
    }

    async function openBook(book) {
        console.log('Opening book:', book.title);
        libraryView.classList.remove('active');
        readerView.classList.add('active');
        document.getElementById('reader-title').textContent = book.title;
        
        // بارگذاری کتاب
        try {
            console.log('Loading book...');
            await window.EpubManager.loadEpub(book.id, book.file, book.title);
            console.log('Book loaded successfully');
        } catch (error) {
            console.error('Error opening book:', error);
            // پیام خطا در خود تابع loadEpub نمایش داده می‌شود
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
        
        // ذخیره تنظیمات تم در localStorage
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
