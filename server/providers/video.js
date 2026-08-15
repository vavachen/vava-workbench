/* 抖音 / 小红书 视频链接 → 解析真实播放地址 → 内嵌播放
   零依赖（仅用 Node 内置 https/http/zlib）。
   说明：
   - 抖音：分享短链 v.douyin.com/xxx 会 30x 跳到 www.douyin.com/video/<id>，
     页面 <script id="RENDER_DATA"> 内含真实视频地址（playApi 无水印 / playAddr 带水印）。
   - 小红书：explore/<id> 页面 __INITIAL_STATE__ 含真实视频地址，但需登录态/签名，
     服务端直连大多被风控拦截 → 返回 ok:false，前端回退「复制链接在 App 打开」。
   仅用于个人整理 / 学习用途；视频地址带签名、数小时内失效。 */
const https = require('https');
const http = require('http');
const zlib = require('zlib');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

function isDouyin(u) { return /douyin\.com|iesdouyin\.com/i.test(u); }
function isXhs(u) { return /xiaohongshu\.com|xhslink\.com/i.test(u); }
function parseUrl(u) { try { return new URL(u); } catch (e) { return null; } }

/* GET：跟随重定向 + 收集 cookie + 自动解 gzip/deflate/br */
function get(url, opts) {
  opts = opts || {};
  return new Promise((resolve, reject) => {
    const maxRedir = opts.maxRedirects == null ? 8 : opts.maxRedirects;
    const timeout = opts.timeout || 12000;
    const cookies = opts.cookies || [];
    const doReq = (target, redirLeft) => {
      const u = parseUrl(target);
      if (!u) return reject(new Error('非法 URL'));
      const lib = u.protocol === 'http:' ? http : https;
      const headers = Object.assign({
        'User-Agent': opts.ua || UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Connection': 'keep-alive'
      }, opts.headers || {});
      if (cookies.length) headers['Cookie'] = cookies.join('; ');
      const req = lib.get(u, { headers }, res => {
        const status = res.statusCode, h = res.headers;
        const setCookie = [];
        if (h['set-cookie']) h['set-cookie'].forEach(c => setCookie.push(c.split(';')[0]));
        if (status >= 300 && status < 400 && h.location && redirLeft > 0) {
          const next = parseUrl(h.location) ? h.location : (u.origin + h.location);
          return doReq(next, redirLeft - 1);
        }
        if (status !== 200) { res.resume(); return resolve({ status, headers: h, cookies: setCookie, body: '' }); }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          const enc = (h['content-encoding'] || '').toLowerCase();
          const finish = (text) => resolve({ status: 200, headers: h, cookies: setCookie, body: text });
          try {
            if (enc === 'gzip') zlib.gunzip(buf, (e, d) => e ? finish(buf.toString('utf8')) : finish(d.toString('utf8')));
            else if (enc === 'deflate') zlib.inflate(buf, (e, d) => e ? finish(buf.toString('utf8')) : finish(d.toString('utf8')));
            else if (enc === 'br') zlib.brotliDecompress(buf, (e, d) => e ? finish(buf.toString('utf8')) : finish(d.toString('utf8')));
            else finish(buf.toString('utf8'));
          } catch (e) { finish(buf.toString('utf8')); }
        });
      });
      req.on('error', reject);
      req.setTimeout(timeout, () => req.destroy(new Error('timeout')));
    };
    doReq(url, maxRedir);
  });
}

/* ---- 提取工具（结构常变，用特征深度搜索，导出供单测） ---- */
function extractRender(html) {
  if (!html) return null;
  let m = html.match(/<script id="RENDER_DATA" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) m = html.match(/<script id="_ROUTER_DATA" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(decodeURIComponent(m[1])); }
  catch (e) { try { return JSON.parse(m[1]); } catch (e2) { return null; } }
}
function findVideoNode(obj, depth) {
  depth = depth || 0;
  if (!obj || typeof obj !== 'object' || depth > 14) return null;
  if ((obj.playApi || obj.playAddr) && (obj.cover || obj.originCover || obj.poster || obj.dynamicCover)) return obj;
  if (obj.playApi || (Array.isArray(obj.playAddr) && obj.playAddr.length) || Array.isArray(obj.bitRate)) return obj;
  for (const k of Object.keys(obj)) {
    const r = findVideoNode(obj[k], depth + 1);
    if (r) return r;
  }
  return null;
}
function pickVideoUrl(node) {
  if (!node) return null;
  const cands = [];
  if (node.playApi) cands.push(node.playApi);
  if (Array.isArray(node.playAddr)) node.playAddr.forEach(a => a && a.url && cands.push(a.url));
  if (Array.isArray(node.bitRate)) node.bitRate.forEach(b => b.playApi && cands.push(b.playApi));
  if (node.playUrl) cands.push(node.playUrl);
  if (typeof node.url === 'string' && /\.(mp4|m3u8)/i.test(node.url)) cands.push(node.url);
  // 优先无水印（playApi / bitRate.playApi 一般是去水印直链）
  const wm = cands.find(u => !/playwm|watermark/i.test(u));
  return (wm || cands[0]) || null;
}
function pickCover(node) {
  if (!node) return null;
  const c = node.cover || node.originCover || node.poster || node.dynamicCover;
  if (!c) return null;
  if (typeof c === 'string') return c;
  return c.url || c.origin || null;
}
function findStr(obj, key, depth) {
  depth = depth || 0;
  if (!obj || typeof obj !== 'object' || depth > 14) return null;
  if (obj[key] != null && typeof obj[key] === 'string' && obj[key].length) return obj[key];
  for (const k of Object.keys(obj)) {
    const r = findStr(obj[k], key, depth + 1);
    if (r) return r;
  }
  return null;
}

