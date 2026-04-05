// === 全局状态 ===
let currentBook = null;
let currentRendition = null;
let currentBookTitle = '';
let currentBookFilename = '';
let popupState = {
    word: '',
    sentence: '',
    translation: '',
    cfi: ''
};
let selectionState = {
    text: '',
    sentence: '',
    cfiRange: '',
    pageX: 0,
    pageY: 0
};

// === 书架 ===
async function loadLibrary() {
    const resp = await fetch('/api/books');
    const books = await resp.json();
    const list = document.getElementById('book-list');

    if (books.length === 0) {
        list.innerHTML = '<p class="hint">将 .epub 文件放入 books/ 文件夹，然后刷新页面</p>';
        return;
    }

    list.innerHTML = books.map(b => `
        <div class="book-card" onclick="openBook('${b.filename}', '${b.title}')">
            <div class="book-icon">📖</div>
            <div class="book-name">${b.title}</div>
        </div>
    `).join('');
}

// === 打开书籍 ===
async function openBook(filename, title) {
    document.getElementById('library-view').style.display = 'none';
    document.getElementById('reader-view').style.display = 'block';
    document.getElementById('book-title-bar').textContent = title;
    currentBookTitle = title;
    currentBookFilename = filename;

    // 清理之前的
    if (currentBook) {
        currentBook.destroy();
    }
    document.getElementById('viewer').innerHTML = '';

    currentBook = ePub(`/books/${filename}`);
    currentRendition = currentBook.renderTo('viewer', {
        width: '100%',
        height: '100%',
        spread: 'none'
    });

    // 读取上次阅读位置
    const savedPosition = localStorage.getItem(`reading-pos-${filename}`);
    if (savedPosition) {
        currentRendition.display(savedPosition);
    } else {
        currentRendition.display();
    }

    // 监听位置变化，保存进度
    currentRendition.on('relocated', (location) => {
        localStorage.setItem(`reading-pos-${filename}`, location.start.cfi);
        if (currentBook.locations && currentBook.locations.length()) {
            const progress = currentBook.locations.percentageFromCfi(location.start.cfi);
            document.getElementById('progress-slider').value = Math.round(progress * 100);
            document.getElementById('progress-display').textContent = Math.round(progress * 100) + '%';
        }
    });

    // 生成位置信息
    currentBook.ready.then(() => {
        return currentBook.locations.generate(1600);
    });

    // 加载已保存的高亮并渲染
    await loadAndApplyHighlights(filename);

    // 每次翻页后重新应用高亮
    currentRendition.on('relocated', () => {
        applyHighlightsToRendition();
    });

    // 注入事件到 epub iframe
    currentRendition.hooks.content.register((contents) => {
        const doc = contents.document;

        // 点击英文段落 → 展开/收起中文翻译
        doc.addEventListener('click', (e) => {
            const enPara = e.target.closest('p.en');
            if (enPara) {
                const cn = enPara.nextElementSibling;
                if (cn && cn.classList.contains('cn')) {
                    cn.classList.toggle('show');
                    return; // 点击英文段落只触发中文展开，不触发翻译
                }
            }

            // 如果有选中文本，不触发单词翻译
            const sel = doc.getSelection();
            if (sel && sel.toString().trim().length > 0) return;

            hideHighlightToolbar();
            const word = getWordAtPoint(doc, e.clientX, e.clientY);
            if (word && word.text.length > 1 && /[a-zA-Z]/.test(word.text)) {
                const iframe = document.querySelector('#viewer iframe');
                const rect = iframe.getBoundingClientRect();
                const pageX = rect.left + e.clientX;
                const pageY = rect.top + e.clientY;

                showPopup(word.text, word.sentence, pageX, pageY);
                translateWord(word.text, word.sentence);
            }
        });

        // 选中文本 → 显示高亮工具栏
        doc.addEventListener('mouseup', (e) => {
            const selection = doc.getSelection();
            const text = selection ? selection.toString().trim() : '';
            if (text && text.length > 1) {
                const iframe = document.querySelector('#viewer iframe');
                const rect = iframe.getBoundingClientRect();
                const pageX = rect.left + e.clientX;
                const pageY = rect.top + e.clientY;

                // 获取 CFI range
                const range = selection.getRangeAt(0);
                const cfiRange = currentRendition.currentLocation()
                    ? contents.cfiFromRange(range)
                    : '';

                const sentence = getSentenceFromSelection(doc, selection);

                selectionState = {
                    text: text,
                    sentence: sentence,
                    cfiRange: cfiRange,
                    pageX: pageX,
                    pageY: pageY
                };

                showHighlightToolbar(pageX, pageY);
            }
        });
    });

    // 键盘翻页
    currentRendition.on('keyup', handleKeyPress);
    document.addEventListener('keyup', handleKeyPress);
}

