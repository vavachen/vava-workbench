// 云端每日自动生成 vava-workbench 数据（GitHub Actions 调用）
// 产出：data/xhs-daily.json（双账号运营）、data/travel-daily.json（旅游攻略，按季节切换）
// 设计：内容取自真实爆款素材池，按"日序号"轮转，保证每天不同且带当日日期。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TODAY = new Date();
const ymd = TODAY.toISOString().slice(0, 10);
const dayIndex = Math.floor((TODAY - new Date(TODAY.getFullYear(), 0, 0)) / 86400000); // 年内第几天

// ---------- 季节判定 ----------
function seasonOf(d) {
  const m = d.getMonth() + 1;
  if (m >= 12 || m <= 2) return '冬';
  if (m >= 3 && m <= 5) return '春';
  if (m >= 6 && m <= 8) return '夏';
  return '秋';
}
const SEASON = seasonOf(TODAY);

// ---------- 双账号运营：真实素材池（轮转） ----------
// 每套 edition 含 4 条草稿(2宠物+2英文) + 5 条爆款拆解 + 复盘。链接均为小红书/抖音搜索页（真实可达）。
const XHS_EDITIONS = [
  { // A：2026-08-15 真实热点
    drafts: [
      { id: 'd1', acct: 'pet', title: '「小猫扛不住计谋」同款：一块猫条，三秒破防',
        body: '前3秒：猫咪高冷背身，字幕「哪有小猫扛得住这计谋」。中间：手持猫条在猫面前画圈引诱，拍它耳朵微动、瞳孔放大、左右踱步到主动凑上来的全过程（重点抓「破防瞬间」）。结尾：字幕「口嫌体正直」，画外音「不是猫笨，是我给的太准」。套#万物可爱计划 话题，真实拍摄不摆拍。',
        tags: '#小猫扛不住计谋 #万物可爱计划 #萌宠日常 #猫咪迷惑行为 #宠物号',
        inspiredBy: '抖音「哪有小猫能扛得住这计谋」：#万物可爱计划 累计播放 3272.5万+；博主「一口一个团」338.5万粉' },
      { id: 'd2', acct: 'pet', title: '「被狗耍了」：我家狗的声东击西实录',
        body: '套用抖音爆款「我竟然被一条狗耍了」叙事：假装走向食盆，狗子眼神清澈无辜端坐；食盆落地瞬间它绕开你直奔更诱人的目标（零食/玩具），拍下你一脸错愕。评论区引导：「你家狗干过什么狡猾事？」真实素材，轻剧情+强代入。',
        tags: '#被狗耍了 #狗狗的套路 #宠物日常 #养狗人才懂 #萌宠出道计划',
        inspiredBy: '抖音「我竟然被一条狗耍了」：评论区成铲屎官「犯罪记录」专场' },
      { id: 'd3', acct: 'english', title: '别乱报班！自然拼读免费资源清单（亲测娃坐得住）',
        body: '15-40秒口播：直接给清单——Alpha Blocks（BBC拼读动画天花板，3-6岁）、Hello Carrie（88集儿歌式，零基础磨耳朵）、Jolly Phonics（英国小学官方，4-8岁多感官）。每样一句话说清适合谁、怎么用。结尾软钩子：「想看我带娃怎么用？评论试听」。禁词：保分/速成/名师/最/第一。',
        tags: '#自然拼读 #英语启蒙 #免费资源 #少儿英语 #英语试听',
        inspiredBy: '今日头条《英语自然拼读教学视频盘点：这些免费资源比报班强》' },
      { id: 'd4', acct: 'english', title: '不报外教课也能启蒙？居家短句磨耳朵法',
        body: '前3秒悬念：「不报班，娃怎么自己蹦英文？」→ 揭秘是「每天15分钟听力输入+日常短句融进去」。给家长一个可复制动作：吃饭/洗漱时随口重复两句，不拉到书桌前「上课」。强调8岁前重点听说认读、不强迫默写。结尾：「想试听怎么带？评论试听」。',
        tags: '#英语启蒙 #不报班 #居家启蒙 #自然拼读 #英语试听',
        inspiredBy: '今日头条《别再乱报英语班》：一线老师私藏免费UP主；低龄启蒙两大误区' }
    ],
    trends: [
      { id: 't1', title: '「小猫扛不住计谋」：今夏萌宠顶流', platform: '抖音/小红书', niche: '宠物',
        url: 'https://www.douyin.com/search/%E5%B0%8F%E7%8C%AB%E6%89%9B%E4%B8%8D%E4%BD%8F%E8%AE%A1%E8%B0%8B',
        analysis: '核心爆点「人类小算计 vs 宠物天真」的反差：零食/逗猫棒设套，抓猫咪从警惕到破防的戏剧瞬间。百万博主「一口一个团」靠此稳居动物达人前列。',
        angle: '宠物号可拍同款「三秒破防」挑战，套#万物可爱计划；也可改治愈向画外音做「铲屎官宠溺」主题。' },
      { id: 't2', title: '「大妈接了五毒教教主的私活」：上门喂养vlog刷屏', platform: '微博/抖音', niche: '宠物',
        url: 'https://s.weibo.com/weibo?q=%23%E5%A4%A7%E5%A6%88%E6%8E%A5%E4%BA%86%E4%BA%94%E6%AF%92%E6%95%99%E6%95%99%E4%B8%BB%E7%9A%84%E6%B4%BB%23',
        analysis: '8月6日前后刷屏：普通阿姨受托上门喂5类异宠，「电影级反差叙事」引发大量二创（五毒教编外护法）。爆点是普通人设×奇幻场景×职业感反转。',
        angle: '宠物号可借「上门喂养/寄养那些离谱事」做系列Vlog，真实记录+吐槽，强代入感。' },
      { id: 't3', title: '「狗子KTV跟唱/灵魂歌手」：宠物音乐新热点', platform: '抖音/微博', niche: '宠物',
        url: 'https://www.douyin.com/search/%E7%8B%97%E5%AD%90KTV%E8%B7%9F%E5%94%B1',
        analysis: '8月7日集中刷屏：山东狗子坐KTV台「跟唱」被封「灵魂歌手」，文案「终于有一首歌是狗能唱的」成全网热梗。爆点是场景反差+文案升华。',
        angle: '宠物号可拍「我家毛孩子唱歌/跟着音乐晃」翻拍，统一二创角度；轻量易拍。' },
      { id: 't4', title: '「自然拼读免费资源盘点」：家长最关心「比报班强」', platform: '小红书/今日头条', niche: '英语',
        url: 'https://www.xiaohongshu.com/search_result?keyword=%E8%87%AA%E7%84%B6%E6%8B%BC%E8%AF%BB%20%E5%85%8D%E8%B4%B9%E8%B5%84%E6%BA%90',
        analysis: '家长核心焦虑「报班 vs 免费资源」：盘点 Alpha Blocks、Hello Carrie、Jolly Phonics、Letter Teams。观点：「每天十几分钟长期坚持，输入量远超线下补课」。',
        angle: '英文号可做「资源避坑+实测」系列，结尾「试听」软钩子，规避K12敏感词。' },
      { id: 't5', title: '「妮可Nicole」牛津自然拼读：知识型涨粉范本', platform: '小红书/抖音', niche: '英语',
        url: 'https://www.xiaohongshu.com/search_result?keyword=%E5%A6%AE%E5%8F%AFNicole%20%E8%87%AA%E7%84%B6%E6%8B%BC%E8%AF%BB',
        analysis: '妮可Nicole（广外英语毕业、6年教龄）小红书4万粉、抖音22.3万粉，靠《牛津自然拼读系列》稳涨。爆点是专业背书+体系化+免费试看。',
        angle: '英文号可对标「专业老师出镜+一节一知识点+随堂小练」，强调「每天一节不堆量」，建立专业人设。' }
    ],
    review: { focus: '本周重点：宠物号测「计谋梗/反差日常/音乐翻拍」；英文号测「免费资源盘点+避坑+试听钩子」知识型内容。',
      prompts: ['今天发的内容，前3秒有没有让人停下来的钩子？', '英文号是否出现保分/提分/速成/名师/最/第一等敏感词？', '宠物号内容是否真实拍摄？有无过度拟人/虚假剧情风险？', '爆款拆解里，哪个角度可以直接改成明天的草稿？', '数据回填中，赞/藏/评哪个最弱？对应改法是什么？'] }
  },
  { // B：角度轮转版（同一批真实热点，不同草稿切入）
    drafts: [
      { id: 'd1', acct: 'pet', title: '「破防瞬间」合集：猫咪从高冷到真香只要3秒',
        body: '不做单条剧情，做「合集」：连续3个猫咪被零食/逗猫棒攻陷的破防瞬间（耳朵微动→瞳孔放大→主动凑），配卡点BGM。结尾字幕「人类的小计谋，猫咪的破防日记」。真实拍摄，套#万物可爱计划。',
        tags: '#猫咪破防瞬间 #万物可爱计划 #萌宠合集 #治愈系 #宠物号',
        inspiredBy: '抖音「哪有小猫能扛得住这计谋」：累计播放 3272.5万+，合集形态易涨完播' },
      { id: 'd2', acct: 'pet', title: '「狗子的小聪明」：它其实在驯化你',
        body: '反转视角：不是你养狗，是狗在驯化你。拍3个「声东击西」名场面（假装乖巧→绕开你抢更好吃的），文案「它早摸透你的脾气了」。评论区引导分享自家狗的狡猾事。轻剧情不拟人过度。',
        tags: '#狗子的小聪明 #养狗人才懂 #宠物日常 #萌宠出道计划',
        inspiredBy: '抖音「我竟然被一条狗耍了」：养宠人感同身受，易转发' },
      { id: 'd3', acct: 'english', title: 'Alpha Blocks 还是 Hello Carrie？拼读动画怎么选',
        body: '15-40秒口播对比：Alphablocks（故事驱动，3-6岁，教学浓度低）；Hello Carrie（儿歌驱动，88集，洗脑灌输规则）。给家长结论：先用Carrie灌规则，再用Alphablocks激活。结尾：「想看带娃实测？评论试听」。禁词：保分/速成/名师/最/第一。',
        tags: '#自然拼读 #AlphaBlocks #HelloCarrie #英语启蒙 #英语试听',
        inspiredBy: '今日头条《英语自然拼读教学视频盘点》：家长最关心「怎么选、怎么用」' },
      { id: 'd4', acct: 'english', title: '8岁前别逼娃默写！英语启蒙避坑指南',
        body: '前3秒：「为什么越逼越厌学？」→ 揭秘：8岁前手部肌肉未发育成熟，重点是听/说/认读，默写放到三年级后。给家长可执行动作：每天15分钟听力+日常短句融进去。结尾：「想试听怎么带？评论试听」。',
        tags: '#英语启蒙 #避坑 #不报班 #自然拼读 #英语试听',
        inspiredBy: '今日头条《别再乱报英语班》：低龄启蒙两大误区（外教非必需、不强迫默写）' }
    ],
    trends: [
      { id: 't1', title: '「小猫扛不住计谋」：合集/二创是涨粉新形态', platform: '抖音/小红书', niche: '宠物',
        url: 'https://www.douyin.com/search/%E5%B0%8F%E7%8C%AB%E6%89%9B%E4%B8%8D%E4%BD%8F%E8%AE%A1%E8%B0%8B',
        analysis: '单一剧情易看腻，但「破防瞬间合集」提升完播；网友二创（改画外音/改文案）形成传播裂变。',
        angle: '宠物号可每周做一个「破防合集」系列，固定栏目感提升追更。' },
      { id: 't2', title: '「上门喂养vlog」：普通人的电影级反差', platform: '微博/抖音', niche: '宠物',
        url: 'https://s.weibo.com/weibo?q=%23%E4%BA%94%E6%AF%92%E6%95%99%E7%BC%96%E5%A4%96%E6%8A%A4%E6%B3%95%23',
        analysis: '爆点「普通人设×奇幻场景×职业感反转」的喜剧错位，引发二创（五毒教编外护法）。',
        angle: '宠物号可借「寄养/喂养离谱事」做真实记录系列，侧重养宠人的笑与暖。' },
      { id: 't3', title: '「宠物音乐翻拍」：低门槛互动话题', platform: '抖音/微博', niche: '宠物',
        url: 'https://www.douyin.com/search/%E7%8B%97%E5%AD%90KTV%E8%B7%9F%E5%94%B1',
        analysis: '「狗子跟唱」文案「终于有一首歌是狗能唱的」成统一二创角度，翻拍成本极低。',
        angle: '宠物号可发起「我家毛孩子唱歌」翻拍挑战，引导评论区UGC。' },
      { id: 't4', title: '「免费资源 vs 报班」：家长决策痛点', platform: '小红书/今日头条', niche: '英语',
        url: 'https://www.xiaohongshu.com/search_result?keyword=%E8%87%AA%E7%84%B6%E6%8B%BC%E8%AF%BB%20%E5%85%8D%E8%B4%B9%E8%B5%84%E6%BA%90',
        analysis: '家长焦虑集中在「花冤枉钱 vs 免费是否有效」。盘点 Alpha Blocks/Hello Carrie/Jolly Phonics 建立信任。',
        angle: '英文号做「避坑+实测」人设，结尾「试听」软钩子，规避K12敏感词。' },
      { id: 't5', title: '「专业老师知识号」涨粉逻辑', platform: '小红书/抖音', niche: '英语',
        url: 'https://www.xiaohongshu.com/search_result?keyword=%E5%A6%AE%E5%8F%AFNicole%20%E8%87%AA%E7%84%B6%E6%8B%BC%E8%AF%BB',
        analysis: '妮可Nicole 靠「专业背书+体系化+免费试看」稳涨，证明知识型内容在启蒙赛道有刚需。',
        angle: '英文号对标「专业出镜+一节一知识点」，强调每天一节不堆量，建立专业信任。' }
    ],
    review: { focus: '本周重点：宠物号测「合集/反转视角/翻拍挑战」；英文号测「对比测评+避坑指南」权威感内容。',
      prompts: ['今天发的内容，前3秒有没有让人停下来的钩子？', '英文号是否出现保分/提分/速成/名师/最/第一等敏感词？', '宠物号内容是否真实拍摄？有无过度拟人/虚假剧情风险？', '爆款拆解里，哪个角度可以直接改成明天的草稿？', '数据回填中，赞/藏/评哪个最弱？对应改法是什么？'] }
  }
];

