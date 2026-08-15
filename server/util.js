/* 联网工具：JSON 抓取 + Wikimedia 图片搜索（免费、无需密钥、合规） */
const https = require('https');

function getJSON(url, timeout = 9000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 VAVA-Workbench/1.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return getJSON(res.headers.location, timeout).then(resolve, reject);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('parse fail')); } });
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => req.destroy(new Error('timeout')));
  });
}

// 抓取纯文本/HTML（用于公开搜索聚合，返回字符串）
function fetchText(url, timeout = 9000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VAVAWorkbench/1.0)' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location, timeout).then(resolve, reject);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => req.destroy(new Error('timeout')));
  });
}

// 从 Wikimedia Commons 按关键词取真实图片（jpg/png/webp）
async function commonsImages(query, limit = 8) {
  const q = encodeURIComponent(query);
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + q +
    '&gsrlimit=' + (limit + 3) + '&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json';
  try {
    const j = await getJSON(url);
    const pages = j.query && j.query.pages;
    const out = [];
    if (pages) for (const k in pages) {
      const ii = pages[k].imageinfo && pages[k].imageinfo[0];
      if (!ii) continue;
      const u = ii.thumburl || ii.url;
      if (!/\.(jpg|jpeg|png|webp)$/i.test(u)) continue;
      out.push({ url: u, title: (pages[k].title || '').replace('File:', '') });
      if (out.length >= limit) break;
    }
    return out;
  } catch (e) { return []; }
}

module.exports = { getJSON, commonsImages, fetchText };
