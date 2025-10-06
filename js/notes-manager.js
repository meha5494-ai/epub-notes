class NotesManager {
  constructor() {
    this.notes = [];
    console.log('NotesManager ایجاد شد');
    this.initDB();
  }

  async initDB() {
    try {
      console.log('در حال مقداردهی اولیه IndexedDB...');
      // نیازی به ایجاد Store نیست، idbKeyval به صورت خودکار از پایگاه داده پیش‌فرض استفاده می‌کند
      await this.loadNotes();
      console.log('IndexedDB با موفقیت مقداردهی اولیه شد');
    } catch (error) {
      console.error('خطا در مقداردهی اولیه IndexedDB:', error);
    }
  }

  async loadNotes() {
    try {
      console.log('در حال بارگذاری یادداشت‌ها...');
      // دریافت تمام کلیدها از پایگاه داده
      const keys = await idbKeyval.keys();
      this.notes = [];
      for (const key of keys) {
        if (key.startsWith('note_')) {
          const note = await idbKeyval.get(key);
          this.notes.push(note);
        }
      }
      console.log('یادداشت‌های موجود:', this.notes);
      
      const notesContainer = document.getElementById('notes-container');
      if (notesContainer) {
        notesContainer.innerHTML = 
          this.notes.length ? this.notes.map(note => this.renderNote(note)).join('') 
          : '<p>یادداشتی یافت نشد</p>';
      }
    } catch (error) {
      console.error('خطا در بارگذاری یادداشت‌ها:', error);
    }
  }

  async addNote(bookId, cfiRange, text, note) {
    try {
      console.log('در حال افزودن یادداشت جدید...');
      const noteId = `note_${Date.now()}`;
      const noteData = {
        id: noteId,
        bookId,
        cfiRange,
        text,
        note,
        createdAt: new Date().toISOString()
      };

      await idbKeyval.set(noteId, noteData);
      this.notes.push(noteData);
      console.log('یادداشت با موفقیت ذخیره شد:', noteData);
      
      this.loadNotes();
      
      // هایلایت متن
      if (window.epubManager && window.epubManager.rendition) {
        window.epubManager.highlightText(cfiRange);
      }
    } catch (error) {
      console.error('خطا در افزودن یادداشت:', error);
      throw error;
    }
  }

  renderNote(note) {
    return `
      <div class="note-item">
        <div class="note-text">${note.text}</div>
        <div class="note-meta">${note.note || ''}</div>
        <small>${new Date(note.createdAt).toLocaleDateString('fa-IR')}</small>
      </div>
    `;
  }
}

window.notesManager = new NotesManager();