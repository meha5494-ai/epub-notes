import { notesManagerInstance } from './notes-manager.js';
import { EpubManager } from './epub-manager.js';

const fileInput=document.getElementById('epub-file-input');
const uploadButton=document.getElementById('upload-button');
const themeToggle=document.getElementById('theme-toggle');
const backButton=document.getElementById('back-to-library');
const readerView=document.getElementById('reader-view');
const bookGrid=document.getElementById('book-grid');

let currentBook=null;

uploadButton.addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',async e=>{
    const file=e.target.files[0];
    if(!file) return;
    currentBook=await EpubManager.loadEpub(file.name,file.name,file.name);
    readerView.classList.add('active');
});

themeToggle.addEventListener('click',()=>{
    document.body.classList.toggle('dark');
});

backButton.addEventListener('click',()=>{ readerView.classList.remove('active'); });
