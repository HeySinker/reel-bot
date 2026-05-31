require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

let token = process.env.META_ACCESS_TOKEN?.trim();
if (token?.startsWith('bEAA')) token = token.slice(1);

if (!token) {
  console.error('❌ META_ACCESS_TOKEN مفقود في .env');
  process.exit(1);
}

const GRAPH = 'https://graph.facebook.com/v19.0';

async function main() {
  for (const endpoint of ['me/accounts', 'me/assigned_pages']) {
    try {
      const { data } = await axios.get(`${GRAPH}/${endpoint}`, {
        params: { access_token: token, fields: 'id,name', limit: 100 },
      });
      const pages = data.data || [];
      if (pages.length === 0) continue;

      console.log('\n📋 صفحات الحساب:\n');
      pages.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   PAGE_ID: ${p.id}\n`);
      });

      console.log('أضف في .env (مثال):');
      console.log(`PAGE_IDS=${pages.map((p) => p.id).join(',')}`);
      console.log('\nأو بأسماء جزئية:');
      console.log(`PAGE_IDS=${pages.map((p) => p.name.split(' ')[0]).join(',')}`);
      return;
    } catch (e) {
      console.warn(`${endpoint}:`, e.response?.data?.error?.message || e.message);
    }
  }
  console.error('❌ لم تُجلب أي صفحات');
  process.exit(1);
}

main();
