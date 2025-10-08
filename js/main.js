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

    // بارگذاری کتاب‌ها از localStorage
    let books = JSON.parse(localStorage.getItem('epubBooks')) || [];

    // ذخیره کتاب‌ها در localStorage
    function saveBooks() {
        localStorage.setItem('epubBooks', JSON.stringify(books));
    }

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            // استخراج متادیتای کتاب
            const metadata = await window.EpubManager.extractBookMetadata(file);
            
            // افزودن کتاب به آرایه
            books.push(metadata);
            
            // ذخیره در localStorage
            saveBooks();
            
            // به‌روزرسانی نمایش کتابخانه
            renderLibrary();
        } catch (error) {
            console.error('Error adding book:', error);
            alert('خطا در افزودن کتاب. لطفاً دوباره تلاش کنید.');
        }
    });

    function renderLibrary() {
        bookGrid.innerHTML = '';
        if (books.length === 0) {
            bookGrid.innerHTML = `
                <div class="empty-state">
                    <p>کتابخانه شما خالی است 📚</p>
                    <button class="primary-button" onclick="document.getElementById('upload-button').click()">
                        افزودن کتاب
                    </button>
                </div>`;
            return;
        }
        
        books.forEach(book => {
            const div = document.createElement('div');
            div.className = 'book-card';
            div.innerHTML = `
                <div class="book-cover">
                    ${book.cover ? `<img src="${book.cover}" alt="${book.title}">` : '<div class="no-cover">📖</div>'}
                </div>
                <h3>${book.title}</h3>
            `;
            div.onclick = () => openBook(book);
            bookGrid.appendChild(div);
        });
    }

    function openBook(book) {
        libraryView.classList.remove('active');
        readerView.classList.add('active');
        document.getElementById('reader-title').textContent = book.title;
        window.EpubManager.loadEpub(book.id, book.epubFile, book.title);
        window.NotesManager.clear();
        renderNotes();
    }

    function renderNotes() {
        const notesList = document.getElementById('notes-list');
        const noNotesMsg = document.getElementById('no-notes-message');
        notesList.innerHTML = '';
        const notes = window.NotesManager.getAll();
        
        if (notes.length === 0) {
            noNotesMsg.style.display = 'block';
            return;
        }
        
        noNotesMsg.style.display = 'none';
        notes.forEach((note, index) => {
            const div = document.createElement('div');
            div.className = 'note-item';
            div.innerHTML = `
                <div class="note-content">${note}</div>
                <button class="delete-note" data-index="${index}">حذف</button>
            `;
            notesList.appendChild(div);
        });
        
        // افزودن رویداد حذف یادداشت
        document.querySelectorAll('.delete-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                window.NotesManager.delete(index);
                renderNotes();
            });
        });
    }

    backBtn.addEventListener('click', () => {
        readerView.classList.remove('active');
        libraryView.classList.add('active');
    });

    toggleNotesBtn.addEventListener('click', () => {
        notesSheet.classList.toggle('visible');
        renderNotes();
    });

    closeNotesBtn.addEventListener('click', () => {
        notesSheet.classList.remove('visible');
    });

    // دکمه افزودن یادداشت جدید
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
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });

    // بارگذاری تم ذخیره شده
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
    }

    // نمایش اولیه کتابخانه
    renderLibrary();
});
