# English Reader

A local EPUB reader with AI-powered translation, built for English learners. Click any word to translate, save to vocabulary, highlight passages, and ask AI questions — all in one place.

Supports English/Chinese interface switching.

## Quick Start

```bash
git clone https://github.com/sher-shen/EnglishReader.git
cd EnglishReader
./setup.sh        # one-click setup
./start.sh        # start reading
```

That's it. Your browser will open at http://localhost:5100.

## Requirements

- Python 3.10+
- An AI CLI tool in your PATH (default: [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code))

## Features

| Feature | Description |
|---------|-------------|
| Click to Translate | Click any word → AI translation with pronunciation and context |
| Vocabulary Builder | Save words across books, all occurrences grouped together |
| Jump to Source | Click a saved word → jump back to the exact location in the book |
| Highlights | Select text → highlight in 4 colors, review in Notes page |
| Ask AI | Type a question in the popup to ask about grammar, usage, etc. |
| Flashcard | Random vocabulary word + simple example sentence on library page |
| Bilingual Mode | For EN/CN books: Chinese hidden by default, click to reveal |
| Language Switch | Full UI in English or Chinese, switch anytime |

## How to Use

1. **Add books** — put `.epub` files in the `books/` folder
2. **Run** `./start.sh` — opens in your browser
3. **Read** — click words to translate, drag to highlight
4. **Review** — check Vocabulary and Notes from the library page

> **PDF books?** Convert to EPUB with [Calibre](https://calibre-ebook.com/) (free).

## Settings

Click **Settings** on the library page to change the AI backend:

| Setting | Default | What it does |
|---------|---------|-------------|
| AI CLI Command | `claude` | Which CLI to call |
| Prompt Argument | `-p` | Flag for passing the prompt |
| Extra Arguments | `--no-input` | Additional flags |

## Data

All data stays on your machine in the `data/` folder:
- `vocabulary.json` — saved words
- `highlights.json` — highlighted passages
- `config.json` — settings

---

# English Reader（中文说明）

一个本地运行的 EPUB 英文阅读器，专为英语学习者设计。点击单词即可 AI 翻译，支持生词本、高亮标注、AI 提问，全部功能集成在一个页面。

支持中英文界面切换。

## 快速开始

```bash
git clone https://github.com/sher-shen/EnglishReader.git
cd EnglishReader
./setup.sh        # 一键安装
./start.sh        # 开始阅读
```

浏览器会自动打开 http://localhost:5100，就可以开始用了。

## 环境要求

- Python 3.10+
- 一个 AI CLI 工具（默认使用 [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)）

## 功能

| 功能 | 说明 |
|------|------|
| 点词翻译 | 点击任意单词，AI 给出翻译、音标和语境释义 |
| 生词本 | 收藏生词，同一个词在不同书中的出处自动聚合 |
| 跳转原文 | 在生词本中点击，跳回书中原来的位置 |
| 高亮标注 | 选中文本，4 种颜色高亮，在"读书笔记"页面统一查看 |
| 问 AI | 翻译弹窗中直接输入问题，问语法、用法、文化背景等 |
| 闪卡复习 | 每次打开书架，随机显示一个生词和简单例句 |
| 双语模式 | 中英双语书默认只显示英文，点击段落可展开中文翻译 |
| 中英切换 | 界面支持中文和英文，随时切换 |

## 使用方法

1. 把 `.epub` 文件放到 `books/` 文件夹
2. 运行 `./start.sh`
3. 浏览器中开始阅读，点词翻译，选中文本高亮
4. 在书架页面查看"生词本"和"读书笔记"

> **PDF 格式的书？** 用 [Calibre](https://calibre-ebook.com/)（免费）转换成 EPUB。

## 设置

在书架页面点击 **Settings/设置** 可以修改 AI 后端。默认使用 `claude -p`，需要提前安装好对应的 CLI 工具。

## 数据存储

所有数据保存在本地 `data/` 文件夹，不会上传到任何服务器。
