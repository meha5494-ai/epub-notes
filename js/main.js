document.addEventListener("DOMContentLoaded", () => {
  console.log('📱 اپلیکیشن اجرا شد');

  const uploadBtn = document.getElementById('upload-btn');
  const bookUpload = document.getElementById('book-upload');
  const booksContainer = document.getElementById('books-container');
  const readerSection = document.getElementById('reader-section');
  const backBtn = document.getElementById('back-btn');
  const addNoteBtn = document.getElementById('add-note-btn');
  const notesPanel = document.getElementById('notes-panel');
  const themeToggle = document.getElementById('theme-toggle');

  // تغییر تم
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  });

  // بارگذاری کتاب‌ها از IndexedDB
  async function loadBookList() {
    const keys = await idbKeyval.keys();
    booksContainer.innerHTML = '';

    for (const key of keys) {
      if (key.startsWith('book_')) {
        const bookInfo = await idbKeyval.get(key);
        const item = document.createElement('div');
        item.className = 'book-item';
        item.textContent = bookInfo.name;
        item.addEventListener('click', () => openBook(bookInfo));
        booksContainer.appendChild(item);
      }
    }

    if (!booksContainer.innerHTML) {
      booksContainer.innerHTML = '<p>هنوز کتابی اضافه نکردی 📖</p>';
    }
  }

  loadBookList();

  uploadBtn.addEventListener('click', () => bookUpload.click());
  bookUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const bookData = await file.arrayBuffer();
    await idbKeyval.set(`book_${Date.now()}`, { name: file.name, data: bookData });
    loadBookList();
  });

  async function openBook(bookInfo) {
    readerSection.classList.remove('hidden');
    document.querySelector('.book-list').classList.add('hidden');
    const book = ePub(bookInfo.data);
    const rendition = book.renderTo("viewer", { width: "100%", height: "100%" });
    await rendition.display();
  }

  backBtn.addEventListener('click', () => {
    readerSection.classList.add('hidden');
    document.querySelector('.book-list').classList.remove('hidden');
  });

  addNoteBtn.addEventListener('click', () => {
    notesPanel.classList.toggle('hidden');
  });

  // سرویس ورکر
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(() => console.log('✅ Service Worker ثبت شد'))
      .catch(err => console.warn('Service Worker Error:', err));
  }
});