// === 高亮相关 ===
let savedHighlights = [];

async function loadAndApplyHighlights(filename) {
    try {
        const resp = await fetch(`/api/highlights/${encodeURIComponent(filename)}`);
        savedHighlights = await resp.json();
        applyHighlightsToRendition();
    } catch (e) {
        savedHighlights = [];
    }
}

function applyHighlightsToRendition() {
    if (!currentRendition || !savedHighlights.length) return;

    const colorMap = {
        yellow: 'rgba(255, 243, 168, 0.5)',
        green: 'rgba(184, 240, 184, 0.5)',
        blue: 'rgba(168, 212, 255, 0.5)',
        pink: 'rgba(255, 184, 212, 0.5)'
    };

    savedHighlights.forEach(h => {
        if (h.cfiRange) {
            try {
                currentRendition.annotations.highlight(
                    h.cfiRange, {},
                    () => {}, '',
                    { 'fill': colorMap[h.color] || colorMap.yellow, 'fill-opacity': '0.5' }
                );
            } catch (e) {
                // 忽略无效的 CFI
            }
        }
    });
}

function showHighlightToolbar(x, y) {
    const toolbar = document.getElementById('highlight-toolbar');
    toolbar.style.display = 'flex';
    toolbar.style.left = (x - 80) + 'px';
    toolbar.style.top = (y - 45) + 'px';

    // 确保不超出屏幕
    const rect = toolbar.getBoundingClientRect();
    if (rect.left < 10) toolbar.style.left = '10px';
    if (rect.right > window.innerWidth - 10) {
        toolbar.style.left = (window.innerWidth - rect.width - 10) + 'px';
    }
}

function hideHighlightToolbar() {
    document.getElementById('highlight-toolbar').style.display = 'none';
}

