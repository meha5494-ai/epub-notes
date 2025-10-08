window.EpubManager = {
    currentBook: null,
    currentRendition: null,
    currentBookId: null,
    currentNotes: [],

    openBook(book){
        const readerTitle = document.getElementById('reader-title');
        const bookContainer = document.getElementById('book-container');
        const loadingOverlay = document.getElementById('loading-overlay');

        readerTitle.textContent = book.title;
        bookContainer.innerHTML = '';
        loadingOverlay.style.display='flex';

        this.currentBook = new ePub(book.file);
        this.currentRendition = this.currentBook.renderTo('book-container',{
            width:'100%', height:'100%', method:'scrolled-doc'
        });

        this.currentRendition.display().then(()=>{
            loadingOverlay.style.display='none';
            this.setupSelection();
        });
    },

    setupSelection(){
        if(!this.currentRendition) return;
        const addNotePopover = document.getElementById('add-note-popover');
        const noteText = document.getElementById('note-text');
        const saveNoteBtn = document.getElementById('save-note');

        this.currentRendition.on('selected', (cfiRange, contents)=>{
            const text = this.currentRendition.getRange(cfiRange).toString().trim();
            if(text.length>0){
                addNotePopover.classList.add('visible');
                noteText.value = '';
                noteText.focus();

                saveNoteBtn.onclick = ()=>{
                    window.NotesManager.add(noteText.value);
                    this.currentNotes.push({cfiRange, text:noteText.value});
                    this.highlightNotes();
                    addNotePopover.classList.remove('visible');
                    renderNotes();
                };
            }
        });
    },

    highlightNotes(){
        this.currentNotes.forEach(note=>{
            this.currentRendition.annotations.highlight(note.cfiRange,{fill:'yellow',opacity:0.3},()=>{},"highlight-note");
        });
    }
};
