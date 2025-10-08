class EpubManager {
  constructor() {
    this.book = null;
    this.rendition = null;
    this.currentBookId = null;
    console.log("📚 EpubManager آماده است");
  }

  async loadBookFromData(bookData, bookId) {
    try {
      console.log("در حال باز کردن کتاب...");
      this.book = ePub(bookData);
      this.currentBookId = bookId;

      const viewer = document.getElementById("viewer");
      viewer.innerHTML = "";

      this.rendition = this.book.renderTo(viewer, {
        width: "100%",
        height: "100%",
        spread: "none",
        flow: "paginated"
      });

      await this.rendition.display();
      console.log("✅ کتاب با موفقیت نمایش داده شد");

      // فعال‌سازی انتخاب متن
      this.enableTextSelection();

    } catch (error) {
      console.error("❌ خطا در باز کردن کتاب:", error);
      alert("خطا در بارگذاری کتاب");
    }
  }

  enableTextSelection() {
    if (!this.rendition) return;

    this.rendition.on("selected", (cfiRange, contents) => {
      const selectedText = contents.window.getSelection().toString();
      if (selectedText.trim()) {
        console.log("📄 متن انتخاب شد:", selectedText);
        window.dispatchEvent(new CustomEvent("text-selected", {
          detail: { cfiRange, text: selectedText }
        }));
      }
      this.rendition.annotations.remove(cfiRange, "highlight");
    });
  }

  highlightText(cfiRange, color = "#ffeb3b") {
    if (!this.rendition) return;
    this.rendition.annotations.add("highlight", cfiRange, {}, null, { fill: color, "fill-opacity": "0.4" });
  }
}

window.epubManager = new EpubManager();