async function addHighlight(color) {
    if (!selectionState.text || !currentBookFilename) return;

    hideHighlightToolbar();

    try {
        const resp = await fetch(`/api/highlights/${encodeURIComponent(currentBookFilename)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cfiRange: selectionState.cfiRange,
                text: selectionState.text,
                color: color
            })
        });
        const highlight = await resp.json();
        savedHighlights.push(highlight);

        // 立即在页面上显示高亮
        const colorMap = {
            yellow: 'rgba(255, 243, 168, 0.5)',
            green: 'rgba(184, 240, 184, 0.5)',
            blue: 'rgba(168, 212, 255, 0.5)',
            pink: 'rgba(255, 184, 212, 0.5)'
        };

        if (selectionState.cfiRange) {
            try {
                currentRendition.annotations.highlight(
                    selectionState.cfiRange, {},
                    () => {}, '',
                    { 'fill': colorMap[color] || colorMap.yellow, 'fill-opacity': '0.5' }
                );
            } catch (e) {}
        }
    } catch (e) {
        console.error('保存高亮失败', e);
    }
}

function translateSelection() {
    hideHighlightToolbar();
    if (selectionState.text) {
        showPopup(selectionState.text, selectionState.sentence,
                  selectionState.pageX, selectionState.pageY);
        translateWord(selectionState.text, selectionState.sentence);
    }
}

// 点击其他地方关闭高亮工具栏
document.addEventListener('mousedown', (e) => {
    const toolbar = document.getElementById('highlight-toolbar');
    if (toolbar.style.display !== 'none' && !toolbar.contains(e.target)) {
        hideHighlightToolbar();
    }
});

// === 读书笔记页面 ===
async function showNotes() {
    document.getElementById('library-view').style.display = 'none';
    document.getElementById('notes-view').style.display = 'block';

    // 加载所有高亮
    const resp = await fetch('/api/highlights');
    const allHighlights = await resp.json();

    // 填充书籍筛选下拉框
    const bookFilter = document.getElementById('notes-book-filter');
    const bookNames = Object.keys(allHighlights);
    bookFilter.innerHTML = '<option value="all">All Books</option>' +
        bookNames.map(fn => `<option value="${escapeHtml(fn)}">${escapeHtml(fn.replace('.epub',''))}</option>`).join('');

    renderNotes(allHighlights);
}

function filterNotes() {
    fetch('/api/highlights').then(r => r.json()).then(allHighlights => {
        const bookFilter = document.getElementById('notes-book-filter').value;
        const colorFilter = document.getElementById('notes-color-filter').value;

        // 按书籍筛选
        let filtered = {};
        if (bookFilter === 'all') {
            filtered = allHighlights;
        } else {
            if (allHighlights[bookFilter]) {
                filtered[bookFilter] = allHighlights[bookFilter];
            }
        }

        // 按颜色筛选
        if (colorFilter !== 'all') {
            for (const key of Object.keys(filtered)) {
                filtered[key] = filtered[key].filter(h => h.color === colorFilter);
            }
        }

        renderNotes(filtered);
    });
}

function renderNotes(allHighlights) {
    const list = document.getElementById('notes-list');
    let totalCount = 0;
    let html = '';

    for (const [filename, highlights] of Object.entries(allHighlights)) {
        if (!highlights.length) continue;
        totalCount += highlights.length;
        const bookName = filename.replace('.epub', '');

        html += `<div class="notes-book-section">`;
        html += `<div class="notes-book-title">📚 ${escapeHtml(bookName)}</div>`;

        highlights.forEach(h => {
            html += `
                <div class="note-card">
                    <div class="note-card-highlight color-${h.color}">${escapeHtml(h.text)}</div>
                    <div class="note-card-meta">
                        <span>${h.date}</span>
                        <span>
                            ${h.cfiRange ? `<span class="jump-link" onclick="jumpToHighlight('${escapeAttr(filename)}', '${escapeAttr(bookName)}', '${escapeAttr(h.cfiRange)}')">Jump to source →</span>` : ''}
                            <button class="note-delete" onclick="event.stopPropagation(); deleteHighlight('${escapeAttr(filename)}', '${escapeAttr(h.id)}')" title="删除">×</button>
                        </span>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
    }

    if (totalCount === 0) {
        list.innerHTML = '<p class="notes-empty">No highlights yet. Select text while reading to highlight it.</p>';
    } else {
        list.innerHTML = `<div class="notes-count">${totalCount} highlights</div>` + html;
    }
}

function hideNotes() {
    document.getElementById('notes-view').style.display = 'none';
    document.getElementById('library-view').style.display = 'block';
}

async function deleteHighlight(filename, highlightId) {
    if (!confirm('Delete this highlight?')) return;
    await fetch(`/api/highlights/${encodeURIComponent(filename)}/${highlightId}`, { method: 'DELETE' });
    // 刷新笔记页面
    filterNotes();
}

async function jumpToHighlight(filename, bookTitle, cfi) {
    hideNotes();
    await openBook(filename, bookTitle);
    setTimeout(() => {
        if (currentRendition) {
            currentRendition.display(cfi);
        }
    }, 500);
}

// === 键盘 ===
function handleKeyPress(e) {
    if (document.getElementById('reader-view').style.display === 'none') return;
    if (document.getElementById('popup').style.display !== 'none') {
        if (e.key === 'Escape') hidePopup();
        return;
    }
    if (e.key === 'Escape') hideHighlightToolbar();
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
}

// === 获取点击位置的单词 ===
function getWordAtPoint(doc, x, y) {
    let range;
    if (doc.caretRangeFromPoint) {
        range = doc.caretRangeFromPoint(x, y);
    } else if (doc.caretPositionFromPoint) {
        const pos = doc.caretPositionFromPoint(x, y);
        if (pos) {
            range = doc.createRange();
            range.setStart(pos.offsetNode, pos.offset);
            range.setEnd(pos.offsetNode, pos.offset);
        }
    }

    if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) {
        return null;
    }

    const textNode = range.startContainer;
    const text = textNode.textContent;
    const offset = range.startOffset;

    let start = offset;
    let end = offset;
    const wordChars = /[a-zA-Z'-]/;

    while (start > 0 && wordChars.test(text[start - 1])) start--;
    while (end < text.length && wordChars.test(text[end])) end++;

    const word = text.slice(start, end).replace(/^['-]+|['-]+$/g, '');
    if (!word) return null;

    const sentence = getSentenceFromTextNode(textNode, offset);
    return { text: word, sentence: sentence };
}

function getSentenceFromTextNode(textNode, offset) {
    const parent = textNode.parentElement.closest('p, div, li, td, h1, h2, h3, h4, h5, h6')
        || textNode.parentElement;
    let fullText = parent.textContent || '';
    const sentences = fullText.match(/[^.!?]*[.!?]+/g) || [fullText];

    let currentOffset = 0;
    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        if (walker.currentNode === textNode) {
            currentOffset += offset;
            break;
        }
        currentOffset += walker.currentNode.textContent.length;
    }

    let pos = 0;
    for (const s of sentences) {
        pos += s.length;
        if (pos >= currentOffset) {
            return s.trim();
        }
    }

    return fullText.trim().slice(0, 200);
}

