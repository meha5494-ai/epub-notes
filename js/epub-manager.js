const bookContainer = document.getElementById('book-container');

let currentBook = null;
let currentRendition = null;
let currentBookId = null;

const EpubManager = {
    loadEpub: async (id, file, title) => {
        bookContainer.innerHTML = '';
        currentBookId = id;

        try {
            const contentDiv = document.createElement('div');
            contentDiv.id = 'epub-content';
            contentDiv.style.cssText = `
                width: 100%;
                height: 100%;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
            `;
            bookContainer.appendChild(contentDiv);

            currentBook = ePub(file);
            currentRendition = currentBook.renderTo("epub-content", {
                width: "100%",
                height: "100%",
                flow: "scrolled-doc",
                manager: "continuous"
            });

            // اعمال CSS به محتوای کتاب بعد از لود
            currentRendition.hooks.content.register((contents) => {
                const doc = contents.document;
                if (!doc) return;
                doc.documentElement.style.overflow = 'hidden';
                doc.body.style.direction = 'rtl';
                doc.body.style.fontFamily = 'Vazirmatn, sans-serif';
                doc.body.style.lineHeight = '1.8';
                doc.body.style.fontSize = '16px';
                doc.body.style.color = '#1e293b';
                doc.body.style.padding = '20px';
                doc.body.style.overflow = 'auto';
            });

            // نمایش آخرین موقعیت مطالعه
            const lastLocation = localStorage.getItem(`book_progress_${id}`);
            if (lastLocation) {
                await currentRendition.display(lastLocation);
            } else {
                await currentRendition.display();
            }

            // ذخیره موقعیت مطالعه در هر تغییر
            currentRendition.on("relocated", (location) => {
                if (location && location.start && location.start.cfi) {
                    localStorage.setItem(`book_progress_${currentBookId}`, location.start.cfi);
                }
            });

            // واکنش به تغییر اندازه صفحه و بازخوانی موقعیت
            window.addEventListener('resize', async () => {
                if (currentRendition) {
                    const loc = localStorage.getItem(`book_progress_${currentBookId}`);
                    if (loc) await currentRendition.display(loc);
                }
            });

            return currentRendition;

        } catch (e) {
            console.error('Error loading EPUB:', e);
            bookContainer.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>خطا در بارگذاری کتاب</h3>
                    <p>متاسفانه در بارگذاری کتاب مشکلی پیش آمد</p>
                    <button class="retry-btn" onclick="location.reload()">
                        <i class="fas fa-redo"></i> تلاش مجدد
                    </button>
                </div>`;
        }
    },

    extractBookMetadata: async (file) => {
        const toBase64 = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const bookDataUrl = await toBase64(file);
        const bookId = file.name + file.size + file.lastModified;
        const book = ePub(file);
        await book.opened;

        let coverData = null;
        try { coverData = await book.coverUrl(); } catch (e) { console.warn('no cover', e); }

        return {
            id: bookId,
            title: file.name.replace('.epub', ''),
            author: 'ناشناس',
            cover: coverData,
            dataUrl: bookDataUrl
        };
    },

    updateProgress: (percent) => {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `${Math.round(percent)}%`;
    },

    updatePageInfo: (current, total) => {
        const pageInfo = document.getElementById('page-info');
        const pageInfoNav = document.getElementById('page-info-nav');
        if (pageInfo) pageInfo.textContent = `صفحه ${current} از ${total}`;
        if (pageInfoNav) pageInfoNav.textContent = `صفحه ${current} از ${total}`;
    },

    showMindmap: async () => {
        if (!currentBook) return;
        try {
            const toc = await currentBook.loaded.spine.getToc();
            const mindmapContent = document.getElementById('mindmap-content');
            const mindmapData = {
                name: "کتاب",
                children: toc.map(item => ({
                    name: item.label,
                    children: item.subitems ? item.subitems.map(sub => ({ name: sub.label })) : []
                }))
            };
            const width = 300;
            const height = 400;
            mindmapContent.innerHTML = '';
            const svg = d3.select("#mindmap-content")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${width/2}, 20)`);
            const root = d3.hierarchy(mindmapData);
            const treeLayout = d3.tree().size([width - 100, height - 100]);
            treeLayout(root);
            svg.selectAll(".link")
                .data(root.links())
                .enter()
                .append("path")
                .attr("class", "link")
                .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y));
            const node = svg.selectAll(".node")
                .data(root.descendants())
                .enter()
                .append("g")
                .attr("class", "node")
                .attr("transform", d => `translate(${d.x},${d.y})`);
            node.append("circle")
                .attr("r", 6)
                .style("fill", d => d.children ? "#6366f1" : "#ec4899");
            node.append("text")
                .attr("dy", "0.31em")
                .attr("x", d => d.children ? -10 : 10)
                .style("text-anchor", d => d.children ? "end" : "start")
                .text(d => d.data.name)
                .style("font-size", "12px");
        } catch (error) {
            console.error('Error generating mindmap:', error);
            document.getElementById('mindmap-content').innerHTML = `
                <div class="mindmap-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>در ایجاد مایند مپ خطایی رخ داد</p>
                </div>
            `;
        }
    },

    prev: () => { if (currentRendition) currentRendition.prev(); },
    next: () => { if (currentRendition) currentRendition.next(); },
};

window.EpubManager = EpubManager;
