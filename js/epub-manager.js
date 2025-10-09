const bookContainer = document.getElementById('book-container');

let currentBook = null;
let currentRendition = null;

const EpubManager = {
    loadEpub: async (id, file, title) => {
        bookContainer.innerHTML = '';
        
        try {
            const contentDiv = document.createElement('div');
            contentDiv.id = 'epub-content';
            contentDiv.style.cssText = `
                width: 100%;
                height: 100%;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: auto;
                padding: 20px;
            `;
            bookContainer.appendChild(contentDiv);
            
            currentBook = ePub(file);
            currentRendition = currentBook.renderTo("epub-content", {
                width: "100%",
                height: "100%",
                flow: "scrolled-doc",
                manager: "continuous"
            });

            await currentRendition.display();

            setTimeout(() => {
                const iframe = document.querySelector('#epub-content iframe');
                if (iframe) {
                    iframe.style.cssText = `
                        width: 100%;
                        height: 100%;
                        border: none;
                        overflow: auto;
                        background: white;
                    `;
                    
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc && iframeDoc.body) {
                        iframeDoc.body.style.direction = 'rtl';
                        iframeDoc.body.style.fontFamily = 'Vazirmatn', sans-serif;
                        iframeDoc.body.style.lineHeight = '1.8';
                        iframeDoc.body.style.fontSize = '16px';
                        iframeDoc.body.style.color = '#1e293b';
                        iframeDoc.body.style.padding = '20px';
                        iframeDoc.documentElement.style.overflow = 'hidden';
                        iframeDoc.body.style.overflow = 'auto';
                    }
                }
            }, 1000);
            
            return currentRendition;
        } catch (e) {
            console.error('Error loading EPUB:', e);
            bookContainer.innerHTML = `<div class="error-container">خطا در بارگذاری کتاب</div>`;
        }
    },

    prev: () => { if (currentRendition) currentRendition.prev(); },
    next: () => { if (currentRendition) currentRendition.next(); },

    extractBookMetadata: async (file) => {
        const book = ePub(file);
        const bookId = file.name + file.size + file.lastModified;
        await book.opened;
        let coverData = null;
        try { coverData = await book.coverUrl(); } catch(e){}
        return { id: bookId, title: file.name.replace('.epub',''), author:'ناشناس', cover: coverData, epubFile: file };
    }
};

window.EpubManager = EpubManager;

// ---------- مدیریت باز شدن کتاب و حفظ موقعیت ----------
document.addEventListener('DOMContentLoaded', async function() {
    const bookGrid = document.getElementById('book-grid');
    const fileInput = document.getElementById('epub-file-input');
    const uploadBtn = document.getElementById('upload-button');
    const readerView = document.getElementById('reader-view');
    const libraryView = document.getElementById('library-view');

    let books = JSON.parse(localStorage.getItem('epubBooks')) || [];

    function renderLibrary() {
        bookGrid.innerHTML = '';
        if (books.length === 0) {
            bookGrid.innerHTML = `<p>کتابخانه شما خالی است</p>`;
            return;
        }

        books.forEach((book, index) => {
            const div = document.createElement('div');
            div.className = 'book-card';
            div.textContent = book.title;
            div.onclick = () => openBook(book);
            bookGrid.appendChild(div);
        });
    }

    async function openBook(book) {
        libraryView.classList.remove('active');
        readerView.classList.add('active');
        localStorage.setItem('lastOpenedBookId', book.id);

        try {
            const rendition = await EpubManager.loadEpub(book.id, book.epubFile, book.title);

            // بازیابی آخرین موقعیت
            const lastLocation = localStorage.getItem(`book_progress_${book.id}`);
            if (lastLocation) await rendition.display(lastLocation);

            // ذخیره موقعیت هنگام تغییر صفحه
            rendition.on("relocated", (location) => {
                if (location && location.start && location.start.cfi) {
                    localStorage.setItem(`book_progress_${book.id}`, location.start.cfi);
                }
            });

        } catch (error) {
            console.error('Error opening book:', error);
        }
    }

    // اگر کتابی قبلاً باز بوده، بازش کن
    const lastBookId = localStorage.getItem('lastOpenedBookId');
    if (lastBookId) {
        const lastBook = books.find(b => b.id === lastBookId);
        if (lastBook) openBook(lastBook);
    }

    renderLibrary();

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        const bookData = await EpubManager.extractBookMetadata(file);
        books.push(bookData);
        localStorage.setItem('epubBooks', JSON.stringify(books));
        localStorage.setItem('lastOpenedBookId', bookData.id);
        renderLibrary();
        openBook(bookData);
    });
});
