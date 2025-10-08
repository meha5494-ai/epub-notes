// js/epub-manager.js

// Global variables for EPUB state
let currentBook = null;
let currentRendition = null;
let currentBookId = null;
let isSelectingText = false;

const readerArea = document.getElementById('reader-area');
const bookContainer = document.getElementById('book-container');
const loadingOverlay = document.getElementById('loading-overlay');
const popover = document.getElementById('add-note-popover');
const notesSheet = document.getElementById('notes-sheet');

/**
 * مدیریت خواندن EPUB (epub.js)
 */
export const EpubManager = {
    // بارگذاری فایل EPUB و نمایش آن
    loadEpub: async (bookId, epubFile, bookTitle) => {
        currentBookId = bookId;
        
        // Show loading and update title
        document.getElementById('reader-title').textContent = bookTitle;
        loadingOverlay.classList.remove('hidden');
        bookContainer.innerHTML = ''; // Clear previous book

        try {
            // 1. Create a Book object from the Blob
            currentBook = new ePub(epubFile);

            // 2. Create a Rendition (renderer)
            currentRendition = currentBook.renderTo('book-container', {
                width: '100%',
                height: '100%',
                // Use scrolled-doc for a smooth, web-like scrolling experience (mobile friendly)
                method: 'scrolled-doc',
                manager: 'default'
            });

            // 3. Display the book
            await currentRendition.display();

            // 4. Set RTL direction for rendered content
            currentRendition.on('rendered', (section, view) => {
                const doc = view.document;
                if (doc) {
                    doc.documentElement.setAttribute('dir', 'rtl');
                    doc.body.style.fontFamily = 'Vazirmatn, sans-serif';
                    doc.body.style.direction = 'rtl';
                    doc.body.style.textAlign = 'justify';
                }
            });

            // 5. Hide loading
            loadingOverlay.classList.add('hidden');

            // 6. Setup text selection for note creation
            EpubManager.setupSelectionHandler();
            
            return currentRendition;

        } catch (error) {
            console.error('Error loading EPUB:', error);
            loadingOverlay.textContent = 'خطا در بارگذاری کتاب.';
        }
    },

    // بازیابی جزئیات کتاب برای نمایش در کارت (جلد و عنوان)
    extractBookMetadata: async (file) => {
        const book = new ePub(file);
        
        // Use File properties for a simple unique ID
        const bookId = file.name + file.size + file.lastModified; 

        // Wait for metadata to be parsed
        await book.opened;
        const metadata = book.metadata;
        const coverUrl = await book.loaded.cover;
        
        let coverDataUrl = null;
        if (coverUrl) {
            try {
                // Get the cover image as a Blob and convert to Data URL
                const cover = await book.coverUrl();
                coverDataUrl = cover; // epub.js coverUrl() often returns an object URL or Data URL directly
            } catch (e) {
                console.warn('Could not extract cover image:', e);
            }
        }

        return {
            id: bookId,
            title: metadata.title || file.name.replace('.epub', ''),
            author: metadata.creator || 'ناشناس',
            cover: coverDataUrl,
            epubFile: file // The original file will be stored in IndexedDB
        };
    },

    // تنظیمات رویداد انتخاب متن برای یادداشت‌برداری
    setupSelectionHandler: () => {
        if (!currentRendition) return;

        currentRendition.on('selected', (cfiRange, contents) => {
            isSelectingText = true;
            // Get the text of the selection
            const text = currentRendition.getRange(cfiRange).toString().trim();
            
            if (text.length > 0) {
                // Show the popover for adding a note
                showAddNotePopover(cfiRange, text, contents);
            } else {
                EpubManager.clearSelection();
            }
            isSelectingText = false;
        });
        
        // Highlight existing notes when rendering
        currentRendition.hooks.render.register(async (contents) => {
            const notes = await NotesManager.getNotes(currentBookId);
            notes.forEach(note => {
                if (note.cfiRange) {
                    currentRendition.annotations.highlight(note.cfiRange, { 'fill': 'yellow', 'opacity': '0.3' }, (e) => {
                        // Click handler for highlights - opens the note sheet
                        if (e.target.tagName === 'A') return; // Avoid links
                        EpubManager.showNotesSheet();
                    }, 'epub-note-highlight');
                }
            });
        });

        // Add CSS for highlight to iframe
        currentRendition.on('added', (section, view) => {
            const doc = view.document;
            const style = doc.createElement('style');
            style.textContent = `
                .epub-note-highlight {
                    background-color: var(--highlight-color, rgba(0, 122, 255, 0.3)) !important;
                    cursor: pointer;
                    direction: rtl;
                }
            `;
            doc.head.appendChild(style);
        });
    },
    
    // پاک کردن انتخاب متن
    clearSelection: () => {
        if (currentRendition) {
            currentRendition.getSelection().removeAllRanges();
            hideAddNotePopover();
        }
    },
    
    // نمایش پنل یادداشت‌ها
    showNotesSheet: () => {
        notesSheet.classList.add('visible');
    },
    
    // بستن پنل یادداشت‌ها
    hideNotesSheet: () => {
        notesSheet.classList.remove('visible');
    },

    // دریافت ID کتاب فعلی
    getCurrentBookId: () => currentBookId,
    
    // دریافت Rendition فعلی
    getCurrentRendition: () => currentRendition
};

// ------------------- Popover Logic -------------------
const noteTextInput = document.getElementById('note-text-input');
let currentCfiRange = null;
let currentContextText = null;

const showAddNotePopover = (cfiRange, contextText, contents) => {
    currentCfiRange = cfiRange;
    currentContextText = contextText;
    noteTextInput.value = '';
    
    // Determine the position to display the popover near the selection
    const selection = contents.window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const iframeRect = contents.iframe.getBoundingClientRect();
        
        // Calculate position relative to the main window
        const posX = iframeRect.left + rect.left + (rect.width / 2);
        const posY = iframeRect.top + rect.bottom;
        
        // Center the popover horizontally
        popover.style.left = '50%';
        popover.style.transform = 'translate(-50%, -50%)';
        
        // Position vertically, avoiding the header/footer
        popover.style.top = `${posY + 20}px`;
        
        // If it goes off the bottom, position it above the selection
        if (posY + popover.offsetHeight > window.innerHeight) {
            popover.style.top = `${iframeRect.top + rect.top - popover.offsetHeight - 20}px`;
        }
    }
    
    popover.classList.add('visible');
    noteTextInput.focus();
};

const hideAddNotePopover = () => {
    popover.classList.remove('visible');
    currentCfiRange = null;
    currentContextText = null;
};


// Note: Event listeners for save/cancel are in main.js
