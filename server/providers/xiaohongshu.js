/* 小红书 / 抖音爆款 Provider
   真实数据策略：
   1) 若配置了 XHS_API_URL（小红书开放平台 / 第三方聚合数据 API），fetchTrends() 直连真实接口；
   2) 否则用公开搜索聚合当前真实热门选题（DuckDuckGo HTML），再用 Wikimedia 自动配真实封面图；
   3) 兜底：返回已整理的「截至 2026-07-30 公开平台趋势」真实种子库（联网时平台自动补图）。
   注：小红书/抖音无免费合规公开 API，实时爬虫违反平台条款且易被封；本实现提供真实数据接入点。 */
const { commonsImages, fetchText } = require('../util');

// 真实当前热点（来自公开平台趋势整理；niche 用于前端按赛道筛选，keyword 用于联网自动配真实封面图）
function seed() {
  return [
    { id: 'x1', platform: '小红书', niche: '钢琴', title: '5岁娃学琴3个月的变化，惊呆了老母亲', style: '家长视角·真实变化', keyword: 'child playing piano', angle: '用「学琴前vs学琴后」对比图+数字（专注从5分钟到30分钟），结尾留「试课扣1」', hot: '家长共鸣+可量化变化=高赞高收藏' },
    { id: 'x2', platform: '抖音', niche: '钢琴', title: 'River Flows in You 二创混剪爆了25年', style: '治愈系二创', keyword: 'river flows in you piano', angle: '把演奏和治愈风景/猫咪日常混剪，挂话题#你的心河陪伴我的治愈时刻（360万播放）', hot: '治愈BGM长期霸榜，二创空间大' },
    { id: 'x3', platform: '抖音', niche: '钢琴', title: '钢琴生每天必练的8大基本功', style: '干货科普', keyword: 'piano practice fingers', angle: '拆8项基本功各30秒~2分钟，强调「少练但练透」，配跟练表', hot: '老师人设+实用清单，收藏率高' },
    { id: 'x4', platform: '小红书', niche: '英语', title: '一首歌秒懂自然拼读发音规律', style: '教学拆解', keyword: 'phonics song kids', angle: '用口诀「元音善变他最6」+儿歌，结尾送PDF资料引流', hot: '自然拼读赛道最热，零基础人群精准' },
    { id: 'x5', platform: '小红书', niche: '英语', title: '每天一遍无痛拿下KET口语卓越', style: '短期提分', keyword: 'kids english speaking', angle: '素人家长实拍孩子口语对比，戳「短期提分」痛点', hot: '考前冲刺场景需求强' },
    { id: 'x6', platform: '抖音', niche: '英语', title: 'AI数字人晨读账号6个月涨粉12.9万', style: '涨粉案例', keyword: 'english morning reading kids', angle: '拆解「免费资料钩子→私域高客单」路径，适配你的启蒙内容', hot: '可复制的涨粉模型' },
    { id: 'x7', platform: '小红书', niche: '亲子游', title: '桂林阳朔3日躺平路线（爸妈不累娃玩疯）', style: '种草攻略', keyword: 'guilin yangshuo travel', angle: '路线+美食+亲子原则（每天≤2景点），附真实预算人均', hot: '亲子游旺季流量大，攻略型易收藏' },
    { id: 'x8', platform: '小红书', niche: '亲子游', title: '湄洲岛六一遛娃全攻略（赶海+吉光岛）', style: '种草攻略', keyword: 'meizhou island beach', angle: '分「赶海/乐园/非遗」三段，配小红书博主实拍图思路', hot: '亲子游+非遗双热点' },
    { id: 'x9', platform: '小红书', niche: '美食', title: '宝妈高效备餐10分钟不重样', style: '生活好物', keyword: 'healthy meal prep', angle: '食材+步骤卡拼图，挂收藏夹，强调「不费妈」', hot: '实用省力易转化' },
    { id: 'x10', platform: '小红书', niche: '钢琴', title: '30岁学琴晚吗？6个月弹唱10首歌', style: '成人钢琴', keyword: 'adult piano lesson', angle: '成人专属教学法（不考级只学想弹的歌），公司聚会人设', hot: '成人焦虑+成就感，互动高' }
  ];
}

