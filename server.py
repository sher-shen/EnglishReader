#!/usr/bin/env python3
"""英文原著阅读器 - 本地服务器"""

import json
import os
import random
import subprocess
import time
import urllib.request
import urllib.parse
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
QA_FILE = DATA_DIR / 'qa_history.json'

BOOKS_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

DEFAULT_CONFIG = {
    'ai_cli': 'claude',
    'ai_args': ['-p'],
    'target_lang': 'zh-CN',
    'show_chinese': True,
    'show_phonetic': True,
    'show_morphology': True,
    'show_english': True,
    'show_examples': True,
}

for f, default in [(VOCAB_FILE, '{}'), (HIGHLIGHTS_FILE, '{}'),
                    (FLASHCARD_CACHE_FILE, '{}'), (QA_FILE, '[]')]:
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


def call_ai(prompt, timeout=60):
    """调用配置的 AI CLI"""
    config = load_config()
    cli = config.get('ai_cli', 'claude')
    args = config.get('ai_args', ['-p'])

    # Some CLIs take prompt as argument (gemini -p "prompt"),
    # others read from stdin (claude -p < stdin).
    # Try argument first, fall back to stdin if that fails.
    if cli in ('gemini', 'gemini-cli'):
        # Gemini: -p takes prompt as next argument
        cmd = [cli] + args + [prompt]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    else:
        # Claude and others: pipe prompt via stdin
        cmd = [cli] + args
        result = subprocess.run(cmd, input=prompt, capture_output=True, text=True, timeout=timeout)

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


# === 词根词缀 ===

PREFIXES = {
    'un': ('un-', 'not, opposite 不/相反'),
    're': ('re-', 'again, back 再/回'),
    'in': ('in-', 'not, into 不/进入'),
    'im': ('im-', 'not 不'),
    'ir': ('ir-', 'not 不'),
    'il': ('il-', 'not 不'),
    'dis': ('dis-', 'not, apart 不/分开'),
    'mis': ('mis-', 'wrong 错误'),
    'pre': ('pre-', 'before 在...之前'),
    'post': ('post-', 'after 在...之后'),
    'over': ('over-', 'too much, above 过度/在上'),
    'under': ('under-', 'below, not enough 在下/不足'),
    'out': ('out-', 'beyond, outside 超过/外'),
    'sub': ('sub-', 'under 在下/次'),
    'super': ('super-', 'above, beyond 超级/在上'),
    'inter': ('inter-', 'between 在...之间'),
    'trans': ('trans-', 'across 跨越'),
    'ex': ('ex-', 'out, former 出/前'),
    'anti': ('anti-', 'against 反对'),
    'auto': ('auto-', 'self 自'),
    'bi': ('bi-', 'two 二'),
    'co': ('co-', 'together 共同'),
    'de': ('de-', 'down, remove 向下/去除'),
    'en': ('en-', 'make, put in 使/放入'),
    'em': ('em-', 'make, put in 使/放入'),
    'fore': ('fore-', 'before 在前'),
    'micro': ('micro-', 'small 微小'),
    'mid': ('mid-', 'middle 中间'),
    'mono': ('mono-', 'one 单'),
    'multi': ('multi-', 'many 多'),
    'non': ('non-', 'not 非'),
    'semi': ('semi-', 'half 半'),
    'tri': ('tri-', 'three 三'),
    'uni': ('uni-', 'one 单一'),
}

