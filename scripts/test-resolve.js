require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { resolveVideo } = require('../lib/video-resolver');

const url = process.argv[2];
if (!url) {
  console.error('الاستخدام: node scripts/test-resolve.js "https://www.instagram.com/reel/..."');
  process.exit(1);
}

resolveVideo(url)
  .then((r) => {
    console.log('✅ نجح');
    console.log('type:', r.type);
    console.log('url:', r.directUrl || r.filePath);
    console.log('caption:', r.caption || '(فارغ)');
  })
  .catch((e) => {
    console.error('❌', e.message);
    process.exit(1);
  });
