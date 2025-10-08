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

    let books = [];

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        const bookData = await window.EpubManager.extractBookMetadata(file);
        books.push(bookData);
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
        libraryView.classList.remove('active');
        readerView.classList.add('active');
        document.getElementById('reader-title').textContent = book.title;
        
        // تاخیر بیشتر برای اطمینان از نمایش کامل view
        setTimeout(async () => {
            await window.EpubManager.loadEpub(book.id, book.file, book.title);
        }, 500);
        
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
    });

    renderLibrary();
});
