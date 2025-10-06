class NotesManager {
  constructor() {
    this.notes = [];
    this.loadNotes();
  }

  async loadNotes() {
    const keys = await idbKeyval.keys();
    this.notes = [];
    for (const key of keys) {
      if (key.startsWith('note_')) {
        const note = await idbKeyval.get(key);
        this.notes.push(note);
      }
    }
    this.displayNotes();
  }

  async addNote(bookId, cfiRange, text, note) {
    const id = `note_${Date.now()}`;
    const newNote = {
      id,
      bookId,
      cfiRange,
      text,
      note,
      date: new Date().toLocaleString('fa-IR')
    };
    await idbKeyval.set(id, newNote);
    this.notes.push(newNote);
    this.displayNotes();
    if (window.epubManager) {
      window.epubManager.highlightText(cfiRange);
    }
  }

  async displayNotes() {
    const container = document.getElementById('notes-container');
    if (!container) return;
    container.innerHTML = this.notes.length
      ? this.notes.map(n => `
        <div class="note-item fade-in">
          <div class="note-text">${n.text}</div>
          <div class="note-meta">${n.note || ''}</div>
          <small>${n.date}</small>
        </div>
      `).join('')
      : '<p>یادداشتی ثبت نشده است.</p>';
  }
}

window.notesManager = new NotesManager();
