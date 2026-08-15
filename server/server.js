/* VAVA 工作台 · 后端服务（零依赖 Node 内置 http）
   - 托管前端静态文件
   - 提供 REST API：联网抓取/自动更新/同步
   - 定时刷新（爆款配图、已知攻略缓存）
   运行：node server/server.js   （默认 3000，可用 PORT 环境变量覆盖） */
const http = require('http');
const fs = require('fs');
const path = require('path');
const store = require('./store');
const xhs = require('./providers/xiaohongshu');
const travel = require('./providers/travel');
const video = require('./providers/video');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };

store.load();

function sendJSON(res, code, obj) {
  const b = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(b);
}
function readBody(req) {
  return new Promise(resolve => {
    let d = ''; req.on('data', c => d += c); req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { resolve({}); } });
  });
}
function staticFile(req, res, urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(buf);
  });
}

async function refreshXhs() {
  const d = store.get();
  d.xhsTrends = await xhs.fetchTrends(d.xhsApi);
  store.save();
}

const server = http.createServer(async (req, res) => {
  const u = req.url;
  try {
    if (u.startsWith('/api/')) {
      if (u === '/api/health') return sendJSON(res, 200, { ok: true, time: Date.now() });

      // 同步：返回可离线缓存的全量（爆款/政策/攻略缓存）
      if (u === '/api/sync') {
        const d = store.get();
        d.lastSync = Date.now(); store.save();
        return sendJSON(res, 200, { online: true, lastSync: d.lastSync, xhs: d.xhsTrends, policy: d.policyList, travelCache: d.travelCache });
      }

      // 小红书爆款
      if (u === '/api/xhs/trends') return sendJSON(res, 200, store.get().xhsTrends);
      if (u === '/api/xhs/refresh') {
        try { const list = await xhs.fetchTrends(store.get().xhsApi); store.get().xhsTrends = list; store.save(); return sendJSON(res, 200, list); }
        catch (e) { return sendJSON(res, 500, { error: e.message }); }
      }
      // 保存小红书真实 API 配置（运行时，无需服务器环境变量）
      if (u === '/api/xhs/config' && req.method === 'POST') {
        const b = await readBody(req);
        const cfg = {
          enabled: b.enabled !== false,
          type: b.type || '小红书',
          url: (b.url || '').trim(),
          key: (b.key || '').trim(),
          auth: b.auth || 'header',
          headerName: (b.headerName || '').trim(),
          fieldMap: b.fieldMap || {}
        };
        store.get().xhsApi = cfg;
        store.save();
        try {
          const list = await xhs.fetchTrends(cfg);
          store.get().xhsTrends = list; store.save();
          return sendJSON(res, 200, { ok: true, count: list.length, sample: list.slice(0, 3).map(x => ({ title: x.title, niche: x.niche, img: x.img })) });
        } catch (e) {
          return sendJSON(res, 200, { ok: false, error: e.message, note: '配置已保存，但连接失败，请检查地址/密钥/字段映射。后端仍会按现有数据运行。' });
        }
      }
      // 测试连接（不落库）
      if (u === '/api/xhs/test' && req.method === 'POST') {
        const b = await readBody(req);
        try {
          const list = await xhs.fetchFromApi({ type: b.type || '小红书', url: (b.url || '').trim(), key: (b.key || '').trim(), auth: b.auth || 'header', headerName: (b.headerName || '').trim(), fieldMap: b.fieldMap || {} });
          return sendJSON(res, 200, { ok: true, count: list.length, sample: list.slice(0, 3).map(x => ({ title: x.title, niche: x.niche, img: x.img })) });
        } catch (e) { return sendJSON(res, 200, { ok: false, error: e.message }); }
      }
      if (u === '/api/xhs/ingest' && req.method === 'POST') {
        const body = await readBody(req);
        const list = store.get().xhsTrends;
        const it = { id: 'x' + Date.now(), title: body.title || '未命名', style: body.style || '实用', keyword: body.keyword || body.title || 'lifestyle', angle: body.angle || '', hot: '', img: null };
        list.unshift(it);
        await xhs.enrich([it]); store.save();
        return sendJSON(res, 200, it);
      }

      // 旅游攻略生成（联网整合）
      if (u.startsWith('/api/travel/generate')) {
        const q = new URL(u, 'http://x').searchParams;
        const dest = q.get('dest'), days = q.get('days') || 5, type = q.get('type') || '家庭游', season = q.get('season') || '春秋';
        if (!dest) return sendJSON(res, 400, { error: '缺少目的地' });
        const key = dest + '|' + days + '|' + type + '|' + season;
        const cache = store.get().travelCache;
        if (cache[key]) return sendJSON(res, 200, cache[key]);
        const result = await travel.generate(dest, days, type, season);
        cache[key] = result; store.save();
        return sendJSON(res, 200, result);
      }

      // 英文政策
      if (u === '/api/policy') return sendJSON(res, 200, store.get().policyList);

      // 抖音 / 小红书 视频链接 → 解析真实播放地址（内嵌播放用）
      if (u.startsWith('/api/parse')) {
        const q = new URL(u, 'http://x').searchParams;
        const url = (q.get('url') || '').trim();
        if (!url) return sendJSON(res, 400, { ok: false, error: '缺少 url' });
        try {
          const r = await video.parse(url);
          return sendJSON(res, 200, r);
        } catch (e) { return sendJSON(res, 200, { ok: false, reason: 'error', url, message: e.message }); }
      }

      return sendJSON(res, 404, { error: 'unknown api' });
    }
    return staticFile(req, res, u);
  } catch (e) {
    return sendJSON(res, 500, { error: e.message });
  }
});

// 启动即刷新配图；每 30 分钟再次刷新
refreshXhs().then(() => console.log('[xhs] 爆款配图已联网刷新'));
setInterval(() => refreshXhs().catch(() => {}), 30 * 60 * 1000);

server.listen(PORT, '0.0.0.0', () => console.log('VAVA 工作台后端已启动: http://0.0.0.0:' + PORT));
