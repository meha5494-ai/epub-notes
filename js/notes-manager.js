export class NotesManager{
    constructor(){ this.notes=[]; }
    addNote(note){ if(note && typeof note==='string') this.notes.push(note); }
    getNotes(){ return this.notes; }
    removeNote(i){ if(i>=0 && i<this.notes.length) this.notes.splice(i,1); }
}
export const notesManagerInstance = new NotesManager();
