#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
echo ""
echo "=== 英文原著阅读器 ==="
echo "请将 .epub 文件放入 books/ 文件夹"
echo "正在启动，浏览器将自动打开..."
echo ""
open http://localhost:5100 &
python3 server.py
