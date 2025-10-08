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

export const notesManagerInstance = new NotesManager();
