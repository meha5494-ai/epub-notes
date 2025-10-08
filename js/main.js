// ساده و گلوبال بدون import/export
const bookGrid = document.getElementById('book-grid');
const fileInput = document.getElementById('epub-file-input');
const uploadBtn = document.getElementById('upload-button');
const themeToggle = document.getElementById('theme-toggle');
const backBtn = document.getElementById('back-button');
const readerView = document.getElementById('reader-view');
const libraryView = document.getElementById('library-view');
const readerTitle = document.getElementById('reader-title');
const bookContainer = document.getElementById('book-container');
const loadingOverlay = document.getElementById('loading-overlay');
const notesSheet = document.getElementById('notes-sheet');
const toggleNotesBtn = document.getElementById('toggle-notes');
const closeNotesBtn = document.getElementById('close-notes');
const addNotePopover = document.getElementById('add-note-popover');
const noteText = document.getElementById('note-text');
const saveNoteBtn = document.getElementById('save-note');
const cancelNoteBtn = document.getElementById('cancel-note');
const notesList = document.getElementById('notes-list');
const noNotesMsg = document.getElementById('no-notes-message');

let books = [];
let currentBook = null;
let currentRendition = null;
let currentNotes = [];

// افزودن کتاب
uploadBtn.addEventListener('click', ()=> fileInput.click());
fileInput.addEventListener('change', async (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const bookId = file.name + file.size + file.lastModified;
    const title = file.name.replace('.epub','');
    books.push({id: bookId, title, file});
    renderLibrary();
});

// نمایش کتابخانه
function renderLibrary(){
    bookGrid.innerHTML = '';
    if(books.length === 0){ bookGrid.innerHTML = '<p>کتابخانه شما خالی است 📚</p>'; return; }
    books.forEach(book=>{
        const div = document.createElement('div');
        div.className = 'book-card';
        div.textContent = book.title;
        div.addEventListener('click', ()=> openBook(book));
        bookGrid.appendChild(div);
    });
}

// باز کردن کتاب
async function openBook(book){
    libraryView.classList.remove('active');
    readerView.classList.add('active');
    readerTitle.textContent = book.title;
    bookContainer.innerHTML = '';
    loadingOverlay.style.display='flex';

    currentBook = new ePub(book.file);
    currentRendition = currentBook.renderTo('book-container',{
        width:'100%', height:'100%', method:'scrolled-doc'
    });
    await currentRendition.display();

    loadingOverlay.style.display='none';
    setupSelection();
    currentNotes = [];
    renderNotes();
}

// انتخاب متن برای یادداشت
function setupSelection(){
    currentRendition.on('selected', (cfiRange, contents)=>{
        const text = currentRendition.getRange(cfiRange).toString().trim();
        if(text.length>0){
            addNotePopover.classList.add('visible');
            noteText.value='';
            noteText.focus();
            saveNoteBtn.onclick = ()=>{
                currentNotes.push({cfiRange, text:noteText.value});
                highlightNotes();
                renderNotes();
                addNotePopover.classList.remove('visible');
            };
        }
    });
}

// هایلایت یادداشت‌ها
function highlightNotes(){
    currentNotes.forEach(note=>{
        currentRendition.annotations.highlight(note.cfiRange,{fill:'yellow',opacity:'0.3'},()=>{},'highlight-note');
    });
}

// نمایش لیست یادداشت‌ها
function renderNotes(){
    notesList.innerHTML='';
    if(currentNotes.length===0){ noNotesMsg.style.display='block'; return; }
    noNotesMsg.style.display='none';
    currentNotes.forEach((note,i)=>{
        const div = document.createElement('div');
        div.textContent = note.text;
        notesList.appendChild(div);
    });
}

// دکمه‌ها
backBtn.addEventListener('click', ()=>{
    readerView.classList.remove('active');
    libraryView.classList.add('active');
});
toggleNotesBtn.addEventListener('click', ()=> notesSheet.classList.toggle('visible'));
closeNotesBtn.addEventListener('click', ()=> notesSheet.classList.remove('visible'));
cancelNoteBtn.addEventListener('click', ()=> addNotePopover.classList.remove('visible'));
themeToggle.addEventListener('click', ()=> document.body.classList.toggle('dark'));