function getSentenceFromSelection(doc, selection) {
    if (!selection.rangeCount) return '';
    const range = selection.getRangeAt(0);
    const parent = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;
    const container = parent.closest('p, div, li, td') || parent;
    return container.textContent.trim().slice(0, 300);
}

// === 翻译弹窗 ===
function showPopup(word, sentence, x, y) {
    const popup = document.getElementById('popup');
    document.getElementById('popup-word').textContent = word;
    document.getElementById('popup-translation').innerHTML = '<div class="loading">Translating...</div>';
    document.getElementById('ask-input').value = '';
    document.getElementById('ask-result').style.display = 'none';
    document.getElementById('save-btn').textContent = '☆ Save';
    document.getElementById('save-btn').classList.remove('saved');

    popupState.word = word;
    popupState.sentence = sentence;
    popupState.translation = '';

    if (currentRendition && currentRendition.location) {
        popupState.cfi = currentRendition.location.start.cfi;
    }

    popup.style.display = 'block';
    const popupRect = popup.getBoundingClientRect();
    let left = x - popupRect.width / 2;
    let top = y + 20;

    if (left < 10) left = 10;
    if (left + popupRect.width > window.innerWidth - 10) {
        left = window.innerWidth - popupRect.width - 10;
    }
    if (top + popupRect.height > window.innerHeight - 10) {
        top = y - popupRect.height - 10;
    }

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
}

function hidePopup() {
    document.getElementById('popup').style.display = 'none';
}

document.addEventListener('click', (e) => {
    const popup = document.getElementById('popup');
    if (popup.style.display !== 'none' && !popup.contains(e.target)) {
        setTimeout(() => {
            if (!popup.matches(':hover')) {
                hidePopup();
            }
        }, 100);
    }
});

// === 调用翻译 API ===
async function translateWord(word, sentence) {
    try {
        const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word, sentence })
        });
        const data = await resp.json();
        popupState.translation = data.result;
        document.getElementById('popup-translation').textContent = data.result;
    } catch (e) {
        document.getElementById('popup-translation').textContent = 'Translation failed. Please try again.';
    }
}

// === 问 AI ===
async function askAI() {
    const input = document.getElementById('ask-input');
    const question = input.value.trim();
    if (!question) return;

    const resultDiv = document.getElementById('ask-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div class="loading">Thinking...</div>';
    input.value = '';

    try {
        const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                word: popupState.word,
                sentence: popupState.sentence,
                question: question
            })
        });
        const data = await resp.json();
        resultDiv.textContent = data.result;
    } catch (e) {
        resultDiv.textContent = 'Request failed. Please try again.';
    }
}

// === 收藏生词 ===
async function saveCurrentWord() {
    const btn = document.getElementById('save-btn');
    if (btn.classList.contains('saved')) return;

    try {
        const resp = await fetch('/api/vocabulary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                word: popupState.word,
                sentence: popupState.sentence,
                translation: popupState.translation,
                book_title: currentBookTitle,
                cfi: popupState.cfi
            })
        });
        const data = await resp.json();
        btn.textContent = `★ Saved (${data.total_occurrences})`;
        btn.classList.add('saved');
    } catch (e) {
        btn.textContent = 'Save failed';
    }
}

// === 翻页 ===
function goPrev() {
    if (currentRendition) currentRendition.prev();
}

function goNext() {
    if (currentRendition) currentRendition.next();
}

function onSliderChange(value) {
    if (currentBook && currentBook.locations && currentBook.locations.length()) {
        const cfi = currentBook.locations.cfiFromPercentage(value / 100);
        currentRendition.display(cfi);
    }
}

// === 返回书架 ===
function backToLibrary() {
    document.getElementById('reader-view').style.display = 'none';
    document.getElementById('library-view').style.display = 'block';
    hidePopup();
    hideHighlightToolbar();
    document.removeEventListener('keyup', handleKeyPress);
}