SUFFIXES = {
    'able': ('-able', 'can be done 可...的'),
    'ible': ('-ible', 'can be done 可...的'),
    'al': ('-al', 'relating to ...的'),
    'ial': ('-ial', 'relating to ...的'),
    'tion': ('-tion', 'state, action 名词化'),
    'sion': ('-sion', 'state, action 名词化'),
    'ation': ('-ation', 'state, action 名词化'),
    'ment': ('-ment', 'result, action 名词化'),
    'ness': ('-ness', 'state, quality 状态'),
    'ity': ('-ity', 'state, quality 性质'),
    'ous': ('-ous', 'full of 充满...的'),
    'ious': ('-ious', 'full of 充满...的'),
    'ful': ('-ful', 'full of 充满...的'),
    'less': ('-less', 'without 无...的'),
    'ly': ('-ly', 'in a way ...地'),
    'er': ('-er', 'one who, more ...者/更'),
    'or': ('-or', 'one who ...者'),
    'ist': ('-ist', 'one who ...者'),
    'ism': ('-ism', 'belief, system 主义'),
    'ize': ('-ize', 'to make ...化'),
    'ise': ('-ise', 'to make ...化'),
    'fy': ('-fy', 'to make 使...化'),
    'en': ('-en', 'to make, made of 使/由...制'),
    'ive': ('-ive', 'tending to ...的'),
    'ative': ('-ative', 'tending to ...的'),
    'ing': ('-ing', 'action, state 进行中'),
    'ed': ('-ed', 'past, having 过去/已'),
    'ant': ('-ant', 'one who, being ...的/者'),
    'ent': ('-ent', 'one who, being ...的/者'),
    'ward': ('-ward', 'direction 向...方向'),
    'ship': ('-ship', 'state, position ...关系/身份'),
    'dom': ('-dom', 'state, realm 领域/状态'),
    'logy': ('-logy', 'study of ...学'),
    'graph': ('-graph', 'writing, record 写/记录'),
}

ROOTS = {
    'act': ('act', 'do 做/行动'),
    'aud': ('aud', 'hear 听'),
    'bene': ('bene', 'good 好'),
    'bio': ('bio', 'life 生命'),
    'cap': ('cap/capt', 'take, seize 拿/抓'),
    'capt': ('cap/capt', 'take, seize 拿/抓'),
    'ced': ('ced/cess', 'go, yield 走/让'),
    'cess': ('ced/cess', 'go, yield 走/让'),
    'cred': ('cred', 'believe 相信'),
    'dict': ('dict', 'say 说'),
    'duc': ('duc/duct', 'lead 引导'),
    'duct': ('duc/duct', 'lead 引导'),
    'fac': ('fac/fact', 'make, do 做'),
    'fact': ('fac/fact', 'make, do 做'),
    'fer': ('fer', 'carry 带/运'),
    'form': ('form', 'shape 形状'),
    'gen': ('gen', 'birth, kind 出生/种类'),
    'graph': ('graph', 'write 写'),
    'ject': ('ject', 'throw 扔/投'),
    'jud': ('jud/jur', 'judge 判断'),
    'jur': ('jud/jur', 'judge, law 判断/法律'),
    'log': ('log/logy', 'word, study 言/学'),
    'luc': ('luc/lum', 'light 光'),
    'lum': ('luc/lum', 'light 光'),
    'man': ('man/manu', 'hand 手'),
    'manu': ('man/manu', 'hand 手'),
    'mit': ('mit/miss', 'send 发送'),
    'miss': ('mit/miss', 'send 发送'),
    'mob': ('mob/mot/mov', 'move 移动'),
    'mot': ('mob/mot/mov', 'move 移动'),
    'mov': ('mob/mot/mov', 'move 移动'),
    'mort': ('mort', 'death 死'),
    'path': ('path', 'feel, suffer 感受/苦'),
    'ped': ('ped', 'foot 脚'),
    'pend': ('pend/pens', 'hang, pay 悬/付'),
    'pens': ('pend/pens', 'hang, pay 悬/付'),
    'phil': ('phil', 'love 爱'),
    'phon': ('phon', 'sound 声音'),
    'photo': ('photo', 'light 光'),
    'port': ('port', 'carry 带/运'),
    'pos': ('pos/pon', 'put, place 放置'),
    'pon': ('pos/pon', 'put, place 放置'),
    'rupt': ('rupt', 'break 断/破'),
    'scrib': ('scrib/script', 'write 写'),
    'script': ('scrib/script', 'write 写'),
    'sens': ('sens/sent', 'feel 感觉'),
    'sent': ('sens/sent', 'feel 感觉'),
    'spec': ('spec/spect', 'look 看'),
    'spect': ('spec/spect', 'look 看'),
    'struct': ('struct', 'build 建造'),
    'tact': ('tact/tang', 'touch 触'),
    'tang': ('tact/tang', 'touch 触'),
    'temp': ('temp', 'time 时间'),
    'ten': ('ten/tain', 'hold 持/保'),
    'tain': ('ten/tain', 'hold 持/保'),
    'tract': ('tract', 'pull, draw 拉/拖'),
    'ven': ('ven/vent', 'come 来'),
    'vent': ('ven/vent', 'come 来'),
    'ver': ('ver/vert', 'turn 转'),
    'vert': ('ver/vert', 'turn 转'),
    'vid': ('vid/vis', 'see 看'),
    'vis': ('vid/vis', 'see 看'),
    'voc': ('voc/vok', 'call, voice 叫/声'),
    'vok': ('voc/vok', 'call, voice 叫/声'),
    'volv': ('volv', 'roll 滚/卷'),
}


