const bookContainer = document.getElementById('book-container');

let currentBook = null;
let currentRendition = null;

const EpubManager = {
    loadEpub: async (id, fileOrDataUrl, title) => {
        bookContainer.innerHTML = '';

        try {
            // ✅ آماده‌سازی محیط نمایش کتاب
            const contentDiv = document.createElement('div');
            contentDiv.id = 'epub-content';
            contentDiv.style.cssText = `
                width: 100%;
                height: 100%;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
                position: relative;
            `;
            bookContainer.appendChild(contentDiv);

            // ✅ تشخیص اینکه فایل Blob است یا Base64
            let source;
            if (typeof fileOrDataUrl === 'string') {
                // از Base64 (برای بعد از رفرش)
                const res = await fetch(fileOrDataUrl);
                const blob = await res.blob();
                source = blob;
            } else {
                // از فایل آپلودشده
                source = fileOrDataUrl;
            }

            // ✅ ساخت کتاب
            currentBook = ePub(source);
            currentRendition = currentBook.renderTo("epub-content", {
                width: "100%",
                height: "100%",
                flow: "scrolled-doc",
                manager: "continuous"
            });

            // ✅ اگر کاربر قبلاً این کتاب رو باز کرده، ادامه از همان صفحه
            const lastLocation = localStorage.getItem(`book_location_${id}`);
            if (lastLocation) {
                await currentRendition.display(lastLocation);
            } else {
                await currentRendition.display();
            }

            // ✅ ذخیره موقعیت جدید هنگام ورق زدن
            currentRendition.on("relocated", (location) => {
                if (location && location.start && location.start.cfi) {
                    localStorage.setItem(`book_location_${id}`, location.start.cfi);
                }
            });

            // ✅ استایل‌دهی به iframe
            setTimeout(() => {
                const iframe = document.querySelector('#epub-content iframe');
                if (iframe) {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc && iframeDoc.body) {
                        iframeDoc.body.style.direction = 'rtl';
                        iframeDoc.body.style.fontFamily = 'Vazirmatn, sans-serif';
                        iframeDoc.body.style.lineHeight = '1.8';
                        iframeDoc.body.style.fontSize = '16px';
                        iframeDoc.body.style.color = '#1e293b';
                        iframeDoc.body.style.padding = '20px';
                        iframe.style.border = 'none';
                    }
                }
            }, 800);
        } catch (e) {
            console.error('Error loading EPUB:', e);
            bookContainer.innerHTML = `
                <div style="padding:40px;text-align:center;color:#dc2626">
                    <h3>خطا در بارگذاری کتاب</h3>
                    <p>مشکلی در نمایش کتاب پیش آمد</p>
                    <button onclick="location.reload()">تلاش مجدد</button>
                </div>`;
        }
    },

    // ✅ استخراج متادیتا و ذخیره Base64 در localStorage
    extractBookMetadata: async (file) => {
        const toBase64 = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const dataUrl = await toBase64(file);
        const id = `${file.name}_${file.size}_${file.lastModified}`;
        const book = ePub(file);
        await book.opened;

        let coverData = null;
        try {
            coverData = await book.coverUrl();
        } catch {
            console.warn("No cover found");
        }

        return {
            id,
            title: file.name.replace('.epub', ''),
            author: 'ناشناس',
            cover: coverData,
            dataUrl // 👈 فایل واقعی Base64
        };
    },

    prev: () => { if (currentRendition) currentRendition.prev(); },
    next: () => { if (currentRendition) currentRendition.next(); }
};

window.EpubManager = EpubManager;