// === 生词本 ===
async function showVocabulary() {
    document.getElementById('library-view').style.display = 'none';
    document.getElementById('vocab-view').style.display = 'block';

    const resp = await fetch('/api/vocabulary');
    const vocab = await resp.json();
    const words = Object.keys(vocab).sort();

    document.getElementById('vocab-count').textContent = `${words.length} words`;

    if (words.length === 0) {
        document.getElementById('vocab-list').innerHTML =
            '<p class="vocab-empty">No saved words yet. Click on words while reading to save them.</p>';
        return;
    }

    document.getElementById('vocab-list').innerHTML = words.map(word => {
        const entry = vocab[word];
        const occurrencesHTML = entry.occurrences.map(occ => `
            <div class="vocab-occurrence">
                <div class="sentence">"${escapeHtml(occ.sentence)}"</div>
                <div class="meta">
                    📚 ${escapeHtml(occ.book)} · ${occ.date}
                    ${occ.cfi ? `<span class="jump-link" onclick="jumpToBook('${escapeAttr(occ.book)}', '${escapeAttr(occ.cfi)}')">Jump to source →</span>` : ''}
                </div>
            </div>
        `).join('');

        return `
            <div class="vocab-item">
                <div class="vocab-item-header">
                    <span class="vocab-item-word">${escapeHtml(word)}</span>
                    <button class="vocab-delete" onclick="deleteWord('${escapeAttr(word)}')" title="删除">×</button>
                </div>
                <div class="vocab-item-translation">${escapeHtml(entry.translation)}</div>
                ${occurrencesHTML}
            </div>
        `;
    }).join('');
}

function hideVocabulary() {
    document.getElementById('vocab-view').style.display = 'none';
    document.getElementById('library-view').style.display = 'block';
}

async function deleteWord(word) {
    if (!confirm(`Delete "${word}"?`)) return;
    await fetch(`/api/vocabulary/${encodeURIComponent(word)}`, { method: 'DELETE' });
    showVocabulary();
}

async function jumpToBook(bookTitle, cfi) {
    const resp = await fetch('/api/books');
    const books = await resp.json();
    const book = books.find(b => b.title === bookTitle);

    if (book) {
        hideVocabulary();
        await openBook(book.filename, book.title);
        setTimeout(() => {
            if (currentRendition) {
                currentRendition.display(cfi);
            }
        }, 500);
    } else {
        alert('Book not found. The file may have been moved.');
    }
}

// === 工具函数 ===
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// === 随机生词闪卡 ===
async function loadFlashcard() {
    const flashcard = document.getElementById('flashcard');
    const wordEl = document.getElementById('flashcard-word');
    const sentenceEl = document.getElementById('flashcard-sentence');
    const cnEl = document.getElementById('flashcard-cn');

    try {
        const resp = await fetch('/api/flashcard');
        const data = await resp.json();

        if (data.empty) {
            flashcard.style.display = 'none';
            return;
        }

        flashcard.style.display = 'block';
        wordEl.textContent = data.word;
        cnEl.style.display = 'none';

        if (data.simple_sentence) {
            sentenceEl.textContent = data.simple_sentence;
            cnEl.textContent = data.simple_sentence_cn || '';
        } else {
            sentenceEl.innerHTML = '<span class="loading">Generating example...</span>';
        }
    } catch (e) {
        flashcard.style.display = 'none';
    }
}

function toggleFlashcardCn() {
    const cnEl = document.getElementById('flashcard-cn');
    if (cnEl.style.display === 'none') {
        cnEl.style.display = 'block';
    } else {
        cnEl.style.display = 'none';
    }
}

// === 设置 ===
async function showSettings() {
    const modal = document.getElementById('settings-modal');
    modal.style.display = 'flex';

    // 加载当前配置
    try {
        const resp = await fetch('/api/config');
        const config = await resp.json();
        document.getElementById('settings-cli').value = config.ai_cli || 'claude';
        document.getElementById('settings-args').value = (config.ai_args || ['-p']).join(' ');
        document.getElementById('settings-extra').value = (config.ai_extra_args || ['--no-input']).join(' ');
    } catch (e) {
        document.getElementById('settings-cli').value = 'claude';
        document.getElementById('settings-args').value = '-p';
        document.getElementById('settings-extra').value = '--no-input';
    }
}

function hideSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

async function saveSettings() {
    const cli = document.getElementById('settings-cli').value.trim() || 'claude';
    const args = document.getElementById('settings-args').value.trim().split(/\s+/).filter(Boolean);
    const extra = document.getElementById('settings-extra').value.trim().split(/\s+/).filter(Boolean);

    try {
        await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ai_cli: cli,
                ai_args: args.length ? args : ['-p'],
                ai_extra_args: extra
            })
        });
        hideSettings();
        alert('Settings saved');
    } catch (e) {
        alert('Save failed');
    }
}

// 点击设置弹窗外部关闭
document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('settings-modal')) {
        hideSettings();
    }
});

// === 启动 ===
loadLibrary();
loadFlashcard();
