export class NotesManager {
    constructor() {
        this.notes = [];
    }

    addNote(note) {
        if (note && typeof note === 'object') {
            this.notes.push(note);
        }
    }

    getNotes(bookId = null) {
        if (!bookId) return this.notes;
        return this.notes.filter(n => n.bookId === bookId);
    }

    removeNote(index) {
        if (index >= 0 && index < this.notes.length) {
            this.notes.splice(index, 1);
        }
    }
}

export const notesManagerInstance = new NotesManager();
