import { notesManagerInstance } from './notes-manager.js';

const bookContainer=document.getElementById('book-container');
const loadingOverlay=document.getElementById('loading-overlay');
const popover=document.getElementById('add-note-popover');
const notesSheet=document.getElementById('notes-sheet');
const noteTextInput=document.getElementById('note-text-input');

let currentBook=null;
let currentRendition=null;
let currentBookId=null;
let currentCfiRange=null;
let currentContextText=null;

export const EpubManager={
    loadEpub:async(bookId,epubFile,bookTitle)=>{
        currentBookId=bookId;
        document.getElementById('reader-title').textContent=bookTitle;
        loadingOverlay.style.display='flex';
        bookContainer.innerHTML='';

        try{
            currentBook=new ePub(epubFile);
            currentRendition=currentBook.renderTo('book-container',{width:'100%',height:'100%',method:'scrolled-doc',manager:'default'});
            await currentRendition.display();

            currentRendition.on('rendered',(section,view)=>{
                const doc=view.document;
                if(doc){
                    doc.documentElement.setAttribute('dir','rtl');
                    doc.body.style.fontFamily='Vazirmatn, sans-serif';
                    doc.body.style.direction='rtl';
                    doc.body.style.textAlign='justify';
                }
            });

            loadingOverlay.style.display='none';
            EpubManager.setupSelectionHandler();
            return currentRendition;
        }catch(e){ console.error(e); loadingOverlay.textContent='خطا در بارگذاری کتاب.'; }
    },
    extractBookMetadata:async(file)=>{
        const book=new ePub(file);
        const bookId=file.name+file.size+file.lastModified;
        await book.opened;
        const metadata=book.metadata;
        let cover=null;
        try{ cover=await book.coverUrl(); }catch(e){ console.warn(e);}
        return {id:bookId,title:metadata.title||file.name.replace('.epub',''),author:metadata.creator||'ناشناس',cover:cover,epubFile:file};
    },
    setupSelectionHandler:()=>{
        if(!currentRendition) return;
        currentRendition.on('selected',(cfiRange,contents)=>{
            const text=currentRendition.getRange(cfiRange).toString().trim();
            if(text.length>0){ EpubManager.showAddNotePopover(cfiRange,text,contents); }
            else EpubManager.clearSelection();
        });
    },
    clearSelection:()=>{ if(currentRendition) currentRendition.getSelection().removeAllRanges(); EpubManager.hideAddNotePopover(); },
    showAddNotePopover:(cfiRange,contextText,contents)=>{ currentCfiRange=cfiRange; currentContextText=contextText; noteTextInput.value=''; popover.classList.add('visible'); noteTextInput.focus(); },
    hideAddNotePopover:()=>{ popover.classList.remove('visible'); currentCfiRange=null; currentContextText=null; },
    getCurrentNoteData:()=>({cfiRange:currentCfiRange,contextText:currentContextText})
};
