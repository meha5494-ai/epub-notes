class EpubManager {
  constructor() {
    this.currentBook = null;
    this.rendition = null;
    console.log('EpubManager ایجاد شد');
  }

  async loadBook(file) {
    console.log('در حال خواندن فایل EPUB...');
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    this.currentBook = book;
    
    // نمایش کتاب
    const viewer = document.getElementById('viewer');
    viewer.innerHTML = '';
    
    this.rendition = book.renderTo(viewer, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      manager: 'continuous'
    });
    
    await this.rendition.display();
    console.log('کتاب با موفقیت نمایش داده شد');
    
    // رویدادهای انتخاب متن
    this.rendition.on('selected', this.handleTextSelection.bind(this));
    
    return book;
  }

  handleTextSelection(cfiRange, contents) {
    console.log('متن انتخاب شد:', cfiRange);
    const selectedText = contents.window.getSelection().toString();
    if (selectedText.trim()) {
      console.log('متن انتخاب شده برای یادداشت:', selectedText);
      // ارسال رویداد به notes-manager
      window.dispatchEvent(new CustomEvent('text-selected', {
        detail: { cfiRange, text: selectedText }
      }));
    }
  }

  highlightText(cfiRange, color = 'yellow') {
    console.log('هایلایت کردن متن:', cfiRange);
    this.rendition.annotations.add('highlight', cfiRange, {
      fill: color
    });
  }
}

window.epubManager = new EpubManager();