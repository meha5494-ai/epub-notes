const fileInput = document.getElementById('epub-file-input');
const uploadBtn = document.getElementById('upload-button');
const backBtn = document.getElementById('back-to-library');
const themeToggle = document.getElementById('theme-toggle');

uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(file){
        const bookMeta = await window.EpubManager.extractBookMetadata(file);
        window.EpubManager.loadEpub(bookMeta.id, file, bookMeta.title);
        document.getElementById('library-view').classList.remove('active');
        document.getElementById('reader-view').classList.add('active');
    }
});

backBtn.addEventListener('click', () => {
    document.getElementById('reader-view').classList.remove('active');
    document.getElementById('library-view').classList.add('active');
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const icon = document.getElementById('theme-icon');
    icon.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
});