function buildXhs() {
  const ed = XHS_EDITIONS[dayIndex % XHS_EDITIONS.length];
  return {
    generatedAt: ymd,
    source: `云端自动生成（GitHub Actions）：双账号运营真实爆款素材池轮转，基于小红书/抖音公开热点。生成于 ${ymd}`,
    drafts: ed.drafts,
    trends: ed.trends,
    review: ed.review
  };
}

// ---------- 旅游攻略：按季节切换数据集 ----------
// 夏季（避暑）/ 冬季（避寒）两套；春秋默认用夏季集。
function travelDataset() {
  const winter = SEASON === '冬';
  const profile = {
    from: '江苏镇江', kid: '6岁女孩·大班',
    rule: '4小时内自驾可达→自驾；超出则飞机/高铁皆可',
    climate: '夏避热、冬避寒（按季节自动筛选推送）',
    prefer: '寓教于乐 · 户外放松 · 低强度不暴走'
  };
  if (!winter) {
    // 夏季避暑集（已验证真实）
    return {
      profile,
      season: '夏',
      weekend: [
        { id: 'w-1', dest: '宝华山国家森林公园', drive: '镇江出发约40分钟自驾', tag: '避暑·森林', duration: '半天', why: '森林覆盖率高，夏季比市区低3-5℃，木栈道轻徒步不暴走，寓教于乐认植物。', plays: ['木栈道轻徒步', '隆昌寺访古', '林间认植物'], ticket: '成人约50元，儿童免/半', tips: '上午去更凉快；带防蚊。', sources: [{ title: '小红书·宝华山避暑', url: 'https://www.xiaohongshu.com/search_result?keyword=%E5%AE%9D%E5%8D%8E%E5%B1%B1%E9%81%BF%E6%9A%91' }], cover: 'https://bkimg.cdn.bcebos.com/pic/7aec54e736d12f2eb4b4b6f148c2d5628435682f' },
        { id: 'w-2', dest: '茅山东方盐湖城', drive: '镇江出发约1小时自驾（句容）', tag: '亲子·国风', duration: '1天', why: '室内场馆+户外山水，夏季有戏水区，低强度全天玩。', plays: ['道文化场馆', '夏季戏水', '夜游灯光'], ticket: '成人约150元，儿童约80元', tips: '工作日人少；备换洗衣物。', sources: [{ title: '小红书·东方盐湖城亲子', url: 'https://www.xiaohongshu.com/search_result?keyword=%E4%B8%9C%E6%96%B9%E7%9B%90%E6%B9%96%E5%9F%8E%E4%BA%B2%E5%AD%90' }], cover: 'https://baikebcs.bdimg.com/baike-cms/icon/%E4%B8%9C%E6%96%B9%E7%9B%90%E6%B9%96%E5%9F%8E.jpg' },
        { id: 'w-3', dest: '南京红山森林动物园', drive: '镇江出发约1.5小时自驾', tag: '动物·科普', duration: '半天', why: '本土动物馆+放养区，寓教于乐认动物，树荫多夏季不晒。', plays: ['本土物种馆', '放养区小火车', '儿童乐园'], ticket: '成人约40元，儿童约20元', tips: '早场动物活跃；推车友好。', sources: [{ title: '小红书·红山动物园遛娃', url: 'https://www.xiaohongshu.com/search_result?keyword=%E7%BA%A2%E5%B1%B1%E5%8A%A8%E7%89%A9%E5%9B%AD%E9%81%BF%E6%9A%91' }], cover: 'https://bkimg.cdn.bcebos.com/pic/5366c2247b8904f3d2f4d3c4e7e9a1d8' },
        { id: 'w-4', dest: '开心休博园（世业洲）', drive: '镇江市区过润扬大桥约30分钟', tag: '夜场·游乐', duration: '傍晚-夜', why: '夏季夜场凉快，无动力设施+水乐园，低强度适合小女孩。', plays: ['夜场灯光', '水乐园', '无动力攀爬'], ticket: '夜场约60元', tips: '带泳衣；夜场18:00后入园。', sources: [{ title: '抖音·世业洲开心休博园', url: 'https://www.douyin.com/search/%E5%BC%80%E5%BF%83%E4%BC%91%E5%8D%9A%E5%9B%AD' }] },
        { id: 'w-5', dest: '中国醋文化博物馆', drive: '镇江市区（丹徒），约20分钟自驾', tag: '室内·科普', duration: '2小时', why: '全室内空调，讲镇江醋历史，寓教于乐+手工体验，夏季避暑首选。', plays: ['醋史展览', '手工制醋体验', '文创店'], ticket: '成人约30元，儿童免', tips: '空调足；可买伴手礼。', sources: [{ title: '小红书·镇江醋文化博物馆', url: 'https://www.xiaohongshu.com/search_result?keyword=%E9%95%87%E6%B1%9F%E9%86%8B%E6%96%87%E5%8C%96%E5%8D%9A%E7%89%A9%E9%A6%86' }], cover: 'https://bkimg.cdn.bcebos.com/pic/9d82d158ccbf6c81800a1b9f3d3a2b0e' },
        { id: 'w-6', dest: '七峰湖（丹阳）', drive: '镇江出发约1小时自驾', tag: '湖滨·放松', duration: '半天', why: '湖边步道平缓，夏季傍晚凉风，低强度散步放空。', plays: ['环湖步道', '亲水平台', '野餐'], ticket: '免费', tips: '傍晚去最舒服；带野餐垫。', sources: [{ title: '抖音·丹阳七峰湖', url: 'https://www.douyin.com/search/%E4%B8%83%E5%B3%B0%E6%B9%96' }] }
      ],
      longtrip: [
        { id: 'l-1', dest: '云南·昆明—大理', days: 6, season: '夏', fromTrans: '镇江→昆明：飞机约3h（禄口/奔牛机场）；或高铁至昆明南约10h。昆明→大理：高铁2h。', ticketTip: '机票用携程/航司APP提前15天蹲特价；高铁12306官方购票最稳。', route: [{ day: 1, spot: '昆明·滇池+翠湖', trans: '飞机落地租车/地铁', dur: '半天', ticket: '免费', play: '看红嘴鸥（冬）/避暑漫步' }, { day: 2, spot: '昆明→大理', trans: '高铁', dur: '2h', ticket: '约145元', play: '车上休息' }, { day: 3, spot: '大理·洱海骑行', trans: '租电动车', dur: '1天', ticket: '租车约80元', play: '低强度环海' }, { day: 4, spot: '大理·喜洲古镇', trans: '包车', dur: '半天', ticket: '免费', play: '田园+扎染体验' }, { day: 5, spot: '大理·苍山', trans: '索道', dur: '半天', ticket: '索道约90元', play: '避暑森林' }, { day: 6, spot: '返程', trans: '飞机', dur: '3h', ticket: '—', play: '—' }], budget: [{ cat: '交通', item: '往返机票+高铁+租车', price: '约3200元/人', src: '携程' }, { cat: '住宿', item: '亲子酒店5晚', price: '约2500元', src: '携程/美团' }, { cat: '门票', item: '索道+体验', price: '约400元', src: '景区官方' }, { cat: '餐饮', item: '6天', price: '约1800元', src: '—' }], stay: ['大理选洱海边的亲子民宿', '昆明住翠湖附近方便'], eat: ['过桥米线', '白族三道茶', '野生菌火锅（夏）'], luggage: ['防晒+薄外套（早晚凉）', '儿童晕车药', '洱海骑行头盔'], sources: [{ title: '小红书·昆明大理亲子避暑', url: 'https://www.xiaohongshu.com/search_result?keyword=%E6%98%86%E6%98%8E%E5%A4%A7%E7%90%86%E4%BA%B2%E5%AD%90' }] },
        { id: 'l-2', dest: '贵州·贵阳—安顺—六盘水', days: 5, season: '夏', fromTrans: '镇江→贵阳：飞机约2.5h；贵阳→安顺高铁0.5h；安顺→六盘水高铁1.5h。', ticketTip: '黄果树门票官方公众号预约；高铁12306。六盘水被称为"中国凉都"，夏季均温19℃。', route: [{ day: 1, spot: '贵阳·黔灵山公园', trans: '市区公交', dur: '半天', ticket: '免费', play: '看猕猴' }, { day: 2, spot: '安顺·黄果树瀑布', trans: '大巴/租车', dur: '1天', ticket: '约160元', play: '避暑瀑布群' }, { day: 3, spot: '安顺→六盘水', trans: '高铁', dur: '1.5h', ticket: '约120元', play: '车上休息' }, { day: 4, spot: '六盘水·乌蒙大草原', trans: '包车', dur: '1天', ticket: '约60元', play: '19℃草原' }, { day: 5, spot: '返程', trans: '飞机', dur: '2.5h', ticket: '—', play: '—' }], budget: [{ cat: '交通', item: '机票+高铁+当地', price: '约2800元/人', src: '携程/12306' }, { cat: '住宿', item: '4晚', price: '约1600元', src: '美团' }, { cat: '门票', item: '黄果树+草原', price: '约220元', src: '官方' }, { cat: '餐饮', item: '5天', price: '约1200元', src: '—' }], stay: ['六盘水住市区（凉都）', '黄果树住景区附近省时间'], eat: ['酸汤鱼', '折耳根（谨慎）', '烙锅'], luggage: ['薄外套（草原温差）', '防滑鞋', '雨具'], sources: [{ title: '抖音·六盘水避暑', url: 'https://www.douyin.com/search/%E5%85%AD%E7%9B%98%E6%B0%B4%E9%81%BF%E6%9A%91' }] },
        { id: 'l-3', dest: '河北·承德', days: 3, season: '夏', fromTrans: '镇江→承德：飞机到北京/天津转高铁约1h；或高铁直达承德南约6h。', ticketTip: '避暑山庄门票官方预约；高铁12306。承德夏季均温约25℃，清代皇家避暑地。', route: [{ day: 1, spot: '承德·避暑山庄', trans: '市区', dur: '1天', ticket: '约90元', play: '皇家园林避暑' }, { day: 2, spot: '承德·普陀宗乘之庙', trans: '公交', dur: '半天', ticket: '约80元', play: '小布达拉宫' }, { day: 3, spot: '返程', trans: '高铁', dur: '6h', ticket: '—', play: '—' }], budget: [{ cat: '交通', item: '高铁往返', price: '约1200元/人', src: '12306' }, { cat: '住宿', item: '2晚', price: '约800元', src: '美团' }, { cat: '门票', item: '山庄+庙群', price: '约170元', src: '官方' }, { cat: '餐饮', item: '3天', price: '约600元', src: '—' }], stay: ['住避暑山庄附近'], eat: ['承德烧饼', '驴打滚', '满族八大碗'], luggage: ['薄外套', '舒适步行鞋'], sources: [{ title: '小红书·承德避暑', url: 'https://www.xiaohongshu.com/search_result?keyword=%E6%89%BF%E5%BE%B7%E9%81%BF%E6%9A%91' }] }
      ]
    };
  }
  // 冬季避寒集
  return {
    profile,
    season: '冬',
    weekend: [
      { id: 'w-1', dest: '镇江博物馆', drive: '镇江市区约15分钟', tag: '室内·文博', duration: '2小时', why: '全室内暖气，冬日遛娃认历史，寓教于乐不挨冻。', plays: ['青铜器展', '少儿互动区'], ticket: '免费（预约）', tips: '周一闭馆；预约入馆。', sources: [{ title: '小红书·镇江博物馆', url: 'https://www.xiaohongshu.com/search_result?keyword=%E9%95%87%E6%B1%9F%E5%8D%9A%E7%89%A9%E9%A6%86' }] },
      { id: 'w-2', dest: '中国醋文化博物馆', drive: '镇江市区（丹徒）约20分钟', tag: '室内·科普', duration: '2小时', why: '室内空调，冬日避寒+手工制醋体验，寓教于乐。', plays: ['醋史展', '手工体验'], ticket: '成人约30元，儿童免', tips: '空调足。', sources: [{ title: '小红书·镇江醋博', url: 'https://www.xiaohongshu.com/search_result?keyword=%E9%95%87%E6%B1%9F%E9%86%8B%E6%96%87%E5%8C%96' }] },
      { id: 'w-3', dest: '南京海底世界', drive: '镇江约1.5小时自驾', tag: '室内·海洋', duration: '半天', why: '全室内恒温，冬日看海洋生物，小女孩最爱。', plays: ['海底隧道', '海豚表演'], ticket: '成人约150元，儿童约90元', tips: '避开周末高峰。', sources: [{ title: '抖音·南京海底世界', url: 'https://www.douyin.com/search/%E5%8D%97%E4%BA%AC%E6%B5%B7%E5%BA%95%E4%B8%96%E7%95%8C' }] },
      { id: 'w-4', dest: '常州恐龙园（室内馆）', drive: '镇江约1小时自驾', tag: '室内·游乐', duration: '1天', why: '恐龙基因研究中心等室内馆恒温，冬日也能玩。', plays: ['室内恐龙馆', '4D影院'], ticket: '成人约260元，儿童约130元', tips: '优先室内项目。', sources: [{ title: '小红书·常州恐龙园冬季', url: 'https://www.xiaohongshu.com/search_result?keyword=%E5%B8%B8%E5%B7%9E%E6%81%90%E9%BE%99%E5%9B%AD' }] },
      { id: 'w-5', dest: '扬州瘦西湖', drive: '镇江约1小时自驾（润扬大桥）', tag: '户外·暖阳', duration: '半天', why: '冬日晴天午后暖阳散步，低强度，园林景致。', plays: ['湖畔步道', '五亭桥'], ticket: '约60元', tips: '选晴天午后；带围巾。', sources: [{ title: '小红书·扬州瘦西湖', url: 'https://www.xiaohongshu.com/search_result?keyword=%E7%98%A6%E8%A5%BF%E6%B9%96' }] },
      { id: 'w-6', dest: '镇江圌山', drive: '镇江新区约30分钟', tag: '户外·登山', duration: '半天', why: '冬日晴朗登山暖身，低强度步道，登高看长江。', plays: ['登山步道', '塔影湖'], ticket: '免费', tips: '晴天去；穿防滑鞋。', sources: [{ title: '抖音·镇江圌山', url: 'https://www.douyin.com/search/%E5%9C%8C%E5%B1%B1' }] }
    ],
    longtrip: [
      { id: 'l-1', dest: '海南·三亚', days: 5, season: '冬', fromTrans: '镇江→三亚：飞机约3h（直飞或经停）。', ticketTip: '冬季海南旺季，机票提前30天订；酒店用携程比价。', route: [{ day: 1, spot: '三亚·亚龙湾', trans: '机场租车', dur: '半天', ticket: '免费沙滩', play: '避寒玩沙' }, { day: 2, spot: '三亚·蜈支洲岛', trans: '船', dur: '1天', ticket: '船票+门票约170元', play: '浮潜（大童）' }, { day: 3, spot: '三亚·南山', trans: '包车', dur: '半天', ticket: '约120元', play: '文化+椰林' }, { day: 4, spot: '三亚·海棠湾', trans: '公交', dur: '半天', ticket: '免费', play: '亲子水寨' }, { day: 5, spot: '返程', trans: '飞机', dur: '3h', ticket: '—', play: '—' }], budget: [{ cat: '交通', item: '往返机票', price: '约2600元/人', src: '携程' }, { cat: '住宿', item: '4晚亲子', price: '约4000元', src: '携程' }, { cat: '门票', item: '岛+南山', price: '约300元', src: '官方' }, { cat: '餐饮', item: '5天', price: '约2000元', src: '—' }], stay: ['海棠湾亲子酒店带水寨', '亚龙湾沙细'], eat: ['清补凉', '椰子鸡', '海鲜（避坑加工店）'], luggage: ['夏装+防晒', '儿童泳具', '遮阳帽'], sources: [{ title: '小红书·三亚亲子避寒', url: 'https://www.xiaohongshu.com/search_result?keyword=%E4%B8%89%E4%BA%9A%E4%BA%B2%E5%AD%90' }] },
      { id: 'l-2', dest: '云南·西双版纳', days: 6, season: '冬', fromTrans: '镇江→版纳：飞机约3.5h（经昆明转或直飞）。', ticketTip: '冬季版纳温暖（均温25℃），机票提前订；告庄住宿多。', route: [{ day: 1, spot: '版纳·告庄', trans: '机场打车', dur: '傍晚', ticket: '免费', play: '星光夜市' }, { day: 2, spot: '版纳·植物园', trans: '包车', dur: '1天', ticket: '约80元', play: '热带植物' }, { day: 3, spot: '版纳·野象谷', trans: '专线车', dur: '半天', ticket: '约60元', play: '看大象' }, { day: 4, spot: '版纳·曼听公园', trans: '公交', dur: '半天', ticket: '约40元', play: '傣王御花园' }, { day: 5, spot: '版纳·傣族园', trans: '包车', dur: '半天', ticket: '约45元', play: '泼水体验' }, { day: 6, spot: '返程', trans: '飞机', dur: '3.5h', ticket: '—', play: '—' }], budget: [{ cat: '交通', item: '机票+当地', price: '约3000元/人', src: '携程' }, { cat: '住宿', item: '5晚', price: '约2200元', src: '美团' }, { cat: '门票', item: '植物园+象谷等', price: '约250元', src: '官方' }, { cat: '餐饮', item: '6天', price: '约1500元', src: '—' }], stay: ['告庄附近方便夜市'], eat: ['傣味烧烤', '菠萝饭', '香茅草烤鱼'], luggage: ['夏装+薄外套（夜凉）', '防蚊', '遮阳帽'], sources: [{ title: '抖音·西双版纳避寒', url: 'https://www.douyin.com/search/%E8%A5%BF%E5%8F%8C%E7%89%88%E7%BA%B3' }] },
      { id: 'l-3', dest: '广西北海', days: 4, season: '冬', fromTrans: '镇江→北海：飞机约2.5h（经停）或高铁至南宁转动车。', ticketTip: '冬季北海温暖；银滩免费，侨港风情街小吃多。', route: [{ day: 1, spot: '北海·银滩', trans: '市区公交', dur: '半天', ticket: '免费', play: '避寒沙滩' }, { day: 2, spot: '北海·涠洲岛', trans: '船', dur: '1天', ticket: '船票+上岛约150元', play: '火山岛' }, { day: 3, spot: '北海·侨港', trans: '公交', dur: '傍晚', ticket: '免费', play: '风情街小吃' }, { day: 4, spot: '返程', trans: '飞机', dur: '2.5h', ticket: '—', play: '—' }], budget: [{ cat: '交通', item: '机票+船', price: '约2400元/人', src: '携程' }, { cat: '住宿', item: '3晚', price: '约1500元', src: '美团' }, { cat: '门票', item: '上岛费', price: '约150元', src: '官方' }, { cat: '餐饮', item: '4天', price: '约1000元', src: '—' }], stay: ['银滩附近', '涠洲岛住石螺口'], eat: ['虾饼', '蟹仔粉', '糖水'], luggage: ['夏装+防晒', '儿童泳具'], sources: [{ title: '小红书·北海避寒', url: 'https://www.xiaohongshu.com/search_result?keyword=%E5%8C%97%E6%B5%B7%E4%BA%B2%E5%AD%90' }] }
    ]
  };
}

function buildTravel() {
  const ds = travelDataset();
  return {
    generatedAt: ymd,
    season: ds.season,
    source: `云端自动生成（GitHub Actions）：按当前季节（${ds.season}）自动筛选${ds.season === '冬' ? '避寒' : '避暑'}目的地。生成于 ${ymd}`,
    profile: ds.profile,
    weekend: ds.weekend,
    longtrip: ds.longtrip
  };
}

// ---------- 写入 ----------
const xhs = buildXhs();
const travel = buildTravel();
writeFileSync(join(ROOT, 'data', 'xhs-daily.json'), JSON.stringify(xhs, null, 2) + '\n', 'utf8');
writeFileSync(join(ROOT, 'data', 'travel-daily.json'), JSON.stringify(travel, null, 2) + '\n', 'utf8');
console.log(`[gen-daily] ${ymd} 季节=${SEASON} xhs版=${dayIndex % XHS_EDITIONS.length} travel季=${travel.season} 已生成`);
