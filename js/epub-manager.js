const bookContainer = document.getElementById('book-container');

let currentBook = null;
let currentRendition = null;

const EpubManager = {
    // 📚 بارگذاری و نمایش EPUB
    loadEpub: async (id, file, title) => {
        bookContainer.innerHTML = '';

        try {
            // ایجاد ناحیه نمایش کتاب
            const contentDiv = document.createElement('div');
            contentDiv.id = 'epub-content';
            contentDiv.style.cssText = `width: 100%; height: 100%;`;
            bookContainer.appendChild(contentDiv);

            // ایجاد کتاب EPUB
            currentBook = ePub(file);
            currentRendition = currentBook.renderTo(contentDiv, {
                width: "100%",
                height: "100%",
                flow: "scrolled-doc",
            });

            // نمایش کتاب
            await currentRendition.display();

            // ✅ بررسی موقعیت آخر مطالعه
            const lastLocation = localStorage.getItem(`book_progress_${id}`);
            if (lastLocation) {
                await currentRendition.display(lastLocation);
            }

            // ✅ ذخیره موقعیت مطالعه هنگام تغییر صفحه
            currentRendition.on("relocated", (location) => {
                if (location && location.start && location.start.cfi) {
                    localStorage.setItem(`book_progress_${id}`, location.start.cfi);
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

    // ✅ استخراج اطلاعات کتاب + تبدیل به Base64 برای ذخیره پایدار
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
        try {
            coverData = await book.coverUrl();
        } catch (e) {
            console.warn('no cover', e);
        }

        return {
            id: bookId,
            title: file.name.replace('.epub', ''),
            author: 'ناشناس',
            cover: coverData,
            dataUrl: bookDataUrl
        };
    },

    // 📊 پیشرفت مطالعه
    updateProgress: (percent) => {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `${Math.round(percent)}%`;
    },

    // 📄 اطلاعات صفحه فعلی
    updatePageInfo: (current, total) => {
        const pageInfo = document.getElementById('page-info');
        const pageInfoNav = document.getElementById('page-info-nav');
        if (pageInfo) pageInfo.textContent = `صفحه ${current} از ${total}`;
        if (pageInfoNav) pageInfoNav.textContent = `صفحه ${current} از ${total}`;
    },

    // 🧠 مایندمپ
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
