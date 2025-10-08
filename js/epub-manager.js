import { notesManagerInstance } from './notes-manager.js';

const bookContainer=document.getElementById('book-container');
const loadingOverlay=document.getElementById('loading-overlay');

let currentBook=null;
let currentRendition=null;

export const EpubManager={
    loadEpub: async(id,file,title)=>{
        loadingOverlay.style.display='flex';
        bookContainer.innerHTML='';
        try{
            currentBook=new ePub(file);
            currentRendition=currentBook.renderTo('book-container',{width:'100%',height:'100%',method:'scrolled-doc',manager:'default'});
            await currentRendition.display();
            loadingOverlay.style.display='none';
            return currentRendition;
        }catch(e){ console.error('Error loading EPUB',e); loadingOverlay.textContent='خطا در بارگذاری کتاب'; }
    },

    extractBookMetadata: async(file)=>{
        const book=new ePub(file);
        const bookId=file.name+file.size+file.lastModified;
        await book.opened;
        let coverData=null;
        try{ coverData=await book.coverUrl(); }catch(e){ console.warn('no cover',e); }
        return {id:bookId,title:file.name.replace('.epub',''),author:'ناشناس',cover:coverData,epubFile:file};
    }
};