def analyze_morphology(word):
    """分析词根词缀"""
    word = word.lower().strip()
    if len(word) < 4:
        return ''

    parts = []

    # Check prefix (longest match first)
    found_prefix = ''
    for length in range(6, 1, -1):
        prefix = word[:length]
        if prefix in PREFIXES:
            label, meaning = PREFIXES[prefix]
            found_prefix = prefix
            parts.append(f"{label} ({meaning})")
            break

    # Check suffix (longest match first)
    found_suffix = ''
    for length in range(5, 1, -1):
        suffix = word[-length:]
        if suffix in SUFFIXES:
            label, meaning = SUFFIXES[suffix]
            found_suffix = suffix
            parts.append(f"{label} ({meaning})")
            break

    # Check root in the middle part
    start = len(found_prefix) if found_prefix else 0
    end = len(word) - len(found_suffix) if found_suffix else len(word)
    middle = word[start:end]

    if len(middle) >= 3:
        for length in range(len(middle), 2, -1):
            for i in range(len(middle) - length + 1):
                segment = middle[i:i+length]
                if segment in ROOTS:
                    label, meaning = ROOTS[segment]
                    parts.insert(len(parts) - 1 if found_suffix else len(parts),
                                f"{label} ({meaning})")
                    break
            else:
                continue
            break

    if not parts:
        return ''

    return '【词根词缀】' + ' + '.join(parts)


# === 免费翻译 API ===

