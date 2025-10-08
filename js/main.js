const uploadBtn = document.getElementById("upload-btn");
const fileInput = document.getElementById("file-input");
const bookList = document.getElementById("book-list");
const readerSection = document.getElementById("reader-section");
const notesPanel = document.getElementById("notes-panel");
const addNoteBtn = document.getElementById("add-note-btn");
const closeNotesBtn = document.getElementById("close-notes-btn");

uploadBtn.onclick = () => fileInput.click();

fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const title = file.name.replace(".epub", "");
  await epubManager.loadBook(file, title);
  readerSection.classList.remove("hidden");
};

window.loadBookList = async () => {
  const keys = await idbKeyval.keys();
  const books = keys.filter(k => k.startsWith("book_"));
  bookList.innerHTML = books.length ? books.map(k => {
    const title = k.replace("book_", "");
    return `<div class="book-item" onclick="openBook('${title}')">${title}</div>`;
  }).join("") : "<p>کتابی وجود ندارد.</p>";
};

window.openBook = async (title) => {
  const data = await idbKeyval.get(`book_${title}`);
  if (!data) return;
  const file = new Blob([data], { type: "application/epub+zip" });
  await epubManager.loadBook(file, title);
  readerSection.classList.remove("hidden");
};

window.addEventListener("text-selected", (e) => {
  const { cfiRange, text } = e.detail;
  const noteText = prompt("متن یادداشت خود را وارد کنید:");
  if (noteText) {
    notesManager.addNote("book", cfiRange, text, noteText);
    notesPanel.classList.remove("hidden");
  }
});

addNoteBtn.onclick = () => notesPanel.classList.toggle("hidden");
closeNotesBtn.onclick = () => notesPanel.classList.add("hidden");

window.onload = () => {
  notesManager.loadNotes();
  loadBookList();
};
