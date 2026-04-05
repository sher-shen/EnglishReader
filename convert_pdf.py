#!/usr/bin/env python3
"""将哈利波特 PDF 转换为 EPUB：英文为主，中文可点击展开"""

import fitz  # PyMuPDF
import os
import re
import zipfile
import html as html_module
from pathlib import Path

HP_DIR = Path(os.path.expanduser("~/Downloads/书籍/小说与文学/哈利波特7部"))
OUTPUT_DIR = Path(os.path.expanduser("~/Desktop/EnglishReader/books"))

BOOKS = {
    "①魔法石": "Harry Potter 1 - The Sorcerers Stone",
    "②密室": "Harry Potter 2 - The Chamber of Secrets",
    "③阿兹卡班的囚徒": "Harry Potter 3 - The Prisoner of Azkaban",
    "④火焰杯": "Harry Potter 4 - The Goblet of Fire",
    "⑤凤凰社": "Harry Potter 5 - The Order of the Phoenix",
    "⑥混血王子": "Harry Potter 6 - The Half-Blood Prince",
    "⑦死亡圣器": "Harry Potter 7 - The Deathly Hallows",
}


def is_chinese_line(line):
    """判断一行是否主要是中文"""
    if not line.strip():
        return False
    chinese_chars = sum(1 for c in line if '\u4e00' <= c <= '\u9fff')
    total_chars = sum(1 for c in line if not c.isspace())
    if total_chars == 0:
        return False
    return chinese_chars / total_chars > 0.3


def is_watermark(line):
    return '更多资料分享' in line or 'LearnWithMe' in line or '微信公众号' in line


def extract_bilingual_paragraphs(doc):
    """从 PDF 提取中英文段落，按章节组织"""
    chapters = []
    current_chapter = {"title": "Start", "paragraphs": []}

    # Collect all lines with language tags
    all_lines = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        for line in text.split("\n"):
            line = line.strip()
            if not line or is_watermark(line):
                continue
            all_lines.append(line)

    # Group lines into paragraphs, pairing English with Chinese
    i = 0
    while i < len(all_lines):
        line = all_lines[i]

        # Chapter heading
        if re.match(r'^CHAPTER\s+', line, re.IGNORECASE):
            if current_chapter["paragraphs"]:
                chapters.append(current_chapter)
            # Check if next line is the chapter subtitle (English)
            chapter_title = line
            i += 1
            # Look for English subtitle and Chinese chapter title
            while i < len(all_lines):
                next_line = all_lines[i]
                if is_chinese_line(next_line):
                    # Chinese chapter title, include it
                    current_chapter = {
                        "title": chapter_title,
                        "title_cn": next_line,
                        "paragraphs": []
                    }
                    i += 1
                    break
                elif re.match(r'^CHAPTER\s+', next_line, re.IGNORECASE):
                    # Next chapter already
                    current_chapter = {
                        "title": chapter_title,
                        "title_cn": "",
                        "paragraphs": []
                    }
                    break
                else:
                    # English subtitle
                    chapter_title += " " + next_line
                    i += 1
            else:
                current_chapter = {
                    "title": chapter_title,
                    "title_cn": "",
                    "paragraphs": []
                }
            continue

        # Regular content: collect English lines, then Chinese lines
        if not is_chinese_line(line):
            # English paragraph - collect consecutive English lines
            en_lines = [line]
            i += 1
            while i < len(all_lines):
                next_line = all_lines[i]
                if is_chinese_line(next_line) or re.match(r'^CHAPTER\s+', next_line, re.IGNORECASE):
                    break
                en_lines.append(next_line)
                i += 1

            en_text = " ".join(en_lines)
            # Fix hyphenated words
            en_text = re.sub(r'(\w)- (\w)', r'\1\2', en_text)

            # Now collect following Chinese lines as translation
            cn_lines = []
            while i < len(all_lines):
                next_line = all_lines[i]
                if not is_chinese_line(next_line):
                    break
                cn_lines.append(next_line)
                i += 1

            cn_text = "".join(cn_lines) if cn_lines else ""

            current_chapter["paragraphs"].append({
                "en": en_text,
                "cn": cn_text
            })
        else:
            # Chinese paragraph without preceding English (e.g. at start of page)
            cn_lines = [line]
            i += 1
            while i < len(all_lines):
                next_line = all_lines[i]
                if not is_chinese_line(next_line):
                    break
                cn_lines.append(next_line)
                i += 1

            cn_text = "".join(cn_lines)
            # Attach to previous paragraph if exists
            if current_chapter["paragraphs"]:
                prev = current_chapter["paragraphs"][-1]
                if not prev["cn"]:
                    prev["cn"] = cn_text
                else:
                    prev["cn"] += cn_text
            else:
                current_chapter["paragraphs"].append({
                    "en": "",
                    "cn": cn_text
                })

    if current_chapter["paragraphs"]:
        chapters.append(current_chapter)

    return chapters


