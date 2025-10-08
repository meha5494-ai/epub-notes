// Singleton Notes Manager
function NotesManager() {
    this.notes = [];
}

NotesManager.prototype.addNote = function(note) {
    if (note && typeof note === 'string') {
        this.notes.push(note);
        updateNotesUI();
    }
};

NotesManager.prototype.getNotes = function() {
    return this.notes;
};

NotesManager.prototype.removeNote = function(index) {
    if (index >= 0 && index < this.notes.length) {
        this.notes.splice(index, 1);
        updateNotesUI();
    }
};

// Singleton instance
window.NotesManager = new NotesManager();

// UI update helper
function updateNotesUI() {
    const list = document.getElementById('notes-list');
    const noNotes = document.getElementById('no-notes-message');
    list.innerHTML = '';
    const notes = window.NotesManager.getNotes();
    if (notes.length === 0) {
        noNotes.style.display = 'block';
    } else {
        noNotes.style.display = 'none';
        notes.forEach((n, i) => {
            const div = document.createElement('div');
            div.className = 'note-item';
            div.innerHTML = `
                <div class="note-text">${n}</div>
                <button onclick="NotesManager.removeNote(${i})">حذف</button>
            `;
            list.appendChild(div);
        });
    }
}
