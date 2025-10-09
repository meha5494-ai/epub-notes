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

    // بارگذاری کتاب‌ها از localStorage
    let books = JSON.parse(localStorage.getItem('epubBooks')) || [];

    // ---------- دکمه‌ها ----------
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            readerView.classList.remove('active');
            libraryView.classList.add('active');
        });
    }

    if (prevPageBtn) prevPageBtn.addEventListener('click', () => window.EpubManager.prev());
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => window.EpubManager.next());

    if (continuousViewBtn) {
        continuousViewBtn.addEventListener('click', () => {
            window.EpubManager.setViewMode('continuous');
            continuousViewBtn.classList.add('active');
            pagedViewBtn.classList.remove('active');
        });
    }

    if (pagedViewBtn) {
        pagedViewBtn.addEventListener('click', () => {
            window.EpubManager.setViewMode('paged');
            pagedViewBtn.classList.add('active');
            continuousViewBtn.classList.remove('active');
        });
    }

    if (mindmapBtn) {
        mindmapBtn.addEventListener('click', () => {
            window.EpubManager.showMindmap();
        });
    }

    if (closeMindmapBtn) closeMindmapBtn.addEventListener('click', () => {
        document.getElementById('mindmap-panel').classList.remove('visible');
    });

    uploadBtn.addEventListener('click', () => fileInput.click());

    // ✅ اصلاح شده: تبدیل فایل به Base64 و ذخیره
    fileInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const bookData = await window.EpubManager.extractBookMetadata(file);
            books.push(bookData);
            localStorage.setItem('epubBooks', JSON.stringify(books));
            renderLibrary();
        } catch (error) {
            console.error('Error processing book:', error);
            alert('خطا در پردازش کتاب');
        }
    });

    // ---------- رندر کتابخانه ----------
    function renderLibrary() {
        bookGrid.innerHTML = '';
        if (books.length === 0) {
            bookGrid.innerHTML = `<div class="empty-state">
                <div class="empty-icon"><i class="fas fa-book"></i></div>
                <h3>کتابخانه شما خالی است</h3>
                <p>برای شروع، یک کتاب EPUB اضافه کنید</p>
                <button class="secondary-btn" onclick="document.getElementById('upload-button').click()">
                    <i class="fas fa-upload"></i> افزودن کتاب
                </button>
            </div>`;
            return;
        }

        books.forEach((book,index)=>{
            const div = document.createElement('div');
            div.className='book-card';

            if(book.cover){
                const img=document.createElement('img');
                img.src=book.cover;
                img.alt=book.title;
                div.appendChild(img);
            } else {
                const placeholder=document.createElement('div');
                placeholder.className='book-placeholder';
                placeholder.innerHTML='<i class="fas fa-book-open"></i>';
                div.appendChild(placeholder);
            }

            const titleDiv=document.createElement('div');
            titleDiv.className='book-title';
            titleDiv.textContent=book.title;
            div.appendChild(titleDiv);

            const deleteBtn=document.createElement('button');
            deleteBtn.className='delete-book-btn';
            deleteBtn.innerHTML='<i class="fas fa-trash"></i>';
            deleteBtn.onclick=(e)=>{
                e.stopPropagation();
                if(confirm('آیا از حذف این کتاب مطمئن هستید؟')){
                    books.splice(index,1);
                    localStorage.setItem('epubBooks',JSON.stringify(books));
                    renderLibrary();
                }
            };
            div.appendChild(deleteBtn);

            div.onclick = ()=>openBook(book);
            bookGrid.appendChild(div);
        });
    }

    // ---------- باز کردن کتاب ----------
    async function openBook(book){
        libraryView.classList.remove('active');
        readerView.classList.add('active');
        document.getElementById('reader-title').textContent = book.title;

        continuousViewBtn.classList.add('active');
        pagedViewBtn.classList.remove('active');

        try {
            // ✅ اصلاح شده: استفاده از Base64 یا فایل واقعی
            if (book.dataUrl) {
                await window.EpubManager.loadEpub(book.id, book.dataUrl, book.title);
            } else if (book.epubFile) {
                await window.EpubManager.loadEpub(book.id, book.epubFile, book.title);
            }

            applySettingsToBook(); // اعمال تنظیمات فونت و رنگ و سایز
        } catch(e){
            console.error(e);
            alert('خطا در باز کردن کتاب');
        }

        window.NotesManager.setBook(book.id);
        renderNotes();
    }

    // ✅ اصلاح شده: اعمال تنظیمات به کتاب
    function applySettingsToBook(){
        if(!window.EpubManager.currentRendition) return;
        const rendition = window.EpubManager.currentRendition;

        const fontSize = localStorage.getItem('fontSize') || '16px';
        const fontFamily = localStorage.getItem('fontFamily') || 'Vazirmatn, sans-serif';
        const pageColor = localStorage.getItem('pageColor') || 'light';
        const readingMode = localStorage.getItem('readingMode') || 'continuous';

        // ثبت تم‌های سفارشی
        rendition.themes.register({
            'custom': {
                'body': {
                    'font-size': fontSize,
                    'font-family': fontFamily,
                    'direction': 'rtl',
                    'padding': '20px',
                    'line-height': '1.8'
                },
                'p, div, span': {
                    'font-size': fontSize,
                    'font-family': fontFamily,
                    'line-height': '1.8'
                }
            }
        });
        
        // انتخاب تم
        rendition.themes.select('custom');
        
        // اعمال رنگ پس‌زمینه
        rendition.themes.register({
            'light': {
                'body': {
                    'background': '#fff',
                    'color': '#1e293b'
                }
            },
            'sepia': {
                'body': {
                    'background': '#f5e6d3',
                    'color': '#1e293b'
                }
            },
            'dark': {
                'body': {
                    'background': '#1e293b',
                    'color': '#fff'
                }
            }
        });
        
        rendition.themes.select(pageColor);
        
        // تنظیم حالت نمایش
        if(readingMode === 'continuous') {
            rendition.flow('scrolled-doc');
        } else {
            rendition.flow('paginated');
        }
    }

    // ✅ اصلاح شده: مدیریت تنظیمات
    document.querySelectorAll('.setting-btn').forEach(btn=>{
        btn.addEventListener('click',function(){
            const setting=this.dataset.setting;
            const value=this.dataset.value;

            localStorage.setItem(setting,value);
            document.querySelectorAll(`.setting-btn[data-setting="${setting}"]`).forEach(b=>b.classList.remove('active'));
            this.classList.add('active');

            applySettingsToBook();
        });
    });

    // ---------- یادداشت‌ها ----------
    window.NotesManager = {
        currentBookId:null,
        notes:[],
        setBook(bookId){this.currentBookId=bookId;this.loadFromStorage();},
        add(note){if(note && note.trim()!==""){this.notes.push(note);this.saveToStorage();}},
        getAll(){return this.notes;},
        delete(index){if(index>=0&&index<this.notes.length){this.notes.splice(index,1);this.saveToStorage();}},
        clear(){this.notes=[];this.saveToStorage();},
        saveToStorage(){if(!this.currentBookId) return; localStorage.setItem(`epubNotes_${this.currentBookId}`,JSON.stringify(this.notes));},
        loadFromStorage(){if(!this.currentBookId) return; const saved=localStorage.getItem(`epubNotes_${this.currentBookId}`); this.notes=saved?JSON.parse(saved):[];}
    };

    function renderNotes(){
        const notesList=document.getElementById('notes-list');
        const noNotesMsg=document.getElementById('no-notes-message');
        notesList.innerHTML='';
        const notes=window.NotesManager.getAll();
        if(notes.length===0){noNotesMsg.style.display='flex'; return;}
        noNotesMsg.style.display='none';
        notes.forEach((note,index)=>{
            const div=document.createElement('div');
            div.className='note-item';
            div.innerHTML=`<div class="note-content">${note}</div>
                <button class="delete-note" data-index="${index}"><i class="fas fa-trash"></i></button>`;
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

    toggleNotesBtn.addEventListener('click',()=>{notesSheet.classList.toggle('visible');renderNotes();});
    closeNotesBtn.addEventListener('click',()=>notesSheet.classList.remove('visible'));
    addNoteBtn.addEventListener('click',()=>{addNotePopover.classList.add('visible'); noteText.focus();});
    cancelNoteBtn.addEventListener('click',()=>{addNotePopover.classList.remove('visible'); noteText.value='';});
    saveNoteBtn.addEventListener('click',()=>{
        const note=noteText.value.trim();
        if(note){window.NotesManager.add(note); renderNotes(); addNotePopover.classList.remove('visible'); noteText.value='';}
    });

    // ---------- تم ----------
    themeToggle.addEventListener('click',()=>{
        document.body.classList.toggle('dark');
        const icon=themeToggle.querySelector('i');
        if(document.body.classList.contains('dark')){icon.classList.remove('fa-moon');icon.classList.add('fa-sun');}
        else{icon.classList.remove('fa-sun');icon.classList.add('fa-moon');}
        localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light');
    });
    if(localStorage.getItem('theme')==='dark'){
        document.body.classList.add('dark');
        const icon=themeToggle.querySelector('i');
        icon.classList.remove('fa-moon');icon.classList.add('fa-sun');
    }

    // ---------- باز کردن کتاب آخر ----------
    const lastBook=sessionStorage.getItem('currentBookData');
    if(lastBook) openBook(JSON.parse(lastBook));

    renderLibrary();
});
