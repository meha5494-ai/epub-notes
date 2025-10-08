document.addEventListener('DOMContentLoaded', function(){
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

    let books = [];

    uploadBtn.addEventListener('click', ()=>fileInput.click());

    fileInput.addEventListener('change', async e=>{
        const file = e.target.files[0];
        if(!file) return;
        
        try {
            // استفاده از متد extractBookMetadata برای دریافت اطلاعات کتاب
            const bookData = await EpubManager.extractBookMetadata(file);
            books.push(bookData);
            renderLibrary();
        } catch (error) {
            console.error('Error adding book:', error);
            // در صورت خطا، حداقل اطلاعات پایه را اضافه کن
            const bookId = file.name + file.size + file.lastModified;
            const title = file.name.replace('.epub','');
            books.push({id:bookId,title,file});
            renderLibrary();
        }
    });

    function renderLibrary(){
        bookGrid.innerHTML='';
        if(books.length===0){
            bookGrid.innerHTML='<p>کتابخانه شما خالی است 📚</p>';
            return;
        }
        books.forEach(book=>{
            const div = document.createElement('div');
            div.className='book-card';
            
            // نمایش جلد کتاب اگر وجود داشته باشد
            if(book.cover) {
                const img = document.createElement('img');
                img.src = book.cover;
                img.alt = book.title;
                div.appendChild(img);
            } else {
                // اگر جلد وجود نداشت، یک placeholder نمایش بده
                const placeholder = document.createElement('div');
                placeholder.className = 'book-placeholder';
                placeholder.textContent = '📖';
                div.appendChild(placeholder);
            }
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'book-title';
            titleDiv.textContent = book.title;
            div.appendChild(titleDiv);
            
            div.onclick=()=>openBook(book);
            bookGrid.appendChild(div);
        });
    }

    function openBook(book){
        libraryView.classList.remove('active');
        readerView.classList.add('active');
        // استفاده از متد loadEpub برای باز کردن کتاب
        EpubManager.loadEpub(book.id, book.file, book.title);
        window.NotesManager.clear();
        renderNotes();
    }

    function renderNotes(){
        const notesList = document.getElementById('notes-list');
        const noNotesMsg = document.getElementById('no-notes-message');
        notesList.innerHTML='';
        const notes = window.NotesManager.getAll();
        if(notes.length===0){ noNotesMsg.style.display='block'; return; }
        noNotesMsg.style.display='none';
        notes.forEach(note=>{
            const div = document.createElement('div');
            div.className='note-item';
            div.textContent=note;
            notesList.appendChild(div);
        });
    }

    backBtn.addEventListener('click', ()=>{
        readerView.classList.remove('active');
        libraryView.classList.add('active');
    });

    toggleNotesBtn.addEventListener('click', ()=>notesSheet.classList.toggle('visible'));
    closeNotesBtn.addEventListener('click', ()=>notesSheet.classList.remove('visible'));
    cancelNoteBtn.addEventListener('click', ()=>addNotePopover.classList.remove('visible'));

    themeToggle.addEventListener('click', ()=>{
        document.body.classList.toggle('dark');
    });

});
