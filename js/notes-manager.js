window.NotesManager = {
    notes: [],
    
    add(note) {
        if (note && note.trim() !== "") {
            this.notes.push(note);
            this.saveToStorage();
        }
    },
    
    getAll() {
        return this.notes;
    },
    
    delete(index) {
        if (index >= 0 && index < this.notes.length) {
            this.notes.splice(index, 1);
            this.saveToStorage();
        }
    },
    
    clear() {
        this.notes = [];
        this.saveToStorage();
    },
    
    saveToStorage() {
        localStorage.setItem('epubNotes', JSON.stringify(this.notes));
    },
    
    loadFromStorage() {
        const saved = localStorage.getItem('epubNotes');
        if (saved) {
            this.notes = JSON.parse(saved);
        }
    }
};

// Load notes when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.NotesManager.loadFromStorage();
});
