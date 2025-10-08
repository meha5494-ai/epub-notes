window.NotesManager = {
    notes: [],
    add(note){
        if(note && note.trim()!=="") this.notes.push(note);
    },
    getAll(){
        return this.notes;
    },
    clear(){
        this.notes=[];
    }
};
