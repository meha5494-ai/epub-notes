class EpubManager {
  constructor() {
    this.currentBook = null;
    this.rendition = null;
  }

  async loadBook(file, title) {
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    this.currentBook = book;

    const viewer = document.getElementById("viewer");
    viewer.innerHTML = "";

    this.rendition = book.renderTo(viewer, {
      width: "100%",
      height: "100%",
      spread: "none",
      flow: "paginated"
    });

    await this.rendition.display();
    this.rendition.on("selected", this.handleSelection.bind(this));

    // ذخیره در IndexedDB
    await idbKeyval.set(`book_${title}`, arrayBuffer);
    window.loadBookList();
  }

  handleSelection(cfiRange, contents) {
    const text = contents.window.getSelection().toString();
    if (text.trim()) {
      window.dispatchEvent(new CustomEvent("text-selected", {
        detail: { cfiRange, text }
      }));
    }
  }

  highlightText(cfiRange, color = "#fde047") {
    this.rendition.annotations.add("highlight", cfiRange, { fill: color });
  }
}

window.epubManager = new EpubManager();
