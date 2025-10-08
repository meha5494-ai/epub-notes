window.NotesManager = {
    notes: [],
    add(note) {
        if (note && note.trim() !== "") this.notes.push(note);
    },
    getAll() {
        return this.notes;
    },
    delete(index) {
        if (index >= 0 && index < this.notes.length) {
            this.notes.splice(index, 1);
        }
    },
    clear() {
        this.notes = [];
    }
};
