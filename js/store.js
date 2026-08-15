/* ===== VAVA 工作台 · 数据层 (localStorage) ===== */
const DB = (function () {
  const KEY = 'vava_workbench_v1';
  let data = null;

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // ---- 钢琴打卡种子（含真实课程视频链接，从0开始学）----
  const PIANO_SEED = [
    { day: 1, title: '音符认读 Do-Re-Mi', content: '认识五线谱高音谱号，唱名与音名对应',
      guide: '📘 今天学会：在键盘上指认 Do-Re-Mi，分清「音名 C-D-E-F-G」和「唱名 Do-Re-Mi」。\n\n① 看视频（第3集·认识键盘/五线谱）约 5 分钟，跟着老师找「中央C」和五线谱的「高音谱号」。\n② 唱名儿歌：右手 1-5 指边点琴键边唱 C(Do)-D(Re)-E(Mi)-F(Fa)-G(Sol)，每音 2 拍，来回 3 遍（看配图①键盘）。\n③ 找位置：在琴上找出 2 组 C-D-E-F-G，用 1-5 指轻轻点一遍，说出每个键的唱名。\n④ 听音游戏：让 App/家长弹一个音，你抢答唱名；错就再听，连续 3 次过关。\n⑤ 记一笔：在「灵光随手记」写「今天记住了 C-D-E-F-G 在哪」。\n\n⏱ 总时长 ≈ 15 分钟 ｜ ⚠️ 易错：把音名(C/D/E)和唱名(Do/Re/Mi)搞混——先分开记，再一一对应。',
      guideMedia: '五指音乐·第3集 五线谱 || https://www.bilibili.com/video/BV1f64y1t7Ff/?p=3',
      guideImages: 'assets/guides/keyboard.svg\nassets/guides/g-staff.svg', done: true },
    { day: 2, title: '右手单音《小星星》', content: '右手1-5指对应 C D E F G，慢速跟弹',
      guide: '📘 今天学会：用右手 1-5 指弹《小星星》右手旋律（C-D-E-F-G 五个音）。\n\n① 看视频：Hoffman《小星星》C 大调教学（右手旋律逐句教），或 B站搜「小星星 C调 教学」。\n② 手型：手腕放平、手指自然弯曲像握鸡蛋；1指(大拇指)弹 C，2指 D，3指 E，4指 F，5指 G（看配图②手型）。\n③ 分手慢练：只弹右手，每小节 4 拍，一个音站稳再换下一个，先 40bpm。\n④ 连起来：把整首右手旋律慢速弹顺，卡住的小节单独练 5 遍。\n⑤ 录音：用手机录一遍，回听找「有没有抢拍 / 音弹错」。\n\n⏱ 总时长 ≈ 20 分钟 ｜ ⚠️ 易错：大拇指躺平——保持指关节立起来；先慢后快，别一上来就原速。',
      guideMedia: 'Hoffman·小星星 C大调教学 || https://www.hoffmanacademy.com/blog/how-to-play-twinkle-twinkle-little-star-on-the-piano',
      guideImages: 'assets/guides/g-hand.svg\nassets/guides/g-keyboard.svg', done: true },
    { day: 3, title: '左手伴奏型', content: '左手柱式和弦 C－G－Am－F',
      guide: '📘 今天学会：左手柱式和弦 C–G–Am–F，给右手旋律「垫底」。\n\n① 看视频：左手和弦伴奏 / 万能和弦走向（系统课）。\n② 认和弦：C=C-E-G、G=G-B-D、Am=A-C-E、F=F-A-C（看配图③和弦，高亮的就是要按的键）。\n③ 手型：左手手指并拢、手腕放松，三个音「同时落下」不要一个一个敲。\n④ 慢练：每个和弦数 4 拍再换，C→G→Am→F 循环，先 50bpm。\n⑤ 加右手：右手弹 Day2 的《小星星》，左右手先分别练熟再合。\n\n⏱ 总时长 ≈ 20 分钟 ｜ ⚠️ 易错：手腕僵硬导致三个音不齐——先抬手、再整体落下；和弦转换保留共同音更顺。',
      guideMedia: '左手和弦伴奏·万能和弦走向 || https://www.bilibili.com/video/BV1kY4y1x7cr/',
      guideImages: 'assets/guides/g-chord.svg', done: false },
    { day: 4, title: '双手合奏《欢乐颂》', content: '先分后合，注意左右手节奏对齐',
      guide: '📘 今天学会：把《欢乐颂》左右手合起来，注意第 1 拍对齐。\n\n① 看视频：第5集《欢乐颂》演奏讲解 + 第6集示范，先听一遍整体感觉。\n② 分手练：左手和弦、右手旋律各自弹到不出错（复习 Day2/3）。\n③ 合奏：用节拍器 50bpm，重点对齐「第 1 拍」——两手同时落下。\n④ 卡壳处理：哪里合不上就退回分手，把那一小节练 10 遍再合。\n⑤ 提速：熟练后节拍器 60→70bpm，保持整齐。\n\n⏱ 总时长 ≈ 25 分钟 ｜ ⚠️ 易错：右手快左手慢——跟着节拍器，谁慢就跟谁；别靠感觉。',
      guideMedia: '五指音乐·第5集 欢乐颂演奏讲解 || https://www.bilibili.com/video/BV1f64y1t7Ff/?p=5\n五指音乐·第6集 欢乐颂示范 || https://www.bilibili.com/video/BV1f64y1t7Ff/?p=6',
      guideImages: 'assets/guides/g-hand.svg', done: false },
    { day: 5, title: '节拍训练 4/4', content: '用节拍器 60bpm，保持稳定',
      guide: '📘 今天学会：稳定打 4/4 拍（强-弱-次强-弱），不抢拍。\n\n① 看视频：第10集 常见4拍子 / 节奏型。\n② 念拍：拍腿打拍念「强-弱-次强-弱」，每拍一下，先空手练 2 分钟（看配图④节拍器）。\n③ 跟拍：节拍器 60bpm，单手弹一个音跟每一拍，注意每拍都落在「点」上。\n④ 上曲：用《欢乐颂》或《小星星》跟节拍器弹，要求每小节第 1 拍是「强」。\n⑤ 检测：关掉节拍器弹一遍，再打开对比——差太多就回到 50bpm。\n\n⏱ 总时长 ≈ 20 分钟 ｜ ⚠️ 易错：抢拍——先把嘴里的拍子稳住，手才稳。',
      guideMedia: '五指音乐·第10集 常见4拍子 || https://www.bilibili.com/video/BV1f64y1t7Ff/?p=10',
      guideImages: 'assets/guides/g-metro.svg', done: false },
    { day: 6, title: '手指独立练习', content: '哈农 No.1，注意抬指',
      guide: '📘 今天学会：哈农 No.1，抬指高、落键快，每根手指独立不牵连。\n\n① 看视频：第33集 哈农一 指法训练 / 手型纠正。\n② 手型：手指自然弯曲，弹哪个指就哪个抬起再落下，其他手指别跟着动（看配图②手型）。\n③ 慢练：每条先 50bpm，抬指明显、落键扎实，左右手分开。\n④ 对称：注意 3-4 指容易「黏」在一起，单独练 3-4 指 8 遍。\n⑤ 提速：稳定后 60→80bpm，保持音质均匀。\n\n⏱ 总时长 ≈ 20 分钟 ｜ ⚠️ 易错：塌指——指关节始终立住；宁可慢，也要每个音清楚。',
      guideMedia: '五指音乐·第33集 哈农一 指法 || https://www.bilibili.com/video/BV1f64y1t7Ff/?p=33',
      guideImages: 'assets/guides/g-hand.svg', done: false },
    { day: 7, title: '小曲《致爱丽丝》片段', content: '前8小节，注意连奏',
      guide: '📘 今天学会：弹《致爱丽丝》前 8 小节，注意「连奏」(legato) 和乐句呼吸。\n\n① 看视频：B站搜「致爱丽丝 简化版 教学」跟练（也可看系统课连奏讲解）。\n② 分手：右手旋律先弹顺，注意连线内的音要「连」不要断（看配图⑤五线谱）。\n③ 左手：伴奏型分手练，数准拍子。\n④ 合奏：慢速合，乐句之间稍微「抬手呼吸」一下。\n⑤ 表现：想象旋律情绪，做一点强弱对比，录音回听。\n\n⏱ 总时长 ≈ 25 分钟 ｜ ⚠️ 易错：连线断成断奏——手指提前准备好下一个音，平滑过渡。',
      guideMedia: 'B站搜·致爱丽丝简化版 || https://search.bilibili.com/all?keyword=致爱丽丝 简化版 教学',
      guideImages: 'assets/guides/g-staff.svg', done: false },
    { day: 8, title: '视奏入门', content: '简单C大调短句视奏',
      guide: '📘 今天学会：看谱即弹（C 大调短句），不回头改错。\n\n① 看视频：B站搜「钢琴 视奏 入门」+ 系统课「视唱练耳」。\n② 读谱：先看调号、拍号、指法，在谱上把指法标好。\n③ 整句过：第一次就从头弹到尾，错了也别停（训练「向前看」）。\n④ 三遍法：第 1 遍慢、第 2 遍稳、第 3 遍带表情，每遍不回头。\n⑤ 换条：再拿一条陌生短句重复，逐步提速。\n\n⏱ 总时长 ≈ 20 分钟 ｜ ⚠️ 易错：中途停下去改错打乱节奏——先完整过，再整体修。',
      guideMedia: 'B站搜·钢琴视奏入门 || https://search.bilibili.com/all?keyword=钢琴 视奏 入门 练习',
      guideImages: 'assets/guides/g-staff.svg', done: false },
    { day: 9, title: '和弦转换', content: 'I-IV-V 转换练习',
      guide: '📘 今天学会：I–IV–V（C–F–G）和弦转换，保留共同音更顺。\n\n① 看视频：三和弦转位 / 万能和弦走向。\n② 认根音：每个和弦先找准最低音（根音），再补上方音。\n③ 找共同音：C→G 共用 G，F→C 共用 C，转换时保留不动的那个音。\n④ 慢循环：C–F–G–C 每和弦 4 拍，50bpm，手腕放松整体落。\n⑤ 配旋律：右手弹 Day2/4 的旋律，左手换和弦垫底。\n\n⏱ 总时长 ≈ 20 分钟 ｜ ⚠️ 易错：换和弦整只手乱搬家——先想「哪个音保留」，只动要变的手指。',
      guideMedia: '左手和弦伴奏·万能和弦走向 || https://www.bilibili.com/video/BV1kY4y1x7cr/',
      guideImages: 'assets/guides/g-chord.svg', done: false },
    { day: 10, title: '节奏型组合', content: '切分与附点节奏',
      guide: '📘 今天学会：切分与附点节奏，先念准再上琴。\n\n① 看视频：第7集 休止符与附点音符。\n② 念节奏：用手打拍，把「哒-哒-哒」念满，附点要数够时值。\n③ 拆分：切分音先当成两个普通音练，再连成切分感觉。\n④ 上琴：在 C 大调音阶上弹切分/附点短句，跟节拍器。\n⑤ 检测：录一段，检查有没有「附点太短 / 切分抢拍」。\n\n⏱ 总时长 ≈ 20 分钟 ｜ ⚠️ 易错：附点时值不足——用「哒-哒-哒」把那一拍数满。',
      guideMedia: '五指音乐·第7集 休止符与附点 || https://www.bilibili.com/video/BV1f64y1t7Ff/?p=7',
      guideImages: 'assets/guides/g-metro.svg', done: false },
    { day: 11, title: '乐曲表现力', content: '强弱对比、乐句呼吸',
      guide: '📘 今天学会：给曲子加强弱对比和乐句呼吸，弹出「感情」。\n\n① 看视频：第13集 钢琴踏板 + 搜「钢琴 强弱处理 表现力」。\n② 标记号：在谱上圈出 f(强)/p(弱)/渐强渐弱。\n③ 渐变：乐句做「从弱到强再到弱」，像说话的语气。\n④ 踏板：踩右踏板在和弦变换处，手弹新和弦的同时换踏板（听视频示范）。\n⑤ 录音回听：对比「平铺直叙」和「有强弱」哪个好听。\n\n⏱ 总时长 ≈ 20 分钟 ｜ ⚠️ 易错：踏板踩太深导致浑浊——换和弦必换踏板，别偷懒。',
      guideMedia: '五指音乐·第13集 钢琴踏板 || https://www.bilibili.com/video/BV1f64y1t7Ff/?p=13',
      guideImages: 'assets/guides/g-chord.svg', done: false },
    { day: 12, title: '阶段小测', content: '完整演奏一首+视奏一条',
      guide: '📘 今天学会：完整演奏一首 + 视奏一条，给自己打分。\n\n① 复习：回看前面对应课程合集（第5/6/10/13/33 集等）。\n② 演奏：选一首已学的（欢乐颂/小星星/致爱丽丝），完整、不带停地弹一遍并录像。\n③ 视奏：拿一条陌生 C 大调短句，用 Day8 方法整句过。\n④ 复盘：回看录像，写下 1 条最想改的（如「第3小节抢拍」）。\n⑤ 打分：节奏 / 手型 / 表现力各 1-5 分，记在「灵光随手记」。\n\n⏱ 总时长 ≈ 30 分钟 ｜ 🎉 完成 12 天入门打卡！',
      guideMedia: '五指音乐·课程合集 || https://www.bilibili.com/video/BV1f64y1t7Ff/',
      guideImages: '', done: false }
  ];
  const WANZI_SEED = [
    { day: 1, title: '🐻 小熊找音符', content: '认识 Do Re Mi，跟着动画唱',
      guide: '🐻 今天玩：跟着动画唱 Do Re Mi，在琴键上找到三个音！\n\n① 看视频：初学者入门迷你课（找中央C、认音名手指编号），或 Hoffman Lesson 1（木偶老师超有趣）。\n② 唱一唱：跟着动画唱 Do-Re-Mi，边唱边拍手。\n③ 找一找：在琴上用右手 1-3 指点出 Do-Re-Mi 三个音（看配图①键盘）。\n④ 玩一玩：家长弹一个音，宝宝猜「是 Do 还是 Mi」，猜对夸一夸。\n\n⏱ 5 分钟，像玩游戏一样开心～',
      guideMedia: '初学者入门迷你课 || https://space.bilibili.com/179999904/lists',
      guideImages: 'assets/guides/g-keyboard.svg', done: true },
    { day: 2, title: '🐱 猫咪弹Do', content: '右手大拇指弹中央C',
      guide: '🐱 今天玩：用右手大拇指(1指)弹出中央C！\n\n① 看视频：请弹吧·右手教学（小朋友歌曲），或 Hoffman 找 C-D-E。\n② 找中央C：键盘中间两个黑键左边的白键就是 Do（看配图①键盘）。\n③ 弹一弹：大拇指轻轻按下，听「叮」的一声，跟着数「1-2-3」弹。\n④ 夸一夸：每弹一下都给自己鼓个掌 👏\n\n⏱ 6 分钟，每弹一下夸一夸。',
      guideMedia: '请弹吧·右手教学 || https://space.bilibili.com/179999904/lists',
      guideImages: 'assets/guides/g-keyboard.svg', done: true },
    { day: 3, title: '🐰 兔子跳跳', content: 'C-D-E 三个音连奏',
      guide: '🐰 今天玩：把 C-D-E 三个音连起来，像小兔子跳！\n\n① 看视频：五指音乐·第22集 C大调音阶 + 请弹吧儿歌跟弹。\n② 连起来：C-D-E 一个接一个，手指不要抬太高，慢慢跳。\n③ 跟弹：跟着视频里的儿歌，边唱边弹。\n④ 加速：熟练后稍稍快一点，但每个音都要清楚。\n\n⏱ 8 分钟，快乐跳跳跳～',
      guideMedia: '五指音乐·第22集 C大调音阶 || https://www.bilibili.com/video/BV1f64y1t7Ff/?p=22',
      guideImages: 'assets/guides/g-keyboard.svg', done: false },
    { day: 4, title: '🌈 彩虹和弦', content: '左手两个音一起按',
      guide: '🌈 今天玩：左手两个音一起按，像变魔术！\n\n① 看视频：菲伯尔钢琴基础教程（零基础小孩专属）或 请弹吧·左手教学。\n② 找音：左手两个手指找到两个白键。\n③ 一起按：数到「3」两个音一起落下去，手腕软软的。\n④ 和妈妈数拍子：1-2-3 按，1-2-3 按，像打节拍。\n\n⏱ 8 分钟，数到 3 一起按～',
      guideMedia: '菲伯尔钢琴基础教程 || https://space.bilibili.com/34238859/lists?sid=4319416',
      guideImages: 'assets/guides/g-chord.svg', done: false }
  ];
  // 为每天的钢琴课自动加「小红书搜索」入口：按当天主题，点开即看小红书里的教学帖 & 视频
  function xhsFor(title) {
    var t = String(title).replace(/^Day\s*\d+\s*[·•\-]\s*/, '').replace(/[🐻🐱🐰🌈]/g, '').trim();
    return '小红书·钢琴 ' + t + ' || https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('钢琴 ' + t);
  }
  [PIANO_SEED, WANZI_SEED].forEach(function (arr) {
    arr.forEach(function (x) { x.guideMedia = xhsFor(x.title) + '\n' + (x.guideMedia || ''); });
  });
  const PIANO_GUIDE = {}; PIANO_SEED.forEach(function (x) { PIANO_GUIDE[x.title] = { guide: x.guide, guideMedia: x.guideMedia, guideImages: x.guideImages || '' }; });
  const WANZI_GUIDE = {}; WANZI_SEED.forEach(function (x) { WANZI_GUIDE[x.title] = { guide: x.guide, guideMedia: x.guideMedia, guideImages: x.guideImages || '' }; });

  // 默认 2 个班（Andy · B3 / Chen Han · HFG）—— 逐课计划来自 js/plans.js（window.VAVA_PLANS）
  // plans.js 由 出勤 AI.xlsx 经 build-plans.js 生成，改表后重新跑脚本即可刷新默认数据
  function buildDefaultClasses() {
    const src = (typeof window !== 'undefined' && window.VAVA_PLANS) ? window.VAVA_PLANS : [];
    const students = [], schedule = [];
    src.forEach(function (c) {
      const sid = uid();
      const plan = (c.plan || []).map(function (p) {
        return {
          seq: p.seq,
          content: p.content || '',
          date: p.date || '',
          done: !!p.done,
          renewal: !!p.renewal,
          feePaid: !!p.feePaid
        };
      });
      const done = plan.filter(function (p) { return p.done; }).length;
      students.push({
        id: sid, name: c.name, stage: c.stage,
        total: c.total || plan.length, done: done,
        day: (typeof c.day === 'number' ? c.day : 2),
        time: c.time || '待补',
        phone: c.phone || '', plan: plan,
        renewAt: 0, next: '', parent: '', attendance: {}, notes: {}, trial: false
      });
      // 周课表（用于首页周视图 / 出勤），内容动态取自 plan，不在 schedule 写死
      schedule.push({
        id: uid(), studentId: sid, day: (typeof c.day === 'number' ? c.day : 2),
        time: c.time || '待补', label: c.name + ' · ' + c.stage,
        note: '阶段:' + c.stage + (c.phone ? ' 电话:' + c.phone : ''),
        feeDue: false, feePaid: false
      });
    });
    return { students, schedule };
  }

  function seed() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;
    // 明日
    const tm = new Date(today); tm.setDate(tm.getDate() + 1);
    const tmStr = `${tm.getFullYear()}-${String(tm.getMonth()+1).padStart(2,'0')}-${String(tm.getDate()).padStart(2,'0')}`;
    const def = buildDefaultClasses();

    return {
      pwd: '1314',            // 默认4位密码，可在设置里改
      editMode: false,
      students: def.students,   // 默认 2 个班（Andy·B3 / Chen Han·HFG），含逐课计划 plan，可在 App 内增删改
      schedule: def.schedule,   // 对应周课表（周视图/出勤用）
      trials: [],     // 试听
      holidays: [],   // 节假日/调课
      feedback: [],   // 学情反馈记录 {id,studentId,range,text,sent}
      imports: [],    // 导入的表格 {id,ts,headers:[],rows:[[...]],count}
      // 旧「12 天平铺打卡」转为「补充课程」自定义区（保留已有进度）；系统课见 piano-curriculum.js
      pianoVAVA: PIANO_SEED.map(function (x) { return Object.assign({ id: uid(), media: '' }, x); }),
      // 系统课打卡进度：lessonId -> { done:bool, note:'' }
      pianoProgress: {},
      xhs: {
        tasks: [
          { id: uid(), text: '发布《钢琴启蒙避坑3点》图文', done: false, date: todayStr },
          { id: uid(), text: '回复昨日评论区3条', done: false, date: todayStr }
        ],
        ideas: [
          { id: uid(), title: '“零基础成人学琴30天”系列', style: '实用干货', note: '可二创：把我的学员案例改成“30天打卡”叙事', used: false, date: todayStr },
          { id: uid(), title: '“家长最关心的5个钢琴问题”', style: '种草答疑', note: '二创角度：用反问+痛点开场', used: false, date: todayStr },
          { id: uid(), title: '“亲子钢琴小游戏”', style: '亲子互动', note: '结合 WANZI 练琴日常拍vlog', used: true, date: todayStr }
        ],
        posts: [
          { id: uid(), title: '《孩子学琴为什么总坐不住》', date: todayStr, metrics: '赞 320 · 收藏 88 · 涨粉 21',
            review: '开头太长，下次前3秒直接抛痛点；封面用对比图更好。' }
        ],
        sources: '今日灵感来源：小红书“钢琴教育”热榜 Top3、抖音音乐类爆款BGM 2条、同行账号评论区高频提问。',
        trends: [
          { id: uid(), title: '5岁娃学琴3个月的变化，惊呆了老母亲', platform: '小红书', niche: '钢琴', style: '家长视角·真实变化', keyword: 'child playing piano', angle: '用「学琴前vs学琴后」对比图+数字（专注从5分钟到30分钟），结尾留「试课扣1」', hot: '家长共鸣+可量化变化=高赞高收藏', img: null },
          { id: uid(), title: 'River Flows in You 二创混剪爆了25年', platform: '抖音', niche: '钢琴', style: '治愈系二创', keyword: 'river flows in you piano', angle: '把演奏和治愈风景/猫咪日常混剪，挂话题#你的心河陪伴我的治愈时刻（360万播放）', hot: '治愈BGM长期霸榜，二创空间大', img: null },
          { id: uid(), title: '钢琴生每天必练的8大基本功', platform: '抖音', niche: '钢琴', style: '干货科普', keyword: 'piano practice fingers', angle: '拆8项基本功各30秒~2分钟，强调「少练但练透」，配跟练表', hot: '老师人设+实用清单，收藏率高', img: null },
          { id: uid(), title: '一首歌秒懂自然拼读发音规律', platform: '小红书', niche: '英语', style: '教学拆解', keyword: 'phonics song kids', angle: '用口诀「元音善变他最6」+儿歌，结尾送PDF资料引流', hot: '自然拼读赛道最热，零基础人群精准', img: null },
          { id: uid(), title: '每天一遍无痛拿下KET口语卓越', platform: '小红书', niche: '英语', style: '短期提分', keyword: 'kids english speaking', angle: '素人家长实拍孩子口语对比，戳「短期提分」痛点', hot: '考前冲刺场景需求强', img: null },
          { id: uid(), title: '桂林阳朔3日躺平路线（爸妈不累娃玩疯）', platform: '小红书', niche: '亲子游', style: '种草攻略', keyword: 'guilin yangshuo travel', angle: '路线+美食+亲子原则（每天≤2景点），附真实预算人均', hot: '亲子游旺季流量大，攻略型易收藏', img: null },
          { id: uid(), title: '宝妈高效备餐10分钟不重样', platform: '小红书', niche: '美食', style: '生活好物', keyword: 'healthy meal prep', angle: '食材+步骤卡拼图，挂收藏夹，强调「不费妈」', hot: '实用省力易转化', img: null }
        ],
        accounts: {
          english: { name: '', handle: '', xhs: true, douyin: true, position: '', pillar: '' },
          pet: { name: '', handle: '', xhs: true, douyin: true, position: '', pillar: '' }
        },
        checklist: {},
        compliance: [],
        daily: null,
        dailyLoaded: '',
        drafts: [
          { id: uid(), acct: 'pet', title: '养猫养狗后，我的焦虑被"微确幸"治好了', body: '今天刷到"具身治愈"这个词，突然懂了为什么下班回家看到它俩就松一口气。不需要大风景，就是猫趴窗台的光、狗在门口等我、俩家伙抢同一个垫子。这些很小的瞬间，把飘着的情绪拉回地面。', tags: '#养猫 #养狗 #萌宠日常 #具身治愈 #独居治愈' },
          { id: uid(), acct: 'pet', title: '试了下"让狗子先说话"的遛狗法，笑不活了', body: '先放最离谱的结果，再补证据，最后让当事方收尾。拍狗子盯着别人家猫的瞬间，再补它拽我裤脚要冲过去的现场，最后狗子：这是在宣战吗？遛狗都变喜剧了。', tags: '#遛狗 #养狗日常 #宠物梗 #戏精狗' },
          { id: uid(), acct: 'english', title: '外国学生问我"落霞与孤鹜齐飞"怎么翻，我直接带他看实景', body: '最近小红书老外特别多，总有人问我古诗词怎么用英文讲。我不是逐字翻，而是先讲画面，再给地道表达。想试听？评论"试听"，我发你安排 🌟', tags: '#英语启蒙 #自然拼读 #用英语讲中国 #独立英语老师' },
          { id: uid(), acct: 'english', title: '把学英语当成"打副本"：每天 1 关，娃主动开口', body: '别逼娃背20个单词，改成今天1关=用英语点一次咖啡/介绍一只动物。过关有反馈，娃把英语当游戏。家长想试？评论"试听"，我给你家娃定制试听课 🌟', tags: '#英语启蒙 #自然拼读 #亲子英语 #游戏化学习' }
        ],
        calendar: [
          { id: uid(), date: '8/3', pet: '猫狗治愈日常', english: '自然拼读口诀', hot: '暑期旅行' },
          { id: uid(), date: '8/4', pet: '遛狗法二创', english: '中式英语纠错', hot: '遛狗热梗' },
          { id: uid(), date: '8/5', pet: '真实养宠干货', english: '用英语讲中国', hot: '中式审美' },
          { id: uid(), date: '8/6', pet: '具身治愈+遛狗法', english: '古诗词英译+招生', hot: '七彩祥云' },
          { id: uid(), date: '8/7', pet: '猫狗分工图', english: '学员 before-after', hot: '' },
          { id: uid(), date: '8/8', pet: '养宠人的一天', english: '成人英语误区', hot: '周末' },
          { id: uid(), date: '8/9', pet: '颜色猎手(橘色)', english: '双语剧情', hot: '' }
        ],
        metrics: [],
        reminder: {
          date: '2026-08-06',
          dismissed: false,
          posts: [
            { acct: 'pet', title: '养猫养狗后，我的焦虑被“微确幸”治好了', angle: '治愈·涨粉' },
            { acct: 'pet', title: '试了下“让狗子先说话”的遛狗法，笑不活了', angle: '梗二创·涨粉' },
            { acct: 'english', title: '外国学生问我“落霞与孤鹜齐飞”怎么翻，我直接带他看实景', angle: '文化输出·招生钩子' },
            { acct: 'english', title: '把学英语当成“打副本”：每天 1 关，娃主动开口', angle: '干货·收藏' }
          ],
          note: '发完前 1 小时主动回评论（互动率直接影响推流）；发完回填 data-tracker.md（赞/藏/评/转/涨粉/账号/标题）。我不代发，Vava 你亲自去发～'
        },
      },
      travel: {
        profile: { from: '江苏镇江', kid: '6岁女孩·大班', rule: '4小时内自驾可达→自驾；超出则飞机/高铁皆可', climate: '夏避热、冬避寒（按季节自动筛选推送）', prefer: '寓教于乐 · 户外放松 · 低强度不暴走' },
        weekend: [],
        longtrip: [],
        loaded: ''
      },
      favorites: [],
      seasonal: [],
      english: [
        { id: uid(), title: '江苏省中小学英语听说测试比重上调', source: '江苏省教育厅《2026义务教育质量监测方案》', date: todayStr,
          key: '听说占比由20%提升至35%，增加情景对话与朗读；', impact: '对学生：更重口语输出；对教学：需增加课堂对话与配音练习。', bookmark: true },
        { id: uid(), title: '小学英语词汇表微调（新增AI/环保主题词）', source: '苏教版教材编写组通知', date: todayStr,
          key: '三至六年级新增约40个主题词汇；', impact: '对教学：补充课件词汇卡；对学生：阅读题材更贴近生活。', bookmark: false }
      ],
      recipes: {
        inventory: [
          { id: uid(), emoji: '🥬', name: '生菜', qty: 1, unit: '把', price: 3.5, buy: todayStr, channel: '盒马', expire: 2 },
          { id: uid(), emoji: '🥚', name: '鸡蛋', qty: 10, unit: '个', price: 12, buy: todayStr, channel: '美团', expire: 15 },
          { id: uid(), emoji: '🍅', name: '番茄', qty: 4, unit: '个', price: 6, buy: todayStr, channel: '盒马', expire: 6 },
          { id: uid(), emoji: '🍜', name: '挂面', qty: 2, unit: '把', price: 4, buy: todayStr, channel: '超市', expire: 180 }
        ],
        fav: [
          { id: uid(), name: '番茄炒蛋', emoji: '🍳', ing: '番茄2个·鸡蛋3个', note: '先炒蛋盛出，再炒番茄出汁，混合调味' }
        ],
        plan: [
          { id: uid(), type: '早餐', name: '番茄鸡蛋面', emoji: '🍜', media: '',
            ing: [{ n: '挂面', a: '1把' }, { n: '鸡蛋', a: '1个' }, { n: '番茄', a: '1个' }],
            season: ['盐', '葱花'] }
        ],
        recipes: [
          { id: uid(), name: '番茄炒蛋', emoji: '🍳', need: ['番茄', '鸡蛋'] },
          { id: uid(), name: '清炒生菜', emoji: '🥬', need: ['生菜'] },
          { id: uid(), name: '番茄鸡蛋面', emoji: '🍜', need: ['番茄', '鸡蛋', '挂面'] },
          { id: uid(), name: '水煮蛋', emoji: '🥚', need: ['鸡蛋'] }
        ]
      },
      notes: [
        { id: uid(), text: '下月想做“成人学琴”选题，先攒3个真实学员故事。', time: todayStr + ' 09:12' }
      ],
      wanzidance: {
        remaining: 6,
        logs: [
          { id: uid(), date: todayStr, content: '老师发：地面动作《小燕子》+ 复习前滚翻', media: '', done: false }
        ]
      },
      wanzipiano: WANZI_SEED.map(function (x) { return Object.assign({ id: uid(), media: '' }, x); }),
      wanzisched: [
        { id: uid(), day: 3, time: '19:00', label: '钢琴 🎹', taken: 3, total: 12 },
        { id: uid(), day: 5, time: '18:30', label: '舞蹈 🩰', taken: 6, total: 12 }
      ],
      settings: { xhsApi: null, apiBase: '' },
      seededClasses: true   // 默认班已内置；清空工作安排后不再强制恢复
    };
  }

  function load() {
    try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { data = null; }
    if (!data) { data = seed(); save(); }
    else migrate(data);
    return data;
  }
  // 补全已保存数据里缺失的真实课程视频链接（按标题匹配；仅当为空时写入，不覆盖用户自定义）
  function migrate(d) {
    if (!d) return;
    if (!d.recipes) d.recipes = { inventory: [], fav: [], plan: [] };
    if (!Array.isArray(d.imports)) d.imports = [];
    if (!Array.isArray(d.schedule)) d.schedule = [];
    if (!Array.isArray(d.students)) d.students = [];
    if (!d.pianoProgress || typeof d.pianoProgress !== 'object') d.pianoProgress = {};
    if (!d.xhs) d.xhs = seed().xhs;
    if (!d.xhs.accounts) d.xhs.accounts = { english: { name: '', handle: '', xhs: true, douyin: true, position: '', pillar: '' }, pet: { name: '', handle: '', xhs: true, douyin: true, position: '', pillar: '' } };
    if (!d.xhs.checklist || typeof d.xhs.checklist !== 'object') d.xhs.checklist = {};
    if (!Array.isArray(d.xhs.compliance)) d.xhs.compliance = [];
    if (!Array.isArray(d.xhs.drafts)) d.xhs.drafts = [];
    if (!Array.isArray(d.xhs.calendar)) d.xhs.calendar = [];
    if (!Array.isArray(d.xhs.metrics)) d.xhs.metrics = [];
    if (!d.xhs.daily || typeof d.xhs.daily !== 'object') d.xhs.daily = null;
    if (typeof d.xhs.dailyLoaded !== 'string') d.xhs.dailyLoaded = '';
    if (!d.xhs.reminder) d.xhs.reminder = seed().xhs.reminder;
    if (!d.travel || typeof d.travel !== 'object') d.travel = { profile: seed().travel.profile, weekend: [], longtrip: [], loaded: '' };
    if (!d.travel.profile || typeof d.travel.profile !== 'object') d.travel.profile = seed().travel.profile;
    if (!Array.isArray(d.travel.weekend)) d.travel.weekend = [];
    if (!Array.isArray(d.travel.longtrip)) d.travel.longtrip = [];
    if (typeof d.travel.loaded !== 'string') d.travel.loaded = '';
    if (!Array.isArray(d.favorites)) d.favorites = [];
    // 首次为空（你之前清空的）自动注入默认 2 个班（含逐课计划），仅一次；之后清空/编辑不再强制恢复
    if (!d.seededClasses && d.students.length === 0 && d.schedule.length === 0) {
      const def = buildDefaultClasses();
      d.students = def.students; d.schedule = def.schedule; d.seededClasses = true;
    }
    // 升级：plans.js 可用时，把逐课计划接入现有数据
    const SRC = (typeof window !== 'undefined' && window.VAVA_PLANS) ? window.VAVA_PLANS : [];
    if (SRC.length) {
      const oldNames = ['Andy', 'Leo', 'CHEN HAN', 'Chen Han'];
      const isOldDefault = d.students.length > 0 &&
        d.students.every(function (s) { return !s.plan && oldNames.indexOf(s.name) >= 0; });
      if (isOldDefault) {
        // 当前正是旧默认 3 班 → 整体替换为 2 班逐课计划（按用户要求只留 Andy / Chen Han）
        const def = buildDefaultClasses();
        d.students = def.students; d.schedule = def.schedule;
      } else {
        // 否则仅给同名学员补全 plan（不删、不改其他自定义学员）
        d.students.forEach(function (s) {
          if (s.plan) return;
          const m = SRC.find(function (c) { return c.name.toLowerCase() === String(s.name).toLowerCase(); });
          if (!m) return;
          s.plan = m.plan.map(function (p) { return { seq: p.seq, content: p.content, date: p.date || '', done: !!p.done, renewal: !!p.renewal, feePaid: !!p.feePaid }; });
          s.stage = m.stage; s.day = (typeof m.day === 'number' ? m.day : 2); s.time = m.time || '待补';
          s.total = m.total || s.plan.length; s.done = s.plan.filter(function (p) { return p.done; }).length;
          d.schedule.forEach(function (sc) {
            if (sc.studentId === s.id) { sc.day = s.day; sc.time = s.time; sc.label = m.name + ' · ' + m.stage; }
          });
        });
      }
    }
    d.schedule.forEach(function (s) {
      if (typeof s.feeDue !== 'boolean') s.feeDue = false;
      if (typeof s.feePaid !== 'boolean') s.feePaid = false;
      if (s.studentId === undefined) s.studentId = null;
    });
    if (!d.settings) d.settings = {};
    if (typeof d.settings.apiBase !== 'string') d.settings.apiBase = '';
    if (!Array.isArray(d.recipes.recipes)) d.recipes.recipes = [
      { id: 'seed', name: '番茄炒蛋', emoji: '🍳', need: ['番茄', '鸡蛋'] },
      { id: 'seed', name: '清炒生菜', emoji: '🥬', need: ['生菜'] },
      { id: 'seed', name: '番茄鸡蛋面', emoji: '🍜', need: ['番茄', '鸡蛋', '挂面'] },
      { id: 'seed', name: '水煮蛋', emoji: '🥚', need: ['鸡蛋'] }
    ];
    ['pianoVAVA', 'wanzipiano'].forEach(function (key) {
      if (!Array.isArray(d[key])) d[key] = [];
      d[key].forEach(function (p) {
        if (p.guide === undefined) p.guide = '';
        if (p.guideMedia === undefined) p.guideMedia = '';
        if (p.guideImages === undefined) p.guideImages = '';
        // 把旧的无标题小红书链接升级为「标题 || 链接」格式（仅当该行还是纯链接时）
        if (String(p.guideMedia).indexOf('小红书·') < 0) {
          const lines = String(p.guideMedia).split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
          const newLines = lines.map(function (l) {
            if (l.indexOf('xiaohongshu.com') >= 0 && l.indexOf(' || ') < 0) return '小红书·钢琴教程 || ' + l;
            return l;
          });
          if (!newLines.some(function (l) { return l.indexOf('xiaohongshu.com') >= 0; })) {
            newLines.unshift(xhsFor(p.title));
          }
          p.guideMedia = newLines.join('\n');
        }
        // 补全缺失的详尽教程 / 视频 / 配图（按标题匹配；仅当为空时写入，不覆盖用户自定义）
        const map = key === 'pianoVAVA' ? PIANO_GUIDE : WANZI_GUIDE;
        const c = map[p.title];
        if (c) {
          if (!p.guide) p.guide = c.guide;
          if (!p.guideMedia) p.guideMedia = c.guideMedia;
          if (!p.guideImages) p.guideImages = c.guideImages || '';
        }
      });
    });
    save();
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(data)); }
  function get() { if (!data) load(); return data; }
  function set(d) { data = d; save(); }
  function reset() { data = seed(); save(); }
  // 导入真实数据（整体替换，需为合法对象）
  function replace(obj) {
    if (!obj || typeof obj !== 'object') throw new Error('非法数据');
    // 保留关键结构，防止误导入导致界面崩
    data = Object.assign(seed(), obj);
    if (!data.pwd) data.pwd = '1314';
    if (!data.xhs) data.xhs = seed().xhs;
    save();
  }
  // 清空所有内容（保留模块结构与密码）
  function clearContent() {
    const s = seed();
    data.students = []; data.schedule = []; data.trials = []; data.holidays = [];
    data.feedback = []; data.imports = []; data.pianoVAVA = []; data.xhs = {
      tasks: [], ideas: [], posts: [], trends: s.xhs.trends, sources: '',
      accounts: { english: { name: '', handle: '', xhs: true, douyin: true, position: '', pillar: '' }, pet: { name: '', handle: '', xhs: true, douyin: true, position: '', pillar: '' } },
      checklist: {}, compliance: [], drafts: [], calendar: [], metrics: [], reminder: null, daily: null, dailyLoaded: ''
    };
    data.travel = { profile: s.travel.profile, weekend: [], longtrip: [], loaded: '' }; data.seasonal = []; data.english = []; data.recipes = { inventory: [], fav: [], plan: [] }; data.notes = [];
    data.wanzidance = { remaining: 0, logs: [] }; data.wanzipiano = []; data.wanzisched = [];
    save();
  }
  // 仅清空「工作安排」模块：学员 / 课表 / 试听 / 节假日 / 学情反馈 / 导入表格
  function clearWork() {
    data.students = []; data.schedule = []; data.trials = []; data.holidays = [];
    data.feedback = []; data.imports = [];
    save();
  }
  // 一键重置「工作安排」为默认 3 班（Andy / Leo / CHEN HAN），用于替换浏览器残留的旧学员数据
  function replaceWorkWithDefaults() {
    const def = buildDefaultClasses();
    data.students = def.students;
    data.schedule = def.schedule;
    data.trials = []; data.holidays = [];
    data.feedback = []; data.imports = [];
    data.seededClasses = true;
    save();
  }
  return { get, set, save, reset, replace, clearContent, clearWork, replaceWorkWithDefaults, uid, KEY };
})();
