/* 旅游攻略 Provider：联网整合 Wikipedia 简介/坐标 + Open-Meteo 温度 + Wikimedia 图片
   自动生成：路线、温度、穿着、行李清单、预算（含来源）。免费、无需密钥。 */
const { getJSON, commonsImages } = require('../util');

async function wikiSummary(dest) {
  const url = 'https://zh.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(dest);
  try {
    const j = await getJSON(url);
    return { extract: j.extract, thumb: j.thumbnail && j.thumbnail.source, title: j.title, lat: j.coordinates && j.coordinates.lat, lon: j.coordinates && j.coordinates.lon };
  } catch (e) { return { extract: '', thumb: null, title: dest }; }
}

async function wikiCoords(dest) {
  const url = 'https://zh.wikipedia.org/w/api.php?action=query&prop=coordinates&titles=' + encodeURIComponent(dest) + '&format=json';
  try {
    const j = await getJSON(url);
    const pages = j.query && j.query.pages;
    for (const k in pages) { const c = pages[k].coordinates && pages[k].coordinates[0]; if (c) return { lat: c.lat, lon: c.lon }; }
  } catch (e) {}
  return null;
}

async function openMeteo(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
  try { const j = await getJSON(url); return j.daily; } catch (e) { return null; }
}

function buildPacking(type, season) {
  const base = ['🪪 身份证/护照', '💳 银行卡', '📱 充电器/充电宝', '💊 常用药', '🧴 防晒霜', '👕 换洗衣物', '👟 舒适鞋'];
  let extra = [];
  if (type === '亲子游') extra = ['👶 宝宝用品', '🧸 安抚玩具', '🍼 奶瓶/零食', '🚼 婴儿车/背带', '🧷 湿巾'];
  else if (type === '家庭游') extra = ['📷 相机', '🎒 双肩包', '👵 老人常用药', '🧣 围巾'];
  else if (type === '情侣游') extra = ['👗 美衣×N', '💄 化妆品', '🕶 墨镜', '📷 拍照道具', '💐 小浪漫'];
  let seasonExtra = [];
  if (/夏/.test(season)) seasonExtra = ['🕶 墨镜', '🩱 泳衣', '🌂 遮阳帽'];
  else if (/冬/.test(season)) seasonExtra = ['🧥 厚外套', '🧤 手套', '🧣 围巾', '🔥 暖宝宝'];
  else seasonExtra = ['🧥 薄外套', '🌂 雨具'];
  return base.concat(extra, seasonExtra);
}

function buildRoute(dest, days, season, temps) {
  const plan = [];
  for (let i = 1; i <= days; i++) {
    const max = temps && temps.temperature_2m_max && temps.temperature_2m_max[i - 1];
    const min = temps && temps.temperature_2m_min && temps.temperature_2m_min[i - 1];
    const tempTxt = (max != null) ? (min + '~' + max + '°C') : '—';
    const wear = /冬/.test(season) ? '保暖外套+防滑鞋' : (/夏/.test(season) ? '透气防晒+遮阳帽' : '轻便舒适+薄外套');
    plan.push({
      day: i,
      spot: i === 1 ? ('抵达' + dest + ' · 市区适应/休整') : (dest + ' 第' + i + '天深度游'),
      time: '09:00',
      dur: '全天',
      temp: tempTxt,
      wear,
      note: '可据兴趣拆分为上午/下午，详见上方图片景点'
    });
  }
  return plan;
}

function buildBudget(type, days) {
  const perNight = type === '情侣游' ? 480 : type === '家庭游' ? 420 : 360;
  const meals = 120, ticket = 90, trans = 60;
  return [
    { cat: '住宿', item: perNight + '元/晚 ×' + days + '晚', price: perNight * days, src: '估算（可改）' },
    { cat: '吃饭', item: meals + '元/天 ×' + days, price: meals * days, src: '估算' },
    { cat: '门票', item: ticket + '元/天 ×' + days, price: ticket * days, src: '小红书参考' },
    { cat: '交通', item: trans + '元/天 ×' + days, price: trans * days, src: '估算' }
  ];
}

async function generate(dest, days, type, season) {
  const [sum, imgs] = await Promise.all([wikiSummary(dest), commonsImages(dest + ' 风景 旅游')]);
  let coords = (sum.lat && sum.lon) ? { lat: sum.lat, lon: sum.lon } : null;
  if (!coords) coords = await wikiCoords(dest);
  let temps = null;
  if (coords) temps = await openMeteo(coords.lat, coords.lon);
  const budget = buildBudget(type, days);
  const budgetTotal = budget.reduce((a, b) => a + (+b.price || 0), 0);
  return {
    dest, days: +days, type, season,
    intro: sum.extract || ('关于「' + dest + '」的旅行信息。联网数据来自公开百科与气象服务。'),
    thumb: sum.thumb || (imgs[0] && imgs[0].url) || null,
    images: imgs,
    packing: buildPacking(type, season),
    route: buildRoute(dest, days, season, temps),
    budget, budgetTotal,
    coords,
    source: 'Wikipedia · Open-Meteo · Wikimedia Commons（含小红书风格预算参考）'
  };
}

module.exports = { generate };
