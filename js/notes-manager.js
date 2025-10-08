class NotesManager {
  constructor() {
    this.notes = [];
    this.panel = document.getElementById("notes-panel");
    this.container = document.getElementById("notes-container");
    this.currentBookId = null;
    console.log("📝 NotesManager آماده است");
    this.init();
  }

  async init() {
    await this.loadNotes();
  }

  async loadNotes(bookId = null) {
    this.notes = [];
    const keys = await idbKeyval.keys();
    for (const key of keys) {
      if (key.startsWith("note_")) {
        const note = await idbKeyval.get(key);
        if (!bookId || note.bookId === bookId) {
          this.notes.push(note);
        }
      }
    }
    this.renderNotes();
  }

  async addNote(bookId, cfiRange, text, noteContent) {
    const noteId = `note_${Date.now()}`;
    const newNote = {
      id: noteId,
      bookId,
      cfiRange,
      text,
      note: noteContent,
      createdAt: new Date().toISOString()
    };

    await idbKeyval.set(noteId, newNote);
    this.notes.push(newNote);
    this.renderNotes();

    // هایلایت متن در کتاب
    if (window.epubManager) {
      window.epubManager.highlightText(cfiRange);
    }
  }

  renderNotes() {
    if (!this.container) return;
    if (this.notes.length === 0) {
      this.container.innerHTML = `<p style="text-align:center; color:gray;">یادداشتی وجود ندارد</p>`;
      return;
    }

    this.container.innerHTML = this.notes.map(note => `
      <div class="note-item">
        <div class="note-text">📘 ${note.text}</div>
        <div class="note-meta">${note.note}</div>
        <small>${new Date(note.createdAt).toLocaleDateString('fa-IR')}</small>
      </div>
    `).join("");
  }
}

window.notesManager = new NotesManager();

// مدیریت رویداد انتخاب متن برای افزودن یادداشت
window.addEventListener("text-selected", async (e) => {
  const { cfiRange, text } = e.detail;
  const note = prompt("یادداشت خود را بنویس:");
  if (note && window.epubManager?.currentBookId) {
    await window.notesManager.addNote(window.epubManager.currentBookId, cfiRange, text, note);
  }
});