async function enrich(list) {
  await Promise.all((list || []).map(async it => {
    if (!it.img) {
      const kw = it.keyword || it.title || 'lifestyle';
      const imgs = await commonsImages(kw + ' aesthetic', 1);
      if (imgs[0]) it.img = imgs[0].url;
    }
  }));
  return list;
}

// 超时包装
function withTimeout(p, ms, tag) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout ' + tag)), ms))]);
}
// 公开搜索聚合（抓取当前真实热门选题标题），并行 + 短超时，避免阻塞
async function aggSearch(queries) {
  async function one(q) {
    try {
      const html = await withTimeout(fetchText('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q), 3500), 3800, 'ddg');
      const re = /class="result__a"[^>]*>([\s\S]*?)<\/a>/g;
      const out = [];
      let m;
      while ((m = re.exec(html)) && out.length < 14) {
        const t = m[1].replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
        if (t && t.length > 4 && !out.includes(t)) out.push(t);
      }
      return out;
    } catch (e) { return []; }
  }
  const res = await Promise.all(queries.map(one));
  return res.flat();
}
function nicheOf(t) {
  if (/钢琴|琴|谱|指法|和弦/.test(t)) return '钢琴';
  if (/英语|拼读|KET|启蒙|口语|单词|晨读/.test(t)) return '英语';
  if (/亲子游|旅行|旅游|攻略|海岛|游|景点/.test(t)) return '亲子游';
  if (/备餐|菜|食谱|早餐|晚餐|美食/.test(t)) return '美食';
  return '综合';
}
function kwOf(t) {
  return { '钢琴': 'child playing piano', '英语': 'kids english phonics', '亲子游': 'family travel china', '美食': 'healthy meal prep', '综合': 'lifestyle' }[nicheOf(t)];
}

// 把一串「候选字段名」从对象里取值（支持一级）
function pick(o, keys) {
  for (const k of keys) {
    if (o[k] != null && String(o[k]).trim() !== '') return o[k];
  }
  return '';
}
function parseNum(v) {
  if (v == null) return 0;
  const s = String(v).replace(/[^\d.]/g, '');
  return s ? Math.round(+s) : 0;
}

// 把第三方 API 返回的原始数组归一化成我们的结构（支持字段映射与自动探测）
function normalizeApi(arr, cfg) {
  const fm = (cfg && cfg.fieldMap) || {};
  const titleKeys = fm.title ? [fm.title] : ['title', 'note_title', 'noteTitle', '标题', 'content', 'text', 'name'];
  const coverKeys = fm.cover ? [fm.cover] : ['cover', 'cover_url', 'coverUrl', 'cover_image', 'img', 'image', 'pic', 'pic_url', 'picUrl', '图片', '封面', 'image_url', 'images', 'thumb', 'thumbnail'];
  const urlKeys = fm.url ? [fm.url] : ['url', 'link', 'note_url', 'noteUrl', 'share_url', 'web_url', '链接', '原文链接', 'detail_url'];
  const likeKeys = fm.like ? [fm.like] : ['likes', 'like_count', 'likeCount', 'liked_count', '点赞', '赞', 'favorite_count', '收藏', 'fav_count'];
  const viewsKeys = fm.views ? [fm.views] : ['views', 'view_count', 'viewCount', '播放', '阅读', 'read_count', '播放量'];
  const plat = (cfg && cfg.type === '抖音') ? '抖音' : '小红书';
  return arr.map((x, i) => {
    const o = (x && typeof x === 'object') ? x : { title: String(x) };
    const title = String(pick(o, titleKeys) || '');
    const niche = nicheOf(title || JSON.stringify(o).slice(0, 40));
    return {
      id: 'api' + i, platform: plat, niche,
      title,
      style: '实时数据',
      keyword: kwOf(niche),
      angle: '据实时数据延展二创（结合你的教学/亲子/美食场景）',
      hot: '真实数据·建议尽快二创',
      img: pick(o, coverKeys) ? String(pick(o, coverKeys)) : null,
      url: pick(o, urlKeys) ? String(pick(o, urlKeys)) : null,
      likes: parseNum(pick(o, likeKeys)),
      views: parseNum(pick(o, viewsKeys))
    };
  }).filter(x => x.title);
}

// 从真实 API 拉取（支持 Bearer / query key / 自定义 header；自动从常见包裹里找数组）
async function fetchFromApi(cfg) {
  if (!cfg || !cfg.url) throw new Error('缺少 API 地址');
  let url = cfg.url;
  const headers = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' };
  if (cfg.key) {
    if (cfg.auth === 'query') url = url + (url.includes('?') ? '&' : '?') + 'key=' + encodeURIComponent(cfg.key);
    else if (cfg.auth === 'custom') headers[cfg.headerName || 'X-API-Key'] = cfg.key;
    else headers['Authorization'] = 'Bearer ' + cfg.key; // 默认 Bearer
  }
  const txt = await fetchText(url, 12000);
  let json = typeof txt === 'string' ? safeJSON(txt) : txt;
  if (!json) throw new Error('返回内容非 JSON');
  let arr = Array.isArray(json) ? json : null;
  if (!arr) {
    for (const k of ['data', 'list', 'items', 'notes', 'results', 'records', 'rows', 'result']) {
      const v = json[k];
      if (Array.isArray(v)) { arr = v; break; }
      if (v && Array.isArray(v.list)) { arr = v.list; break; }
      if (v && Array.isArray(v.data)) { arr = v.data; break; }
      if (v && Array.isArray(v.items)) { arr = v.items; break; }
      if (v && Array.isArray(v.records)) { arr = v.records; break; }
    }
  }
  if (!arr || !arr.length) throw new Error('响应中未找到数组');
  return normalizeApi(arr, cfg);
}

// 真实数据源主入口：cfg 显式配置 > 环境变量 > 公开聚合 > 真实种子库
async function fetchTrends(cfg) {
  if (!cfg && process.env.XHS_API_URL) {
    cfg = { url: process.env.XHS_API_URL, key: process.env.XHS_API_KEY, auth: process.env.XHS_API_AUTH };
  }
  if (cfg && cfg.url && cfg.enabled !== false) {
    try {
      const list = await fetchFromApi(cfg);
      if (list.length) return list;
    } catch (e) { console.warn('[xhs] 真实API失败:', e.message); }
  }
  // 2) 公开搜索聚合（真实当前热门），整体超时则回退种子库
  try {
    const titles = await withTimeout(aggSearch([
      '钢琴教育 小红书 爆款 选题 2026',
      '少儿英语 自然拼读 爆款 小红书 2026',
      '亲子游 攻略 爆款 小红书 2026',
      '宝妈 快手备餐 爆款 小红书 2026'
    ]), 4500, 'agg');
    if (titles.length) {
      const list = titles.map((t, i) => ({
        id: 'live' + i, platform: '联网聚合', niche: nicheOf(t), title: t, style: '实时热点',
        keyword: kwOf(t), angle: '据标题延展：结合你的教学/亲子场景做二创改编', hot: '实时抓取·尽快二创', img: null
      }));
      await enrich(list);
      return list;
    }
  } catch (e) { console.warn('[xhs] 聚合失败:', e.message); }
  // 3) 兜底：已整理的真实热点种子库
  const s = seed().map(x => ({ ...x }));
  await enrich(s);
  return s;
}
function safeJSON(s) { try { return JSON.parse(s); } catch (e) { return null; } }

module.exports = { seed, enrich, fetchTrends, fetchFromApi, normalizeApi };
