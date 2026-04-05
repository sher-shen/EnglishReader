# English Reader

A local web-based EPUB reader designed for English language learners. Click any word to get an AI-powered translation. Save words to your vocabulary list, highlight passages, and review everything in one place.

## Features

- **Click-to-Translate** — Click any word in the book and get an instant AI-powered translation with pronunciation and contextual meaning
- **Vocabulary Builder** — Save unknown words to your personal vocabulary list. The same word from different books automatically aggregates all occurrences with original sentences
- **Jump to Source** — From the vocabulary list, click to jump back to the exact location in the book where you first encountered the word
- **Highlight & Notes** — Select text and highlight it in 4 colors (yellow, green, blue, pink). View all highlights in the Reading Notes page, filterable by book and color
- **Ask AI** — After looking up a word, type a follow-up question (grammar, usage, cultural context) and get an AI answer without leaving the reader
- **Flashcard Review** — Each time you open the library, a random word from your vocabulary is displayed with a simple example sentence (AI-generated, using only basic vocabulary) to reinforce memory
- **Collapsible Translations** — For bilingual EPUBs, Chinese translations are hidden by default. Click any English paragraph to reveal/hide its Chinese translation
- **Reading Progress** — Automatically saves your reading position for each book. Resume where you left off
- **Configurable AI Backend** — Default uses Claude CLI, but you can switch to any AI CLI tool (ChatGPT, Gemini, etc.) from the Settings page

## Prerequisites

- **Python 3.10+**
- **An AI CLI tool** installed and available in your PATH. Supported options:
  - [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) (default) — `claude`
  - Any other AI CLI that accepts a prompt via command-line argument

## Installation

```bash
# Clone the repository
git clone https://github.com/sher-shen/EnglishReader.git
cd EnglishReader

# Create a virtual environment and install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create required directories
mkdir -p books data
```

## Usage

### 1. Add Books

Place your `.epub` files in the `books/` folder.

> **Tip:** If you have PDF books, you can convert them to EPUB using [Calibre](https://calibre-ebook.com/) (free). A conversion script (`convert_pdf.py`) is also included for specific PDF formats.

### 2. Start the Reader

```bash
# Option A: Use the start script
./start.sh

# Option B: Start manually
source venv/bin/activate
python3 server.py
```

Then open http://localhost:5100 in your browser.

### 3. Read & Learn

- **Click a word** → Translation popup appears automatically
- **Select text** → Highlight toolbar appears (choose a color or translate the selection)
- **Save words** → Click "☆ Save" in the translation popup to add to your vocabulary
- **Ask AI** → Type a question in the popup's input box and press Enter
- **Navigate** → Use arrow keys (← →) or the bottom navigation bar

### 4. Review

- **Vocabulary** — Click "Vocabulary" on the library page to see all saved words with their contexts
- **Reading Notes** — Click "Notes" to see all highlighted passages, filterable by book and color
- **Flashcard** — A random word with a simple example sentence appears at the top of the library page each time you open it

## Configuration

### Changing the AI Backend

Click **Settings** on the library page to configure your AI CLI:

| Setting | Default | Description |
|---------|---------|-------------|
| AI CLI Command | `claude` | The CLI executable name |
| Prompt Argument | `-p` | The flag used to pass a prompt to the CLI |
| Extra Arguments | `--no-input` | Additional flags (space-separated) |

**Examples:**

| AI Tool | CLI Command | Prompt Arg | Extra Args |
|---------|-------------|------------|------------|
| Claude Code | `claude` | `-p` | `--no-input` |

> Note: The AI CLI must be installed separately and available in your system PATH. This app does not include or manage AI API keys — it calls the CLI tool directly.

## Data Storage

All data is stored locally in the `data/` folder:

| File | Description |
|------|-------------|
| `vocabulary.json` | Your saved words with translations and source contexts |
| `highlights.json` | All highlighted passages organized by book |
| `flashcard_cache.json` | Cached simple example sentences for flashcards |
| `config.json` | AI CLI configuration |

## Project Structure

```
EnglishReader/
├── server.py              # Flask backend
├── start.sh               # One-click start script
├── requirements.txt       # Python dependencies
├── convert_pdf.py         # PDF to EPUB conversion utility
├── static/
│   ├── index.html         # Main page
│   ├── style.css          # Styles
│   └── app.js             # Frontend logic
├── books/                 # Your EPUB files (gitignored)
└── data/                  # Local data storage (gitignored)
```

## License

MIT

---

# English Reader (中文说明)

一个本地运行的 EPUB 英文阅读器，专为英语学习者设计。点击任意单词即可获得 AI 翻译，支持生词本、高亮标注和复习功能。

## 功能特点

- **点词翻译** — 点击书中任意单词，自动弹出 AI 翻译（含音标和语境释义）
- **生词本** — 收藏不认识的单词，同一个词在不同书中的出处会自动聚合，并可跳转回原文
- **高亮标注** — 选中文本可用 4 种颜色高亮，在"读书笔记"页面统一查看，支持按书籍和颜色筛选
- **问 AI** — 翻译弹窗中可以直接输入问题（语法、用法、文化背景等），无需切换应用
- **闪卡复习** — 每次打开书架，随机展示一个生词和 AI 生成的简单例句（除目标词外全是基础词汇）
- **可折叠翻译** — 中英双语 EPUB 默认只显示英文，点击段落可展开/收起中文翻译
- **阅读进度** — 自动保存每本书的阅读位置
- **可配置 AI** — 默认使用 Claude CLI，可在设置页面切换为其他 AI CLI 工具

## 安装步骤

```bash
# 克隆仓库
git clone https://github.com/sher-shen/EnglishReader.git
cd EnglishReader

# 创建虚拟环境并安装依赖
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 创建必要目录
mkdir -p books data
```

## 使用方法

1. 将 `.epub` 文件放入 `books/` 文件夹
2. 运行 `./start.sh` 或 `source venv/bin/activate && python3 server.py`
3. 浏览器打开 http://localhost:5100
4. 开始阅读！点击单词查翻译，选中文本做高亮

## 配置 AI

点击书架页面的 **Settings** 按钮，可以修改 AI CLI 命令。默认使用 `claude -p`。你需要提前安装好对应的 AI CLI 工具。

## 数据说明

所有数据保存在本地 `data/` 文件夹中，不会上传到任何服务器。包括：生词本、高亮标注、闪卡缓存、设置文件。
