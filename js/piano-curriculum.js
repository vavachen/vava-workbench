/* ===== VAVA 工作台 · 钢琴系统课（0基础 → 半年，4 阶段 26 课） =====
 * 静态课程体系：window.PIANO_CURRICULUM
 * 进度存于 localStorage（d.pianoProgress），更新本课不影响打卡。
 * 图文用本地 SVG（assets/piano/），视频内嵌 B站播放器 + 我的录课槽位。
 */
window.PIANO_CURRICULUM = {
  meta: {
    title: '钢琴系统课 · 0 基础到半年',
    subtitle: '4 阶段 · 26 课 · 图文 + 视频，每周一节稳步推进',
    totalWeeks: 26,
    cover: 'assets/piano/cover.svg'
  },
  // 公开教程资源（B站 / YouTube 钢琴教学频道，点开即搜）
  resources: [
    { name: '教钢琴的余老师', note: '成人启蒙，每节短易懂', tag: 'B站', url: 'https://search.bilibili.com/all?keyword=教钢琴的余老师' },
    { name: '三分钟音乐社', note: '保姆级乐理，系统全面', tag: 'B站', url: 'https://search.bilibili.com/all?keyword=三分钟音乐社 钢琴' },
    { name: '山姆钢琴 sam 老师', note: '五线谱 / 痛点干货', tag: 'B站', url: 'https://search.bilibili.com/all?keyword=山姆钢琴' },
    { name: '悦耳钢琴学习教室', note: '初学者教程 800+ 集', tag: 'B站', url: 'https://search.bilibili.com/all?keyword=悦耳钢琴学习教室' },
    { name: '刘亦朵', note: '左右手分步再合练', tag: 'B站', url: 'https://search.bilibili.com/all?keyword=刘亦朵 钢琴' },
    { name: 'Hoffman Academy', note: '儿童启蒙经典（英文）', tag: 'YouTube', url: 'https://www.youtube.com/results?search_query=Hoffman+Academy+piano+lesson' },
    { name: 'PianoVideoLessons', note: '分级系统课（英文）', tag: 'YouTube', url: 'https://www.youtube.com/results?search_query=PianoVideoLessons+beginner' }
  ],
  phases: [
    {
      id: 'ph1', name: '阶段一 · 启蒙入门', weeks: '第 1–6 周', color: 'sage',
      goal: '认识乐器与身体准备：坐姿、手型、手指编号、do-re-mi 与单手旋律，先建立正确习惯。',
      lessons: [
        { id: 'w1', week: 1, title: '认识键盘与中央C', focus: '分清黑白键，找到基准音中央C',
          goals: ['认识 88 键布局：白键 52 / 黑键 36，黑键「两粒一组·三粒一组」', '找到中央C：键盘中央「两黑键左边」的白键', '记住 C-D-E-F-G 五个白键的位置'],
          text: '钢琴从左到右音越来越高。先别急着弹曲子，把「地图」认熟：黑键总是两个一组、三个一组交替；中央C 就在中间「两个黑键左边」的白键，它是所有记谱的基准。\n\n今天目标：闭眼也能用手指出中央C，并依次点出 C-D-E-F-G。',
          imgs: ['assets/piano/keyboard.svg'],
          videoHint: '钢琴 键盘 中央C 教学',
          videos: [
            { title: '认识手指与键盘', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=2' },
            { title: '认识键盘', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=8' },
            { title: '音组与中央C', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=77' }
          ] },
        { id: 'w2', week: 2, title: '坐姿与手型', focus: '腰背挺直、手肘≈键高、身距一拳',
          goals: ['琴凳坐前 1/2，腰背自然挺直不僵硬', '手肘高度 ≈ 键盘，大臂自然下垂', '身体与琴距约一拳，肩膀放松'],
          text: '正确的坐姿是弹不累、弹得好的前提。坐太深会驼背，太近肩膀会耸。\n\n要点：坐琴凳前半；后背挺直但别绷；手肘自然垂下时高度和琴键差不多；身体离琴约一拳。每天练前先检查一遍坐姿。',
          imgs: ['assets/piano/posture.svg', 'assets/piano/handshape.svg'],
          videoHint: '钢琴 正确坐姿 手型',
          videos: [
            { title: '学习坐姿', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=1' },
            { title: '坐姿手型', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=13' }
          ] },
        { id: 'w3', week: 3, title: '手指编号与断奏触键', focus: '大拇指=1，落下像「掉」到键上',
          goals: ['记住：两手大拇指都是 1，向小指依次为 2-3-4-5', '断奏(staccato)：手指自然落下，发音后轻提', '落臂放松，用体重而非按压力量'],
          text: '弹琴前先给手指「编号」：大拇指是 1，小指是 5，两只手都一样。\n\n断奏是最基础的手感：手自然抬起，像一滴水「掉」到键上，弹完轻轻提起来（音与音之间断开）。体会用胳膊的重量落下，而不是用手指去「按」。',
          imgs: ['assets/piano/fingering.svg', 'assets/piano/handshape.svg'],
          videoHint: '钢琴 断奏 手指编号 触键',
          videos: [
            { title: '学习单音落奏', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=12' },
            { title: '入门指法', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=14' },
            { title: '三种弹奏方式', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=3' }
          ] },
        { id: 'w4', week: 4, title: 'do-re-mi 与音名', focus: '唱名 Do-Re-Mi = 音名 C-D-E',
          goals: ['分清「唱名」(Do Re Mi) 与「音名」(C D E)', '在键上找出 C-D-E-F-G 并边点边唱', '建立「音高→键位」的对应'],
          text: '同一个音有两种名字：唱的时候叫 Do-Re-Mi（唱名），写/说的时候叫 C-D-E（音名）。C=Do, D=Re, E=Mi, F=Fa, G=Sol。\n\n今天：右手 1-5 指边点 C-D-E-F-G 边唱，来回几遍，做到「看到音名就能找到键」。',
          imgs: ['assets/piano/fingering.svg', 'assets/piano/keyboard.svg'],
          videoHint: '钢琴 do re mi 音名 唱名',
          videos: [
            { title: '熟悉键盘音高', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=4' },
            { title: '音名、唱名', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=7' },
            { title: '音名与唱名（乐理）', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=76' }
          ] },
        { id: 'w5', week: 5, title: '右手旋律《小星星》', focus: 'C-D-E-F-G 单手连起来',
          goals: ['右手 1-5 指弹 C-D-E-F-G 五个音', '慢速跟弹《小星星》右手旋律', '一个音站稳再换下一个，先 40bpm'],
          text: '《小星星》右手只用 C-D-E-F-G：C C G G A A G｜F F E E D D C。\n\n分手慢练：只弹右手，每小节数 4 拍，音与音连起来但不抢。先 40bpm，卡住的小节单独练 5 遍，再连成整首。',
          imgs: ['assets/piano/fingering.svg'],
          videoHint: '小星星 C调 右手 教学',
          videos: [
            { title: '《小星星》C调简单版', url: 'https://www.bilibili.com/video/BV1234y1X77m/' },
            { title: '《小星星》双手简谱教学', url: 'https://www.bilibili.com/video/BV1YS421d7bX/' }
          ] },
        { id: 'w6', week: 6, title: '节拍与节奏入门', focus: '跟节拍器数准 4/4 拍',
          goals: ['认识全/二分/四分/八分音符的时值', '念准「强-弱-次强-弱」', '用节拍器 60bpm 稳定打拍'],
          text: '节奏是音乐的骨架。先念后弹：拍腿打拍念「强-弱-次强-弱」，每拍一下。\n\n打开节拍器 60bpm，单手弹一个音跟每一拍；再上《小星星》，要求每小节第 1 拍是「强」。抢拍的元凶是嘴里没拍子——先念稳，手才稳。',
          imgs: ['assets/piano/rhythm.svg'],
          videoHint: '钢琴 节奏 4/4拍 节拍器',
          videos: [
            { title: '认识音符的时值', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=3' },
            { title: '音符时值与休止符', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=75' }
          ] }
      ]
    },
    {
      id: 'ph2', name: '阶段二 · 基础奠基', weeks: '第 7–14 周', color: 'brown',
      goal: '进入五线谱与双手：识谱、左右手配合、连奏与音阶，能弹一首简单小品。',
      lessons: [
        { id: 'w7', week: 7, title: '五线谱与谱号', focus: '高音谱号下加一线 = 中央C',
          goals: ['认识五线谱「线与间」', '高音谱号记右手旋律；低音谱号记左手', '中央C：高音谱号下加一线 / 低音谱号上加一线'],
          text: '五线谱像楼梯：五条线、四个间，音越往上越高。高音谱号（右手）下加一线就是中央C；低音谱号（左手）上加一线也是中央C。\n\n今天先认谱号与线间位置，能在谱上圈出中央C 即可，不急着弹。',
          imgs: ['assets/piano/staff.svg'],
          videoHint: '五线谱 高音谱号 中央C 教学',
          videos: [
            { title: '五线谱的基本逻辑', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=5' },
            { title: 'F谱号与G谱号', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=8' },
            { title: '五线四间', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=37' },
            { title: '高音谱号', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=38' }
          ] },
        { id: 'w8', week: 8, title: 'C–G 五指位置与音程', focus: '五个手指守住一个把位',
          goals: ['右手五指落在 C-D-E-F-G（一个把位）', '认识级进（相邻音）与跳进', '左右手分别在把位内弹短句'],
          text: '把位就是「五个手指守住五个相邻白键」。右手 C-D-E-F-G 是一个最常用把位。\n\n音程=音与音的距离：相邻的叫级进（如 C→D），跳过中间的叫跳进（如 C→E）。先在把位内弹级进短句，再试小跳进。',
          imgs: ['assets/piano/staff.svg', 'assets/piano/keyboard.svg'],
          videoHint: '钢琴 五指位置 音程',
          videos: [
            { title: '熟悉双手CDEFG', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=9' },
            { title: '音程（乐理）', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=74' },
            { title: '音程', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=16' }
          ] },
        { id: 'w9', week: 9, title: '左手入门与简单伴奏', focus: '左手垫底，右手唱歌',
          goals: ['左手在 C-D-E-F-G 把位内弹低音', '用简单分解/柱式为右手旋律伴奏', '先分手练熟，再慢速叠加'],
          text: '左手是「地基」。先单独练左手：在把位里弹低音或简单伴奏型（如每小节一个根音）。\n\n等左手能稳稳弹，再让它给右手旋律「垫底」。记住铁律：左右手都要先分手练到不出错，再合。',
          imgs: ['assets/piano/chords.svg'],
          videoHint: '钢琴 左手 伴奏 入门',
          videos: [
            { title: '熟悉双手CDEFG', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=9' },
            { title: '移位能力培养', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=10' }
          ] },
        { id: 'w10', week: 10, title: '双手配合《欢乐颂》', focus: '先分后合，对齐第 1 拍',
          goals: ['右手旋律 + 左手简单低音', '用节拍器 50bpm 对齐第 1 拍', '卡壳处退回分手单练'],
          text: '《欢乐颂》右手：E E F G｜G F E D｜C C D E｜E D D。左手每小节一个低音（C / G / C / G）。\n\n合奏时最容易「右手快左手慢」。解决：跟节拍器，谁慢就跟谁；哪里合不上就退回分手，把那一小节练 10 遍再合。',
          imgs: ['assets/piano/chords.svg'],
          videoHint: '欢乐颂 钢琴 双手 教学',
          videos: [
            { title: '合手能力培养', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=14' },
            { title: '两只手做不同的事', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=15' }
          ] },
        { id: 'w11', week: 11, title: '连奏 legato', focus: '音与音之间「连」，不抬死',
          goals: ['理解连线内要连贯不中断', '下一指提前备好，平滑过渡', '抬指明显但不「砸」'],
          text: '连奏(legato)是音与音圆滑连接：前一个音下去后，下一个手指已经准备好，在它落下的瞬间前一个才悄悄抬起——中间不断。\n\n常见错误是把连线弹成断奏。练习：把抬指做明显，但落键要柔，像走路一步接一步。',
          imgs: ['assets/piano/handshape.svg'],
          videoHint: '钢琴 连奏 legato 教学',
          videos: [
            { title: '中央F与连奏线', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=7' },
            { title: '三种弹奏方式', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=3' }
          ] },
        { id: 'w12', week: 12, title: '八分音符与附点', focus: '把一拍拆成两个半拍',
          goals: ['八分音符 = 半拍（一拍里两个）', '附点 = 原时值 + 一半', '先念节奏再上琴'],
          text: '四分音符是一拍；八分音符是半拍，一拍里能放两个（常成对出现）。附点音符「·」表示延长自身一半：附点四分 = 一拍半。\n\n先用手打拍把节奏念准（哒-哒-哒-哒），附点要数够时值，再搬到琴上跟节拍器。',
          imgs: ['assets/piano/rhythm.svg'],
          videoHint: '钢琴 八分音符 附点 节奏',
          videos: [
            { title: '认识音符的时值', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=3' },
            { title: '音符时值与休止符', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=75' }
          ] },
        { id: 'w13', week: 13, title: 'C 大调音阶（右手）', focus: '1-2-3 穿指回到 1 再到 5',
          goals: ['右手弹 C-D-E-F-G-A-B-C', '指法：1-2-3 后「穿指」回 1，再 2-3-4-5', '先 50bpm，均匀流畅再提速'],
          text: '音阶是钢琴的「字母表」。C 大调右手指法：C(1) D(2) E(3) F(1) G(2) A(3) B(4) C(5)。\n\n难点在 F 处的「穿指」：大拇指从 3、4 指下穿过去接 F。慢练这个转换，做到音粒均匀、不抢不拖。',
          imgs: ['assets/piano/cscale.svg'],
          videoHint: 'C大调音阶 右手 指法',
          videos: [
            { title: '全音和半音', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=9' },
            { title: '入门指法', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=14' }
          ] },
        { id: 'w14', week: 14, title: '小曲《致爱丽丝》简化片段', focus: '连线里的连奏 + 乐句呼吸',
          goals: ['弹《致爱丽丝》前 8 小节简化版', '连线内连贯，乐句之间抬手呼吸', '做一点强弱对比，录音回听'],
          text: '把前几周学的连奏、把位、节奏用在一首真实小曲上。前 8 小节右手是经典旋律，左手简单伴奏。\n\n重点：连线内音要连；乐句与乐句之间稍微抬手「呼吸」。弹完录一遍，对比「平铺直叙」和「有强弱」哪个好听。',
          imgs: ['assets/piano/staff.svg'],
          videoHint: '致爱丽丝 简化版 教学',
          videos: [
            { title: '中央F与连奏线', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=7' },
            { title: '三种弹奏方式', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=3' }
          ] }
      ]
    },
    {
      id: 'ph3', name: '阶段三 · 技巧进阶', weeks: '第 15–20 周', color: 'coral',
      goal: '从单音到和声：和弦、踏板、力度表情，能弹带伴奏与情绪的小曲。',
      lessons: [
        { id: 'w15', week: 15, title: '和弦基础 C / F / G', focus: '三个音同时落下',
          goals: ['认 C(C-E-G)、F(F-A-C)、G(G-B-D)', '三个音「同时落下」，不一个一个敲', '手腕放松，保留共同音更顺'],
          text: '和弦是「几个音一起响」。最常用三个：C=C-E-G、F=F-A-C、G=G-B-D。\n\n弹和弦：手指并拢、手腕放松，三个音整体落下（不是依次敲）。转换时先想「哪个音保留」，只动要变的手指。',
          imgs: ['assets/piano/chords.svg'],
          videoHint: '钢琴 三和弦 C F G 教学',
          videos: [
            { title: '什么是三和弦', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=70' },
            { title: '大三和弦', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=22' },
            { title: '小三和弦', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=23' }
          ] },
        { id: 'w16', week: 16, title: '和弦转位与 I–IV–V', focus: '万能进行 C–F–G–C',
          goals: ['理解 I(C)–IV(F)–V(G) 进行', '找每个和弦的根音再补上方音', 'C→G 共用 G，F→C 共用 C'],
          text: '和弦进行像句子的语法。最万能的是 I–IV–V（C–F–G）。\n\n转换窍门：先找准最低音（根音），再补上方两音；C→G 共用 G、F→C 共用 C，保留共同音手指不动，只动要变的。慢循环 C–F–G–C，每和弦 4 拍。',
          imgs: ['assets/piano/chords.svg'],
          videoHint: '钢琴 和弦转位 I IV V 进行',
          videos: [
            { title: '和弦转位（乐理实践）', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=22' },
            { title: '基础和弦（乐理实践）', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=21' }
          ] },
        { id: 'w17', week: 17, title: '踏板入门', focus: '换和弦必换踏板',
          goals: ['认识右踏板（延音踏板）', '切分踏板：手弹新音的同时换踏板', '别踩太深，避免浑浊'],
          text: '右踏板让音延长、更连贯。新手最易错：踩太深或该换不换，声音发浑。\n\n学「切分踏板」：在手指弹下新和弦的瞬间，脚快速换一次踏板（踩下→松开→再踩），让旧音放干净、新音接上。换和弦必换踏板。',
          imgs: ['assets/piano/pedal.svg'],
          videoHint: '钢琴 延音踏板 切分踏板',
          videos: [
            { title: '踏板是钢琴的灵魂', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=52' },
            { title: '踏板乐曲练习', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=53' }
          ] },
        { id: 'w18', week: 18, title: '力度与乐句表情', focus: '让旋律有「说话的语气」',
          goals: ['认识 p(弱)/f(强)/渐强渐弱', '在谱上标出强弱并做出对比', '乐句像句子一样起伏呼吸'],
          text: '同样的音，强弹和弱弹是完全不同的表达。p=弱、f=强，渐强/渐弱像海浪。\n\n练习：在谱上圈出 f/p，弹成「强—弱—强」的语气；乐句连线尾端轻轻抬手「呼吸」。录音对比，立刻听出差别。',
          imgs: ['assets/piano/dynamics.svg'],
          videoHint: '钢琴 力度 表情 强弱 处理',
          videos: [
            { title: '三种弹奏方式', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=3' },
            { title: '认识基本谱面记号', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=6' }
          ] },
        { id: 'w19', week: 19, title: 'G 大调与 F 大调音阶', focus: '认识升号 # 与降号 b',
          goals: ['G 大调一个升号 #F；F 大调一个降号 bB', '左右手分别弹两个调的音阶', '指法正确，均匀流畅'],
          text: 'C 大调全用白键；G 大调把 F 升高半音（#F），F 大调把 B 降低半音（bB）。\n\n先分手把两个调的音阶弹顺，注意黑键的指法安排（让大拇指落在合适的白键）。熟练后它们会成为你即兴与移调的底子。',
          imgs: ['assets/piano/cscale.svg'],
          videoHint: 'G大调 F大调 音阶 指法',
          videos: [
            { title: '大小调（乐理实践）', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=32' },
            { title: '升降记号', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=10' },
            { title: '五度圈', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=71' }
          ] },
        { id: 'w20', week: 20, title: '综合小曲（流行/经典）', focus: '和弦伴奏 + 旋律 + 踏板',
          goals: ['选一首喜欢的简单曲（如《卡农》片段）', '左手和弦 + 右手旋律 + 右踏板', '做出基础力度与乐句'],
          text: '把阶段三的和弦、踏板、力度用在一首完整小曲上。推荐《卡农》前半段（左手 I–V–vi–iii–IV–I–IV–V 进行）或一首喜欢的流行歌简化版。\n\n目标：能从头弹到尾、带伴奏与情绪，不再只是「把音弹对」。',
          imgs: ['assets/piano/chords.svg', 'assets/piano/dynamics.svg'],
          videoHint: '卡农 简化版 钢琴 教学',
          videos: [
            { title: '顺阶和弦（乐理实践）', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=24' },
            { title: '踏板乐曲练习', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=53' }
          ] }
      ]
    },
    {
      id: 'ph4', name: '阶段四 · 演奏提高', weeks: '第 21–26 周', color: 'sage-d',
      goal: '从「会弹」到「会演」：科学练习、完整曲目、表现力与汇报，并规划后续路线。',
      lessons: [
        { id: 'w21', week: 21, title: '科学练习法', focus: '慢练·分手·难点攻克',
          goals: ['分手练习：左右手各自练到熟', '慢速叠加：从 60bpm 逐步加速', '难点单独抠，录音自查'],
          text: '练琴不是「从头弹到尾」。高效公式：分手练熟 → 慢速合（节拍器）→ 逐步提速；卡住的小节单独练 10 遍。\n\n每天 25 分钟专注 > 2 小时瞎弹。用「录音回听」能发现自己 85% 的问题。',
          imgs: ['assets/piano/rhythm.svg', 'assets/piano/handshape.svg'],
          videoHint: '钢琴 高效练习法 慢练 分手',
          videos: [
            { title: '学习方法', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=5' },
            { title: '合手能力培养', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=14' }
          ] },
        { id: 'w22', week: 22, title: '一首完整曲目（一）选曲与分段', focus: '选合适难度，分段攻克',
          goals: ['选一首略高于当前水平、喜欢的曲', '按乐句/段落拆分，定每周目标', '先攻最难段落，再串全曲'],
          text: '挑一首你真正想弹的曲（难度以「慢速能弹对 70%」为宜）。\n\n把曲子按段落拆开，先练最难的段落（别总从头弹）；每周只攻 1–2 段。分段练熟后，拼接就快。',
          imgs: ['assets/piano/cscale.svg'],
          videoHint: '钢琴 选曲 分段练习',
          videos: [
            { title: '学习方法', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=5' },
            { title: '扒谱演奏', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=6' }
          ] },
        { id: 'w23', week: 23, title: '一首完整曲目（二）连贯与背谱', focus: '从「看谱」到「心中有谱」',
          goals: ['全曲慢速连贯弹奏', '理解式背谱（结构/和声而非死记）', '闭谱能弹主要段落'],
          text: '背谱不是硬记手指，而是记住「音乐结构」：哪句是问答、和声怎么走。\n\n先保证全曲慢速连贯不中断；再尝试闭谱，卡住处回头看谱、想结构。理解式背谱更牢、上台更稳。',
          imgs: ['assets/piano/dynamics.svg'],
          videoHint: '钢琴 背谱 连贯 演奏',
          videos: [
            { title: '顺阶和弦（乐理实践）', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=24' },
            { title: '和弦编配', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=15' }
          ] },
        { id: 'w24', week: 24, title: '装饰音与速度术语', focus: '让演奏更「专业」',
          goals: ['认识倚音、琶音等常见装饰音', '理解 rit.(渐慢)/accel.(渐快)', '按术语处理速度起伏'],
          text: '曲子里的意大利术语是「演奏指示」：rit. 渐慢、accel. 渐快、a tempo 回原速；装饰音（如倚音）是「带过的小音」。\n\n先看清术语再弹，速度起伏要自然，像说话的停顿与加速，别突兀。',
          imgs: ['assets/piano/dynamics.svg'],
          videoHint: '钢琴 装饰音 速度术语 rit accel',
          videos: [
            { title: '认识基本谱面记号', url: 'https://www.bilibili.com/video/BV1D7421K7ZZ/?p=6' },
            { title: '五线谱识谱', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=72' }
          ] },
        { id: 'w25', week: 25, title: '舞台表现与录音自评', focus: '把练习变成「演奏」',
          goals: ['固定演奏速度，模拟上台一次弹完', '录音/录像，按节奏·手型·表现力打分', '针对最弱项做最后打磨'],
          text: '上台和练习是两件事。练一首曲到「能一次不中断弹完」，再录像自评：节奏稳吗？手型对吗？有表情吗？\n\n每项 1–5 分，找出最想改的 1 条集中打磨，比平均用力更有效。',
          imgs: ['assets/piano/dynamics.svg'],
          videoHint: '钢琴 舞台表现 演奏 自评',
          videos: [
            { title: '学习方法', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=5' },
            { title: '即兴弹奏', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=4' }
          ] },
        { id: 'w26', week: 26, title: '阶段汇报与后续路线', focus: '总结半年，规划下一步',
          goals: ['完成一首完整曲目汇报演奏（录视频）', '回顾 26 课进步，写下 3 个收获', '规划下一步：考级 / 即兴 / 曲目积累'],
          text: '半年到这一步，你已经能弹一首带伴奏、有表情的完整曲目。给自己办一场小汇报（录下来留念）。\n\n后续路线三选一或并行：① 考级（如音协/英皇 1–3 级）；② 学即兴伴奏；③ 持续积累曲目库。保持每周 1 课 + 每日练习的节奏即可。',
          imgs: ['assets/piano/cover.svg'],
          videoHint: '钢琴 考级 即兴伴奏 路线',
          videos: [
            { title: '即兴弹奏', url: 'https://www.bilibili.com/video/BV1AgbQzzE5t/?p=4' },
            { title: '即兴音乐', url: 'https://www.bilibili.com/video/BV16ndNYFEMt/?p=8' }
          ] }
      ]
    }
  ]
};
