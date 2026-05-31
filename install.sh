#!/bin/bash
echo "=============================="
echo "  تثبيت بوت إعادة نشر الريلز"
echo "=============================="

# التحقق من Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. ثبته من: https://nodejs.org"
    exit 1
fi
echo "✅ Node.js: $(node -v)"

# التحقق من Python (لازم لـ yt-dlp)
if ! command -v python3 &> /dev/null; then
    echo "⚠️  Python3 غير موجود - سيتم تثبيته"
    sudo apt-get install -y python3 python3-pip 2>/dev/null || true
fi

# تثبيت yt-dlp
echo "📦 تثبيت yt-dlp..."
pip3 install -U yt-dlp 2>/dev/null || pip install -U yt-dlp 2>/dev/null
echo "✅ yt-dlp مثبت"

# تثبيت ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "📦 تثبيت ffmpeg..."
    sudo apt-get install -y ffmpeg 2>/dev/null || brew install ffmpeg 2>/dev/null || echo "⚠️  ثبت ffmpeg يدوياً من: https://ffmpeg.org"
fi
echo "✅ ffmpeg جاهز"

# تثبيت حزم Node
echo "📦 تثبيت حزم Node.js..."
npm install

# إنشاء ملف .env
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "📝 تم إنشاء ملف .env"
    echo "   ⚠️  افتح الملف وأضف التوكنات الخاصة بك!"
else
    echo "✅ ملف .env موجود"
fi

echo ""
echo "=============================="
echo "  التثبيت اكتمل! 🎉"
echo "=============================="
echo ""
echo "الخطوة التالية:"
echo "  1. افتح ملف .env وأضف التوكنات"
echo "  2. شغل البوت: node bot.js"
echo ""
