#!/usr/bin/env python3
"""英文原著阅读器 - 本地服务器"""

import json
import os
import random
import subprocess
import time
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory
app = Flask(__name__, static_folder='static')

BASE_DIR = Path(__file__).parent
BOOKS_DIR = BASE_DIR / 'books'
DATA_DIR = BASE_DIR / 'data'
VOCAB_FILE = DATA_DIR / 'vocabulary.json'
HIGHLIGHTS_FILE = DATA_DIR / 'highlights.json'
CONFIG_FILE = DATA_DIR / 'config.json'
FLASHCARD_CACHE_FILE = DATA_DIR / 'flashcard_cache.json'

BOOKS_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

DEFAULT_CONFIG = {
    'ai_cli': 'claude',
    'ai_args': ['-p'],
    'ai_extra_args': ['--no-input'],
}

for f, default in [(VOCAB_FILE, '{}'), (HIGHLIGHTS_FILE, '{}'),
                    (FLASHCARD_CACHE_FILE, '{}')]:
    if not f.exists():
        f.write_text(default, encoding='utf-8')

if not CONFIG_FILE.exists():
    CONFIG_FILE.write_text(json.dumps(DEFAULT_CONFIG, indent=2), encoding='utf-8')


def load_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def save_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


def load_config():
    try:
        return load_json(CONFIG_FILE)
    except Exception:
        return DEFAULT_CONFIG


def call_ai(prompt, timeout=30):
    """调用配置的 AI CLI"""
    config = load_config()
    cli = config.get('ai_cli', 'claude')
    args = config.get('ai_args', ['-p'])
    extra = config.get('ai_extra_args', ['--no-input'])

    cmd = [cli] + args + [prompt] + extra

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    return result.stdout.strip()


# === 路由 ===

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')


@app.route('/books/<path:filename>')
def serve_book(filename):
    return send_from_directory(BOOKS_DIR, filename)


@app.route('/api/books')
def list_books():
    books = []
    for f in sorted(BOOKS_DIR.iterdir()):
        if f.suffix.lower() in ('.epub',):
            books.append({'filename': f.name, 'title': f.stem})
    return jsonify(books)


# === 设置 ===

@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify(load_config())


@app.route('/api/config', methods=['POST'])
def update_config():
    data = request.json
    config = load_config()
    config.update(data)
    save_json(CONFIG_FILE, config)
    return jsonify(config)


# === 翻译 ===

@app.route('/api/translate', methods=['POST'])
def translate():
    data = request.json
    word = data.get('word', '')
    sentence = data.get('sentence', '')
    question = data.get('question', '')

    if question:
        prompt = (
            f"用户正在阅读英文原著，选中了一个词/短语，有问题要问。\n\n"
            f"选中的内容：{word}\n"
            f"所在句子：{sentence}\n\n"
            f"用户的问题：{question}\n\n"
            f"请用中文简洁回答。"
        )
    else:
        prompt = (
            f"用户正在阅读英文原著，点击了一个不认识的词。请给出这个词的翻译。\n\n"
            f"单词/短语：{word}\n"
            f"所在句子：{sentence}\n\n"
            f"请按以下格式简洁回答（不要加多余的话）：\n"
            f"【释义】中文意思（如果有多个常见含义，列出2-3个）\n"
            f"【音标】国际音标\n"
            f"【句中含义】在这个句子中具体是什么意思"
        )

    try:
        result = call_ai(prompt)
        return jsonify({'result': result})
    except subprocess.TimeoutExpired:
        return jsonify({'result': '翻译超时，请重试'}), 500
    except Exception as e:
        return jsonify({'result': f'出错了：{str(e)}'}), 500


# === 随机生词闪卡 ===

