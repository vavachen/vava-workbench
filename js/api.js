/* ===== VAVA 工作台 · 联网同步层 =====
   策略：优先调用自带后端 /api；若后端不可达（如纯静态托管），则浏览器直接调用
   支持 CORS 的公开服务（Wikipedia / Open-Meteo / Wikimedia Commons）实现「联网即自动更新」。
   所有数据会缓存进 localStorage，断网也能看。 */
const API = (function () {
  function apiBase() { return ((DB.get().settings && DB.get().settings.apiBase) || window.API_BASE || '/api'); }
  let online = false, lastSync = null, backendReachable = false;

  function jget(url, ms = 9000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } })
      .then(r => { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .finally(() => clearTimeout(t));
  }

  /* ---------- 公开 CORS 数据源（浏览器直连） ---------- */
  async function commonsImages(query, limit = 8) {
    const u = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
      encodeURIComponent(query) + '&gsrlimit=' + (limit + 3) + '&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*';
    const j = await jget(u);
    const pages = j.query && j.query.pages, out = [];
    if (pages) for (const k in pages) {
      const ii = pages[k].imageinfo && pages[k].imageinfo[0]; if (!ii) continue;
      const uu = ii.thumburl || ii.url; if (!/\.(jpg|jpeg|png|webp)$/i.test(uu)) continue;
      out.push({ url: uu, title: (pages[k].title || '').replace('File:', '') });
      if (out.length >= limit) break;
    }
    return out;
  }
  async function wikiSummary(dest) {
    const j = await jget('https://zh.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(dest));
    return { extract: j.extract, thumb: j.thumbnail && j.thumbnail.source, lat: j.coordinates && j.coordinates.lat, lon: j.coordinates && j.coordinates.lon };
  }
  async function wikiCoords(dest) {
    const j = await jget('https://zh.wikipedia.org/w/api.php?action=query&prop=coordinates&titles=' + encodeURIComponent(dest) + '&format=json&origin=*');
    const pages = j.query && j.query.pages;
    for (const k in pages) { const c = pages[k].coordinates && pages[k].coordinates[0]; if (c) return { lat: c.lat, lon: c.lon }; }
    return null;
  }
  async function openMeteo(lat, lon) {
    const j = await jget(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`);
    return j.daily;
  }

  /* ---------- 攻略生成逻辑 ---------- */
  function buildPacking(type, season) {
    const base = ['🪪 身份证/护照', '💳 银行卡', '📱 充电器/充电宝', '💊 常用药', '🧴 防晒霜', '👕 换洗衣物', '👟 舒适鞋'];
    let extra = [];
    if (type === '亲子游') extra = ['👶 宝宝用品', '🧸 安抚玩具', '🍼 奶瓶/零食', '🚼 婴儿车/背带', '🧷 湿巾'];
    else if (type === '家庭游') extra = ['📷 相机', '🎒 双肩包', '👵 老人常用药', '🧣 围巾'];
    else if (type === '情侣游') extra = ['👗 美衣×N', '💄 化妆品', '🕶 墨镜', '📷 拍照道具', '💐 小浪漫'];
    let se = [];
    if (/夏/.test(season)) se = ['🕶 墨镜', '🩱 泳衣', '🌂 遮阳帽'];
    else if (/冬/.test(season)) se = ['🧥 厚外套', '🧤 手套', '🧣 围巾', '🔥 暖宝宝'];
    else se = ['🧥 薄外套', '🌂 雨具'];
    return base.concat(extra, se);
  }
  function buildRoute(dest, days, season, temps) {
    const plan = [];
    for (let i = 1; i <= days; i++) {
      const mx = temps && temps.temperature_2m_max && temps.temperature_2m_max[i - 1];
      const mn = temps && temps.temperature_2m_min && temps.temperature_2m_min[i - 1];
      const temp = (mx != null) ? (mn + '~' + mx + '°C') : '—';
      const wear = /冬/.test(season) ? '保暖外套+防滑鞋' : (/夏/.test(season) ? '透气防晒+遮阳帽' : '轻便舒适+薄外套');
      plan.push({ day: i, spot: i === 1 ? ('抵达' + dest + ' · 市区适应') : (dest + ' 第' + i + '天深度游'), time: '09:00', dur: '全天', temp, wear, note: '可据兴趣拆分上下午，详见上方图片景点' });
    }
    return plan;
  }
  function buildBudget(type, days) {
    const n = type === '情侣游' ? 480 : type === '家庭游' ? 420 : 360;
    return [
      { cat: '住宿', item: n + '元/晚 ×' + days + '晚', price: n * days, src: '估算（可改）' },
      { cat: '吃饭', item: '120元/天 ×' + days, price: 120 * days, src: '估算' },
      { cat: '门票', item: '90元/天 ×' + days, price: 90 * days, src: '小红书参考' },
      { cat: '交通', item: '60元/天 ×' + days, price: 60 * days, src: '估算' }
    ];
  }

  async function generateTravel(dest, days, type, season) {
    // 1) 后端优先
    try {
      const j = await jget(apiBase() + '/travel/generate?dest=' + encodeURIComponent(dest) + '&days=' + encodeURIComponent(days) + '&type=' + encodeURIComponent(type) + '&season=' + encodeURIComponent(season), 12000);
      cacheTravel(dest, j); return j;
    } catch (e) { /* fallthrough 到浏览器直连 */ }
    // 2) 浏览器直连公开 CORS 服务
    const [sum, imgs] = await Promise.all([wikiSummary(dest).catch(() => ({})), commonsImages(dest + ' 风景 旅游').catch(() => [])]);
    let coords = (sum.lat && sum.lon) ? { lat: sum.lat, lon: sum.lon } : null;
    if (!coords) coords = await wikiCoords(dest).catch(() => null);
    let temps = null; if (coords) temps = await openMeteo(coords.lat, coords.lon).catch(() => null);
    const budget = buildBudget(type, days);
    const out = {
      dest, days: +days, type, season,
      intro: sum.extract || ('关于「' + dest + '」的旅行信息。联网数据来自公开百科与气象服务。'),
      thumb: sum.thumb || (imgs[0] && imgs[0].url) || null,
      images: imgs, packing: buildPacking(type, season),
      route: buildRoute(dest, days, season, temps), budget,
      budgetTotal: budget.reduce((a, b) => a + (+b.price || 0), 0),
      coords, source: 'Wikipedia · Open-Meteo · Wikimedia Commons'
    };
    cacheTravel(dest, out); return out;
  }
  function cacheTravel(dest, obj) {
    const d = DB.get(); d.travelCache = d.travelCache || {}; d.travelCache[dest] = obj; DB.save();
  }

  /* ---------- 小红书爆款配图（联网） ---------- */
  async function enrichXhs(list) {
    // 后端优先给全量（含真实 API 数据 + 配图）
    try { const j = await jget(apiBase() + '/xhs/trends', 8000); if (Array.isArray(j) && j.length) return j; } catch (e) {}
    // 浏览器直连给每个缺图项补图
    await Promise.all((list || []).map(async it => {
      if (!it.img && it.keyword) { const imgs = await commonsImages(it.keyword + ' aesthetic', 1).catch(() => []); if (imgs[0]) it.img = imgs[0].url; }
    }));
    return list;
  }
  // 把小红书真实 API 配置推送到后端（运行时，无需服务器环境变量）
  async function setXhsConfig(cfg) {
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 12000);
      const r = await fetch(apiBase() + '/xhs/config', { method: 'POST', signal: ctrl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) }).finally(() => clearTimeout(t));
      return await r.json();
    } catch (e) { return { ok: false, error: '后端不可达：请先运行后端服务（node server/server.js）后再保存配置。' }; }
  }
  async function testXhs(cfg) {
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 12000);
      const r = await fetch(apiBase() + '/xhs/test', { method: 'POST', signal: ctrl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) }).finally(() => clearTimeout(t));
      return await r.json();
    } catch (e) { return { ok: false, error: '后端不可达：请先运行后端服务（node server/server.js）。' }; }
  }

  /* ---------- 抖音 / 小红书 视频地址解析 ---------- */
  async function parseVideo(url) {
    try {
      const j = await jget(apiBase() + '/parse?url=' + encodeURIComponent(url), 15000);
      return j;
    } catch (e) { return { ok: false, offline: true, url, message: '后端不可达：请先运行后端服务（node server/server.js）后再试。' }; }
  }

  /* ---------- 后端同步（可选，用于离线缓存 + 手动录入持久化） ---------- */
  async function backendSync() {
    try {
      const j = await jget(apiBase() + '/sync', 8000);
      if (j && j.online) {
        backendReachable = true; online = true; lastSync = j.lastSync;
        const d = DB.get();
        if (j.xhs && j.xhs.length) d.xhsTrends = j.xhs;
        if (j.policy && j.policy.length) d.policyList = j.policy;
        if (j.travelCache) d.travelCache = Object.assign(d.travelCache || {}, j.travelCache);
        DB.save();
      }
    } catch (e) { online = false; }
    return { online, lastSync, backend: backendReachable };
  }

  async function init() { return backendSync(); }

  return { init, generateTravel, enrichXhs, backendSync, setXhsConfig, testXhs, parseVideo, get online() { return online; }, get lastSync() { return lastSync; }, get backend() { return backendReachable; } };
})();
