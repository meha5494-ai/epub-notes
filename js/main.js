document.addEventListener("DOMContentLoaded", () => {
  console.log('اپلیکیشن شروع به کار کرد');
  
  // بررسی وجود کتابخانه‌های مورد نیاز
  if (typeof ePub === 'undefined') {
    console.error('خطا: کتابخانه epub.js بارگذاری نشده');
    alert('خطا در بارگذاری کتابخانه‌ها. لطفاً صفحه را رفرش کنید.');
    return;
  }
  
  if (typeof idbKeyval === 'undefined') {
    console.error('خطا: کتابخانه idb-keyval بارگذاری نشده');
    alert('خطا در بارگذاری کتابخانه‌ها. لطفاً صفحه را رفرش کنید.');
    return;
  }
  
  // عناصر DOM
  const uploadBtn = document.getElementById('upload-btn');
  const bookUpload = document.getElementById('book-upload');
  const booksContainer = document.getElementById('books-container');
  const readerSection = document.getElementById('reader-section');
  const backBtn = document.getElementById('back-btn');
  const addNoteBtn = document.getElementById('add-note-btn');
  const notesPanel = document.getElementById('notes-panel');
  const installBtn = document.getElementById('install-btn');

  // بررسی وجود عناصر
  if (!uploadBtn || !bookUpload || !booksContainer || !readerSection || !backBtn || !addNoteBtn || !notesPanel) {
    console.error('خطا: یکی از عناصر DOM یافت نشد');
    return;
  }

  console.log('همه عناصر DOM پیدا شد');

  // رویداد آپلود کتاب
  uploadBtn.addEventListener('click', () => {
    console.log('دکمه آپلود کلیک شد');
    bookUpload.click();
  });

  bookUpload.addEventListener('change', async (e) => {
    console.log('فایل انتخاب شد');
    const file = e.target.files[0];
    
    if (!file) {
      console.log('هیچ فایلی انتخاب نشد');
      return;
    }
    
    if (file.type !== 'application/epub+zip') {
      alert('لطفاً یک فایل EPUB معتبر انتخاب کنید');
      return;
    }
    
    try {
      console.log('در حال بارگذاری کتاب...');
      
      // بررسی وجود epubManager
      if (!window.epubManager) {
        throw new Error('اپلیکیشن آماده نیست. لطفاً صفحه را رفرش کنید.');
      }
      
      await window.epubManager.loadBook(file);
      console.log('کتاب با موفقیت بارگذاری شد');
      showReader();
      
    } catch (error) {
      console.error('خطا در بارگذاری کتاب:', error);
      alert(`خطا در بارگذاری کتاب: ${error.message}`);
    }
  });

  // نمایش بخش خواندن
  function showReader() {
    console.log('نمایش بخش خواندن');
    document.querySelector('.book-list').classList.add('hidden');
    readerSection.classList.remove('hidden');
  }

  // بازگشت به لیست کتاب‌ها
  backBtn.addEventListener('click', () => {
    console.log('بازگشت به لیست کتاب‌ها');
    readerSection.classList.add('hidden');
    document.querySelector('.book-list').classList.remove('hidden');
  });

  // افزودن یادداشت
  addNoteBtn.addEventListener('click', () => {
    console.log('نمایش پنل یادداشت‌ها');
    notesPanel.classList.toggle('hidden');
  });

  // دریافت متن انتخاب شده
  window.addEventListener('text-selected', async (e) => {
    console.log('متن انتخاب شد:', e.detail);
    const { cfiRange, text } = e.detail;
    const note = prompt('یادداشت خود را وارد کنید:');
    
    if (note !== null) {
      try {
        console.log('در حال افزودن یادداشت...');
        
        if (!window.notesManager) {
          throw new Error('مدیریت یادداشت‌ها آماده نیست');
        }
        
        await window.notesManager.addNote('current-book', cfiRange, text, note);
        console.log('یادداشت با موفقیت افزوده شد');
        
      } catch (error) {
        console.error('خطا در افزودن یادداشت:', error);
        alert(`خطا در افزودن یادداشت: ${error.message}`);
      }
    }
  });

  // نصب PWA
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) {
      installBtn.style.display = 'block';
      console.log('دکمه نصب نمایش داده شد');
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
      }
    });
  }

  // ثبت سرویس ورکر در GitHub Pages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(() => console.log('✅ Service Worker registered successfully'))
      .catch(err => console.warn('Service Worker error:', err));
  }
});
