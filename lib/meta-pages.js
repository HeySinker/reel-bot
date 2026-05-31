const axios = require('axios');
const { GRAPH_API, META_ACCESS_TOKEN, PAGE_IDS_FILTER } = require('./config');

function pageMatchesFilter(page, filter) {
  const f = filter.toLowerCase();
  return page.pageId === filter || page.name.toLowerCase() === f || page.name.toLowerCase().includes(f);
}

async function fetchPagesFromMeta(accessToken) {
  for (const endpoint of ['me/accounts', 'me/assigned_pages']) {
    try {
      const { data } = await axios.get(`${GRAPH_API}/${endpoint}`, {
        params: { access_token: accessToken, fields: 'id,name,access_token', limit: 100 },
      });
      const pages = (data.data || [])
        .filter((p) => p.id && p.access_token)
        .map((p) => ({ name: p.name, pageId: p.id, token: p.access_token }));
      if (pages.length > 0) return pages;
    } catch (err) {
      console.warn(endpoint, err.response?.data?.error?.message || err.message);
    }
  }
  return [];
}

async function loadBranches() {
  if (!META_ACCESS_TOKEN || PAGE_IDS_FILTER.length === 0) return [];
  const all = await fetchPagesFromMeta(META_ACCESS_TOKEN);
  return all.filter((p) => PAGE_IDS_FILTER.some((f) => pageMatchesFilter(p, f)));
}

module.exports = { loadBranches, pageMatchesFilter };