@app.route('/api/flashcard')
def random_flashcard():
    """随机返回一个生词 + 简单例句"""
    vocab = load_json(VOCAB_FILE)
    if not vocab:
        return jsonify({'empty': True})

    word = random.choice(list(vocab.keys()))
    entry = vocab[word]

    # 检查缓存里有没有这个词的简单例句
    cache = load_json(FLASHCARD_CACHE_FILE)
    if word in cache:
        return jsonify({
            'empty': False,
            'word': word,
            'translation': entry.get('translation', ''),
            'simple_sentence': cache[word]['sentence'],
            'simple_sentence_cn': cache[word].get('sentence_cn', ''),
            'cached': True
        })

    # 没有缓存，用 AI 生成一个简单例句
    prompt = (
        f"请为英语单词 \"{word}\" 造一个非常简单的英文例句。要求：\n"
        f"1. 除了 \"{word}\" 之外，其他所有词都必须是最基础最常见的词（小学水平）\n"
        f"2. 句子要短，不超过12个词\n"
        f"3. 要体现这个词最经典、最常用的用法\n"
        f"4. 再给出这个句子的中文翻译\n\n"
        f"只回复两行，第一行英文句子，第二行中文翻译，不要加任何其他内容。"
    )

    try:
        result = call_ai(prompt, timeout=15)
        lines = [l.strip() for l in result.strip().split('\n') if l.strip()]
        en_sentence = lines[0] if lines else f"This is a {word}."
        cn_sentence = lines[1] if len(lines) > 1 else ""

        # 缓存
        cache[word] = {'sentence': en_sentence, 'sentence_cn': cn_sentence}
        save_json(FLASHCARD_CACHE_FILE, cache)

        return jsonify({
            'empty': False,
            'word': word,
            'translation': entry.get('translation', ''),
            'simple_sentence': en_sentence,
            'simple_sentence_cn': cn_sentence,
            'cached': False
        })
    except Exception:
        # AI 不可用时，用原文例句兜底
        fallback = ''
        if entry.get('occurrences'):
            fallback = entry['occurrences'][0].get('sentence', '')
        return jsonify({
            'empty': False,
            'word': word,
            'translation': entry.get('translation', ''),
            'simple_sentence': fallback,
            'simple_sentence_cn': '',
            'cached': True
        })


# === 生词本 ===

@app.route('/api/vocabulary', methods=['GET'])
def get_vocabulary():
    return jsonify(load_json(VOCAB_FILE))


@app.route('/api/vocabulary', methods=['POST'])
def save_word():
    data = request.json
    word = data.get('word', '').strip().lower()
    sentence = data.get('sentence', '')
    translation = data.get('translation', '')
    book_title = data.get('book_title', '')
    cfi = data.get('cfi', '')

    if not word:
        return jsonify({'error': '词不能为空'}), 400

    vocab = load_json(VOCAB_FILE)

    if word not in vocab:
        vocab[word] = {'translation': translation, 'occurrences': []}

    vocab[word]['occurrences'].append({
        'sentence': sentence,
        'book': book_title,
        'cfi': cfi,
        'date': time.strftime('%Y-%m-%d %H:%M')
    })

    if translation:
        vocab[word]['translation'] = translation

    save_json(VOCAB_FILE, vocab)
    return jsonify({'success': True, 'total_occurrences': len(vocab[word]['occurrences'])})


@app.route('/api/vocabulary/<word>', methods=['DELETE'])
def delete_word(word):
    vocab = load_json(VOCAB_FILE)
    if word in vocab:
        del vocab[word]
        save_json(VOCAB_FILE, vocab)
    # 同时清除闪卡缓存
    cache = load_json(FLASHCARD_CACHE_FILE)
    if word in cache:
        del cache[word]
        save_json(FLASHCARD_CACHE_FILE, cache)
    return jsonify({'success': True})


# === 高亮 ===

@app.route('/api/highlights/<book_filename>', methods=['GET'])
def get_highlights(book_filename):
    highlights = load_json(HIGHLIGHTS_FILE)
    return jsonify(highlights.get(book_filename, []))


@app.route('/api/highlights/<book_filename>', methods=['POST'])
def add_highlight(book_filename):
    data = request.json
    highlights = load_json(HIGHLIGHTS_FILE)

    if book_filename not in highlights:
        highlights[book_filename] = []

    highlight = {
        'id': str(int(time.time() * 1000)),
        'cfiRange': data.get('cfiRange', ''),
        'text': data.get('text', ''),
        'color': data.get('color', 'yellow'),
        'note': data.get('note', ''),
        'date': time.strftime('%Y-%m-%d %H:%M')
    }

    highlights[book_filename].append(highlight)
    save_json(HIGHLIGHTS_FILE, highlights)
    return jsonify(highlight)


@app.route('/api/highlights/<book_filename>/<highlight_id>', methods=['DELETE'])
def delete_highlight(book_filename, highlight_id):
    highlights = load_json(HIGHLIGHTS_FILE)
    if book_filename in highlights:
        highlights[book_filename] = [
            h for h in highlights[book_filename] if h['id'] != highlight_id
        ]
        save_json(HIGHLIGHTS_FILE, highlights)
    return jsonify({'success': True})


@app.route('/api/highlights', methods=['GET'])
def get_all_highlights():
    return jsonify(load_json(HIGHLIGHTS_FILE))


if __name__ == '__main__':
    print("\n=== 英文原著阅读器 ===")
    print(f"书籍目录：{BOOKS_DIR}")
    print(f"请将 .epub 文件放入 books/ 文件夹")
    print(f"打开浏览器访问：http://localhost:5100\n")
    app.run(host='127.0.0.1', port=5100, debug=True)
