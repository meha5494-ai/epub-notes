async function openBook(book) {
    console.log('Opening book:', book.title);
    libraryView.classList.remove('active');
    readerView.classList.add('active');
    document.getElementById('reader-title').textContent = book.title;
    
    // ریست کردن حالت نمایش
    continuousViewBtn.classList.add('active');
    pagedViewBtn.classList.remove('active');
    
    // ✅ تشخیص منبع (فایل یا Base64)
    try {
        console.log('Loading book...');

        let epubSource;
        if (book.epubFile) {
            epubSource = book.epubFile; // اگر تازه آپلود شده
        } else if (book.dataUrl) {
            epubSource = book.dataUrl; // اگر از localStorage خونده می‌شه
        } else {
            throw new Error("EPUB source not found");
        }

        await window.EpubManager.loadEpub(book.id, epubSource, book.title);
        console.log('Book loaded successfully');
    } catch (error) {
        console.error('Error opening book:', error);
        bookContainer.innerHTML = `
            <div class="error-container">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>خطا در باز کردن کتاب</h3>
                <p>مشکلی در بارگذاری کتاب پیش آمد</p>
                <button class="retry-btn" onclick="location.reload()">
                    <i class="fas fa-redo"></i> تلاش مجدد
                </button>
            </div>`;
    }
    
    window.NotesManager.clear();
    renderNotes();
}
