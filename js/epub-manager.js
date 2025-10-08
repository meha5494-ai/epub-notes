// js/epub-manager.js

// دسترسی به NoteManager از فضای گلوبال
const NotesManager = window.NotesManager;

// DOM Elements (دسترسی مستقیم، زیرا در زمان بارگذاری موجود هستند)
const bookContainer = document.getElementById('book-container');
const loadingOverlay = document.getElementById('loading-overlay');
const popover = document.getElementById('add-note-popover');
const notesSheet = document.getElementById('notes-sheet');
const noteTextInput = document.getElementById('note-text-input');

// Global variables for EPUB state (Local to this script)
let currentBook = null;
let currentRendition = null;
let currentBookId = null;
let currentCfiRange = null;     // متغیرهای وضعیت پاپ‌اوور
let currentContextText = null;  // متغیرهای وضعیت پاپ‌اوور


/**
 * مدیریت خواندن EPUB (epub.js)
 * تعریف شیء EpubManager در فضای گلوبال (window)
 */
window.EpubManager = {
    loadEpub: async (bookId, epubFile, bookTitle) => {
        currentBookId = bookId;
        
        document.getElementById('reader-title').textContent = bookTitle;
        loadingOverlay.classList.remove('hidden');
        bookContainer.innerHTML = ''; 

        try {
            // ePub یک تابع گلوبال است که توسط CDN فراهم شده
            currentBook = new ePub(epubFile);

            currentRendition = currentBook.renderTo('book-container', {
                width: '100%',
                height: '100%',
                method: 'scrolled-doc',
                manager: 'default'
            });

            await currentRendition.display();

            currentRendition.on('rendered', (section, view) => {
                const doc = view.document;
                if (doc) {
                    doc.documentElement.setAttribute('dir', 'rtl');
                    doc.body.style.fontFamily = 'Vazirmatn, sans-serif';
                    doc.body.style.direction = 'rtl';
                    doc.body.style.textAlign = 'justify';
                }
            });

            loadingOverlay.classList.add('hidden');

            window.EpubManager.setupSelectionHandler();
            
            return currentRendition;

        } catch (error) {
            console.error('Error loading EPUB:', error);
            loadingOverlay.textContent = 'خطا در بارگذاری کتاب.';
        }
    },

    extractBookMetadata: async (file) => {
        const book = new ePub(file);
        const bookId = file.name + file.size + file.lastModified; 

        await book.opened;
        const metadata = book.metadata;
        
        let coverDataUrl = null;
        try {
            const cover = await book.coverUrl();
            coverDataUrl = cover;
        } catch (e) {
            console.warn('Could not extract cover image:', e);
        }

        return {
            id: bookId,
            title: metadata.title || file.name.replace('.epub', ''),
            author: metadata.creator || 'ناشناس',
            cover: coverDataUrl,
            epubFile: file
        };
    },

    setupSelectionHandler: () => {
        if (!currentRendition) return;

        currentRendition.on('selected', (cfiRange, contents) => {
            const text = currentRendition.getRange(cfiRange).toString().trim();
            
            if (text.length > 0) {
                // نمایش Popover
                window.EpubManager.showAddNotePopover(cfiRange, text, contents); 
            } else {
                window.EpubManager.clearSelection();
            }
        });
        
        // Highlight existing notes
        currentRendition.hooks.render.register(async (contents) => {
            const notes = await NotesManager.getNotes(currentBookId);
            notes.forEach(note => {
                if (note.cfiRange) {
                    currentRendition.annotations.highlight(note.cfiRange, { 'fill': 'yellow', 'opacity': '0.3' }, (e) => {
                        if (e.target.tagName === 'A') return; 
                        window.EpubManager.showNotesSheet();
                    }, 'epub-note-highlight');
                }
            });
        });

        // Add CSS for highlight to iframe
        currentRendition.on('added', (section, view) => {
            const doc = view.document;
            const style = doc.createElement('style');
            // از CSS Variables اصلی برای تم روشن/تیره استفاده می‌کند
            style.textContent = `
                .epub-note-highlight {
                    background-color: var(--highlight-color, rgba(0, 122, 255, 0.3)) !important; 
                    cursor: pointer;
                    direction: rtl;
                }
                body {
                    background-color: var(--bg-color); 
                    color: var(--text-color);
                }
            `;
            doc.head.appendChild(style);
        });
    },
    
    clearSelection: () => {
        if (currentRendition) {
            currentRendition.getSelection().removeAllRanges();
            window.EpubManager.hideAddNotePopover();
        }
    },
    
    showNotesSheet: () => {
        notesSheet.classList.add('visible');
    },
    
    hideNotesSheet: () => {
        notesSheet.classList.remove('visible');
    },

    getCurrentBookId: () => currentBookId,
    getCurrentRendition: () => currentRendition,

    // ------------------- Popover Management -------------------
    
    showAddNotePopover: (cfiRange, contextText, contents) => {
        currentCfiRange = cfiRange;
        currentContextText = contextText;
        noteTextInput.value = '';
        
        // Logic for positioning Popover
        const selection = contents.window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const iframeRect = contents.iframe.getBoundingClientRect();
            
            const posX = iframeRect.left + rect.left + (rect.width / 2);
            const posY = iframeRect.top + rect.bottom;
            
            popover.style.left = '50%';
            popover.style.transform = 'translate(-50%, -50%)';
            popover.style.top = `${posY + 20}px`;
            
            // If the popover goes off the bottom of the screen, move it above the selection
            if (posY + popover.offsetHeight > window.innerHeight) {
                popover.style.top = `${iframeRect.top + rect.top - popover.offsetHeight - 20}px`;
            }
        }
        
        popover.classList.add('visible');
        noteTextInput.focus();
    },

    hideAddNotePopover: () => {
        popover.classList.remove('visible');
        currentCfiRange = null;
        currentContextText = null;
    },

    getCurrentNoteData: () => ({
        cfiRange: currentCfiRange,
        contextText: currentContextText
    })
};
