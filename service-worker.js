class EpubManager {
  constructor() {
    this.currentBook = null;
    this.rendition = null;
    console.log('EpubManager ایجاد شد');
  }

  async loadBook(file) {
    try {
      console.log('در حال خواندن فایل EPUB...');
      
      // بررسی وجود کتابخانه epub.js
      if (typeof ePub === 'undefined') {
        throw new Error('کتابخانه epub.js بارگذاری نشده است');
      }

      // بررسی وجود عنصر viewer
      const viewer = document.getElementById('viewer');
      if (!viewer) {
        throw new Error('عنصر viewer یافت نشد');
      }

      // خواندن فایل
      const arrayBuffer = await file.arrayBuffer();
      const book = ePub(arrayBuffer);
      this.currentBook = book;
      
      // پاک کردن محتوای قبلی
      viewer.innerHTML = '';
      
      // رندر کردن کتاب
      this.rendition = book.renderTo(viewer, {
        width: '100%',
        height: '100%',
        flow: 'paginated',
        manager: 'continuous'
      });
      
      await this.rendition.display();
      console.log('کتاب با موفقیت نمایش داده شد');
      
      // تنظیم رویدادها
      this.setupEvents();
      
      return book;
    } catch (error) {
      console.error('خطا در loadBook:', error);
      throw error; // ارسال خطا به بالا برای مدیریت
    }
  }

  setupEvents() {
    if (!this.rendition) return;
    
    // رویداد انتخاب متن
    this.rendition.on('selected', this.handleTextSelection.bind(this));
    
    // رویدادهای خطا
    this.rendition.on('relocated', (location) => {
      console.log('تغییر مکان:', location);
    });
    
    this.rendition.on('rendered', (section) => {
      console.log('بخش رندر شد:', section);
    });
  }

  handleTextSelection(cfiRange, contents) {
    console.log('متن انتخاب شد:', cfiRange);
    const selectedText = contents.window.getSelection().toString();
    if (selectedText.trim()) {
      console.log('متن انتخاب شده برای یادداشت:', selectedText);
      window.dispatchEvent(new CustomEvent('text-selected', {
        detail: { cfiRange, text: selectedText }
      }));
    }
  }

  highlightText(cfiRange, color = 'yellow') {
    if (!this.rendition) {
      console.error('rendition در دسترس نیست');
      return;
    }
    
    console.log('هایلایت کردن متن:', cfiRange);
    this.rendition.annotations.add('highlight', cfiRange, {
      fill: color
    });
  }
}

window.epubManager = new EpubManager();