async function parseDouyin(rawUrl) {
  let first;
  try { first = await get(rawUrl, { ua: UA_MOBILE, maxRedirects: 8, timeout: 12000 }); }
  catch (e) { throw new Error('访问抖音失败：' + e.message); }
  const cookies = first.cookies || [];
  let html = first.body || '';
  let data = extractRender(html);

  // 从任意位置拿 aweme id / 视频页 URL，再去详情页取（更稳）
  const loc = (first.headers && first.headers.location) || '';
  let idm = (loc + ' ' + html).match(/video[/-](\d{10,})/);
  if (!idm) idm = rawUrl.match(/video[/-](\d{10,})/);
  if (!idm) idm = html.match(/aweme_id["'=: ]+(\d{10,})/);
  const vid = idm ? idm[1] : null;

  if (!data && vid) {
    const opt = { ua: UA, cookies, timeout: 12000, headers: { 'Referer': 'https://www.douyin.com/' } };
    const det = await get('https://www.douyin.com/video/' + vid, opt).catch(() => ({ body: '' }));
    data = extractRender(det.body);
    if (!data) {
      const det2 = await get('https://www.iesdouyin.com/share/video/' + vid + '/', { ua: UA, cookies, timeout: 12000 }).catch(() => ({ body: '' }));
      data = extractRender(det2.body);
    }
  }
  if (!data) throw new Error('未找到抖音页面数据（链接可能失效或需登录）');
  const vn = findVideoNode(data);
  if (!vn) throw new Error('页面中未找到视频数据');
  const videoUrl = pickVideoUrl(vn);
  if (!videoUrl) throw new Error('未提取到可用视频地址');
  return {
    platform: 'douyin', ok: true, videoUrl,
    title: (findStr(data, 'desc') || '').slice(0, 200),
    cover: pickCover(vn) || null,
    author: findStr(data, 'nickname') || findStr(data, 'authorName') || '',
    watermark: /playwm|watermark/i.test(videoUrl)
  };
}

function findXhsVideo(obj, depth) {
  depth = depth || 0;
  if (!obj || typeof obj !== 'object' || depth > 16) return null;
  if (obj.video && (obj.video.consumerUrl || (obj.video.media && obj.video.media.stream && obj.video.media.stream.h264))) {
    const v = obj.video;
    const stream = v.media && v.media.stream && v.media.stream.h264;
    const url = v.consumerUrl || (stream && stream[0] && (stream[0].masterUrl || stream[0].url)) || null;
    return { url, title: findStr(obj, 'title'), cover: (v.cover && (v.cover.url || v.cover)) || null, author: findStr(obj, 'nickname') || findStr(obj, 'authorName') };
  }
  for (const k of Object.keys(obj)) {
    const r = findXhsVideo(obj[k], depth + 1);
    if (r) return r;
  }
  return null;
}
async function parseXhs(rawUrl) {
  const first = await get(rawUrl, { ua: UA_MOBILE, maxRedirects: 8, timeout: 12000 }).catch(() => ({ body: '' }));
  const html = first.body || '';
  const m = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*(?:;|<\/script>)/)
    || html.match(/__INITIAL_STATE__["']?\s*[:=]\s*(\{[\s\S]*?\})\s*<\/script>/);
  if (!m) {
    if (/验证码|slider|verify|security|请完成安全验证|网络异常/i.test(html))
      return { platform: 'xiaohongshu', ok: false, reason: 'xhs_captcha', url: rawUrl, message: '小红书需要登录 / 安全验证，无法自动解析。请用「复制链接」在小红书 App 打开。' };
    return { platform: 'xiaohongshu', ok: false, reason: 'xhs_blocked', url: rawUrl, message: '小红书页面未返回视频数据（可能被风控拦截）。请用「复制链接」在小红书 App 打开。' };
  }
  let data;
  try { data = JSON.parse(m[1]); } catch (e) { return { platform: 'xiaohongshu', ok: false, reason: 'xhs_parse_fail', url: rawUrl, message: '小红书数据解析失败。' }; }
  const vid = findXhsVideo(data);
  if (!vid || !vid.url) return { platform: 'xiaohongshu', ok: false, reason: 'xhs_no_video', url: rawUrl, message: '该笔记可能不是视频，或未提取到视频地址。' };
  return { platform: 'xiaohongshu', ok: true, videoUrl: vid.url, title: (vid.title || '').slice(0, 200), cover: vid.cover || null, author: vid.author || '' };
}

/* ---- 主入口（带 TTL 缓存） ---- */
const cache = new Map();
const TTL = 3 * 3600 * 1000; // 视频地址数小时失效，缓存仅用于减少重复请求
async function parse(url) {
  url = (url || '').trim();
  if (!url) return { ok: false, reason: 'empty' };
  if (!isDouyin(url) && !isXhs(url)) return { ok: false, reason: 'unsupported', url, message: '仅支持抖音 / 小红书链接。' };
  const hit = cache.get(url);
  if (hit && Date.now() < hit.exp) return hit.res;
  let res;
  try {
    res = isDouyin(url) ? await parseDouyin(url) : await parseXhs(url);
  } catch (e) {
    res = { ok: false, reason: 'error', url, message: '解析失败：' + e.message };
  }
  cache.set(url, { exp: Date.now() + TTL, res });
  return res;
}

module.exports = { parse, isDouyin, isXhs, extractRender, findVideoNode, pickVideoUrl, findXhsVideo };
