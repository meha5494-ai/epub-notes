import { notesManagerInstance } from './notes-manager.js';
import { EpubManager } from './epub-manager.js';

const fileInput=document.getElementById('epub-file-input');
const uploadButton=document.getElementById('upload-button');
const themeToggle=document.getElementById('theme-toggle');
const backButton=document.getElementById('back-to-library');
const readerView=document.getElementById('reader-view');
const bookGrid=document.getElementById('book-grid');
const readerTitle=document.getElementById('reader-title');

let library=[];

if(localStorage.getItem('library')){
    library=JSON.parse(localStorage.getItem('library'));
    renderLibrary();
}

uploadButton.addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',async e=>{
    const file=e.target.files[0];
    if(!file) return;
    const metadata=await EpubManager.extractBookMetadata(file);
    library.push(metadata);
    localStorage.setItem('library',JSON.stringify(library));
    renderLibrary();
});

function renderLibrary(){
    bookGrid.innerHTML='';
    if(library.length===0){
        bookGrid.innerHTML='<p>کتابخانه‌ی شما خالی است. 📚</p>';
        return;
    }
    library.forEach(book=>{
        const card=document.createElement('div');
        card.className='book-card';
        card.innerHTML=`<img src="${book.cover||'icons/icon-192.png'}"><p>${book.title}</p>`;
        card.addEventListener('click',async()=>{
            readerTitle.textContent=book.title;
            await EpubManager.loadEpub(book.id,book.epubFile,book.title);
            readerView.classList.add('active');
        });
        bookGrid.appendChild(card);
    });
}

themeToggle.addEventListener('click',()=>document.body.classList.toggle('dark'));
backButton.addEventListener('click',()=>readerView.classList.remove('active'));
