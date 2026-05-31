const axios = require('axios');
const { GRAPH_API } = require('./config');

/** رفع عبر رابط مباشر — مناسب لـ Vercel (بدون قرص) */
async function uploadVideoByFileUrl(videoUrl, caption, pageId, pageToken) {
  const { data } = await axios.post(
    `${GRAPH_API}/${pageId}/videos`,
    null,
    {
      params: {
        file_url: videoUrl,
        description: caption,
        published: true,
        access_token: pageToken,
      },
      timeout: 120000,
    }
  );
  return data;
}

/** رفع من مسار ملف — للتشغيل المحلي */
async function uploadVideoFromFile(videoPath, caption, pageId, pageToken) {
  const fs = require('fs');
  const FormData = require('form-data');
  const form = new FormData();
  form.append('source', fs.createReadStream(videoPath));
  form.append('description', caption);
  form.append('published', 'true');
  form.append('access_token', pageToken);

  const { data } = await axios.post(`${GRAPH_API}/${pageId}/videos`, form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 300000,
  });
  return data;
}

module.exports = { uploadVideoByFileUrl, uploadVideoFromFile };
