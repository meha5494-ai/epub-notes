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

    const continuousViewBtn = document.getElementById('continuous-view-btn');
    const pagedViewBtn = document.getElementById('paged-view-btn');
    const mindmapBtn = document.getElementById('mindmap-btn');
    const closeMindmapBtn = document.getElementById('close-mindmap');

    let books = JSON.parse(localStorage.getItem('epubBooks')) || [];

    // دکمه بازگشت
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            readerView.classList.remove('active');
            libraryView.classList.add('active');
            sessionStorage.removeItem('currentBookId');
        });
    }

    // دکمه مایندمپ
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

    // دکمه‌های نمایش
    if (continuousViewBtn) {
        continuousViewBtn.addEventListener('click', function() {
            window.EpubManager.setViewMode('continuous');
            continuousViewBtn.classList.add('active');
            pagedViewBtn.classList.remove('active');
            localStorage.setItem('readingMode','continuous');
        });
    }
    if (pagedViewBtn) {
        pagedViewBtn.addEventListener('click', function() {
            window.EpubManager.setViewMode('paged');
            pagedViewBtn.classList.add('active');
            continuousViewBtn.classList.remove('active');
            localStorage.setItem('readingMode','paged');
        });
    }

    // آپلود کتاب
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        const bookData = await window.EpubManager.extractBookMetadata(file);
        books.push(bookData);
        localStorage.setItem('epubBooks', JSON.stringify(books));
        renderLibrary();
    });

    function renderLibrary() {
        bookGrid.innerHTML = '';
        if (books.length === 0) {
            bookGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-book"></i></div>
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
            deleteBtn.title = 'حذف کتاب';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm('آیا از حذف این کتاب مطمئن هستید؟')) {
                    books.splice(index,1);
                    localStorage.setItem('epubBooks',JSON.stringify(books));
                    renderLibrary();
                }
            };
            div.appendChild(deleteBtn);

            div.onclick = () => openBook(book);
            bookGrid.appendChild(div);
        });
    }

    async function openBook(book) {
        libraryView.classList.remove('active');
        readerView.classList.add('active');
        document.getElementById('reader-title').textContent = book.title;

        continuousViewBtn.classList.add('active');
        pagedViewBtn.classList.remove('active');

        // ذخیره کتاب فعلی در sessionStorage برای refresh
        sessionStorage.setItem('currentBookId', book.id);
        sessionStorage.setItem('currentBookData', JSON.stringify(book));

        try {
            const rendition = await window.EpubManager.loadEpub(book.id, book.epubFile, book.title);

            // اعمال تنظیمات شخصی‌سازی
            const fontSize = localStorage.getItem('fontSize') || '16px';
            const fontFamily = localStorage.getItem('fontFamily') || 'Vazirmatn, sans-serif';
            const pageColor = localStorage.getItem('pageColor') || 'white';
            const lineHeight = 1.8;

            rendition.on('rendered', (section) => {
                const iframe = document.querySelector('#epub-content iframe');
                if (iframe) {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc && iframeDoc.body) {
                        iframeDoc.body.style.fontSize = fontSize;
                        iframeDoc.body.style.fontFamily = fontFamily;
                        iframeDoc.body.style.background = pageColor==='light'?'#fff':pageColor==='sepia'?'#f5e6d3':'#1e293b';
                        iframeDoc.body.style.color = pageColor==='dark'?'#fff':'#1e293b';
                        iframeDoc.body.style.lineHeight = lineHeight;
                        iframeDoc.body.style.direction = 'rtl';
                        iframeDoc.body.style.padding = '20px';
                    }
                }
            });

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
        notes.forEach((note,index)=>{
            const div=document.createElement('div');
            div.className='note-item';
            div.innerHTML=`<div class="note-content">${note}</div>
                           <button class="delete-note" data-index="${index}">
                           <i class="fas fa-trash"></i>
                           </button>`;
            notesList.appendChild(div);
        });
        document.querySelectorAll('.delete-note').forEach(btn=>{
            btn.addEventListener('click',(e)=>{
                const index=parseInt(e.currentTarget.dataset.index);
                window.NotesManager.delete(index);
                renderNotes();
            });
        });
    }

    toggleNotesBtn.addEventListener('click',()=>{notesSheet.classList.toggle('visible'); renderNotes();});
    closeNotesBtn.addEventListener('click',()=>notesSheet.classList.remove('visible'));
    addNoteBtn.addEventListener('click',()=>{addNotePopover.classList.add('visible'); noteText.focus();});
    cancelNoteBtn.addEventListener('click',()=>{addNotePopover.classList.remove('visible'); noteText.value='';});
    saveNoteBtn.addEventListener('click',()=>{
        const note=noteText.value.trim();
        if(note){window.NotesManager.add(note); renderNotes(); addNotePopover.classList.remove('visible'); noteText.value='';}
    });

    themeToggle.addEventListener('click',()=>{
        document.body.classList.toggle('dark');
        const icon=themeToggle.querySelector('i');
        if(document.body.classList.contains('dark')){ icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
        else { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
        localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light');
    });

    if(localStorage.getItem('theme')==='dark'){
        document.body.classList.add('dark');
        const icon=themeToggle.querySelector('i');
        icon.classList.remove('fa-moon'); icon.classList.add('fa-sun');
    }

    renderLibrary();

    // باز کردن کتاب بعد از رفرش اگر موجود باشد
    const lastBook = sessionStorage.getItem('currentBookData');
    if(lastBook) openBook(JSON.parse(lastBook));
});

// یادداشت‌ها
window.NotesManager={
    notes:[],
    add(note){if(note && note.trim()!==""){this.notes.push(note); this.saveToStorage();}},
    getAll(){return this.notes;},
    delete(index){if(index>=0 && index<this.notes.length){this.notes.splice(index,1); this.saveToStorage();}},
    clear(){this.notes=[]; this.saveToStorage();},
    saveToStorage(){localStorage.setItem('epubNotes',JSON.stringify(this.notes));},
    loadFromStorage(){const saved=localStorage.getItem('epubNotes'); this.notes=saved?JSON.parse(saved):[];}
};

window.addEventListener('DOMContentLoaded',()=>{window.NotesManager.loadFromStorage();});
