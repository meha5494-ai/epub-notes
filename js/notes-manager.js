class NotesManager {
  constructor() {
    this.notes = [];
  }

  async loadNotes() {
    const keys = await idbKeyval.keys();
    this.notes = [];
    for (const key of keys) {
      if (key.startsWith("note_")) {
        this.notes.push(await idbKeyval.get(key));
      }
    }
    this.renderNotes();
  }

  async addNote(bookId, cfiRange, text, note) {
    const id = `note_${Date.now()}`;
    const newNote = { id, bookId, cfiRange, text, note, date: new Date().toLocaleString("fa-IR") };
    await idbKeyval.set(id, newNote);
    this.notes.push(newNote);
    this.renderNotes();
    window.epubManager.highlightText(cfiRange);
  }

  renderNotes() {
    const container = document.getElementById("notes-container");
    if (!container) return;
    container.innerHTML = this.notes.map(n => `
      <div class="note-item">
        <b>${n.text}</b><br>
        <small>${n.note || "بدون توضیح"} | ${n.date}</small>
      </div>
    `).join("") || "<p>یادداشتی ثبت نشده است.</p>";
  }
}

window.notesManager = new NotesManager();
