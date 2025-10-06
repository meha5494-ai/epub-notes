class EpubManager {
  constructor() {
    this.currentBook = null;
    this.rendition = null;
    console.log('EpubManager آماده شد');
  }

  async loadBook(file) {
    console.log('📖 در حال بارگذاری کتاب...');
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    this.currentBook = book;

    const viewer = document.getElementById('viewer');
    viewer.innerHTML = '';

    this.rendition = book.renderTo(viewer, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      spread: 'none',
      manager: 'continuous'
    });

    await this.rendition.display();
    console.log('✅ کتاب نمایش داده شد');

    this.rendition.on('selected', this.handleTextSelection.bind(this));
  }

  handleTextSelection(cfiRange, contents) {
    const selectedText = contents.window.getSelection().toString();
    if (selectedText.trim()) {
      console.log('متن انتخاب‌شده:', selectedText);
      window.dispatchEvent(new CustomEvent('text-selected', {
        detail: { cfiRange, text: selectedText }
      }));
    }
  }

  highlightText(cfiRange, color = '#fde047') {
    if (this.rendition) {
      this.rendition.annotations.add('highlight', cfiRange, { fill: color });
    }
  }
}

window.epubManager = new EpubManager();
