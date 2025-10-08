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

    fileInput.addEventListener('change', e=>{
        const file = e.target.files[0];
        if(!file) return;
        const bookId = file.name + file.size + file.lastModified;
        const title = file.name.replace('.epub','');
        books.push({id:bookId,title,file});
        renderLibrary();
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
            div.textContent=book.title;
            div.onclick=()=>openBook(book);
            bookGrid.appendChild(div);
        });
    }

    function openBook(book){
        libraryView.classList.remove('active');
        readerView.classList.add('active');
        window.EpubManager.openBook(book);
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
