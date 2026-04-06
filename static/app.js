// === i18n ===
const LANG = {
    en: {
        myLibrary: 'My Library',
        notes: 'Notes',
        vocabulary: 'Vocabulary',
        settings: 'Settings',
        showTranslation: 'Show Translation',
        nextWord: 'Next Word',
        placeEpub: 'Place .epub files in the books/ folder, then refresh the page',
        backToLibrary: '← Library',
        prev: 'Prev',
        next: 'Next',
        translate: 'Translate',
        translating: 'Translating...',
        thinking: 'Thinking...',
        translationFailed: 'Translation failed. Please try again.',
        requestFailed: 'Request failed. Please try again.',
        save: '☆ Save',
        saved: '★ Saved',
        saveFailed: 'Save failed',
        askPlaceholder: 'Ask AI a question about this word...',
        send: 'Send',
        back: '← Back',
        words: 'words',
        noWords: 'No saved words yet. Click on words while reading to save them.',
        jumpToSource: 'Jump to source →',
        deleteWord: 'Delete',
        deleteWordConfirm: 'Delete',
        bookNotFound: 'Book not found. The file may have been moved.',
        readingNotes: 'Reading Notes',
        allBooks: 'All Books',
        allColors: 'All Colors',
        yellow: 'Yellow',
        green: 'Green',
        blue: 'Blue',
        pink: 'Pink',
        noHighlights: 'No highlights yet. Select text while reading to highlight it.',
        highlights: 'highlights',
        deleteHighlight: 'Delete this highlight?',
        settingsTitle: 'Settings',
        displayOptions: 'Display Options',
        showChinese: 'Translation',
        showPhonetic: 'Phonetic transcription',
        showMorphology: 'Word roots & affixes',
        showEnglish: 'English definitions',
        showExamples: 'Example sentences',
        targetLang: 'Translation language',
        targetLangHint: 'Choose which language to translate into.',
        aiCli: 'AI CLI Command',
        aiCliHint: 'Default: claude. You can change this to any AI CLI you have installed.',
        promptArg: 'Prompt Argument',
        promptArgHint: 'The CLI flag for passing a prompt. Claude uses -p.',
        saveBtn: 'Save',
        cancel: 'Cancel',
        settingsSaved: 'Settings saved',
        generatingExample: 'Generating example...',
        langLabel: 'Language',
        jumpToPagePrompt: 'Enter page number:',
        wordOfTheDay: 'Word of the Day',
        editTitlePrompt: 'Enter library name:',
        qaHistory: 'Q&A History',
        noQA: 'No Q&A yet. Ask AI a question while reading.',
        deleteQAConfirm: 'Delete this Q&A?',
        items: 'items',
    },
    zh: {
        myLibrary: '我的书架',
        notes: '读书笔记',
        vocabulary: '生词本',
        settings: '设置',
        showTranslation: '显示中文',
        nextWord: '换一个',
        placeEpub: '将 .epub 文件放入 books/ 文件夹，然后刷新页面',
        backToLibrary: '← 返回书架',
        prev: '上一页',
        next: '下一页',
        translate: '翻译',
        translating: '翻译中...',
        thinking: '思考中...',
        translationFailed: '翻译失败，请重试',
        requestFailed: '请求失败，请重试',
        save: '☆ 收藏',
        saved: '★ 已收藏',
        saveFailed: '收藏失败',
        askPlaceholder: '有问题？输入后按回车问 AI...',
        send: '发送',
        back: '← 返回',
        words: '个词',
        noWords: '还没有收藏的生词，阅读时点击单词即可收藏',
        jumpToSource: '跳转到原文 →',
        deleteWord: '删除',
        deleteWordConfirm: '确定删除',
        bookNotFound: '找不到这本书，可能文件已被移动',
        readingNotes: '读书笔记',
        allBooks: '全部书籍',
        allColors: '全部颜色',
        yellow: '黄色',
        green: '绿色',
        blue: '蓝色',
        pink: '粉色',
        noHighlights: '还没有高亮笔记，阅读时选中文字即可高亮',
        highlights: '条高亮',
        deleteHighlight: '确定删除这条高亮吗？',
        settingsTitle: '设置',
        displayOptions: '显示选项',
        showChinese: '翻译',
        showPhonetic: '音标',
        showMorphology: '词根词缀',
        showEnglish: '英文释义',
        showExamples: '例句',
        targetLang: '翻译目标语言',
        targetLangHint: '选择翻译成哪种语言。',
        aiCli: 'AI CLI 命令',
        aiCliHint: '默认使用 claude。可以改成你安装的其他 AI CLI 工具。',
        promptArg: 'Prompt 参数',
        promptArgHint: '传递 prompt 的参数。Claude 用 -p。',
        extraArgs: '额外参数',
        extraArgsHint: '其他需要的参数，多个用空格分隔。可留空。',
        jumpToPagePrompt: '输入页码：',
        wordOfTheDay: '每日一词',
        editTitlePrompt: '输入书架名称：',
        qaHistory: '问答记录',
        noQA: '还没有问答记录，阅读时向 AI 提问即可。',
        deleteQAConfirm: '删除这条问答？',
        items: '条',
        saveBtn: '保存',
        cancel: '取消',
        settingsSaved: '设置已保存',
        generatingExample: '生成例句中...',
        langLabel: '语言',
    }
};

