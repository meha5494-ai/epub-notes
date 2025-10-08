document.addEventListener("DOMContentLoaded", () => {
  const uploadBtn = document.getElementById("upload-btn");
  const bookUpload = document.getElementById("book-upload");
  const booksContainer = document.getElementById("books-container");
  const readerSection = document.getElementById("reader-section");
  const backBtn = document.getElementById("back-btn");
  const addNoteBtn = document.getElementById("add-note-btn");
  const notesPanel = document.getElementById("notes-panel");
  const themeToggle = document.getElementById("theme-toggle");

  // تم روشن/تیره
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });

  // بارگذاری لیست کتاب‌ها
  async function loadBooks() {
    const keys = await idbKeyval.keys();
    booksContainer.innerHTML = "";

    for (const key of keys) {
      if (key.startsWith("book_")) {
        const bookInfo = await idbKeyval.get(key);
        const card = document.createElement("div");
        card.className = "book-card";
        card.innerHTML = `
          <img src="${bookInfo.cover}" class="book-cover" alt="cover">
          <div class="book-title">${bookInfo.name}</div>
        `;
        card.addEventListener("click", () => openBook(bookInfo));
        booksContainer.appendChild(card);
      }
    }

    if (!booksContainer.innerHTML) {
      booksContainer.innerHTML = `<p style="text-align:center;">📖 هنوز کتابی اضافه نکردی</p>`;
    }
  }

  loadBooks();

  uploadBtn.addEventListener("click", () => bookUpload.click());
  bookUpload.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    await book.ready;

    const coverUrl = await book.archive.createUrl(await book.coverUrl());
    const name = file.name.replace(".epub", "");
    const data = await book.archive.zip.generateAsync({ type: "arraybuffer" });

    await idbKeyval.set(`book_${Date.now()}`, { name, data, cover: coverUrl });
    loadBooks();
  });

  async function openBook(bookInfo) {
    readerSection.classList.remove("hidden");
    document.querySelector(".book-list").classList.add("hidden");

    const book = ePub(bookInfo.data);
    const rendition = book.renderTo("viewer", { width: "100%", height: "100%" });
    await rendition.display();
  }

  backBtn.addEventListener("click", () => {
    readerSection.classList.add("hidden");
    document.querySelector(".book-list").classList.remove("hidden");
  });

  addNoteBtn.addEventListener("click", () => {
    notesPanel.classList.toggle("hidden");
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js")
      .then(() => console.log("✅ SW Registered"))
      .catch(err => console.warn("SW Error:", err));
  }
});