def build_epub(chapters, epub_path, title):
    """Build EPUB with collapsible Chinese translations"""

    STYLE = '''
body { font-family: Georgia, serif; line-height: 1.8; margin: 2em; color: #333; font-size: 1.1em; }
h1 { text-align: center; margin: 2em 0 0.3em; font-size: 1.4em; }
.chapter-title-cn { text-align: center; color: #888; font-size: 0.9em; margin-bottom: 1.5em; }
p.en { text-indent: 2em; margin: 0.6em 0; cursor: pointer; }
p.en:hover { background: #f5f5f5; border-radius: 4px; }
.cn { display: none; color: #666; font-size: 0.9em; padding: 4px 2em 8px; margin: 0 0 0.6em;
      border-left: 3px solid #ddd; background: #fafafa; border-radius: 0 4px 4px 0; }
.cn.show { display: block; }
'''

    # Script removed - handled by app.js via epub.js hooks

    with zipfile.ZipFile(epub_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('mimetype', 'application/epub+zip', compress_type=zipfile.ZIP_STORED)

        zf.writestr('META-INF/container.xml', '''<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>''')

        manifest_items = []
        spine_items = []
        toc_items = []

        for i, chapter in enumerate(chapters):
            ch_id = f"chapter{i}"
            ch_file = f"{ch_id}.xhtml"

            title_cn_html = ""
            if chapter.get("title_cn"):
                title_cn_html = f'<div class="chapter-title-cn">{html_module.escape(chapter["title_cn"])}</div>'

            paras_html = []
            for p in chapter["paragraphs"]:
                if p["en"]:
                    paras_html.append(f'<p class="en">{html_module.escape(p["en"])}</p>')
                    if p["cn"]:
                        paras_html.append(f'<div class="cn">{html_module.escape(p["cn"])}</div>')
                elif p["cn"]:
                    # Standalone Chinese (rare)
                    paras_html.append(f'<div class="cn show">{html_module.escape(p["cn"])}</div>')

            ch_html = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta charset="UTF-8"/>
<title>{html_module.escape(chapter["title"])}</title>
<style>{STYLE}</style>
</head>
<body>
<h1>{html_module.escape(chapter["title"])}</h1>
{title_cn_html}
{chr(10).join(paras_html)}
</body>
</html>'''

            zf.writestr(f'OEBPS/{ch_file}', ch_html)
            manifest_items.append(f'<item id="{ch_id}" href="{ch_file}" media-type="application/xhtml+xml" />')
            spine_items.append(f'<itemref idref="{ch_id}"/>')
            toc_items.append(f'<li><a href="{ch_file}">{html_module.escape(chapter["title"])}</a></li>')

        opf = f'''<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:title>{html_module.escape(title)}</dc:title>
  <dc:language>en</dc:language>
  <dc:creator>J.K. Rowling</dc:creator>
  <dc:identifier id="uid">hp-{hash(title)}</dc:identifier>
  <meta property="dcterms:modified">2026-04-05T00:00:00Z</meta>
</metadata>
<manifest>
  <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  {chr(10).join(manifest_items)}
</manifest>
<spine>
  {chr(10).join(spine_items)}
</spine>
</package>'''
        zf.writestr('OEBPS/content.opf', opf)

        nav = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head><meta charset="UTF-8"/><title>Table of Contents</title></head>
<body>
<nav epub:type="toc">
<h1>Table of Contents</h1>
<ol>
{chr(10).join(toc_items)}
</ol>
</nav>
</body>
</html>'''
        zf.writestr('OEBPS/nav.xhtml', nav)

    print(f"  -> {epub_path.name}")


def pdf_to_epub(pdf_path, epub_path, title):
    doc = fitz.open(pdf_path)
    chapters = extract_bilingual_paragraphs(doc)
    doc.close()
    build_epub(chapters, epub_path, title)


if __name__ == "__main__":
    print("开始转换哈利波特 PDF → 中英双语 EPUB（中文可折叠）...\n")

    for pdf_file in sorted(HP_DIR.glob("*.pdf")):
        matched_title = None
        for key, title in BOOKS.items():
            if key in pdf_file.name:
                matched_title = title
                break

        if matched_title:
            epub_path = OUTPUT_DIR / f"{matched_title}.epub"
            print(f"转换: {pdf_file.name}")
            try:
                pdf_to_epub(pdf_file, epub_path, matched_title)
            except Exception as e:
                print(f"  失败: {e}")

    print("\n转换完成！")
    print("阅读时默认只显示英文，点击任意英文段落可展开/收起对应的中文翻译。")