let currentLang = localStorage.getItem('reader-lang') || 'en';

function t(key) {
    return (LANG[currentLang] && LANG[currentLang][key]) || LANG.en[key] || key;
}

function switchLang(lang) {
    currentLang = lang;
    localStorage.setItem('reader-lang', lang);
    applyLang();
}

function applyLang() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    // Update language selector
    const sel = document.getElementById('lang-select');
    if (sel) sel.value = currentLang;
}

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
        list.innerHTML = `<p class="hint">${t('placeEpub')}</p>`;
        return;
    }

    list.innerHTML = books.map((b, i) => `
        <div class="book-card" data-book-index="${i}">
            <div class="book-icon">📖</div>
            <div class="book-name">${escapeHtml(b.title)}</div>
        </div>
    `).join('');

    // Use event delegation to avoid string escaping issues in onclick
    list.querySelectorAll('.book-card').forEach(card => {
        const idx = parseInt(card.dataset.bookIndex);
        card.addEventListener('click', () => openBook(books[idx].filename, books[idx].title));
    });
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

    // Fetch as ArrayBuffer for reliable loading
    const bookResp = await fetch(`/books/${encodeURIComponent(filename)}`);
    const bookData = await bookResp.arrayBuffer();
    currentBook = ePub(bookData);
    currentRendition = currentBook.renderTo('viewer', {
        width: '100%',
        height: '100%',
        spread: 'none'
    });

    // 读取上次阅读位置
    const savedPosition = localStorage.getItem(`reading-pos-${filename}`);
    if (savedPosition) {
        currentRendition.display(savedPosition).catch(() => {
            // Saved position invalid, start from beginning
            localStorage.removeItem(`reading-pos-${filename}`);
            currentRendition.display();
        });
    } else {
        currentRendition.display();
    }

    // 监听位置变化，保存进度
    currentRendition.on('relocated', (location) => {
        localStorage.setItem(`reading-pos-${filename}`, location.start.cfi);
        if (currentBook.locations && currentBook.locations.length()) {
            const totalPages = currentBook.locations.length();
            const currentPage = currentBook.locations.locationFromCfi(location.start.cfi);
            const progress = currentBook.locations.percentageFromCfi(location.start.cfi);
            document.getElementById('progress-slider').value = Math.round(progress * 100);
            document.getElementById('progress-display').textContent =
                `${currentPage} / ${totalPages}  (${Math.round(progress * 100)}%)`;
        }

        // 更新章节标题显示
        updateChapterTitle(location);
    });

    // 生成位置信息 + 构建章节映射
    currentBook.ready.then(() => {
        buildChapterMap();
        return currentBook.locations.generate(1600);
    });

    // 加载已保存的高亮并渲染
    await loadAndApplyHighlights(filename);

    // 加载生词表（用于标记）
    await loadVocabWords();

    // 每次翻页后重新应用高亮和生词标记
    currentRendition.on('relocated', () => {
        applyHighlightsToRendition();
    });

    // 注入事件到 epub iframe
    currentRendition.hooks.content.register((contents) => {
        const doc = contents.document;

        // 标记生词（下划虚线）
        markVocabWords(doc);

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

        // 选中文本 → 自动翻译 + 显示高亮工具栏
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

                // 自动弹出翻译（和点单词一样）
                showPopup(text, sentence, pageX, pageY);
                translateWord(text, sentence);

                // 同时显示高亮工具栏（在翻译弹窗上方）
                showHighlightToolbar(pageX, pageY - 60);
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

// === 生词标记 ===
let vocabSingleWords = new Set(); // single words
let vocabPhrases = [];             // multi-word phrases

async function loadVocabWords() {
    try {
        const resp = await fetch('/api/vocabulary');
        const vocab = await resp.json();
        vocabSingleWords = new Set();
        vocabPhrases = [];
        for (const key of Object.keys(vocab)) {
            if (key.includes(' ')) {
                vocabPhrases.push(key);
            } else {
                vocabSingleWords.add(key);
            }
        }
        // Sort phrases by length (longest first) for greedy matching
        vocabPhrases.sort((a, b) => b.length - a.length);
    } catch (e) {
        vocabSingleWords = new Set();
        vocabPhrases = [];
    }
}

function markVocabWords(doc) {
    if (!vocabSingleWords.size && !vocabPhrases.length) return;

    // Inject style
    let style = doc.getElementById('vocab-mark-style');
    if (!style) {
        style = doc.createElement('style');
        style.id = 'vocab-mark-style';
        doc.head.appendChild(style);
    }
    style.textContent = `
        .vocab-mark {
            border-bottom: 2px dotted #e67e22;
            cursor: pointer;
        }
    `;

    // Mark phrases first (in paragraph-level text)
    if (vocabPhrases.length) {
        const paragraphs = doc.querySelectorAll('p, div, li, td, h1, h2, h3, h4, h5, h6');
        for (const para of paragraphs) {
            if (para.querySelector('.vocab-mark')) continue;
            const html = para.innerHTML;
            let newHtml = html;
            for (const phrase of vocabPhrases) {
                // Case-insensitive match, word boundary
                const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
                newHtml = newHtml.replace(regex, '<span class="vocab-mark">$1</span>');
            }
            if (newHtml !== html) {
                para.innerHTML = newHtml;
            }
        }
    }

    // Mark single words via text node walking
    if (!vocabSingleWords.size) return;

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    const wordPattern = /\b[a-zA-Z'-]+\b/g;

    for (const node of textNodes) {
        const parent = node.parentElement;
        if (!parent || parent.classList.contains('vocab-mark') ||
            parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') continue;

        const text = node.textContent;
        let hasMatch = false;
        const fragments = [];
        let lastIndex = 0;

        text.replace(wordPattern, (match, offset) => {
            const lower = match.toLowerCase().replace(/^['-]+|['-]+$/g, '');
            if (vocabSingleWords.has(lower)) {
                hasMatch = true;
                if (offset > lastIndex) {
                    fragments.push(doc.createTextNode(text.slice(lastIndex, offset)));
                }
                const span = doc.createElement('span');
                span.className = 'vocab-mark';
                span.textContent = match;
                fragments.push(span);
                lastIndex = offset + match.length;
            }
        });

        if (hasMatch) {
            if (lastIndex < text.length) {
                fragments.push(doc.createTextNode(text.slice(lastIndex)));
            }
            const container = doc.createDocumentFragment();
            fragments.forEach(f => container.appendChild(f));
            parent.replaceChild(container, node);
        }
    }
}

// After saving a word, refresh markings
async function refreshVocabMarks() {
    await loadVocabWords();
    // Directly mark in current iframe without re-rendering
    const iframe = document.querySelector('#viewer iframe');
    if (iframe && iframe.contentDocument) {
        markVocabWords(iframe.contentDocument);
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
    // Reset save button
    const saveBtn = toolbar.querySelector('.hl-save-btn');
    if (saveBtn) { saveBtn.textContent = '☆'; saveBtn.classList.remove('saved'); }
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

async function saveSelection() {
    if (!selectionState.text) return;
    const btn = document.querySelector('.hl-save-btn');

    let cfi = '';
    if (currentRendition && currentRendition.location) {
        cfi = currentRendition.location.start.cfi;
    }

    try {
        // First get translation
        const transResp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: selectionState.text, sentence: selectionState.sentence })
        });
        const transData = await transResp.json();

        // Save with translation
        await fetch('/api/vocabulary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                word: selectionState.text,
                sentence: selectionState.sentence,
                translation: transData.result || '',
                book_title: currentBookTitle,
                cfi: cfi
            })
        });

        if (btn) {
            btn.textContent = '★';
            btn.classList.add('saved');
        }
        refreshVocabMarks();
    } catch (e) {
        if (btn) btn.textContent = '!';
    }

    hideHighlightToolbar();
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
    bookFilter.innerHTML = `<option value="all">${t('allBooks')}</option>` +
        bookNames.map(fn => `<option value="${escapeHtml(fn)}">${escapeHtml(fn.replace('.epub',''))}</option>`).join('');

    renderNotes(allHighlights);
}

