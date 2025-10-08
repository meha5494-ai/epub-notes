// js/notes-manager.js
export class NotesManager {
    constructor() {
        this.notes = [];
    }

    addNote(note) {
        if (note && typeof note === 'string') {
            this.notes.push(note);
        }
    }

    getNotes() {
        return this.notes;
    }

    removeNote(index) {
        if (index >= 0 && index < this.notes.length) {
            this.notes.splice(index, 1);
        }
    }
}

// نمونه یکتا برای استفاده در پروژه
export const notesManagerInstance = new NotesManager();