def translate_text(text, target_lang=None):
    """用 Google Translate 免费接口获取翻译"""
    if target_lang is None:
        config = load_config()
        target_lang = config.get('target_lang', 'zh-CN')
    try:
        encoded = urllib.parse.quote(text[:500])
        url = (
            f"https://translate.googleapis.com/translate_a/single"
            f"?client=gtx&sl=en&tl={target_lang}&dt=t&q={encoded}"
        )
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        })
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        # Response format: [[["translated","original",...],...],...]
        if data and data[0]:
            translated = ''.join(part[0] for part in data[0] if part[0])
            if translated and translated != text:
                return translated
    except Exception:
        pass

    # Fallback to MyMemory
    try:
        params = urllib.parse.urlencode({
            'q': text[:500],
            'langpair': f'en|{target_lang}'
        })
        url = f"https://api.mymemory.translated.net/get?{params}"
        req = urllib.request.Request(url, headers={'User-Agent': 'EnglishReader/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        translated = data.get('responseData', {}).get('translatedText', '')
        if translated and translated != text:
            return translated
    except Exception:
        pass
    return ''


# === 免费词典 API ===

def lookup_dictionary(word):
    """用免费词典 API 查词，根据用户设置返回结果"""
    config = load_config()
    word_clean = word.strip().lower()
    url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{urllib.parse.quote(word_clean)}"

    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'EnglishReader/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())

        if not data or not isinstance(data, list):
            return None

        entry = data[0]
        result_parts = []

        # 音标
        if config.get('show_phonetic', True):
            phonetics = entry.get('phonetics', [])
            phonetic_text = ''
            for p in phonetics:
                if p.get('text'):
                    phonetic_text = p['text']
                    break
            if phonetic_text:
                result_parts.append(f"{word_clean}  {phonetic_text}")
            else:
                result_parts.append(word_clean)
        else:
            result_parts.append(word_clean)

        # 翻译
        if config.get('show_chinese', True):
            translated = translate_text(word_clean)
            if translated:
                result_parts.append(f"【翻译】{translated}")

        # 词根词缀
        if config.get('show_morphology', True):
            morphology = analyze_morphology(word_clean)
            if morphology:
                result_parts.append(morphology)

        # 英文释义
        if config.get('show_english', True):
            for meaning in entry.get('meanings', [])[:3]:
                pos = meaning.get('partOfSpeech', '')
                defs = meaning.get('definitions', [])[:2]
                for d in defs:
                    definition = d.get('definition', '')
                    example = d.get('example', '')
                    line = f"  [{pos}] {definition}"
                    if config.get('show_examples', True) and example:
                        line += f'\n    e.g. "{example}"'
                    result_parts.append(line)

        return '\n'.join(result_parts)
    except Exception:
        return None


# === 翻译 ===

@app.route('/api/translate', methods=['POST'])
def translate():
    data = request.json
    word = data.get('word', '')
    sentence = data.get('sentence', '')
    question = data.get('question', '')

    # 有问题 → 用 AI
    if question:
        prompt = (
            f"用户正在阅读英文原著，选中了一个词/短语，有问题要问。\n\n"
            f"选中的内容：{word}\n"
            f"所在句子：{sentence}\n\n"
            f"用户的问题：{question}\n\n"
            f"请用中文简洁回答。"
        )
        try:
            result = call_ai(prompt)
            # Save Q&A to history
            qa_list = load_json(QA_FILE)
            qa_list.append({
                'word': word,
                'sentence': sentence,
                'question': question,
                'answer': result,
                'book': request.json.get('book_title', ''),
                'date': time.strftime('%Y-%m-%d %H:%M')
            })
            save_json(QA_FILE, qa_list)
            return jsonify({'result': result})
        except Exception as e:
            return jsonify({'result': f'AI error: {str(e)}'}), 500

    # 判断是单词还是短语/句子
    is_phrase = ' ' in word.strip()

    if not is_phrase:
        # 单词 → 免费词典 API
        dict_result = lookup_dictionary(word)
        if dict_result:
            return jsonify({'result': dict_result, 'source': 'dictionary'})

    # 短语/句子/词典没查到 → 免费翻译 API
    cn = translate_text(word)
    if cn:
        result = f"{word.strip()}\n【中文】{cn}"
        return jsonify({'result': result, 'source': 'translate'})

    # 翻译 API 也失败 → 最后用 AI
    try:
        prompt = (
            f"请翻译以下英文内容为中文，只给出翻译结果：\n\n{word}"
        )
        result = call_ai(prompt)
        return jsonify({'result': f"{word.strip()}\n【中文】{result}", 'source': 'ai'})
    except Exception as e:
        return jsonify({'result': f'Translation failed: {str(e)}'}), 500


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


def clean_word(text):
    """Clean punctuation from start/end but keep internal hyphens."""
    import re
    # Strip whitespace
    text = text.strip()
    # Remove leading punctuation/symbols (keep letters, digits, hyphens inside)
    text = re.sub(r'^[^a-zA-Z0-9]+', '', text)
    # Remove trailing punctuation/symbols
    text = re.sub(r'[^a-zA-Z0-9]+$', '', text)
    # Collapse multiple spaces to one
    text = re.sub(r'\s+', ' ', text)
    return text


@app.route('/api/vocabulary', methods=['POST'])
def save_word():
    data = request.json
    raw_word = data.get('word', '')
    word = clean_word(raw_word).lower()
    sentence = data.get('sentence', '')
    translation = data.get('translation', '')
    book_title = data.get('book_title', '')
    cfi = data.get('cfi', '')

    if not word:
        return jsonify({'error': '词不能为空'}), 400

    vocab = load_json(VOCAB_FILE)

    if word not in vocab:
        vocab[word] = {'translation': translation, 'occurrences': []}

    # Dedup: don't add if same book + same cfi already exists
    existing = vocab[word]['occurrences']
    is_dup = any(
        o.get('book') == book_title and o.get('cfi') == cfi
        for o in existing
    ) if cfi else False

    if not is_dup:
        existing.append({
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


# === Q&A 历史 ===

@app.route('/api/qa', methods=['GET'])
def get_qa_history():
    return jsonify(load_json(QA_FILE))


@app.route('/api/qa/<int:index>', methods=['DELETE'])
def delete_qa(index):
    qa_list = load_json(QA_FILE)
    if 0 <= index < len(qa_list):
        qa_list.pop(index)
        save_json(QA_FILE, qa_list)
    return jsonify({'success': True})


if __name__ == '__main__':
    print("\n=== 英文原著阅读器 ===")
    print(f"书籍目录：{BOOKS_DIR}")
    print(f"请将 .epub 文件放入 books/ 文件夹")
    print(f"打开浏览器访问：http://localhost:5100\n")
    app.run(host='127.0.0.1', port=5100, debug=True)