function filterNotes() {
    fetch('/api/highlights').then(r => r.json()).then(allHighlights => {
        const bookFilter = document.getElementById('notes-book-filter').value;
        const colorFilter = (document.getElementById('notes-view').dataset.colorFilter) || 'all';

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
                            ${h.cfiRange ? `<span class="jump-link" onclick="jumpToHighlight('${escapeAttr(filename)}', '${escapeAttr(bookName)}', '${escapeAttr(h.cfiRange)}')">${t('jumpToSource')}</span>` : ''}
                            <button class="note-delete" onclick="event.stopPropagation(); deleteHighlight('${escapeAttr(filename)}', '${escapeAttr(h.id)}')" title="删除">×</button>
                        </span>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
    }

    if (totalCount === 0) {
        list.innerHTML = `<p class="notes-empty">${t('noHighlights')}</p>`;
    } else {
        list.innerHTML = `<div class="notes-count">${totalCount} ${t('highlights')}</div>` + html;
    }
}

function hideNotes() {
    document.getElementById('notes-view').style.display = 'none';
    document.getElementById('library-view').style.display = 'block';
}

async function deleteHighlight(filename, highlightId) {
    if (!confirm(t('deleteHighlight'))) return;
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
    document.getElementById('popup-translation').innerHTML = `<div class="loading">${t('translating')}</div>`;
    document.getElementById('ask-input').value = '';
    document.getElementById('ask-result').style.display = 'none';
    document.getElementById('save-btn').textContent = t('save');
    document.getElementById('save-btn').classList.remove('saved');

    popupState.word = word;
    popupState.sentence = sentence;
    popupState.translation = '';

    if (currentRendition && currentRendition.location) {
        popupState.cfi = currentRendition.location.start.cfi;
    }

    popup.style.display = 'block';
    popup.style.maxHeight = '';
    popupOpenTime = Date.now();
    const popupRect = popup.getBoundingClientRect();
    let left = x - popupRect.width / 2;
    let top = y + 20;

    // Keep within horizontal bounds
    if (left < 10) left = 10;
    if (left + popupRect.width > window.innerWidth - 10) {
        left = window.innerWidth - popupRect.width - 10;
    }

    // If not enough space below, show above the word
    const spaceBelow = window.innerHeight - y - 20;
    const spaceAbove = y - 20;

    if (popupRect.height > spaceBelow) {
        if (spaceAbove > spaceBelow) {
            // Show above, limit height if needed
            const maxH = Math.min(spaceAbove - 10, 400);
            popup.style.maxHeight = maxH + 'px';
            top = Math.max(10, y - Math.min(popupRect.height, maxH) - 10);
        } else {
            // Show below but limit height to fit
            const maxH = Math.max(spaceBelow - 10, 150);
            popup.style.maxHeight = maxH + 'px';
            top = y + 20;
        }
    }

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
}

let popupOpenTime = 0;

function hidePopup() {
    document.getElementById('popup').style.display = 'none';
}

// Only close popup when clicking outside, with protection period
document.addEventListener('mousedown', (e) => {
    const popup = document.getElementById('popup');
    if (popup.style.display === 'none') return;
    // Don't close within 500ms of opening (prevents flash-close)
    if (Date.now() - popupOpenTime < 500) return;
    if (!popup.contains(e.target)) {
        hidePopup();
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
        document.getElementById('popup-translation').textContent = t('translationFailed');
    }
}

// === 问 AI ===
async function askAI() {
    const input = document.getElementById('ask-input');
    const question = input.value.trim();
    if (!question) return;

    const resultDiv = document.getElementById('ask-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `<div class="loading">${t('thinking')}</div>`;
    input.value = '';

    try {
        const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                word: popupState.word,
                sentence: popupState.sentence,
                question: question,
                book_title: currentBookTitle
            })
        });
        const data = await resp.json();
        resultDiv.textContent = data.result;
    } catch (e) {
        resultDiv.textContent = t('requestFailed');
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
        btn.textContent = `${t('saved')} (${data.total_occurrences})`;
        btn.classList.add('saved');
        refreshVocabMarks();
    } catch (e) {
        btn.textContent = t('saveFailed');
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

// === 章节检测 ===

// 预处理 TOC，建立 spine index → chapter label 的映射
let chapterMap = []; // [{spineIndex, label}]

function buildChapterMap() {
    chapterMap = [];
    if (!currentBook || !currentBook.navigation || !currentBook.navigation.toc) return;

    const toc = flattenToc(currentBook.navigation.toc);
    for (const item of toc) {
        const href = item.href.split('#')[0];
        const spineItem = currentBook.spine.get(href);
        if (spineItem) {
            chapterMap.push({
                spineIndex: spineItem.index,
                label: item.label.trim(),
                href: item.href
            });
        }
    }
    // Sort by spine index
    chapterMap.sort((a, b) => a.spineIndex - b.spineIndex);
}

function getChapterFromLocation(location) {
    if (!location || !chapterMap.length) return '';
    // location.start.index is the spine index
    const spineIdx = location.start.index;
    let match = '';
    for (const ch of chapterMap) {
        if (ch.spineIndex <= spineIdx) {
            match = ch.label;
        } else {
            break;
        }
    }
    return match;
}

function getChapterFromPercent(percent) {
    if (!currentBook || !currentBook.locations || !chapterMap.length) return '';
    const cfi = currentBook.locations.cfiFromPercentage(percent);
    // Extract spine index from cfi: epubcfi(/6/N! ...) → N/2 - 1
    const match = cfi.match(/^epubcfi\(\/6\/(\d+)/);
    if (match) {
        const spineIdx = Math.floor(parseInt(match[1]) / 2) - 1;
        let label = '';
        for (const ch of chapterMap) {
            if (ch.spineIndex <= spineIdx) {
                label = ch.label;
            } else {
                break;
            }
        }
        return label;
    }
    return '';
}

function flattenToc(toc) {
    let result = [];
    for (const item of toc) {
        result.push(item);
        if (item.subitems && item.subitems.length) {
            result = result.concat(flattenToc(item.subitems));
        }
    }
    return result;
}

function updateChapterTitle(location) {
    const chapter = getChapterFromLocation(location);
    const titleBar = document.getElementById('book-title-bar');
    if (chapter) {
        titleBar.textContent = currentBookTitle + '  ·  ' + chapter;
    } else {
        titleBar.textContent = currentBookTitle;
    }
}

// 进度条悬停时显示章节名
function onSliderHover(e) {
    if (!currentBook || !currentBook.locations || !currentBook.locations.length()) return;
    const slider = e.target;
    const rect = slider.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    const chapterLabel = getChapterFromPercent(percent);
    const page = Math.round(percent * currentBook.locations.length());

    const tooltip = document.getElementById('slider-tooltip');
    const text = chapterLabel ? `${chapterLabel}  (${page})` : `${page}`;
    tooltip.textContent = text;
    tooltip.style.display = 'block';
    tooltip.style.left = Math.max(10, e.clientX - tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = (rect.top - 36) + 'px';
}

function onSliderLeave() {
    document.getElementById('slider-tooltip').style.display = 'none';
}

// 跳转到指定页数
function jumpToPage() {
    if (!currentBook || !currentBook.locations || !currentBook.locations.length()) return;
    const total = currentBook.locations.length();
    const input = prompt(t('jumpToPagePrompt') || `Enter page number (1-${total}):`, '');
    if (input === null) return;
    const page = parseInt(input);
    if (isNaN(page) || page < 1 || page > total) return;
    const percent = (page - 1) / total;
    const cfi = currentBook.locations.cfiFromPercentage(percent);
    currentRendition.display(cfi);
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

    document.getElementById('vocab-count').textContent = `${words.length} ${t('words')}`;

    if (words.length === 0) {
        document.getElementById('vocab-list').innerHTML =
            `<p class="vocab-empty">${t('noWords')}</p>`;
        return;
    }

    document.getElementById('vocab-list').innerHTML = words.map(word => {
        const entry = vocab[word];
        const occurrencesHTML = entry.occurrences.map(occ => `
            <div class="vocab-occurrence">
                <div class="sentence">"${escapeHtml(occ.sentence)}"</div>
                <div class="meta">
                    📚 ${escapeHtml(occ.book)} · ${occ.date}
                    ${occ.cfi ? `<span class="jump-link" onclick="jumpToBook('${escapeAttr(occ.book)}', '${escapeAttr(occ.cfi)}')">${t('jumpToSource')}</span>` : ''}
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
    if (!confirm(`${t('deleteWordConfirm')} "${word}"?`)) return;
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
        alert(t('bookNotFound'));
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
            sentenceEl.innerHTML = `<span class="loading">${t('generatingExample')}</span>`;
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

    try {
        const resp = await fetch('/api/config');
        const config = await resp.json();
        document.getElementById('settings-cli').value = config.ai_cli || 'claude';
        document.getElementById('settings-args').value = (config.ai_args || ['-p']).join(' ');
        document.getElementById('settings-show-chinese').checked = config.show_chinese !== false;
        document.getElementById('settings-show-phonetic').checked = config.show_phonetic !== false;
        document.getElementById('settings-show-morphology').checked = config.show_morphology !== false;
        document.getElementById('settings-show-english').checked = config.show_english !== false;
        document.getElementById('settings-show-examples').checked = config.show_examples !== false;
        document.getElementById('settings-target-lang').value = config.target_lang || 'zh-CN';
    } catch (e) {
        document.getElementById('settings-cli').value = 'claude';
        document.getElementById('settings-args').value = '-p';
    }
}

function hideSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

async function saveSettings() {
    const cli = document.getElementById('settings-cli').value.trim() || 'claude';
    const args = document.getElementById('settings-args').value.trim().split(/\s+/).filter(Boolean);

    try {
        await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ai_cli: cli,
                ai_args: args.length ? args : ['-p'],
                target_lang: document.getElementById('settings-target-lang').value,
                show_chinese: document.getElementById('settings-show-chinese').checked,
                show_phonetic: document.getElementById('settings-show-phonetic').checked,
                show_morphology: document.getElementById('settings-show-morphology').checked,
                show_english: document.getElementById('settings-show-english').checked,
                show_examples: document.getElementById('settings-show-examples').checked,
            })
        });
        hideSettings();
        alert(t('settingsSaved'));
    } catch (e) {
        alert(t('saveFailed'));
    }
}

// 点击设置弹窗外部关闭
document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('settings-modal')) {
        hideSettings();
    }
});

// === Q&A History ===
async function showQAHistory() {
    document.getElementById('library-view').style.display = 'none';
    document.getElementById('qa-view').style.display = 'block';

    const resp = await fetch('/api/qa');
    const qaList = await resp.json();

    document.getElementById('qa-count').textContent = `${qaList.length} ${t('items') || 'items'}`;

    if (qaList.length === 0) {
        document.getElementById('qa-list').innerHTML =
            `<p class="vocab-empty">${t('noQA') || 'No Q&A yet. Ask AI a question while reading.'}</p>`;
        return;
    }

    // Show newest first
    const reversed = [...qaList].reverse();
    document.getElementById('qa-list').innerHTML = reversed.map((qa, i) => {
        const realIndex = qaList.length - 1 - i;
        return `
        <div class="qa-card">
            <div class="qa-context">
                <span class="qa-word">${escapeHtml(qa.word)}</span>
                ${qa.book ? `<span class="qa-book">📚 ${escapeHtml(qa.book)}</span>` : ''}
                <span class="qa-date">${qa.date}</span>
            </div>
            ${qa.sentence ? `<div class="qa-sentence">"${escapeHtml(qa.sentence)}"</div>` : ''}
            <div class="qa-question">Q: ${escapeHtml(qa.question)}</div>
            <div class="qa-answer">${escapeHtml(qa.answer)}</div>
            <button class="note-delete" onclick="deleteQA(${realIndex})" title="Delete">×</button>
        </div>`;
    }).join('');
}

function hideQAHistory() {
    document.getElementById('qa-view').style.display = 'none';
    document.getElementById('library-view').style.display = 'block';
}

async function deleteQA(index) {
    if (!confirm(t('deleteQAConfirm') || 'Delete this Q&A?')) return;
    await fetch(`/api/qa/${index}`, { method: 'DELETE' });
    showQAHistory();
}

// === Library title editing ===
function editLibraryTitle() {
    const el = document.getElementById('library-title');
    const current = localStorage.getItem('library-title') || t('myLibrary');
    const newTitle = prompt(t('editTitlePrompt') || 'Enter library name:', current);
    if (newTitle !== null && newTitle.trim()) {
        localStorage.setItem('library-title', newTitle.trim());
        el.textContent = newTitle.trim();
    }
}

function loadLibraryTitle() {
    const saved = localStorage.getItem('library-title');
    if (saved) {
        document.getElementById('library-title').textContent = saved;
    }
}

// === Flashcard toggle ===
function toggleFlashcard() {
    const card = document.getElementById('flashcard');
    const arrow = document.getElementById('flashcard-arrow');
    const isOpen = card.style.display !== 'none';
    card.style.display = isOpen ? 'none' : 'block';
    arrow.classList.toggle('open', !isOpen);
    localStorage.setItem('flashcard-open', !isOpen);
}

function restoreFlashcardState() {
    const isOpen = localStorage.getItem('flashcard-open') !== 'false';
    const card = document.getElementById('flashcard');
    const arrow = document.getElementById('flashcard-arrow');
    if (card && isOpen) {
        card.style.display = 'block';
        arrow.classList.add('open');
    }
}

// === Notes color filter (pill buttons) ===
function filterByColor(color) {
    // Update active pill
    document.querySelectorAll('.color-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.color === color);
    });
    // Store and re-filter
    document.getElementById('notes-view').dataset.colorFilter = color;
    filterNotes();
}

// Override filterNotes to use pill buttons
const _originalFilterNotes = typeof filterNotes === 'function' ? filterNotes : null;

// === 启动 ===
applyLang();
loadLibraryTitle();
loadLibrary();
loadFlashcard();
restoreFlashcardState();
