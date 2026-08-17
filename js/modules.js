/* ===== VAVA 工作台 · 各模块视图 ===== */
const Modules = (function () {
  const V = {};
  const rerender = () => App.refresh();
  const el = UI.el;
  const esc = UI.esc;

  function card(title, icon, kids) {
    const head = el('div', { class: 'card-h' }, el('h3', null, [icon + '  ', title]));
    const body = el('div', null, kids);
    return el('div', { class: 'card' }, [head, body]);
  }
  function empty(msg) { return el('div', { class: 'empty' }, msg); }
  function row2(k, v) { return el('div', { class: 'row2' }, [el('b', null, k), el('span', null, v || '')]); }

  // ===== 批量选择 / 删除 =====
  const Batch = {
    on: false, sel: {}, removers: {}, allIds: [], _update: null,
    reset() { this.sel = {}; this.removers = {}; this.allIds = []; this.update(); },
    item(id, removeFn) {
      this.allIds.push(id); this.removers[id] = removeFn;
      const cb = el('input', { type: 'checkbox', class: 'batch-cb', 'data-batch': id });
      cb.checked = !!this.sel[id];
      cb.addEventListener('change', () => { if (cb.checked) this.sel[id] = true; else delete this.sel[id]; this.update(); });
      return cb;
    },
    selectAll() {
      if (Object.keys(this.sel).length === this.allIds.length && this.allIds.length) this.sel = {};
      else { this.sel = {}; this.allIds.forEach(id => this.sel[id] = true); }
      document.querySelectorAll('.batch-cb').forEach(cb => { cb.checked = !!this.sel[cb.getAttribute('data-batch')]; });
      this.update();
    },
    deleteSelected() {
      const ids = Object.keys(this.sel);
      if (!ids.length) { UI.toast('请先勾选要删除的内容'); return; }
      if (!confirm('确认删除选中的 ' + ids.length + ' 项内容？此操作不可撤销')) return;
      ids.forEach(id => { const fn = this.removers[id]; if (fn) fn(); });
      this.sel = {}; DB.save(); App.refresh(); UI.toast('已删除 ' + ids.length + ' 项 ✅');
    },
    update() { if (this._update) this._update(this.sel, this.allIds); },
    setUpdate(fn) { this._update = fn; }
  };

  // ===== CSV / TSV 解析（支持引号、逗号、制表符、换行）=====
  function parseCSV(text) {
    text = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows = []; let row = [], cur = '', q = false, i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i += 2; continue; } q = false; i++; }
        else { cur += ch; i++; }
      } else {
        if (ch === '"') { q = true; i++; }
        else if (ch === ',') { row.push(cur); cur = ''; i++; }
        else if (ch === '\t') { row.push(cur); cur = ''; i++; }
        else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; i++; }
        else { cur += ch; i++; }
      }
    }
    if (cur.length || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(r => r.some(c => String(c).trim() !== ''));
  }

  // ===== 口述整理 → 结构化 → 生成评语 =====
  function organizeOral(text, students) {
    const names = (students || []).map(s => s.name).filter(Boolean);
    let studentName = '';
    for (const n of names) { if (text.indexOf(n) >= 0) { studentName = n; break; } }
    const sentences = String(text).split(/[。！!？\?\n]/).map(s => s.trim()).filter(Boolean);
    const good = [], weak = [], plan = [], other = [];
    sentences.forEach(s => {
      if (/(进步|掌握|会|主动|积极|认真|专注|亮|不错|棒|流畅|准|稳|提升|提高|喜欢|兴趣|自信)/.test(s)) good.push(s);
      else if (/(需|需要|不足|不(够|足|熟|会)|弱|错|慢|缺|加强|练习|纠正|注意|问题|难点|容易)/.test(s)) weak.push(s);
      else if (/(建议|下次|多|计划|安排|目标|希望|可以|以后|回家)/.test(s)) plan.push(s);
      else other.push(s);
    });
    return { studentName, good: good.join('；'), weak: weak.join('；'), plan: plan.join('；'), other: other.join('；'), raw: text };
  }
  function genComment(o) {
    const name = o.studentName || '（学员）';
    const good = o.good ? '· ' + o.good : '· 本期整体状态不错，学习态度认真，能按时完成练习。';
    const weak = o.weak ? '· ' + o.weak : '· 个别知识点还需巩固，熟练度可再提升。';
    const plan = o.plan ? '· ' + o.plan : '· 下阶段继续巩固基础，增加针对性练习与听音训练。';
    return '【' + name + ' 学情反馈】\n家长您好！' + name + '本期课程表现整体平稳、积极，感谢您一直以来的配合与陪伴。\n\n✅ 进步与亮点：\n' + good + '\n\n📌 需要加强：\n' + weak + '\n\n🎯 下阶段建议：\n' + plan + '\n\n如在家练习中有任何疑问，随时私信我，咱们一起帮' + name + '进步 🌟\n—— VAVA 老师';
  }

  window.Batch = Batch;

  // 练习指导 / 教程区块（钢琴打卡通用）
  function platformOf(url) {
    if (!url) return { name: '教程链接', cls: 'lnk', icon: '🔗' };
    if (/douyin\.com|iesdouyin\.com|v\.douyin\.com/.test(url)) return { name: '抖音', cls: 'douyin', icon: '🎵' };
    if (url.indexOf('xiaohongshu.com') >= 0 || url.indexOf('xhslink.com') >= 0) return { name: '小红书', cls: 'xhs', icon: '📕' };
    if (url.indexOf('bilibili.com') >= 0) return { name: 'B站', cls: 'bili', icon: '📺' };
    if (url.indexOf('hoffmanacademy.com') >= 0) return { name: 'Hoffman(英文)', cls: 'en', icon: '🎓' };
    if (url.indexOf('youtube.com') >= 0 || url.indexOf('youtu.be') >= 0) return { name: 'YouTube', cls: 'yt', icon: '▶️' };
    return { name: '教程链接', cls: 'lnk', icon: '🔗' };
  }
  function isVideoUrl(u) { return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(u); }
  function isImgUrl(u) { return /\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/i.test(u); }
  // 兼容老旧 / 微信内置浏览器的复制回退（execCommand）
  function fallbackCopy(text, okMsg) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      UI.toast(ok ? (okMsg || '已复制链接 ✅') : '复制失败，请长按链接手动复制');
    } catch (e) { UI.toast('复制失败，请长按链接手动复制'); }
  }
  function copyWithFallback(text, okMsg) {
    try {
      navigator.clipboard.writeText(text).then(
        () => UI.toast(okMsg || '已复制链接 ✅'),
        () => fallbackCopy(text, okMsg)
      );
    } catch (e) { fallbackCopy(text, okMsg); }
  }
  // 卡片内点击 → 应用内小窗预览（B站/YouTube 内嵌播放；直链直接播；小红书给「打开」按钮）
  function playPreview(url, title) {
    const pf = platformOf(url);
    let body = null;
    if (pf.cls === 'bili') {
      const m = url.match(/BV[0-9A-Za-z]+/);
      const bvid = m ? m[0] : '';
      const p = (url.match(/[?&]p=(\d+)/) || [])[1] || 1;
      if (bvid) body = el('iframe', { class: 'lb-iframe', src: 'https://player.bilibili.com/player.html?bvid=' + bvid + '&page=' + p + '&high_quality=1&danmaku=0&autoplay=1', allowfullscreen: '', frameborder: '0' });
    } else if (pf.cls === 'yt') {
      const m = url.match(/(?:[?&]v=|youtu\.be\/)([0-9A-Za-z_-]{6,})/);
      const id = m ? m[1] : '';
      if (id) body = el('iframe', { class: 'lb-iframe', src: 'https://www.youtube.com/embed/' + id + '?autoplay=1', allowfullscreen: '', frameborder: '0' });
    } else if (isVideoUrl(url)) {
      body = el('video', { class: 'lb-video', src: url, controls: true, autoplay: true, playsinline: '' });
    }
    if (!body) {
      if (pf.cls === 'xhs') body = linkFallbackModal(url, { icon: '📕', title: '小红书需在 App 内观看', desc: '网页 / 微信内置浏览器都无法直接播放小红书视频。', toast: '已复制链接 ✅ 打开小红书 App 粘贴访问' });
      else if (pf.cls === 'douyin') body = linkFallbackModal(url, { icon: '🎵', title: '抖音需在 App 内观看', desc: '网页直开常失败，可「解析并内嵌播放」，或用 App 打开。', toast: '已复制链接 ✅ 打开抖音 App 粘贴访问' });
      else body = linkFallbackModal(url, { icon: '🔗', title: '打开链接', desc: '点下方按钮在新标签页打开查看，或尝试解析内嵌播放。', toast: '已复制链接 ✅' });
    }
    UI.lightbox({ title: title || (pf.name + ' 预览'), body: body });
  }
  // 链接兜底小窗：复制 + 解析内嵌播放（覆盖抖音 / 小红书 / 通用链接）
  function linkFallbackModal(url, opts) {
    opts = opts || {};
    const isShort = /xhslink\.com|xhs\.link|v\.douyin\.com/i.test(url);
    return el('div', { class: 'lb-xhs' }, [
      el('div', { class: 'lb-xhs-ico' }, opts.icon || '🔗'),
      el('div', { class: 'lb-xhs-t' }, opts.title || '打开链接'),
      el('p', { class: 'muted', style: { fontSize: '12px', margin: '8px 0 12px', textAlign: 'left', lineHeight: 1.6 } }, [
        opts.desc || '点下方按钮在新标签页打开查看。',
        ...(isShort ? [el('br'), '⚠️ 该链接是「临时跳转链」，直接打开可能 404 / 跳失败。'] : []),
        el('br'),
        '推荐：复制链接 → 打开对应 App → 粘贴访问；或在「Safari / 系统浏览器」打开。'
      ]),
      el('a', { class: 'btn coral', href: url, target: '_blank', rel: 'noopener' }, (opts.icon || '🔗') + ' 尝试打开'),
      el('button', { class: 'btn ghost parse-play', style: { marginTop: '10px', width: '100%' }, onclick: () => { tryParsePlay(url, this.parentElement); } }, '🔓 尝试解析并内嵌播放'),
      el('button', { class: 'btn ghost', style: { marginTop: '10px', width: '100%' }, onclick: () => copyWithFallback(url, opts.toast) }, '📋 复制链接'),
      el('p', { class: 'muted', style: { fontSize: '11px', margin: '10px 0 0', wordBreak: 'break-all' } }, url)
    ]);
  }
  // 调用后端解析抖音 / 小红书真实视频地址并内嵌播放
  function tryParsePlay(url, holder) {
    const btn = holder.querySelector('.parse-play');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ 解析中…'; }
    UI.toast('正在解析视频地址…');
    API.parseVideo(url).then(r => {
      if (r && r.ok && r.videoUrl) {
        const v = el('video', { class: 'lb-video', src: r.videoUrl, controls: true, autoplay: true, playsinline: '', poster: r.cover || '' });
        const box = document.querySelector('.lb-body');
        if (box) {
          box.innerHTML = '';
          box.classList.add('lb-play');
          const head = el('div', { class: 'lb-play-head' }, (r.title ? '🎬 ' + r.title : (r.platform === 'douyin' ? '抖音视频' : '视频')) + (r.watermark ? '（含水印）' : '（已去水印）'));
          box.appendChild(head);
          box.appendChild(v);
          v.addEventListener('loadeddata', () => { v.play().catch(() => {}); });
          v.addEventListener('error', () => {
            box.innerHTML = '';
            box.appendChild(el('div', { class: 'lb-xhs' }, [el('p', { class: 'muted' }, '视频地址加载失败（可能已过期或防盗链）。请用「复制链接」在 App 打开。')]));
          });
        }
        if (btn) btn.textContent = '✅ 已解析内嵌播放';
      } else {
        UI.toast('自动解析失败：' + ((r && r.message) || '暂不支持该链接'));
        if (btn) { btn.disabled = false; btn.textContent = '🔓 重试解析并内嵌播放'; }
      }
    }).catch(e => {
      UI.toast('解析出错，请稍后重试');
      if (btn) { btn.disabled = false; btn.textContent = '🔓 重试解析并内嵌播放'; }
    });
  }
  // 内嵌视频播放器（inline iframe / video），直接渲染在页面里而非弹窗
  function inlineVideoEmbed(url, title) {
    const pf = platformOf(url);
    if (pf.cls === 'bili') {
      const m = url.match(/BV[0-9A-Za-z]+/);
      const bvid = m ? m[0] : '';
      const p = (url.match(/[?&]p=(\d+)/) || [])[1] || 1;
      if (bvid) return el('iframe', { class: 'v-embed', src: 'https://player.bilibili.com/player.html?bvid=' + bvid + '&page=' + p + '&high_quality=1&danmaku=0&autoplay=0', allowfullscreen: '', frameborder: '0', scrolling: 'no', loading: 'lazy', title: title || '' });
    } else if (pf.cls === 'yt') {
      const m = url.match(/(?:[?&]v=|youtu\.be\/)([0-9A-Za-z_-]{6,})/);
      const id = m ? m[1] : '';
      if (id) return el('iframe', { class: 'v-embed', src: 'https://www.youtube.com/embed/' + id + '?rel=0', allowfullscreen: '', frameborder: '0', loading: 'lazy', title: title || '' });
    } else if (isVideoUrl(url)) {
      return el('video', { class: 'v-embed v-native', src: url, controls: true, preload: 'metadata', playsinline: '' });
    }
    // 无法内嵌（抖音/小红书/通用链接）→ 回退为可点击的 tile 卡片
    return el('div', { class: 'v-fallback' }, [mediaTile(title || '教程链接', url)]);
  }

  // 16:9 视频预览小卡：YouTube 有真缩略图，B站/小红书等用平台风格封面，点开直接看
  function mediaTile(title, url) {
    const pf = platformOf(url);
    let thumb = null;
    if (pf.cls === 'yt') {
      const m = url.match(/(?:[?&]v=|youtu\.be\/)([0-9A-Za-z_-]{6,})/);
      if (m) thumb = 'https://img.youtube.com/vi/' + m[1] + '/hqdefault.jpg';
    }
    const media = thumb
      ? el('img', { class: 'g-tile-img', src: thumb, alt: title, loading: 'lazy' })
      : el('div', { class: 'g-tile-ph ' + pf.cls }, el('span', { class: 'g-tile-ico' }, pf.icon));
    return el('div', { class: 'g-tile', onclick: () => { playPreview(url, title); } }, [
      el('div', { class: 'g-media' }, [media, el('div', { class: 'g-tile-play' }, '▶')]),
      el('div', { class: 'g-tile-cap' }, title)
    ]);
  }
  function guideBlock(p) {
    if (!p.guide && !p.guideMedia && !p.guideImages) return null;
    const kids = [];
    if (p.guide) kids.push(el('div', { class: 'g-b' }, p.guide));
    // 图文并茂：配图画廊
    if (p.guideImages) {
      const imgs = String(p.guideImages).split(/\n+/).map(s => s.trim()).filter(Boolean);
      if (imgs.length) kids.push(el('div', { class: 'g-imgs' }, imgs.map(function (src) {
        return el('img', { class: 'g-img2', src: src, alt: '教程配图', loading: 'lazy', onclick: () => { UI.lightbox({ title: '配图', body: el('img', { class: 'lb-img', src: src, alt: '' }) }); } });
      })));
    }
    if (p.guideMedia) {
      const lines = String(p.guideMedia).split(/\n+/).map(s => s.trim()).filter(Boolean);
      const tiles = [];
      lines.forEach(function (raw) {
        if (isVideoUrl(raw)) { kids.push(el('video', { class: 'g-video', src: raw, controls: true, preload: 'metadata', playsinline: '' })); return; }
        if (isImgUrl(raw)) { kids.push(el('img', { class: 'g-img', src: raw, alt: '教程配图', loading: 'lazy' })); return; }
        const i = raw.indexOf(' || ');
        const title = i >= 0 ? raw.slice(0, i).trim() : '';
        const url = i >= 0 ? raw.slice(i + 4).trim() : raw;
        tiles.push(mediaTile(title || (platformOf(url).name + ' 教程'), url));
      });
      if (tiles.length) kids.push(el('div', { class: 'g-links' }, [
        el('div', { class: 'g-cap' }, '📒 教程 / 视频（点开直接看）'),
        el('div', { class: 'g-tiles' }, tiles)
      ]));
    }
    return el('div', { class: 'guide' }, kids);
  }
  const GUIDE_FIELDS = [
    { key: 'guide', label: '练习指导 / 教程要点（可多行，建议分步骤写）', type: 'textarea' },
    { key: 'guideMedia', label: '教程 / 视频链接（每行一个；格式「标题 || 链接」，如：第5集 欢乐颂 || https://...；支持小红书、B站、YouTube、图片/视频直链）', type: 'textarea' },
    { key: 'guideImages', label: '教程配图链接（每行一个，本地如 assets/guides/xxx.svg 或图片直链）', type: 'textarea' }
  ];

  // 出勤记录结构：data.attendance[date] = {present:[], absent:[]}
  function getAtt(date) {
    const d = DB.get(); if (!d.attendance) d.attendance = {};
    if (!d.attendance[date]) d.attendance[date] = { present: [], absent: [] };
    return d.attendance[date];
  }

  // ===== 逐课计划（plan）辅助 =====
  function weekdayShort(day) { return ['日', '一', '二', '三', '四', '五', '六'][day] || '?'; }
  function planOf(st) { return (st && Array.isArray(st.plan)) ? st.plan : null; }
  function nextLessonOf(st) {
    const p = planOf(st); if (!p) return null;
    return p.find(function (x) { return !x.done; }) || null;
  }
  function planDoneCount(st) {
    const p = planOf(st); if (!p) return (st && st.done) || 0;
    return p.filter(function (x) { return x.done; }).length;
  }
  function planTotal(st) {
    const p = planOf(st); if (!p) return (st && st.total) || 0;
    return p.length;
  }
  // 待缴费续费提醒：续费标记 + 未标记已缴 + 课序 >= 下次课（即尚未到来的续费点）
  function pendingRenewals(st) {
    const p = planOf(st); if (!p) return [];
    const nx = nextLessonOf(st);
    const start = nx ? nx.seq : 1;
    return p.filter(function (x) { return x.renewal && !x.feePaid && x.seq >= start; });
  }
  // 增删/编辑课后重算进度（带 plan 的学员：total=课数, done=已上数）
  function recalcPlan(st) {
    if (!Array.isArray(st.plan)) return;
    st.total = st.plan.length;
    st.done = st.plan.filter(function (x) { return x.done; }).length;
  }

  /* ---------------- 工作安排（首页） ---------------- */
  V.work = function (c) {
    const d = DB.get();
    const tm = new Date(); tm.setDate(tm.getDate() + 1);
    const tmWD = tm.getDay();
    const tmDate = UI.addDays(0); // unused
    const tomorrowItems = d.schedule.filter(s => s.day === tmWD);
    const renew = d.students.filter(s => !s.trial && pendingRenewals(s).length > 0);
    const renewCount = d.students.reduce(function (n, s) { return n + (s.trial ? 0 : pendingRenewals(s).length); }, 0);
    const trialsTomorrow = d.trials.filter(t => t.date === UI.addDays(1));

    // KPI
    const kpi = el('div', { class: 'kpi' }, [
      kpiCard(d.schedule.filter(s => s.day === new Date().getDay()).length, '今日课次'),
      kpiCard(renewCount, '待续费'),
      kpiCard(d.trials.length, '试听学员'),
      kpiCard(pianoCurriculumDone() + '/' + pianoCurriculumTotal(), '钢琴课进度')
    ]);
    c.appendChild(kpi);

    // 辅助：按学员聚合课表 / 下次课发生时间
    function studOf(s) {
      if (s.studentId) { const x = d.students.find(z => z.id === s.studentId); if (x) return x; }
      return d.students.find(x => x.name && s.label.indexOf(x.name) >= 0) || null;
    }
    function nextOcc(s) {
      const now = new Date(); now.setHours(0, 0, 0, 0);
      let dt = new Date(weekDate(s.day) + 'T00:00:00');
      if (dt < now) dt.setDate(dt.getDate() + 7);
      const t = String(s.time || '').split(':'); const h = parseInt(t[0]) || 0, m = parseInt(t[1]) || 0;
      dt.setHours(h, m, 0, 0);
      return dt;
    }

    // 🎓 各班下次课内容（首页核心）—— 优先用逐课计划 plan
    const ncKids = [];
    d.students.filter(s => !s.trial).forEach(st => {
      const p = planOf(st);
      if (p && p.length) {
        const nx = nextLessonOf(st);
        if (nx) {
          ncKids.push(el('div', { class: 'li', onclick: () => viewClassSchedule(st) }, [
            el('div', { class: 'body', style: { cursor: 'pointer' } }, [
              el('div', { class: 't' }, st.name + ' · 下次 ' + UI.weekdayCN(weekDate(st.day)) + ' ' + st.time),
              el('div', { class: 's' }, '第' + nx.seq + '课：' + nx.content + (nx.date ? '（' + nx.date + '）' : ''))
            ])
          ]));
        } else {
          ncKids.push(el('div', { class: 'li' }, [
            el('div', { class: 'body' }, [el('div', { class: 't' }, st.name), el('div', { class: 's' }, '全部课程已完成 🎉')])
          ]));
        }
      } else {
        // 旧数据：按周课表 schedule 推算
        const lessons = d.schedule.filter(s2 => { const o = studOf(s2); return o && o.id === st.id; });
        if (!lessons.length) return;
        lessons.sort((a, b) => nextOcc(a) - nextOcc(b));
        const nx = lessons[0];
        const wd = weekDate(nx.day);
        const att = getAtt(wd);
        const done = att.present.includes(nx.label);
        ncKids.push(el('div', { class: 'li' + (nx.feeDue && !nx.feePaid ? ' fee' : '') }, [
          el('div', { class: 'body', style: { cursor: 'pointer' }, onclick: () => scheduleDetail(nx) }, [
            el('div', { class: 't' }, st.name + ' · 下次 ' + UI.weekdayCN(wd) + ' ' + nx.time),
            el('div', { class: 's' }, '学习内容：' + (nx.note || st.next || '待补充') + (done ? '  · ✅已上完' : ''))
          ])
        ]));
      }
    });
    if (!ncKids.length) ncKids.push(empty('暂未安排各班课表'));
    c.appendChild(card('🎓 各班下次课内容', '📚', ncKids));

    // 💸 缴费提醒（逐课计划里的续费标记 + 旧周课表 feeDue）
    const feeItems = [];
    d.students.filter(s => !s.trial).forEach(st => {
      const p = planOf(st);
      if (p && p.length) pendingRenewals(st).forEach(function (x) { feeItems.push({ st: st, lesson: x, kind: 'plan' }); });
    });
    d.schedule.filter(s => s.feeDue && !s.feePaid).forEach(function (s) { feeItems.push({ st: studOf(s), lesson: s, kind: 'sched' }); });
    const feeKids = feeItems.length ? feeItems.map(function (it) {
      const st = it.st;
      if (it.kind === 'plan') {
        const x = it.lesson;
        return el('div', { class: 'li', style: { background: 'var(--coral-bg)' } }, [
          el('div', { class: 'body', style: { cursor: 'pointer' }, onclick: () => viewClassSchedule(st) }, [
            el('div', { class: 't' }, '🔴 ' + st.name + ' · 第' + x.seq + '课'),
            el('div', { class: 's', style: { color: 'var(--coral)' } }, '需提醒续费：' + x.content)
          ]),
          el('button', { class: 'btn coral sm', onclick: () => { x.feePaid = true; DB.save(); rerender(); UI.toast('已标记缴费 ✅'); } }, '已缴费')
        ]);
      }
      const s = it.lesson;
      return el('div', { class: 'li', style: { background: 'var(--coral-bg)' } }, [
        el('div', { class: 'body', style: { cursor: 'pointer' }, onclick: () => scheduleDetail(s) }, [
          el('div', { class: 't' }, '🔴 ' + (st ? st.name : s.label) + ' · ' + UI.weekdayCN(weekDate(s.day)) + ' ' + s.time),
          el('div', { class: 's', style: { color: 'var(--coral)' } }, '需提醒缴费：' + (s.note || '该次课'))
        ]),
        el('button', { class: 'btn coral sm', onclick: () => { s.feePaid = true; DB.save(); rerender(); UI.toast('已标记缴费 ✅'); } }, '已缴费')
      ]);
    }) : [empty('暂无待缴费提醒 🎉')];
    c.appendChild(card('💸 缴费提醒', '💰', feeKids));

    c.appendChild(el('button', { class: 'btn', style: { width: '100%', marginBottom: '14px', background: 'linear-gradient(135deg,#6BA8A0,#B08968)' }, onclick: importTableModal }, '📥 导入学员/课表表格（Excel · CSV · 直接粘贴）'));

    // 明日提醒
    const tKids = [];
    if (tomorrowItems.length || trialsTomorrow.length) {
      tomorrowItems.forEach(s => {
        const stud = d.students.find(x => x.name && s.label.indexOf(x.name) >= 0);
        const warn = stud && pendingRenewals(stud).length ? ' ⚠️下次课后提醒续费' : '';
        tKids.push(el('div', { class: 'li' }, [
          el('div', { class: 'body' }, [
            el('div', { class: 't' }, s.time + ' · ' + s.label),
            el('div', { class: 's' }, '内容：' + (s.note || stud && stud.next || '待补充') + warn)
          ])
        ]));
      });
      trialsTomorrow.forEach(t => tKids.push(el('div', { class: 'li', style: { background: 'var(--sage-bg)' } }, [
        el('div', { class: 'body' }, [el('div', { class: 't' }, '🌟 试听 ' + t.time + ' · ' + t.name + '（' + t.age + '岁·' + t.level + '）'),
          el('div', { class: 's' }, '家长状态：' + t.status)])
      ])));
    } else tKids.push(empty('明日暂无排课'));
    c.appendChild(card('明日课程提前提醒', '🔔', tKids));

    // 续费提醒
    const rKids = [];
    if (renew.length) renew.forEach(s => {
      const pct = planTotal(s) ? Math.round(planDoneCount(s) / planTotal(s) * 100) : 0;
      const pr = pendingRenewals(s);
      const atSeq = pr.length ? pr[0].seq : 0;
      rKids.push(el('div', { class: 'li', style: { background: 'var(--coral-bg)' } }, [
        el('div', { class: 'body' }, [
          el('div', { class: 't' }, s.name + ' · 已上 ' + planDoneCount(s) + '/' + planTotal(s)),
          el('div', { class: 'bar coral', style: { marginTop: '6px' } }, el('span', { style: { width: pct + '%' } })),
          el('div', { class: 's', style: { color: 'var(--coral)', marginTop: '4px' } }, atSeq ? ('第' + atSeq + '课需续费 → 请提醒家长续费下一阶段') : '请提醒家长续费下一阶段')
        ]),
        el('button', { class: 'btn coral sm', onclick: () => { UI.toast('已标记提醒家长 ✅'); } }, '提醒')
      ]));
    }); else rKids.push(empty('暂无待续费学员 🎉'));
    c.appendChild(card('续费提醒', '💰', rKids));

    // 本周课表 + 出勤
    const wk = el('div', { class: 'card' });
    wk.appendChild(el('div', { class: 'card-h' }, [
      el('h3', null, '📅 本周课表与出勤'),
      el('div', { style: { display: 'flex', gap: '6px', alignItems: 'center' } }, [
        el('button', { class: 'btn sm', onclick: () => openScheduleFull() }, '📅 全屏'),
        el('span', { class: 'pill sage' }, '点课程看详情')
      ])
    ]));
    const grid = el('div', { class: 'days' });
    const wds = [1, 2, 3, 4, 5, 6, 0];
    const todayWD = new Date().getDay();
    const todayDate = UI.todayStr();
    wds.forEach(wd => {
      const date = weekDate(wd);
      const isToday = wd === todayWD;
      const cls = d.schedule.filter(s => s.day === wd);
      const att = getAtt(date);
      const cell = el('div', { class: 'day' + (isToday ? ' today' : '') });
      cell.appendChild(el('div', { class: 'dt' }, UI.weekdayCN(date) + ' ' + (date.slice(5))));
      cls.forEach(s => {
        const status = att.present.includes(s.label) ? 'ok' : att.absent.includes(s.label) ? 'no' : '';
        const dot = status === 'ok' ? '<span class="dot" style="background:var(--sage)"></span>'
          : status === 'no' ? '<span class="dot" style="background:var(--coral)"></span>' : '';
        const isFee = s.feeDue && !s.feePaid;
        const line = el('div', { class: 'cls' + (isFee ? ' red' : ''), html: (isFee ? '<span class="dot" style="background:var(--coral)"></span>' : dot) + esc(s.time + ' ' + s.label) });
        line.style.cursor = 'pointer';
        line.addEventListener('click', () => scheduleDetail(s));
        cell.appendChild(line);
      });
      if (!cls.length) cell.appendChild(el('div', { class: 'cls', style: { color: 'var(--muted)' } }, '—'));
      grid.appendChild(cell);
    });
    wk.appendChild(grid);
    // 口述记录
    const notesToday = (d.notesByDate && d.notesByDate[todayDate]) || [];
    const voice = el('div', { class: 'voice' }, [
      el('span', { class: 'mic', title: '口述记录' }, '🎤'),
      el('span', { style: { flex: '1' } }, notesToday.length ? '今日口述：' + notesToday.join(' / ') : '点击🎤口述记录学员情况，自动归档到 ' + todayDate)
    ]);
    voice.querySelector('.mic').addEventListener('click', () => {
      UI.voiceInput(txt => {
        const dd = DB.get(); if (!dd.notesByDate) dd.notesByDate = {};
        if (!dd.notesByDate[todayDate]) dd.notesByDate[todayDate] = [];
        dd.notesByDate[todayDate].push(txt); DB.save(); rerender(); UI.toast('已归档到 ' + todayDate);
      });
    });
    wk.appendChild(voice);
    c.appendChild(wk);

    // 已导入表格记录（可批量删除）
    if (d.imports && d.imports.length) {
      const ik = d.imports.map(im => {
        const head = (im.headers || []).slice(0, 6);
        const rows = (im.rows || []).slice(0, 4);
        const tbl = el('table', { class: 'tbl import' }, [
          el('tr', null, head.map(h => el('th', null, h || '')))
        ].concat(rows.map(r => el('tr', null, head.map((_, i) => el('td', null, (r[i] != null ? String(r[i]) : '').slice(0, 20)))))));
        return el('div', { class: 'li' }, [
          Batch.item(im.id, () => { d.imports = d.imports.filter(x => x.id !== im.id); }),
          el('div', { class: 'body' }, [
            el('div', { class: 't' }, '📥 导入于 ' + (im.ts ? im.ts.slice(0, 16).replace('T', ' ') : '') + ' · ' + (im.count || 0) + ' 行'),
            el('div', { class: 's' }, '表头：' + (im.headers || []).join(' / ')),
            el('div', { class: 'tbl-wrap' }, [tbl])
          ])
        ]);
      });
      c.appendChild(card('已导入表格记录', '🗂', ik));
    }

    // 课表管理（增 / 改 / 删）
    const schedKids = d.schedule.map(s => el('div', { class: 'li' }, [
      Batch.item(s.id, () => { d.schedule = d.schedule.filter(x => x.id !== s.id); }),
      el('div', { class: 'body' }, [el('div', { class: 't' }, UI.weekdayCN(weekDate(s.day)) + ' ' + s.time + ' · ' + s.label),
        el('div', { class: 's' }, s.note || '（无备注）')]),
      el('button', { class: 'btn sm edit-only', onclick: () => editSched(s) }, '改'),
      el('button', { class: 'btn sm edit-only', onclick: () => { if (confirm('删除课表项？')) { d.schedule = d.schedule.filter(x => x.id !== s.id); DB.save(); rerender(); } } }, '删')
    ]));
    if (!schedKids.length) schedKids.push(empty('暂无课表项'));
    const schedCard = card('课表管理', '🗓', schedKids);
    schedCard.appendChild(el('button', { class: 'add-btn edit-only', onclick: addSched }, '+ 添加课表项'));
    c.appendChild(schedCard);

    // 各班完整课表（按学员聚合，优先展示逐课计划 plan）
    const grpKids = [];
    d.students.filter(s => !s.trial).forEach(st => {
      const pct = planTotal(st) ? Math.round(planDoneCount(st) / planTotal(st) * 100) : 0;
      const nx = nextLessonOf(st);
      const summary = el('div', { class: 'li sub', style: { cursor: 'pointer' }, onclick: () => viewClassSchedule(st) }, [
        el('div', { class: 'body' }, [
          el('div', { class: 't' }, st.name + ' · ' + st.stage + '（已上 ' + planDoneCount(st) + '/' + planTotal(st) + '）'),
          el('div', { class: 'bar', style: { marginTop: '6px' } }, el('span', { style: { width: pct + '%' } })),
          el('div', { class: 's', style: { marginTop: '4px' } }, nx ? ('下次：第' + nx.seq + '课 ' + nx.content) : '已全部完成 🎉')
        ])
      ]);
      grpKids.push(el('div', { class: 'grp' }, [
        el('div', { class: 'grp-h', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }, [
          el('span', null, '周' + weekdayShort(st.day) + ' ' + st.time),
          el('button', { class: 'btn sm', style: { marginLeft: 'auto' }, onclick: () => viewClassSchedule(st) }, '📅 完整课表')
        ]),
        el('div', { class: 'grp-body' }, [summary])
      ]));
    });
    if (!grpKids.length) grpKids.push(empty('暂未安排各班课表'));
    c.appendChild(card('📚 各班完整课表', '🗓', grpKids));

    function addSched() {
      UI.formModal({ title: '添加课表项', fields: [
        { key: 'day', label: '星期(1-6=周一至六, 0=周日)', type: 'number', default: new Date().getDay() },
        { key: 'time', label: '时间', default: '15:00' },
        { key: 'label', label: '课程标签(如 小米·第2阶段)' },
        { key: 'note', label: '备注 / 内容' },
        { key: 'feeDue', label: '🔴 标红：需缴费提醒', type: 'checkbox', default: false }
      ], onSubmit: v => {
        const st = d.students.find(x => x.name && String(v.label).indexOf(x.name) >= 0);
        d.schedule.push({ id: DB.uid(), studentId: st ? st.id : null, day: +v.day, time: v.time, label: v.label, note: v.note, feeDue: !!v.feeDue, feePaid: false });
        DB.save(); rerender(); UI.toast('已添加课表');
      } });
    }
    function editSched(s) {
      UI.formModal({ title: '编辑课表项', fields: [
        { key: 'day', label: '星期(1-6=周一至六, 0=周日)', type: 'number', default: s.day },
        { key: 'time', label: '时间', default: s.time },
        { key: 'label', label: '课程标签', default: s.label },
        { key: 'note', label: '备注 / 内容', default: s.note || '' },
        { key: 'feeDue', label: '🔴 标红：需缴费提醒', type: 'checkbox', default: s.feeDue }
      ], onSubmit: v => { Object.assign(s, { day: +v.day, time: v.time, label: v.label, note: v.note, feeDue: !!v.feeDue }); if (!s.feeDue) s.feePaid = false; DB.save(); rerender(); UI.toast('已保存'); } });
    }

    // 学情反馈（每4次）
    const fKids = [];
    d.students.filter(s => !s.trial).forEach(s => {
      if (s.done >= 4 && s.done % 4 === 0) {
        const exists = d.feedback.find(f => f.studentId === s.id && f.range === (s.done - 3) + '-' + s.done);
        if (!exists) {
          fKids.push(el('div', { class: 'li', style: { background: 'var(--sage-bg)' } }, [
            el('div', { class: 'body' }, [el('div', { class: 't' }, s.name + ' · 第' + (s.done - 3) + '-' + s.done + '次课总结已生成'),
              el('div', { class: 's' }, '拼读掌握度约' + Math.min(90, 50 + s.done * 3) + '% · 建议家庭多练巩固')]),
            el('button', { class: 'btn sm', onclick: () => {
              const dd = DB.get(); dd.feedback.push({ id: DB.uid(), studentId: s.id, range: (s.done - 3) + '-' + s.done, text: s.name + '阶段总结', sent: false });
              DB.save(); rerender(); UI.toast('已生成，记得发给家长');
            } }, '生成')
          ]));
        }
      }
    });
    d.feedback.slice().reverse().forEach(f => {
      const st = d.students.find(s => s.id === f.studentId);
      fKids.push(el('div', { class: 'li' }, [
        Batch.item(f.id, () => { d.feedback = d.feedback.filter(x => x.id !== f.id); }),
        el('div', { class: 'body' }, [el('div', { class: 't' }, (st ? st.name : '') + ' · 第' + f.range + '次学情反馈' + (f.sent ? ' ✅已发' : '')),
          el('div', { class: 's' }, f.text)]),
        el('div', { class: 'act', style: { gap: '6px' } }, [
          f.sent ? null : el('button', { class: 'btn sm', onclick: () => { f.sent = true; DB.save(); rerender(); UI.toast('已发送给家长 ✅'); } }, '发送'),
          el('button', { class: 'btn sm edit-only', onclick: () => UI.formModal({ title: '编辑学情反馈', fields: [{ key: 'text', label: '反馈内容', type: 'textarea', default: f.text }], onSubmit: v => { f.text = v.text; DB.save(); rerender(); UI.toast('已保存'); } }) }, '改')
        ])
      ]));
    });
    if (!fKids.length) fKids.push(empty('暂无学情反馈待处理'));
    const fbCard = card('学情反馈（每4次课）', '📝', fKids);
    fbCard.appendChild(el('button', { class: 'add-btn', onclick: () => genCommentModal() }, '🎤 口述生成评语'));
    c.appendChild(fbCard);

    // 试听安排
    const trKids = d.trials.map(t => el('div', { class: 'li' }, [
      Batch.item(t.id, () => { d.trials = d.trials.filter(x => x.id !== t.id); }),
      el('div', { class: 'body' }, [el('div', { class: 't' }, t.name + ' · ' + t.age + '岁 · ' + t.level),
        el('div', { class: 's' }, UI.prettyDate(t.date) + ' ' + t.time + ' · ' + t.status)]),
      el('button', { class: 'btn sm edit-only', onclick: () => editTrial(t) }, '改'),
      el('button', { class: 'btn sm edit-only', onclick: () => { if (confirm('删除试听？')) { d.trials = d.trials.filter(x => x.id !== t.id); DB.save(); rerender(); } } }, '删')
    ]));
    if (!trKids.length) trKids.push(empty('暂无试听安排'));
    const trCard = card('试听安排', '🌟', trKids);
    trCard.appendChild(el('button', { class: 'add-btn', onclick: addTrial }, '+ 添加试听'));
    c.appendChild(trCard);

    // 节假日调课
    const hKids = d.holidays.map(h => el('div', { class: 'li' }, [
      Batch.item(h.id, () => { d.holidays = d.holidays.filter(x => x.id !== h.id); }),
      el('div', { class: 'body' }, [el('div', { class: 't' }, h.name), el('div', { class: 's' }, h.desc)]),
      UI.switchEl(h.done, on => { h.done = on; DB.save(); rerender(); }),
      el('button', { class: 'btn sm edit-only', onclick: () => editHoliday(h) }, '改'),
      el('button', { class: 'btn sm edit-only', onclick: () => { if (confirm('删除？')) { d.holidays = d.holidays.filter(x => x.id !== h.id); DB.save(); rerender(); } } }, '删')
    ]));
    if (!hKids.length) hKids.push(empty('暂无节假日调课'));
    const hCard = card('节假日调课提醒', '🏮', hKids);
    hCard.appendChild(el('button', { class: 'add-btn', onclick: addHoliday }, '+ 添加调课'));
    c.appendChild(hCard);

    // 课程管理（学员）
    const sKids = d.students.map(s => el('div', { class: 'li' }, [
      Batch.item(s.id, () => { d.students = d.students.filter(x => x.id !== s.id); }),
      el('div', { class: 'body' }, [
        el('div', { class: 't' }, (s.trial ? '🌟 ' : '') + s.name + ' · ' + s.stage),
        el('div', { class: 'bar', style: { marginTop: '5px' } }, el('span', { style: { width: Math.round(s.done / s.total * 100) + '%' } })),
        el('div', { class: 's', style: { marginTop: '3px' } }, '已上 ' + s.done + '/' + s.total + (s.trial ? '（试听）' : '') + (s.next ? ' · 下次：' + s.next : ''))
      ]),
      el('button', { class: 'btn sm edit-only', onclick: () => editStudent(s) }, '改'),
      el('button', { class: 'btn sm edit-only', onclick: () => { if (confirm('删除学员？')) { d.students = d.students.filter(x => x.id !== s.id); DB.save(); rerender(); } } }, '删')
    ]));
    const sCard = card('课程管理（学员）', '📚', sKids);
    sCard.appendChild(el('button', { class: 'add-btn', onclick: addStudent }, '+ 添加学员'));
    c.appendChild(sCard);

    function addStudent() {
      UI.formModal({ title: '添加学员', fields: [
        { key: 'name', label: '姓名' }, { key: 'stage', label: '阶段', default: '第1阶段' },
        { key: 'total', label: '总课次', type: 'number', default: 12 },
        { key: 'done', label: '已上次数', type: 'number', default: 0 },
        { key: 'renewAt', label: '续费提醒课次', type: 'number', default: 10 },
        { key: 'next', label: '下次课程内容' }, { key: 'parent', label: '家长' }, { key: 'phone', label: '电话' }
      ], onSubmit: v => {
        d.students.push({ id: DB.uid(), name: v.name, stage: v.stage, total: +v.total || 12, done: +v.done || 0, renewAt: +v.renewAt || 10, next: v.next, parent: v.parent, phone: v.phone, attendance: {}, notes: {}, trial: false });
        DB.save(); rerender(); UI.toast('已添加 ' + v.name);
      } });
    }
    function editStudent(s) {
      UI.formModal({ title: '编辑学员 ' + s.name, fields: [
        { key: 'name', label: '姓名', default: s.name }, { key: 'stage', label: '阶段', default: s.stage },
        { key: 'total', label: '总课次', type: 'number', default: s.total }, { key: 'done', label: '已上次数', type: 'number', default: s.done },
        { key: 'renewAt', label: '续费提醒课次', type: 'number', default: s.renewAt },
        { key: 'next', label: '下次课程内容', default: s.next || '' }, { key: 'parent', label: '家长', default: s.parent || '' }, { key: 'phone', label: '电话', default: s.phone || '' }
      ], onSubmit: v => { Object.assign(s, { name: v.name, stage: v.stage, total: +v.total, done: +v.done, renewAt: +v.renewAt, next: v.next, parent: v.parent, phone: v.phone }); DB.save(); rerender(); UI.toast('已保存'); } });
    }
    function addTrial() {
      UI.formModal({ title: '添加试听', fields: [
        { key: 'name', label: '学员名' }, { key: 'age', label: '年龄', type: 'number' }, { key: 'level', label: '基础水平', default: '零基础' },
        { key: 'date', label: '日期(YYYY-MM-DD)', default: UI.addDays(1) }, { key: 'time', label: '时间', default: '18:00' }, { key: 'status', label: '状态', default: '待联系' }
      ], onSubmit: v => { d.trials.push({ id: DB.uid(), name: v.name, age: v.age, level: v.level, date: v.date, time: v.time, status: v.status }); DB.save(); rerender(); UI.toast('已添加试听'); } });
    }
    function addHoliday() {
      UI.formModal({ title: '添加调课', fields: [
        { key: 'name', label: '名称' }, { key: 'desc', label: '说明', type: 'textarea' }
      ], onSubmit: v => { d.holidays.push({ id: DB.uid(), name: v.name, desc: v.desc, done: false }); DB.save(); rerender(); UI.toast('已添加'); } });
    }
    function editHoliday(h) {
      UI.formModal({ title: '编辑调课', fields: [
        { key: 'name', label: '名称', default: h.name }, { key: 'desc', label: '说明', type: 'textarea', default: h.desc || '' }
      ], onSubmit: v => { Object.assign(h, { name: v.name, desc: v.desc }); DB.save(); rerender(); UI.toast('已保存'); } });
    }
    function editTrial(t) {
      UI.formModal({ title: '编辑试听', fields: [
        { key: 'name', label: '学员名', default: t.name }, { key: 'age', label: '年龄', type: 'number', default: t.age },
        { key: 'level', label: '基础水平', default: t.level }, { key: 'date', label: '日期(YYYY-MM-DD)', default: t.date },
        { key: 'time', label: '时间', default: t.time }, { key: 'status', label: '状态', default: t.status }
      ], onSubmit: v => { Object.assign(t, { name: v.name, age: v.age, level: v.level, date: v.date, time: v.time, status: v.status }); DB.save(); rerender(); UI.toast('已保存'); } });
    }
  };

  // ===== 工作安排：导入表格（Excel 复制 / CSV / TSV）=====
  // ===== 逐课计划 Excel 解析（每个 sheet = 一个班，含阶段/学员/时间 + 逐课 row）=====
  function parsePlanWorkbook(wb) {
    const DAYMAP = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 };
    const classes = [];
    for (const name of wb.SheetNames) {
      const ws = wb.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' })
        .map(function (r) { return r.map(function (x) { return x == null ? '' : String(x); }); })
        .filter(function (r) { return r.some(function (x) { return x.trim() !== ''; }); });
      if (!rows.length) continue;
      let stage = '', student = '', day = 2, time = '';
      for (const r of rows.slice(0, 6)) {
        const joined = r.join(' ');
        const mS = joined.match(/阶段[:：]\s*([^\s,，]+)/);
        const mStu = joined.match(/学员[:：]\s*([^\s,，]+)/);
        const mT = joined.match(/时间[:：]\s*每周?([一二三四五六日天])\s*([\d:.：\-]+)/);
        if (mS) stage = mS[1].trim();
        if (mStu) student = mStu[1].replace(/[，,].*$/, '').trim();
        if (mT) { day = (DAYMAP[mT[1]] != null) ? DAYMAP[mT[1]] : 2; time = mT[2].replace(/[：]/g, ':').trim(); }
      }
      if (!student) continue;
      const plan = [];
      for (const r of rows) {
        const seq = parseInt(r[0]);
        if (!isFinite(seq)) continue;            // 仅课序为数字的行算作一节课
        const content = String(r[1] || '').trim();
        const date = String(r[2] || '').trim();
        const renewal = r.some(function (c) { return String(c).indexOf('续费') >= 0; });
        plan.push({ seq: seq, content: content, date: date, done: false, renewal: renewal, feePaid: false });
      }
      if (!plan.length) continue;
      plan.sort(function (a, b) { return a.seq - b.seq; });
      classes.push({ name: student, stage: stage || '第1阶段', day: day, time: time || '待补', plan: plan });
    }
    return classes;
  }
  // 追加（不覆盖）：同名学员合并课节（按课序去重），不删除其他班级
  function mergePlanClasses(classes) {
    const d = DB.get();
    let addedStu = 0, addedLes = 0, merged = 0;
    classes.forEach(function (c) {
      const st = d.students.find(function (s) { return String(s.name).toLowerCase() === c.name.toLowerCase(); });
      if (!st) {
        const sid = DB.uid();
        const plan = c.plan.map(function (p) { return Object.assign({}, p); });
        d.students.push({
          id: sid, name: c.name, stage: c.stage, total: plan.length, done: 0,
          day: c.day, time: c.time, phone: '', plan: plan,
          renewAt: 0, next: '', parent: '', attendance: {}, notes: {}, trial: false
        });
        d.schedule.push({
          id: DB.uid(), studentId: sid, day: c.day, time: c.time,
          label: c.name + ' · ' + c.stage, note: '阶段:' + c.stage, feeDue: false, feePaid: false
        });
        addedStu++;
      } else {
        if (!Array.isArray(st.plan)) st.plan = [];
        const have = {}; st.plan.forEach(function (p) { have[p.seq] = true; });
        c.plan.forEach(function (p) { if (!have[p.seq]) { st.plan.push(Object.assign({}, p)); addedLes++; } });
        st.plan.sort(function (a, b) { return a.seq - b.seq; });
        if (!st.stage || st.stage === '第1阶段') st.stage = c.stage;
        if (!st.time || st.time === '待补' || st.time === '待测补') st.time = c.time;
        if (typeof st.day !== 'number') st.day = c.day;
        recalcPlan(st);
        merged++;
      }
    });
    DB.save();
    return { addedStu: addedStu, addedLes: addedLes, merged: merged };
  }

  function importTableModal() {
    const d = DB.get();
    const ta = el('textarea', { style: { width: '100%', height: '150px', fontSize: '13px', fontFamily: 'monospace', border: '1.5px solid var(--line)', borderRadius: '12px', padding: '10px', resize: 'vertical' }, placeholder: '粘贴从 Excel 复制的内容，或 CSV 文本。第一行为表头。\n可识别列：姓名 / 阶段 / 总课次 / 已上 / 手机号 / 星期 / 时间 / 课程 / 备注' });
    const file = el('input', { type: 'file', accept: '.csv,.tsv,.txt,.xlsx,.xls' });
    const drop = el('div', { class: 'file-drop' }, ['📥 点击选择 Excel（.xlsx / .xls）或 CSV / TSV 文件，也可从 Excel 复制后粘贴到上方', el('small', null, '支持 .xlsx 直接上传，第一行为表头即可自动识别')]);
    drop.addEventListener('click', () => file.click());
    file.addEventListener('change', () => { if (file.files && file.files[0]) drop.firstChild.textContent = '已选文件：' + file.files[0].name; });
    const preview = el('div', { class: 'import-preview' });
    function runParse(text) {
      const rows = Array.isArray(text) ? text : parseCSV(text);
      preview.innerHTML = '';
      if (!rows.length) { preview.appendChild(el('div', { class: 'muted' }, '没有解析到内容，请检查粘贴或文件。')); return; }
      const header = rows[0].map(h => String(h).trim());
      const dataRows = rows.slice(1);
      const find = (keys) => { for (let i = 0; i < header.length; i++) for (const k of keys) if (header[i].indexOf(k) >= 0) return i; return -1; };
      const map = {
        name: find(['姓名', '名字', '学生', 'name']), stage: find(['阶段', '级别', '水平', 'stage']),
        total: find(['总课次', '总课时', '课时', '课次']), done: find(['已上', '上过']),
        phone: find(['手机', '电话', '联系']), day: find(['星期', '周几', '周']),
        time: find(['时间']), label: find(['课程', '科目', '内容', 'label']), note: find(['备注', '说明'])
      };
      const dwMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 };
      const parsed = dataRows.map(r => {
        const g = (k) => map[k] >= 0 ? String(r[map[k]] || '').trim() : '';
        let day = -1; const m = g('day').replace('周', '').replace('星期', '').trim();
        if (dwMap[m] !== undefined) day = dwMap[m];
        const total = parseInt(g('total')), done = parseInt(g('done'));
        return { name: g('name'), stage: g('stage') || '第1阶段', total: isNaN(total) ? 12 : total, done: isNaN(done) ? 0 : done, phone: g('phone'), day, time: g('time'), label: g('label') || g('name'), note: g('note') };
      }).filter(x => x.name);
      const uniqNames = [...new Set(parsed.map(x => x.name))];
      if (!parsed.length) { preview.appendChild(el('div', { class: 'muted' }, '未识别到「姓名」列，请确认表头包含 姓名。')); return; }
      const wkArr = ['日', '一', '二', '三', '四', '五', '六'];
      const tbl = el('table', { class: 'tbl import' }, [
        el('tr', null, ['姓名', '阶段', '总课次', '已上', '星期', '时间', '课程', '备注'].map(h => el('th', null, h)))
      ].concat(parsed.map(x => el('tr', null, [
        el('td', null, x.name), el('td', null, x.stage), el('td', null, String(x.total)), el('td', null, String(x.done)),
        el('td', null, x.day >= 0 ? wkArr[x.day] : '—'), el('td', null, x.time || '—'), el('td', null, x.label), el('td', null, x.note || '')
      ]))));
      preview.appendChild(el('div', { class: 'muted', style: { margin: '8px 0 6px' } }, '共识别 ' + uniqNames.length + ' 个班（' + parsed.length + ' 节次课表）。同一学员多行 = 该班完整周课表，确认后导入到「课程管理（学员）」与「课表管理」（可单独删改）。'));
      preview.appendChild(el('div', { class: 'tbl-wrap' }, [tbl]));
      const btn = el('button', { class: 'btn coral', style: { marginTop: '10px' }, onclick: () => {
        d.imports = d.imports || [];
        d.imports.push({ id: DB.uid(), ts: new Date().toISOString(), headers: header, rows: dataRows, count: parsed.length });
        let addedStu = 0, addedSch = 0;
        parsed.forEach(x => {
          let st = d.students.find(s => s.name === x.name);
          if (!st) { st = { id: DB.uid(), name: x.name, stage: x.stage, total: x.total, done: x.done, renewAt: Math.max(2, x.total - 2), next: '', parent: '', phone: x.phone, attendance: {}, notes: {}, trial: false }; d.students.push(st); addedStu++; }
          if (x.day >= 0 && x.time) {
            const label = x.name + (x.label && x.label !== x.name ? ' · ' + x.label : '');
            const dup = d.schedule.find(s => s.studentId === st.id && s.day === x.day && s.time === x.time && s.label === label);
            if (!dup) { d.schedule.push({ id: DB.uid(), studentId: st.id, day: x.day, time: x.time, label: label, note: x.note || '', feeDue: false, feePaid: false }); addedSch++; }
          }
        });
        DB.save(); UI.close(); rerender(); UI.toast('已导入 ' + uniqNames.length + ' 个班 · ' + addedSch + ' 节次课表 ✅');
      } }, '✅ 确认导入 ' + uniqNames.length + ' 个班');
      preview.appendChild(btn);
    }
    function loadXLSX(cb) {
      if (window.XLSX) { cb(); return; }
      UI.toast('正在加载 Excel 解析组件…');
      const sc = document.createElement('script');
      sc.src = 'js/vendor/xlsx.min.js';
      sc.onload = cb;
      sc.onerror = () => UI.toast('Excel 解析组件加载失败，请改用 CSV 或复制粘贴');
      document.head.appendChild(sc);
    }
    const parseBtn = el('button', { class: 'btn', style: { marginTop: '10px' }, onclick: () => {
      const f = file.files && file.files[0];
      if (f && /\.(xlsx|xls)$/i.test(f.name)) {
        loadXLSX(() => {
          const fr = new FileReader();
          fr.onload = () => {
            try {
              const wb = XLSX.read(fr.result, { type: 'array' });
              const ws = wb.Sheets[wb.SheetNames[0]];
              const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' })
                .map(r => r.map(x => String(x == null ? '' : x)))
                .filter(r => r.some(x => x.trim() !== ''));
              runParse(rows);
            } catch (e) { UI.toast('Excel 解析失败：' + e.message); }
          };
          fr.readAsArrayBuffer(f);
        });
      } else if (f) {
        const fr = new FileReader();
        fr.onload = () => { ta.value = String(fr.result); runParse(ta.value); };
        fr.readAsText(f, 'utf-8');
      } else runParse(ta.value);
    } }, '🔍 解析预览');
    // 模式②：逐课计划（多班 Excel，每个 sheet = 一个班）
    const planBtn = el('button', { class: 'btn', style: { marginTop: '8px' }, onclick: () => {
      const f = file.files && file.files[0];
      if (!f || !/\.(xlsx|xls)$/i.test(f.name)) { UI.toast('请先选择 .xlsx 文件（逐课计划为每个 sheet 一个班）'); return; }
      loadXLSX(() => {
        const fr = new FileReader();
        fr.onload = () => {
          try {
            const wb = XLSX.read(fr.result, { type: 'array' });
            const classes = parsePlanWorkbook(wb);
            if (!classes.length) { UI.toast('未解析到班级，请确认每个 sheet 表头含「阶段/学员/时间」'); return; }
            preview.innerHTML = '';
            const wkArr = ['日', '一', '二', '三', '四', '五', '六'];
            const tbl = el('table', { class: 'tbl import' }, [
              el('tr', null, ['班级', '阶段', '星期', '时间', '课数'].map(h => el('th', null, h)))
            ].concat(classes.map(c => el('tr', null, [
              el('td', null, c.name), el('td', null, c.stage),
              el('td', null, wkArr[c.day]), el('td', null, c.time),
              el('td', null, String(c.plan.length))
            ]))));
            preview.appendChild(el('div', { class: 'muted', style: { margin: '8px 0 6px' } }, '共识别 ' + classes.length + ' 个班的逐课计划。将「追加」到现有数据（同名班级自动合并课节、不覆盖、不删除其他班级）。'));
            preview.appendChild(el('div', { class: 'tbl-wrap' }, [tbl]));
            preview.appendChild(el('button', { class: 'btn coral', style: { marginTop: '10px' }, onclick: () => {
              const r = mergePlanClasses(classes);
              UI.close(); rerender();
              UI.toast('已追加 ' + r.addedStu + ' 个新班 + ' + r.addedLes + ' 节新课 ✅（' + r.merged + ' 个班已合并）');
            } }, '✅ 追加导入（不覆盖）'));
          } catch (e) { UI.toast('解析失败：' + e.message); }
        };
        fr.readAsArrayBuffer(f);
      });
    } }, '📚 解析逐课计划（多班·每 sheet 一个班）');
    const body = el('div', null, [
      el('p', { class: 'muted', style: { fontSize: '12px', margin: '0 0 8px' } }, '支持：① 直接上传 Excel（.xlsx / .xls）；② 上传 CSV / TSV；③ 从 Excel 复制后粘贴。表头含相应列名即可自动映射生成学员与课表。'),
      el('p', { style: { fontSize: '12px', margin: '0 0 10px' } }, [
        el('a', { href: 'sample-import.xlsx', download: 'sample-import.xlsx', style: { fontWeight: '600', marginRight: '12px' } }, '⬇️ 下载样表 .xlsx'),
        el('a', { href: 'sample-import.csv', download: 'sample-import.csv', style: { fontWeight: '600', marginRight: '12px' } }, '⬇️ 下载样表 .csv'),
        el('a', { href: 'plan-import-template.xlsx', download: 'plan-import-template.xlsx', style: { fontWeight: '600' } }, '⬇️ 逐课计划多班模板')
      ]),
      drop, ta, parseBtn, planBtn, preview
    ]);
    UI.open(el('div', { class: 'modal', style: { maxWidth: '640px' } }, [el('h3', null, '📥 导入学员 / 课表表格'), body]));
  }

  // ===== 课节详情（点击放大看详情 + 出勤切换）=====
  function scheduleDetail(s) {
    const date = weekDate(s.day);
    const att = getAtt(date);
    const isP = att.present.includes(s.label), isA = att.absent.includes(s.label);
    const isFee = s.feeDue && !s.feePaid;
    const body = el('div', { class: 'sched-detail' }, [
      row2('星期', UI.weekdayCN(date) + '（' + date + '）'),
      row2('时间', s.time),
      row2('课程 / 学员', s.label),
      row2('备注 / 内容', s.note || '—'),
      el('div', { class: 'att-row' }, [
        el('span', null, '出勤：'),
        el('span', { class: 'pill ' + (isP ? 'sage' : isA ? 'coral' : 'muted') }, isP ? '✅ 已出勤' : isA ? '⛔ 缺勤' : '未记录')
      ]),
      el('div', { class: 'att-row' }, [
        el('span', null, '缴费：'),
        el('span', { class: 'pill ' + (isFee ? 'red' : 'sage') }, isFee ? '🔴 需提醒缴费' : '✅ 无需提醒')
      ]),
      el('div', { class: 'actions', style: { marginTop: '16px', flexWrap: 'wrap', gap: '8px' } }, [
        el('button', { class: 'btn sm', onclick: () => { ensurePresent(date, s.label); UI.closeLightbox(); rerender(); UI.toast('已标记本节课上完 ✅'); } }, isP ? '✅ 本节课已上完' : '✅ 标记已上完'),
        el('button', { class: 'btn sm coral', onclick: () => { markAtt(date, s.label, 'absent'); UI.closeLightbox(); rerender(); } }, isA ? '取消缺勤' : '⛔ 标记缺勤'),
        el('button', { class: 'btn sm' + (isFee ? ' coral' : ''), onclick: () => { s.feeDue = !s.feeDue; if (!s.feeDue) s.feePaid = false; DB.save(); UI.closeLightbox(); rerender(); UI.toast(s.feeDue ? '已标红，将提醒缴费 🔴' : '已取消标红'); } }, s.feeDue ? '🔴 取消标红(需缴费)' : '🔴 标红：需缴费')
      ])
    ]);
    UI.lightbox({ title: '📚 课节详情', body });
  }
  function markAtt(date, label, type) {
    const att = getAtt(date);
    if (type === 'present') { att.present = att.present.includes(label) ? att.present.filter(x => x !== label) : att.present.concat(label); att.absent = att.absent.filter(x => x !== label); }
    else { att.absent = att.absent.includes(label) ? att.absent.filter(x => x !== label) : att.absent.concat(label); att.present = att.present.filter(x => x !== label); }
    DB.save();
  }
  function ensurePresent(date, label) {
    const a = getAtt(date);
    if (!a.present.includes(label)) { a.present = a.present.concat(label); a.absent = a.absent.filter(x => x !== label); DB.save(); }
  }

  // ===== 全屏课表 =====
  function openScheduleFull() {
    const d = DB.get();
    const wds = [1, 2, 3, 4, 5, 6, 0];
    const body = el('div', { class: 'sched-full' }, wds.map(wd => {
      const date = weekDate(wd);
      const cls = d.schedule.filter(s => s.day === wd);
      const att = getAtt(date);
      return el('div', { class: 'sf-day' }, [
        el('div', { class: 'sf-dt' }, UI.weekdayCN(date) + ' · ' + date.slice(5)),
        cls.length ? el('div', { class: 'sf-items' }, cls.map(s => {
          const st = att.present.includes(s.label) ? 'ok' : att.absent.includes(s.label) ? 'no' : '';
          const isFee = s.feeDue && !s.feePaid;
          return el('div', { class: 'sf-item' + (st === 'ok' ? ' ok' : st === 'no' ? ' no' : '') + (isFee ? ' red' : ''), onclick: () => scheduleDetail(s) }, [
            el('span', { class: 'sf-time' }, s.time), el('span', { class: 'sf-label' }, s.label),
            el('span', { class: 'sf-dot' }, isFee ? '🔴' : st === 'ok' ? '✅' : st === 'no' ? '⛔' : '')
          ]);
        })) : el('div', { class: 'sf-empty' }, '— 无课 —')
      ]);
    }));
    UI.lightbox({ title: '📅 本周课表（点课节看详情）', body, wide: true });
  }

  // ===== 单班完整课表（逐课计划优先；无 plan 时回退到周课表）=====
  function viewClassSchedule(st) {
    const p = planOf(st);
    let body;
    if (p && p.length) {
      const next = nextLessonOf(st);
      const items = p.map(function (x) {
        const cls = x.done ? ' ok' : (x.renewal ? ' red' : '');
        const tag = x.done ? '✅' : (x.renewal ? (x.feePaid ? '💰' : '🔴') : (x === next ? '➡️' : '⏳'));
        return el('div', { class: 'sf-item' + cls, onclick: () => lessonDetail(st, x) }, [
          el('span', { class: 'sf-seq' }, '第' + x.seq + '课'),
          el('span', { class: 'sf-label' }, x.content + (x.date ? '（' + x.date + '）' : '')),
          el('span', { class: 'sf-dot' }, tag)
        ]);
      });
      body = el('div', { class: 'sched-full' }, [
        el('div', { class: 'cls-summary' }, [
          el('span', { class: 'pill sage' }, st.stage || '—'),
          el('span', null, '周' + weekdayShort(st.day) + ' ' + st.time),
          el('span', null, '已上 ' + planDoneCount(st) + ' / ' + planTotal(st) + ' 课'),
          st.phone ? el('span', null, '📞 ' + st.phone) : null
        ].filter(Boolean)),
        el('div', { class: 'sf-items' }, items)
      ]);
    } else {
      const d = DB.get();
      const wds = [1, 2, 3, 4, 5, 6, 0];
      const lessons = d.schedule.filter(s => { const o = studOf(s); return o && o.id === st.id; });
      body = el('div', { class: 'sched-full' }, [
        el('div', { class: 'cls-summary' }, [
          el('span', { class: 'pill sage' }, st.stage || '—'),
          el('span', null, '已上 ' + (st.done || 0) + ' / ' + (st.total || 0) + ' 课时'),
          st.phone ? el('span', null, '📞 ' + st.phone) : null
        ].filter(Boolean)),
        ...wds.map(wd => {
          const date = weekDate(wd);
          const cls = lessons.filter(s => s.day === wd);
          const att = getAtt(date);
          return el('div', { class: 'sf-day' }, [
            el('div', { class: 'sf-dt' }, UI.weekdayCN(date) + ' · ' + date.slice(5)),
            cls.length ? el('div', { class: 'sf-items' }, cls.map(s => {
              const isP = att.present.includes(s.label), isA = att.absent.includes(s.label);
              const isFee = s.feeDue && !s.feePaid;
              return el('div', { class: 'sf-item' + (isP ? ' ok' : isA ? ' no' : '') + (isFee ? ' red' : ''), onclick: () => scheduleDetail(s) }, [
                el('span', { class: 'sf-time' }, s.time),
                el('span', { class: 'sf-label' }, s.label + (s.note ? ' · ' + s.note : '')),
                el('span', { class: 'sf-dot' }, isFee ? '🔴' : isP ? '✅' : isA ? '⛔' : '')
              ]);
            })) : el('div', { class: 'sf-empty' }, '— 无课 —')
          ]);
        })
      ]);
    }
    UI.lightbox({ title: '📚 ' + st.name + ' · 完整课表（' + planTotal(st) + ' 课）', body, wide: true });
  }

  // ===== 单节课详情（逐课计划项）=====
  function lessonDetail(st, p) {
    const body = el('div', { class: 'sched-detail' }, [
      row2('课序', '第 ' + p.seq + ' 课'),
      row2('阶段', st.stage),
      row2('学习内容', p.content || '—'),
      row2('上课日期', p.date || '未记录'),
      el('div', { class: 'att-row' }, [
        el('span', null, '状态：'),
        el('span', { class: 'pill ' + (p.done ? 'sage' : 'muted') }, p.done ? '✅ 已上完' : '⏳ 未上')
      ]),
      el('div', { class: 'att-row' }, [
        el('span', null, '缴费：'),
        el('span', { class: 'pill ' + (p.renewal ? (p.feePaid ? 'sage' : 'red') : 'muted') }, p.renewal ? (p.feePaid ? '✅ 已缴费' : '🔴 需提醒续费') : '无需续费')
      ]),
      el('div', { class: 'actions', style: { marginTop: '16px', flexWrap: 'wrap', gap: '8px' } }, [
        el('button', { class: 'btn sm', onclick: () => { editLesson(st, p); } }, '✏️ 编辑内容'),
        el('button', { class: 'btn sm', onclick: () => { p.done = !p.done; recalcPlan(st); DB.save(); UI.closeLightbox(); rerender(); UI.toast(p.done ? '已标记上完 ✅' : '已取消标记'); } }, p.done ? '✅ 本节课已上完' : '✅ 标记已上完'),
        el('button', { class: 'btn sm' + (p.renewal ? ' coral' : ''), onclick: () => { p.renewal = !p.renewal; DB.save(); UI.closeLightbox(); rerender(); UI.toast(p.renewal ? '已设为续费提醒 🔴' : '已取消续费提醒'); } }, p.renewal ? '🔴 取消续费提醒' : '🔴 设为续费提醒'),
        el('button', { class: 'btn sm' + (p.feePaid ? ' coral' : ''), onclick: () => { p.feePaid = !p.feePaid; DB.save(); UI.closeLightbox(); rerender(); UI.toast(p.feePaid ? '已标记缴费 💰' : '已取消缴费标记'); } }, p.feePaid ? '💰 取消已缴费' : '💰 标记已缴费'),
        el('button', { class: 'btn sm', onclick: () => { addLesson(st); } }, '➕ 添加下一课'),
        el('button', { class: 'btn sm coral', onclick: () => {
          if (!confirm('确定删除第 ' + p.seq + ' 课？此操作不可撤销')) return;
          st.plan = st.plan.filter(function (x) { return x !== p; });
          recalcPlan(st); DB.save(); UI.closeLightbox(); viewClassSchedule(st); UI.toast('已删除第 ' + p.seq + ' 课 🗑');
        } }, '🗑 删除本课')
      ])
    ]);
    UI.lightbox({ title: '📚 ' + st.name + ' · 第' + p.seq + '课', body });
  }
  // 编辑单课（内容 + 日期）
  function editLesson(st, p) {
    UI.formModal({
      title: '✏️ 编辑第 ' + p.seq + ' 课',
      fields: [
        { key: 'content', label: '学习内容', type: 'textarea', default: p.content || '' },
        { key: 'date', label: '上课日期（YYYY-MM-DD，可空）', default: p.date || '' }
      ],
      onSubmit: function (o) {
        p.content = (o.content || '').trim();
        p.date = (o.date || '').trim();
        DB.save(); UI.closeLightbox(); viewClassSchedule(st); UI.toast('已更新第 ' + p.seq + ' 课 ✅');
      }
    });
  }
  // 追加下一课
  function addLesson(st) {
    if (!Array.isArray(st.plan)) st.plan = [];
    const max = st.plan.reduce(function (m, x) { return Math.max(m, x.seq); }, 0);
    const seq = max + 1;
    st.plan.push({ seq: seq, content: '', date: '', done: false, renewal: false, feePaid: false });
    recalcPlan(st); DB.save(); UI.closeLightbox(); viewClassSchedule(st);
    UI.toast('已添加第 ' + seq + ' 课 ➕（点开可填写内容）');
  }

  // ===== 口述生成学情评语 =====
  function genCommentModal() {
    const d = DB.get();
    const raw = el('textarea', { class: 'oral-raw', placeholder: '🎤 口述或粘贴学员情况，例如：\n「小米这周进步很大，主动练琴，音准更稳了；但左手和弦还不太熟，回家要多练；建议下阶段加视奏训练，多鼓励她」' });
    const out = el('div', { class: 'oral-structured' });
    const comment = el('textarea', { style: { width: '100%', height: '180px', fontSize: '13px', lineHeight: '1.6', border: '1.5px solid var(--line)', borderRadius: '12px', padding: '11px', fontFamily: 'inherit', resize: 'vertical', marginTop: '6px' } });
    let organized = null;
    function step(t, c) { return el('div', { class: 'oral-step' }, [el('div', { class: 'lbl' }, t), el('div', null, c || '（无）')]); }
    function organize() {
      const txt = raw.value.trim();
      if (!txt) { UI.toast('请先输入口述内容'); return; }
      organized = organizeOral(txt, d.students);
      out.innerHTML = '';
      out.appendChild(el('div', { class: 'oral-name' }, organized.studentName ? ('👤 识别学员：' + organized.studentName) : '👤 未识别到具体学员（可连同姓名一起口述）'));
      out.appendChild(step('✅ 进步与亮点', organized.good));
      out.appendChild(step('📌 需要加强', organized.weak));
      out.appendChild(step('🎯 下阶段建议', organized.plan));
      comment.value = genComment(organized);
      UI.toast('已整理并生成评语 ✅');
    }
    const body = el('div', null, [
      el('div', { style: { display: 'flex', alignItems: 'flex-start', gap: '8px' } }, [
        el('span', { class: 'mic', title: '语音口述', style: { fontSize: '22px', cursor: 'pointer', lineHeight: '34px' } }, '🎤'),
        raw
      ]),
      el('button', { class: 'btn', style: { margin: '10px 0' }, onclick: organize }, '🧹 整理并生成评语'),
      el('div', { class: 'muted', style: { fontSize: '12px', margin: '2px 0 4px' } }, '整理结果（自动归类）：'),
      out,
      el('div', { class: 'muted', style: { fontSize: '12px', margin: '10px 0 2px' } }, '生成评语（可手动微调）：'),
      comment,
      el('div', { class: 'actions', style: { marginTop: '12px' } }, [
        el('button', { class: 'btn ghost', onclick: () => { comment.select(); try { document.execCommand('copy'); UI.toast('已复制评语'); } catch (e) { UI.toast('复制失败'); } } }, '📋 复制'),
        el('button', { class: 'btn coral', onclick: () => {
          if (!comment.value.trim()) { UI.toast('请先生成评语'); return; }
          const st = organized && organized.studentName ? d.students.find(s => s.name === organized.studentName) : null;
          d.feedback.push({ id: DB.uid(), studentId: st ? st.id : null, range: '口述生成', text: comment.value, sent: false });
          DB.save(); UI.close(); rerender(); UI.toast('已保存为学情反馈 ✅');
        } }, '💾 保存为学情反馈')
      ])
    ]);
    UI.open(el('div', { class: 'modal', style: { maxWidth: '620px' } }, [
      el('h3', null, '🎤 口述生成学情评语'),
      body,
      el('div', { class: 'actions' }, [el('button', { class: 'btn ghost', onclick: UI.close }, '关闭')])
    ]));
    body.querySelector('.mic').addEventListener('click', () => {
      UI.voiceInput(txt => { raw.value = raw.value ? raw.value + (raw.value.endsWith('\n') ? '' : '\n') + txt : txt; });
    });
  }

  function kpiCard(n, l) { return el('div', { class: 'k' }, [el('div', { class: 'n' }, String(n)), el('div', { class: 'l' }, l)]); }
  function weekDate(wd) { const now = new Date(); const diff = (wd - now.getDay() + 7) % 7; return UI.addDays(diff); }

  /* ---------------- 钢琴（VAVA） ---------------- */
  // ===== 钢琴系统课进度辅助（读 window.PIANO_CURRICULUM）=====
  function pianoCurriculumTotal() {
    const C = window.PIANO_CURRICULUM; if (!C) return 0;
    let n = 0; (C.phases || []).forEach(ph => { n += (ph.lessons || []).length; }); return n;
  }
  function pianoCurriculumDone() {
    const C = window.PIANO_CURRICULUM; if (!C) return 0;
    const d = DB.get(); let n = 0;
    (C.phases || []).forEach(ph => (ph.lessons || []).forEach(l => { const r = d.pianoProgress && d.pianoProgress[l.id]; if (r && r.done) n++; }));
    return n;
  }
  function pianoRec(id) {
    const d = DB.get(); if (!d.pianoProgress) d.pianoProgress = {};
    if (!d.pianoProgress[id]) d.pianoProgress[id] = { done: false, note: '', myVideo: '' };
    return d.pianoProgress[id];
  }

  V.piano = function (c) {
    const d = DB.get();
    const C = window.PIANO_CURRICULUM || { meta: {}, phases: [] };
    const total = pianoCurriculumTotal();
    const done = pianoCurriculumDone();

    // KPI
    c.appendChild(el('div', { class: 'kpi' }, [
      kpiCard(done + '/' + total, '系统课进度'),
      kpiCard(total - done, '待完成'),
      kpiCard((C.phases || []).length, '阶段'),
      kpiCard(d.pianoVAVA.length, '补充课程')
    ]));

    // 封面
    if (C.meta && C.meta.cover) {
      c.appendChild(el('div', { class: 'piano-cover' }, [
        el('img', { src: C.meta.cover, alt: C.meta.title || '钢琴系统课', loading: 'lazy' }),
        el('div', { class: 'piano-cover-t' }, [
          el('div', { class: 'pt' }, C.meta.title || '钢琴系统课'),
          el('div', { class: 'ps' }, C.meta.subtitle || '')
        ])
      ]));
    }

    // 阶段 → 课程
    (C.phases || []).forEach(function (ph) {
      const phEl = el('div', { class: 'phase phase-' + (ph.color || 'sage') }, [
        el('div', { class: 'phase-h' }, [
          el('div', { class: 'phase-name' }, ph.name),
          el('div', { class: 'phase-weeks' }, ph.weeks)
        ]),
        ph.goal ? el('div', { class: 'phase-goal' }, ph.goal) : null
      ]);
      (ph.lessons || []).forEach(function (lesson) {
        const rec = pianoRec(lesson.id);
        const lessonEl = el('div', { class: 'lesson' + (rec.done ? ' done' : '') }, [
          el('div', { class: 'lesson-h' }, [
            el('div', { class: 'lesson-week' }, '第' + lesson.week + '周'),
            el('div', { class: 'lesson-main' }, [
              el('div', { class: 'lesson-title' }, lesson.title),
              el('div', { class: 'lesson-focus' }, lesson.focus)
            ])
          ]),
          el('div', { class: 'lesson-goals' }, (lesson.goals || []).map(function (g) { return el('div', { class: 'goal' }, '✓ ' + g); })),
          guideBlock({ guide: lesson.text, guideImages: (lesson.imgs || []).join('\n') }),
          el('div', { class: 'lesson-video' }, [
            el('div', { class: 'lv-cap' }, '🎬 配套视频（内嵌播放）'),
            el('div', { class: 'lv-col' }, [
              el('div', { class: 'lv-sub' }, '① 公开教程（B站内嵌，直接看）'),
              lessonVideosArea(lesson)
            ]),
            el('div', { class: 'lv-col' }, [
              el('div', { class: 'lv-sub' }, '② 我的录课（粘贴你自己的视频链接）'),
              myVideoArea(lesson)
            ])
          ]),
          el('div', { class: 'lesson-foot' }, [
            el('span', { class: 'lesson-note' }, rec.done ? ('✅ 已完成' + (rec.note ? '：' + rec.note : '')) : '未完成'),
            el('button', { class: 'btn sm', onclick: () => { editNote(lesson); } }, '备注'),
            UI.switchEl(rec.done, function (on) { pianoRec(lesson.id).done = on; DB.save(); rerender(); })
          ])
        ]);
        phEl.appendChild(lessonEl);
      });
      c.appendChild(phEl);
    });

    // 推荐公开课资源
    if (C.resources && C.resources.length) {
      c.appendChild(el('div', { class: 'card' }, [
        el('div', { class: 'card-h' }, el('h3', null, ['📚 推荐公开课资源（点开即搜）'])),
        el('div', { class: 'res-list' }, C.resources.map(function (r) {
          return el('a', { class: 'res-item', href: r.url, target: '_blank', rel: 'noopener' }, [
            el('div', { class: 'res-main' }, [
              el('div', { class: 'res-name' }, r.name),
              el('div', { class: 'res-note' }, r.note || '')
            ]),
            el('span', { class: 'pill ' + (r.tag === 'YouTube' ? 'lnk' : 'brown') }, r.tag)
          ]);
        }))
      ]));
    }

    // 自定义补充课程（旧 pianoVAVA 自定义区）
    const list = d.pianoVAVA;
    const supCard = el('div', { class: 'card' }, [
      el('div', { class: 'card-h' }, el('h3', null, ['📌 自定义补充课程（你自己的练习 / 录课）'])),
      el('div', null, list.length ? list.map(function (p) {
        return el('div', { class: 'li' }, [
          Batch.item(p.id, function () { d.pianoVAVA = d.pianoVAVA.filter(function (x) { return x.id !== p.id; }); }),
          el('div', { class: 'body' }, [
            el('div', { class: 't' }, 'Day ' + p.day + ' · ' + p.title),
            el('div', { class: 's' }, p.content + (p.media ? ' 🔗' + p.media : '')),
            guideBlock(p)
          ]),
          UI.switchEl(p.done, function (on) { p.done = on; DB.save(); rerender(); }),
          el('button', { class: 'btn sm edit-only', onclick: () => { editLesson(p); } }, '改'),
          el('button', { class: 'btn sm edit-only', onclick: () => { if (confirm('删除？')) { d.pianoVAVA = d.pianoVAVA.filter(function (x) { return x.id !== p.id; }); DB.save(); rerender(); } } }, '删')
        ]);
      }) : [empty('暂无补充课程，可点击下方添加你自己的练习 / 录课')])
    ]);
    supCard.appendChild(el('button', { class: 'add-btn', onclick: () => UI.formModal({ title: '添加补充课程', fields: [
      { key: 'day', label: '天数/序号', type: 'number', default: list.length + 1 }, { key: 'title', label: '标题' },
      { key: 'content', label: '教学内容', type: 'textarea' }, { key: 'media', label: '图文/视频链接(可选)' }
    ].concat(GUIDE_FIELDS), onSubmit: function (v) { d.pianoVAVA.push({ id: DB.uid(), day: +v.day, title: v.title, content: v.content, media: v.media, guide: v.guide, guideMedia: v.guideMedia, guideImages: v.guideImages, done: false }); DB.save(); rerender(); UI.toast('已添加'); } }) }, '+ 添加补充课程'));
    c.appendChild(supCard);

    // —— 内部辅助 ——
    function lessonVideosArea(lesson) {
      var vids = lesson.videos || [];
      if (!vids.length) {
        var q = encodeURIComponent(lesson.videoHint || lesson.title);
        return el('div', { class: 'v-search-fallback' }, [
          el('a', { class: 'v-search-link', href: 'https://search.bilibili.com/all?keyword=' + q, target: '_blank', rel: 'noopener' }, '🔍 B站搜：' + (lesson.videoHint || lesson.title)),
          el('a', { class: 'v-search-link', href: 'https://www.youtube.com/results?search_query=' + q, target: '_blank', rel: 'noopener' }, '🔍 YouTube 搜：' + (lesson.videoHint || lesson.title))
        ]);
      }
      return el('div', { class: 'v-embeds' }, vids.map(function (v) {
        return el('div', { class: 'v-embed-item' }, [
          el('div', { class: 'v-embed-title' }, v.title),
          inlineVideoEmbed(v.url, v.title)
        ]);
      }));
    }
    function myVideoArea(lesson) {
      var v = pianoRec(lesson.id).myVideo;
      if (v) {
        return el('div', { class: 'my-video-wrap' }, [
          inlineVideoEmbed(v, '我的录课'),
          el('button', { class: 'btn sm ghost', style: { marginTop: '6px' }, onclick: () => { editMyVideo(lesson); } }, '替换/删除')
        ]);
      }
      return el('div', { class: 'my-video-slot', onclick: () => { editMyVideo(lesson); } }, '＋ 粘贴你的录课视频链接（B站 / YouTube / 抖音 / 直链）');
    }
    function editMyVideo(lesson) {
      UI.formModal({ title: '我的录课视频', fields: [
        { key: 'url', label: '视频链接（B站/YouTube/抖音/视频直链 mp4 等，留空可删除）', type: 'textarea', default: pianoRec(lesson.id).myVideo || '' }
      ], onSubmit: function (v) { const u = (v.url || '').trim(); pianoRec(lesson.id).myVideo = u; DB.save(); rerender(); UI.toast(u ? '已保存我的视频' : '已清除'); } });
    }
    function editNote(lesson) {
      UI.formModal({ title: '本课备注', fields: [
        { key: 'note', label: '练习笔记 / 心得', type: 'textarea', default: pianoRec(lesson.id).note || '' }
      ], onSubmit: function (v) { pianoRec(lesson.id).note = (v.note || '').trim(); DB.save(); rerender(); UI.toast('已保存'); } });
    }
    function editLesson(p) {
      UI.formModal({ title: '编辑课程', fields: [
        { key: 'title', label: '标题', default: p.title }, { key: 'content', label: '教学内容', type: 'textarea', default: p.content },
        { key: 'media', label: '图文/视频链接', default: p.media || '' }
      ].concat(GUIDE_FIELDS.map(function (f) { return Object.assign({}, f, { default: p[f.key] || '' }); })), onSubmit: function (v) { Object.assign(p, { title: v.title, content: v.content, media: v.media, guide: v.guide, guideMedia: v.guideMedia, guideImages: v.guideImages }); DB.save(); rerender(); UI.toast('已保存'); } });
    }
  };

  /* ---------------- 小红书运营 ---------------- */
  V.xhs = function (c) {
    const d = DB.get(); const x = d.xhs;
    // 兜底归一化：防止「清空内容」或旧数据缺字段导致渲染崩
    x.accounts = x.accounts || {};
    x.drafts = x.drafts || [];
    x.trends = x.trends || [];
    x.posts = x.posts || [];
    x.metrics = x.metrics || [];
    x.daily = x.daily || null;
    if (typeof x.dailyLoaded !== 'string') x.dailyLoaded = '';

    // 每日自动加载联网数据（静态站通过 data/xhs-daily.json 更新）
    // 策略：自动条目每天替换，手动条目保留；避免旧 auto 草稿堆积在顶部。
    function mergeDaily(j) {
      if (!j || x.dailyLoaded === j.generatedAt) return;
      x.drafts = x.drafts.filter(function (dd) { return !dd.auto; });
      (j.drafts || []).forEach(function (dr) {
        x.drafts.push(Object.assign({}, dr, { id: DB.uid(), date: j.generatedAt, auto: true }));
      });
      x.trends = x.trends.filter(function (tt) { return !tt.auto; });
      (j.trends || []).forEach(function (tr) {
        x.trends.push(Object.assign({}, tr, { id: DB.uid(), date: j.generatedAt, auto: true }));
      });
      x.daily = j;
      x.dailyLoaded = j.generatedAt;
      DB.save();
    }
    if (!window.__xhsDailyLoading) {
      window.__xhsDailyLoading = true;
      fetch('data/xhs-daily.json?v=' + Date.now())
        .then(function (r) { return r.json(); })
        .then(function (j) { mergeDaily(j); App.refresh(); })
        .catch(function () { window.__xhsDailyLoading = false; });
    }
    // 初始化清理：只保留与 dailyLoaded 同日的自动条目，防止旧版本数据堆积
    if (x.dailyLoaded) {
      x.drafts = x.drafts.filter(function (dd) { return !dd.auto || dd.date === x.dailyLoaded; });
      x.trends = x.trends.filter(function (tt) { return !tt.auto || tt.date === x.dailyLoaded; });
    }

    // ===== 账号速览（紧凑）=====
    function acctCard(key, emoji, defName, goal, persona, pillars, bg) {
      const a = x.accounts[key] || {};
      const nm = a.name || defName;
      const cardEl = el('div', { class: 'card ovw', style: { borderLeft: '5px solid ' + bg } });
      cardEl.appendChild(el('div', { class: 'card-h' }, [
        el('span', null, [emoji + ' ', el('b', null, nm)]),
        el('span', { class: 'pill ' + (key === 'pet' ? 'brown' : 'sage') }, key === 'pet' ? '宠物号·变现' : '英文号·招生')
      ]));
      cardEl.appendChild(el('div', { class: 'ovw-ps' }, [
        el('div', null, '🎯 ' + goal),
        el('div', null, '🧑‍🏫 ' + persona),
        el('div', null, '📌 支柱：' + pillars)
      ]));
      cardEl.appendChild(el('button', { class: 'add-btn edit-only', onclick: () => UI.formModal({ title: '编辑' + nm, fields: [
        { key: 'name', label: '账号昵称', default: a.name || '' },
        { key: 'handle', label: '简介/钩子', type: 'textarea', default: a.handle || '' },
        { key: 'position', label: '人设一句话', default: a.position || '' },
        { key: 'pillar', label: '内容支柱', default: a.pillar || '' }
      ], onSubmit: function (v) { x.accounts[key] = Object.assign(a, v); DB.save(); rerender(); UI.toast('已保存'); } }) }, '✏️ 编辑账号'));
      return cardEl;
    }
    c.appendChild(acctCard('pet', '🐾', 'XX的猫狗日记', '后期变现（带货/接广/开店）', '一猫一狗的治愈日常 + 真实养宠经验', '治愈日常 · 养宠干货 · 梗二创 · 真实生活', '#B08968'));
    c.appendChild(acctCard('english', '🔤', 'Vava 的英语小课堂', '招生（试听课 → 正课）', '会讲段子的独立少儿英语老师', '双语剧情 · 英语干货 · 用英语讲中国 · 学员故事', '#6BA8A0'));

    // ===== 链接/视频预览卡（类嵌入式）=====
    function linkCard(url, title, note) {
      if (!url) return null;
      const isXhs = /xiaohongshu\.com/.test(url);
      const isDy = /douyin\.com|iesdouyin\.com/.test(url);
      const host = isXhs ? '📕 小红书' : isDy ? '🎵 抖音' : '🔗 来源';
      const hostClass = isXhs ? 'xhs' : isDy ? 'dy' : 'web';
      const action = isXhs ? '打开小红书' : isDy ? '打开抖音' : '打开链接';
      const short = url.length > 52 ? url.slice(0, 49) + '...' : url;
      const head = el('div', { class: 'link-head' }, [
        el('span', { class: 'link-badge ' + hostClass }, host),
        el('a', { class: 'link-action', href: url, target: '_blank', rel: 'noopener' }, action + ' →')
      ]);
      const kids = [head];
      if (title) kids.push(el('div', { class: 'link-title' }, title));
      kids.push(el('a', { class: 'link-url', href: url, target: '_blank', rel: 'noopener' }, short));
      if (note) kids.push(el('div', { class: 'link-note' }, note));
      return el('div', { class: 'link-card' }, kids);
    }

    // ===== 1. 今日草稿 =====
    const dailyDate = x.daily && x.daily.generatedAt ? ' · ' + x.daily.generatedAt : '';
    const sortedDrafts = (x.drafts || []).slice().sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
    const draftKids = sortedDrafts.map(function (dr) {
      return el('div', { class: 'li' }, [
        Batch.item(dr.id, function () { x.drafts = x.drafts.filter(function (y) { return y.id !== dr.id; }); }),
        el('div', { class: 'body' }, [
          el('div', { class: 't' }, [(dr.acct === 'pet' ? '🐾 ' : '🔤 ') + dr.title, dr.auto ? el('span', { class: 'pill sage' }, '自动') : null, dr.date ? el('span', { class: 'muted', style: { fontSize: '11px', marginLeft: '6px' } }, dr.date) : null]),
          el('div', { class: 's' }, dr.body),
          dr.tags ? el('div', { class: 's', style: { color: 'var(--sage-d)' } }, '🏷 ' + dr.tags) : null,
          dr.inspiredBy ? el('div', { class: 'muted', style: { fontSize: '11px', marginTop: '4px' } }, '💡 灵感：' + dr.inspiredBy) : null
        ]),
        el('button', { class: 'btn sm edit-only', onclick: () => { editDraft(dr); } }, '改')
      ]);
    });
    if (!draftKids.length) draftKids.push(empty('今日暂无草稿，每日 6:00 自动更新'));
    const draftCard = card('📝 今日草稿' + dailyDate + '（每日 6:00 自动更新 · 可编辑）', '', draftKids);
    draftCard.appendChild(el('button', { class: 'add-btn edit-only', onclick: () => UI.formModal({ title: '添加草稿', fields: [
      { key: 'acct', label: '账号', type: 'select', options: [{ value: 'pet', label: '宠物号' }, { value: 'english', label: '英文号' }] },
      { key: 'title', label: '标题' }, { key: 'body', label: '正文/口播', type: 'textarea' }, { key: 'tags', label: '标签' },
      { key: 'inspiredBy', label: '灵感来源', type: 'textarea' }
    ], onSubmit: function (v) { x.drafts.push({ id: DB.uid(), acct: v.acct, title: v.title, body: v.body, tags: v.tags, inspiredBy: v.inspiredBy, date: UI.todayStr() }); DB.save(); rerender(); UI.toast('已添加'); } }) }, '+ 添加草稿'));
    c.appendChild(draftCard);

    // ===== 2. 爆款拆解 & 二创灵感 =====
    const sortedTrends = (x.trends || []).slice().sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
    const trendKids = sortedTrends.map(function (tr) {
      return el('div', { class: 'li trend-li' }, [
        Batch.item(tr.id, function () { x.trends = x.trends.filter(function (y) { return y.id !== tr.id; }); }),
        el('div', { class: 'body' }, [
          el('div', { class: 't' }, [tr.title, tr.auto ? el('span', { class: 'pill sage' }, '自动') : null, tr.date ? el('span', { class: 'muted', style: { fontSize: '11px', marginLeft: '6px' } }, tr.date) : null]),
          el('div', { style: { display: 'flex', gap: '6px', margin: '4px 0', flexWrap: 'wrap' } }, [
            el('span', { class: 'pill brown' }, tr.platform || '小红书'),
            el('span', { class: 'pill sage' }, tr.niche || '综合')
          ]),
          el('div', { class: 's' }, '🔥 爆点：' + (tr.analysis || '—')),
          el('div', { class: 's', style: { color: 'var(--coral)' } }, '✂️ 二创：' + (tr.angle || '—')),
          linkCard(tr.url, tr.title, '点击卡片跳转原视频/笔记，参考后再二创')
        ]),
        el('button', { class: 'btn sm edit-only', onclick: () => { editTrend(tr); } }, '改')
      ]);
    });
    if (!trendKids.length) trendKids.push(empty('暂无爆款拆解，每日 6:00 自动更新'));
    const trendCard = card('🔥 爆款拆解 & 二创灵感' + dailyDate + '（每日 6:00 自动更新）', '', trendKids);
    trendCard.appendChild(el('button', { class: 'add-btn edit-only', onclick: () => UI.formModal({ title: '添加爆款拆解', fields: [
      { key: 'title', label: '标题' },
      { key: 'platform', label: '平台', default: '小红书' },
      { key: 'niche', label: '赛道', default: '宠物' },
      { key: 'url', label: '原视频/笔记链接' },
      { key: 'analysis', label: '爆点分析', type: 'textarea' },
      { key: 'angle', label: '二创角度', type: 'textarea' }
    ], onSubmit: function (v) { x.trends.push({ id: DB.uid(), title: v.title, platform: v.platform, niche: v.niche, url: v.url, analysis: v.analysis, angle: v.angle, date: UI.todayStr() }); DB.save(); rerender(); UI.toast('已添加'); } }) }, '+ 添加爆款'));
    c.appendChild(trendCard);

    // ===== 3. 复盘 =====
    const reviewBody = el('div', null);
    // 3.1 数据回填
    reviewBody.appendChild(el('div', { class: 'grp-h' }, '📊 发布数据'));
    const mKids = (x.metrics || []).map(function (m) {
      const hot = (m.zan >= 500) || (m.cang >= 200) || (m.ping >= 50);
      return el('div', { class: 'li' }, [
        Batch.item(m.id, function () { x.metrics = x.metrics.filter(function (y) { return y.id !== m.id; }); }),
        el('div', { class: 'body' }, [
          el('div', { class: 't' }, [m.title + '  ', el('span', { class: 'pill ' + (m.acct === 'pet' ? 'brown' : 'sage') }, m.acct === 'pet' ? '🐾宠物' : '🔤英文'), ' · ' + (m.plat || '小红书')]),
          el('div', { class: 's' }, '赞 ' + (m.zan || 0) + ' · 藏 ' + (m.cang || 0) + ' · 评 ' + (m.ping || 0) + ' · 转 ' + (m.zhuan || 0) + ' · 涨粉 ' + (m.fen || 0) + (hot ? '  🔥小爆' : ''))
        ]),
        el('button', { class: 'btn sm edit-only', onclick: () => { editMetric(m); } }, '改')
      ]);
    });
    if (!mKids.length) mKids.push(empty('暂无数据，发完记得回填'));
    reviewBody.appendChild(el('div', null, mKids));
    reviewBody.appendChild(el('button', { class: 'add-btn edit-only', onclick: () => UI.formModal({ title: '添加发布数据', fields: [
      { key: 'acct', label: '账号', type: 'select', options: [{ value: 'pet', label: '宠物号' }, { value: 'english', label: '英文号' }] },
      { key: 'plat', label: '平台', type: 'select', options: [{ value: '小红书', label: '小红书' }, { value: '抖音', label: '抖音' }] },
      { key: 'title', label: '标题' },
      { key: 'zan', label: '赞', type: 'number' }, { key: 'cang', label: '藏', type: 'number' }, { key: 'ping', label: '评', type: 'number' },
      { key: 'zhuan', label: '转', type: 'number' }, { key: 'fen', label: '涨粉', type: 'number' }
    ], onSubmit: function (v) { x.metrics.push({ id: DB.uid(), acct: v.acct, plat: v.plat, title: v.title, zan: +v.zan || 0, cang: +v.cang || 0, ping: +v.ping || 0, zhuan: +v.zhuan || 0, fen: +v.fen || 0 }); DB.save(); rerender(); UI.toast('已记录'); } }) }, '+ 添加数据'));

    // 3.2 发布复盘笔记
    reviewBody.appendChild(el('div', { class: 'grp-h', style: { marginTop: '12px' } }, '📝 复盘笔记'));
    const pKids = (x.posts || []).map(function (p) {
      return el('div', { class: 'li' }, [
        Batch.item(p.id, function () { x.posts = x.posts.filter(function (y) { return y.id !== p.id; }); }),
        el('div', { class: 'body' }, [el('div', { class: 't' }, [p.title + '  ', el('span', { class: 'pill sage' }, p.metrics)]), el('div', { class: 's' }, p.review)]),
        el('button', { class: 'btn sm edit-only', onclick: () => { editPost(p); } }, '改')
      ]);
    });
    if (!pKids.length) pKids.push(empty('还没有发布复盘记录'));
    reviewBody.appendChild(el('div', null, pKids));
    reviewBody.appendChild(el('button', { class: 'add-btn edit-only', onclick: () => UI.formModal({ title: '添加复盘', fields: [
      { key: 'title', label: '标题' }, { key: 'metrics', label: '数据(赞/藏/涨粉)' },
      { key: 'review', label: '哪里可优化/下次怎么做', type: 'textarea' }
    ], onSubmit: function (v) { x.posts.push({ id: DB.uid(), title: v.title, date: UI.todayStr(), metrics: v.metrics, review: v.review }); DB.save(); rerender(); UI.toast('已记录复盘'); } }) }, '+ 添加复盘'));

    // 3.3 每日复盘问题
    const prompts = (x.daily && x.daily.review && x.daily.review.prompts) || [
      '今天发的内容，前3秒有没有让人停下来的钩子？',
      '英文号是否出现保分/提分/速成/名师/最/第一等敏感词？',
      '宠物号内容是否真实拍摄？有无过度拟人/虚假剧情风险？',
      '爆款拆解里，哪个角度可以直接改成明天的草稿？',
      '数据回填中，赞/藏/评哪个最弱？对应改法是什么？'
    ];
    reviewBody.appendChild(el('div', { class: 'grp-h', style: { marginTop: '12px' } }, '🔁 每日复盘问题'));
    reviewBody.appendChild(el('div', { class: 'muted', style: { lineHeight: 1.9 } }, prompts.map(function (q, i) { return (i + 1) + '. ' + q; }).join('\n')));
    if (x.daily && x.daily.review && x.daily.review.focus) {
      reviewBody.appendChild(el('div', { class: 'li-tip', style: { marginTop: '6px' } }, '💡 本周重点：' + x.daily.review.focus));
    }

    const reviewCard = card('📊 复盘（数据 + 笔记 + 每日问题）', '', [reviewBody]);
    c.appendChild(reviewCard);

    // ===== 编辑函数 =====
    function editDraft(dr) {
      UI.formModal({ title: '编辑草稿', fields: [
        { key: 'acct', label: '账号', type: 'select', options: [{ value: 'pet', label: '宠物号' }, { value: 'english', label: '英文号' }], default: dr.acct },
        { key: 'title', label: '标题', default: dr.title }, { key: 'body', label: '正文/口播', type: 'textarea', default: dr.body || '' },
        { key: 'tags', label: '标签', default: dr.tags || '' }, { key: 'inspiredBy', label: '灵感来源', type: 'textarea', default: dr.inspiredBy || '' }
      ], onSubmit: function (v) { Object.assign(dr, { acct: v.acct, title: v.title, body: v.body, tags: v.tags, inspiredBy: v.inspiredBy }); DB.save(); rerender(); UI.toast('已保存'); } });
    }
    function editTrend(tr) {
      UI.formModal({ title: '编辑爆款拆解', fields: [
        { key: 'title', label: '标题', default: tr.title }, { key: 'platform', label: '平台', default: tr.platform || '' },
        { key: 'niche', label: '赛道', default: tr.niche || '' }, { key: 'url', label: '原视频/笔记链接', default: tr.url || '' },
        { key: 'analysis', label: '爆点分析', type: 'textarea', default: tr.analysis || '' },
        { key: 'angle', label: '二创角度', type: 'textarea', default: tr.angle || '' }
      ], onSubmit: function (v) { Object.assign(tr, { title: v.title, platform: v.platform, niche: v.niche, url: v.url, analysis: v.analysis, angle: v.angle }); DB.save(); rerender(); UI.toast('已保存'); } });
    }
    function editMetric(m) {
      UI.formModal({ title: '编辑数据', fields: [
        { key: 'acct', label: '账号', type: 'select', options: [{ value: 'pet', label: '宠物号' }, { value: 'english', label: '英文号' }], default: m.acct },
        { key: 'plat', label: '平台', type: 'select', options: [{ value: '小红书', label: '小红书' }, { value: '抖音', label: '抖音' }], default: m.plat || '小红书' },
        { key: 'title', label: '标题', default: m.title },
        { key: 'zan', label: '赞', type: 'number', default: m.zan || 0 }, { key: 'cang', label: '藏', type: 'number', default: m.cang || 0 },
        { key: 'ping', label: '评', type: 'number', default: m.ping || 0 }, { key: 'zhuan', label: '转', type: 'number', default: m.zhuan || 0 },
        { key: 'fen', label: '涨粉', type: 'number', default: m.fen || 0 }
      ], onSubmit: function (v) { Object.assign(m, { acct: v.acct, plat: v.plat, title: v.title, zan: +v.zan || 0, cang: +v.cang || 0, ping: +v.ping || 0, zhuan: +v.zhuan || 0, fen: +v.fen || 0 }); DB.save(); rerender(); UI.toast('已保存'); } });
    }
    function editPost(p) {
      UI.formModal({ title: '编辑复盘', fields: [
        { key: 'title', label: '标题', default: p.title }, { key: 'metrics', label: '数据(赞/藏/涨粉)', default: p.metrics },
        { key: 'review', label: '哪里可优化/下次怎么做', type: 'textarea', default: p.review || '' }
      ], onSubmit: function (v) { Object.assign(p, { title: v.title, metrics: v.metrics, review: v.review }); DB.save(); rerender(); UI.toast('已保存'); } });
    }
  };

  /* ---------------- 旅游攻略 ---------------- */
  function luggageFor(type) {
    const base = ['🪪 证件', '💳 银行卡', '📱 充电器', '💊 常用药', '🧴 防晒', '👕 换洗衣物'];
    if (type === '亲子游') return base.concat(['👶 宝宝用品', '🧸 玩具', '🍼 奶瓶/零食', '🚼 推车']);
    if (type === '家庭游') return base.concat(['📷 相机', '🎒 双肩包', '👵 老人常用药']);
    if (type === '情侣游') return base.concat(['👗 美衣×N', '💄 化妆品', '🕶 墨镜', '📷 拍照道具']);
    return base;
  }
  function renderTravelResult(host, r, onSave) {
    host.appendChild(el('div', { class: 'card-h' }, [el('h3', null, '📍 ' + r.dest), el('span', { class: 'pill sage' }, r.type + ' · ' + r.days + '天 · ' + r.season)]));
    if (r.thumb) host.appendChild(el('img', { class: 'img-hero', src: r.thumb, alt: r.dest, loading: 'lazy' }));
    if (r.intro) host.appendChild(el('div', { class: 'hero-intro' }, r.intro));
    if (r.images && r.images.length) {
      const grid = el('div', { class: 'img-grid' });
      r.images.slice(0, 6).forEach(im => grid.appendChild(el('div', { class: 'g' }, [el('img', { src: im.url, alt: im.title, loading: 'lazy' }), el('div', { class: 'cap' }, im.title)])));
      host.appendChild(grid);
    }
    host.appendChild(el('div', { class: 'muted', style: { margin: '8px 0 4px', fontWeight: 600 } }, '🗺 路线'));
    const tbl = el('table', { class: 'tbl' });
    tbl.appendChild(el('tr', null, ['天数', '景点', '时间', '时长', '温度', '穿着', '备注'].map(h => el('th', null, h))));
    r.route.forEach(rw => tbl.appendChild(el('tr', null, [el('td', null, 'D' + rw.day), el('td', null, rw.spot), el('td', null, rw.time), el('td', null, rw.dur), el('td', null, rw.temp), el('td', null, rw.wear), el('td', null, rw.note)])));
    host.appendChild(el('div', { class: 'tbl-wrap' }, [tbl]));
    host.appendChild(el('div', { class: 'muted', style: { margin: '10px 0 4px', fontWeight: 600 } }, '💰 预算清单'));
    const bt = el('table', { class: 'tbl' });
    bt.appendChild(el('tr', null, ['类别', '项目', '价格', '来源'].map(h => el('th', null, h))));
    let sum = 0; r.budget.forEach(b => { sum += (+b.price) || 0; bt.appendChild(el('tr', null, [el('td', null, b.cat), el('td', null, b.item), el('td', null, '¥' + b.price), el('td', null, b.src)])); });
    host.appendChild(el('div', { class: 'tbl-wrap' }, [bt]));
    host.appendChild(el('div', { class: 'muted', style: { marginTop: '4px', fontWeight: 700 } }, '合计预估：¥' + sum));
    host.appendChild(el('div', { class: 'muted', style: { margin: '10px 0 4px', fontWeight: 600 } }, '🧳 行李清单（自动生成）'));
    host.appendChild(el('div', null, r.packing.map(l => el('span', { class: 'chip' }, l))));
    host.appendChild(el('div', { class: 'src-note' }, '数据来源：' + r.source));
    host.appendChild(el('div', { style: { display: 'flex', gap: '10px', marginTop: '10px' } }, [
      el('button', { class: 'btn', style: { flex: '1' }, onclick: onSave }, '保存为我的攻略'),
      el('button', { class: 'btn ghost', style: { flex: '1' }, onclick: () => shareCardView({ dest: r.dest, days: r.days, type: r.type, season: r.season, intro: r.intro, images: r.images, route: r.route, budget: r.budget, luggage: r.packing, source: r.source }) }, '🖼 生成分享长图')
    ]));
  }

  // 图文长图分享卡
  function shareCardView(p) {
    const root = el('div', { class: 'share-card' });
    if (p.images && p.images[0] && p.images[0].url) root.appendChild(el('img', { class: 'sc-hero', src: p.images[0].url, crossorigin: 'anonymous', alt: p.dest }));
    root.appendChild(el('div', { class: 'sc-head' }, [
      el('h2', null, '📍 ' + p.dest),
      el('div', { class: 'sc-pills' }, [
        el('span', { class: 'pill sage' }, p.type), el('span', { class: 'pill brown' }, p.days + '天'), el('span', { class: 'pill brown' }, p.season)
      ])
    ]));
    if (p.intro) root.appendChild(el('div', { class: 'sc-intro' }, p.intro));
    if (p.images && p.images.length) {
      const g = el('div', { class: 'sc-grid' });
      p.images.slice(0, 6).forEach(im => g.appendChild(el('div', { class: 'sc-g' }, [el('img', { src: im.url, crossorigin: 'anonymous', alt: im.title }), el('div', { class: 'cap' }, im.title)])));
      root.appendChild(g);
    }
    root.appendChild(el('div', { class: 'sc-sec' }, '🗺 路线'));
    const tbl = el('table', { class: 'sc-tbl' });
    tbl.appendChild(el('tr', null, ['天', '景点', '时间', '时长', '温度', '穿着'].map(h => el('th', null, h))));
    (p.route || []).forEach(r => tbl.appendChild(el('tr', null, [el('td', null, 'D' + r.day), el('td', null, r.spot), el('td', null, r.time), el('td', null, r.dur), el('td', null, r.temp), el('td', null, r.wear)])));
    root.appendChild(tbl);
    root.appendChild(el('div', { class: 'sc-sec' }, '💰 预算清单'));
    const bt = el('table', { class: 'sc-tbl' });
    bt.appendChild(el('tr', null, ['类别', '项目', '价格'].map(h => el('th', null, h))));
    let sum = 0;
    (p.budget || []).forEach(b => { sum += (+b.price) || 0; bt.appendChild(el('tr', null, [el('td', null, b.cat), el('td', null, b.item), el('td', null, '¥' + b.price)])); });
    root.appendChild(bt);
    root.appendChild(el('div', { class: 'sc-total' }, '合计预估：¥' + sum));
    root.appendChild(el('div', { class: 'sc-sec' }, '🧳 行李清单'));
    root.appendChild(el('div', { class: 'sc-chips' }, (p.luggage || []).map(l => el('span', { class: 'chip' }, l))));
    root.appendChild(el('div', { class: 'sc-foot' }, '数据来源：' + (p.source || '联网整合') + ' · 由 VAVA 工作台生成'));

    const modal = el('div', { class: 'modal wide' }, [
      el('div', { class: 'sc-bar' }, [
        el('button', { class: 'btn sm', onclick: () => downloadCard(root) }, '📸 保存为图片'),
        el('button', { class: 'btn sm ghost', onclick: () => copyTravelText(p) }, '📋 复制文字'),
        el('button', { class: 'btn sm ghost', onclick: () => UI.close() }, '关闭')
      ]),
      root
    ]);
    UI.open(modal);
  }
  function copyTravelText(p) {
    const lines = ['📍 ' + p.dest + '（' + p.type + ' · ' + p.days + '天 · ' + p.season + '）', p.intro || '', '', '🗺 路线'];
    (p.route || []).forEach(r => lines.push('D' + r.day + ' ' + r.spot + ' · ' + r.time + ' · ' + r.temp + ' · ' + r.wear));
    let sum = 0; (p.budget || []).forEach(b => sum += (+b.price) || 0);
    lines.push('', '💰 预算：' + (p.budget || []).map(b => b.cat + ' ' + b.item + ' ¥' + b.price).join(' / ') + ' ＝ 合计 ¥' + sum);
    lines.push('', '🧳 行李：' + (p.luggage || []).join('、'));
    lines.push('', '来源：' + (p.source || '联网整合'));
    const text = lines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => UI.toast('已复制攻略文字 ✅')).catch(() => fallbackCopy(text));
    else fallbackCopy(text);
    function fallbackCopy(t) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); UI.toast('已复制攻略文字 ✅'); } catch (e) { UI.toast('复制失败，请手动选择'); } document.body.removeChild(ta); }
  }
  function downloadCard(node) {
    if (window.html2canvas) {
      UI.toast('生成图片中…');
      window.html2canvas(node, { useCORS: true, backgroundColor: '#ffffff', scale: 2 }).then(canvas => {
        const a = document.createElement('a'); a.download = 'VAVA-' + Date.now() + '.png'; a.href = canvas.toDataURL('image/png'); a.click(); UI.toast('已保存图片 ✅');
      }).catch(() => UI.toast('生成失败，请长按图片或截图保存'));
    } else UI.toast('请长按图片或截图保存');
  }

  V.travel = function (c) {
    const d = DB.get(); const t = d.travel;
    t.profile = t.profile || {};
    t.weekend = t.weekend || [];
    t.longtrip = t.longtrip || [];
    if (typeof t.loaded !== 'string') t.loaded = '';

    // 每日自动加载联网攻略（静态站通过 data/travel-daily.json 更新）
    function mergeTravel(j) {
      if (!j || t.loaded === j.generatedAt) return;
      (j.weekend || []).forEach(function (w) {
        if (!t.weekend.find(function (x) { return x.dest === w.dest; })) {
          t.weekend.push(Object.assign({}, w, { id: DB.uid(), auto: true }));
        }
      });
      (j.longtrip || []).forEach(function (l) {
        if (!t.longtrip.find(function (x) { return x.dest === l.dest; })) {
          t.longtrip.push(Object.assign({}, l, { id: DB.uid(), auto: true }));
        }
      });
      if (j.profile) t.profile = Object.assign({}, t.profile, j.profile);
      t.loaded = j.generatedAt;
      DB.save();
    }
    if (!window.__travelLoading) {
      window.__travelLoading = true;
      fetch('data/travel-daily.json?v=' + Date.now())
        .then(function (r) { return r.json(); })
        .then(function (j) { mergeTravel(j); App.refresh(); })
        .catch(function () { window.__travelLoading = false; });
    }

    function escXml(s) { return String(s || '').replace(/[<>&]/g, function (m) { return m === '<' ? '&lt;' : m === '>' ? '&gt;' : '&amp;'; }); }

    function isFav(url){ return (DB.get().favorites||[]).some(function(f){ return f.url===url; }); }
    function toggleFav(src){
      const d = DB.get(); d.favorites = d.favorites || [];
      const i = d.favorites.findIndex(function(f){ return f.url === src.url; });
      if (i>=0) d.favorites.splice(i,1);
      else d.favorites.unshift({ id: DB.uid(), title: src.title||src.url, url: src.url, note:'', cover:'', createdAt: UI.todayStr() });
      DB.save();
    }
    function pickEmoji(s){
      s = s||'';
      if (/宝华|森林|自然|山/.test(s)) return '🌲';
      if (/动物/.test(s)) return '🦁';
      if (/盐湖城|古镇|庄|寺|庙|宫|避暑山庄/.test(s)) return '🏯';
      if (/湖|河|海/.test(s)) return '🌊';
      if (/博物|文化|馆/.test(s)) return '🏛';
      if (/休博|乐园|游|玩/.test(s)) return '🎡';
      if (/云南|大理|昆明|贵州|六盘水|黄果树|草原|承德/.test(s)) return '🏞';
      if (/雪|寒/.test(s)) return '❄️';
      return '✈️';
    }
    function hueOf(s){ let h=0; s=s||''; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))%360; return h; }
    function svgCover(dest){
      const h = hueOf(dest);
      const name = (dest||'').length>8 ? (dest||'').slice(0,8)+'…' : (dest||'');
      const svg = '<svg viewBox="0 0 140 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">'
        + '<defs><linearGradient id="cg'+h+'" x1="0" y1="0" x2="1" y2="1">'
        + '<stop offset="0" stop-color="hsl('+h+',45%,74%)"/>'
        + '<stop offset="1" stop-color="hsl('+((h+38)%360)+',52%,56%)"/></linearGradient></defs>'
        + '<rect width="140" height="120" fill="url(#cg'+h+')"/>'
        + '<circle cx="106" cy="28" r="13" fill="rgba(255,255,255,.55)"/>'
        + '<path d="M0 92 L34 56 L58 82 L86 48 L140 96 L140 120 L0 120 Z" fill="rgba(255,255,255,.20)"/>'
        + '<path d="M0 104 L40 72 L70 98 L104 66 L140 104 L140 120 L0 120 Z" fill="rgba(255,255,255,.36)"/>'
        + '<text x="70" y="106" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="700">'+escXml(name)+'</text>'
        + '</svg>';
      const b = el('div', { class:'tc-img svg-cover' }); b.innerHTML = svg; return b;
    }
    function coverBox(dest, coverUrl){
      const box = el('div', { class:'tc-cover' });
      if (coverUrl) {
        const img = el('img', { class:'tc-img', src: coverUrl, alt: dest||'', loading:'lazy' });
        img.onerror = function(){ box.innerHTML=''; box.appendChild(svgCover(dest)); };
        box.appendChild(img);
      } else {
        box.appendChild(svgCover(dest));
      }
      return box;
    }
    function segBtn(key, label){
      return el('button', { class:'seg-btn'+((window.__travelTab||'all')===key?' on':''), onclick:function(){ window.__travelTab=key; rerender(); } }, label);
    }
    function favView(){
      const d = DB.get(); const favs = d.favorites||[];
      const kids = favs.map(function(f){
        const fc = el('div', { class:'card fav-card' });
        const body = el('div', { class:'tc-body' });
        const u = f.url||'';
        const isXhs = /xiaohongshu\.com/.test(u), isDy = /douyin\.com/.test(u);
        const host = isXhs ? '📕 小红书' : isDy ? '🎵 抖音' : '🔗 链接';
        body.appendChild(el('div', { class:'card-h' }, [
          Batch.item(f.id, function(){ d.favorites = d.favorites.filter(function(x){ return x.id!==f.id; }); }),
          el('h3', null, [el('span', { class:'src-host' }, host), ' ', el('a', { class:'src-link', href:u, target:'_blank', rel:'noopener' }, f.title||u)])
        ]));
        if (f.note) body.appendChild(el('div', { class:'fav-note' }, '📝 ' + f.note));
        body.appendChild(el('div', { class:'act edit-only', style:{ marginTop:'8px', gap:'8px' } }, [
          el('button', { class:'btn sm', onclick:function(){ editFav(f); } }, '改'),
          el('button', { class:'btn sm', onclick:function(){ if(confirm('取消收藏并删除？')){ d.favorites=d.favorites.filter(function(x){ return x.id!==f.id; }); DB.save(); rerender(); } } }, '删')
        ]));
        fc.appendChild(body);
        fc.appendChild(coverBox(f.title||'收藏', f.cover));
        return fc;
      });
      if (!kids.length) kids.push(empty('还没有收藏～ 在上面的攻略里点 ☆ 就能收藏喜欢的链接'));
      const fc2 = card('⭐ 我的收藏（你有绝对的编辑权）', '', kids);
      fc2.appendChild(el('button', { class:'add-btn edit-only', onclick:function(){ UI.formModal({ title:'手动添加收藏', fields:[
        { key:'title', label:'标题' }, { key:'url', label:'链接URL' }, { key:'note', label:'备注', type:'textarea' }, { key:'cover', label:'封面图URL(可选)' }
      ], onSubmit:function(v){ DB.get().favorites.unshift({ id:DB.uid(), title:v.title, url:v.url, note:v.note||'', cover:v.cover||'', createdAt:UI.todayStr() }); DB.save(); rerender(); UI.toast('已收藏'); } }); } }, '+ 添加收藏'));
      return fc2;
    }
    function editFav(f){
      UI.formModal({ title:'编辑收藏', fields:[
        { key:'title', label:'标题', default:f.title }, { key:'url', label:'链接URL', default:f.url },
        { key:'note', label:'备注', type:'textarea', default:f.note||'' }, { key:'cover', label:'封面图URL', default:f.cover||'' }
      ], onSubmit:function(v){ Object.assign(f, { title:v.title, url:v.url, note:v.note, cover:v.cover }); DB.save(); rerender(); UI.toast('已保存'); } });
    }

    // ===== 出游画像卡 =====
    const p = t.profile;
    const prof = el('div', { class: 'card travel-profile' }, [
      el('div', { class: 'card-h' }, [el('h3', null, '🧭 我们家出游画像'), el('span', { class: 'pill sage' }, (p.kid || '') + ' · ' + (p.from || ''))]),
      el('div', { class: 'prof-grid' }, [
        el('div', { class: 'prof-item' }, [el('span', { class: 'k' }, '📍 出发地'), el('span', { class: 'v' }, p.from || '镇江')]),
        el('div', { class: 'prof-item' }, [el('span', { class: 'k' }, '🚗 交通'), el('span', { class: 'v' }, p.rule || '')]),
        el('div', { class: 'prof-item' }, [el('span', { class: 'k' }, '🌡 季节'), el('span', { class: 'v' }, p.climate || '')]),
        el('div', { class: 'prof-item' }, [el('span', { class: 'k' }, '💡 偏好'), el('span', { class: 'v' }, p.prefer || '')])
      ]),
      el('div', { class: 'edit-only', style: { marginTop: '8px' } }, el('button', { class: 'btn sm', onclick: () => editProfile(p) }, '编辑画像'))
    ]);
    c.appendChild(prof);

    // ===== 来源链接卡（含 ☆ 收藏按钮；识别 小红书 / 抖音 / 携程）=====
    function srcCard(src) {
      if (!src) return null;
      const u = src.url || '';
      const isXhs = /xiaohongshu\.com/.test(u);
      const isDy = /douyin\.com/.test(u);
      const isCt = /ctrip\.com|ly\.com/.test(u);
      const host = isXhs ? '📕 小红书' : isDy ? '🎵 抖音' : isCt ? '🟦 携程' : '🔗 来源';
      const fav = isFav(u);
      const short = u.length > 46 ? u.slice(0, 43) + '...' : u;
      return el('div', { class: 'src-pill' + (fav ? ' fav' : '') }, [
        el('span', { class: 'src-host' }, host),
        el('a', { class: 'src-link', href: u, target: '_blank', rel: 'noopener' }, src.title || short),
        el('button', { class: 'fav-btn' + (fav ? ' on' : ''), title: fav ? '取消收藏' : '收藏', onclick: function (e) { e.preventDefault(); e.stopPropagation(); toggleFav(src); rerender(); } }, fav ? '★' : '☆')
      ]);
    }

    // ===== SVG 十六番式行程地图：地点图钉 + 箭头连线 + 交通/天数标注 =====
    function routeMap(route) {
      if (!route || !route.length) return null;
      const W = 360, step = 80;
      const H = 28 + route.length * step;
      const pinX = function (i) { return (i % 2 === 0) ? 104 : 256; };
      const pinY = function (i) { return 34 + i * step; };
      const trunc = function (s, n) { s = s || ''; return s.length > n ? s.slice(0, n) + '…' : s; };
      let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" xmlns="http://www.w3.org/2000/svg" style="display:block">';
      svg += '<defs><marker id="tarr" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L6,3 L0,6 Z" fill="#5B8C84"/></marker>'
        + '<linearGradient id="mpbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAF3F0"/><stop offset="1" stop-color="#F5EFE4"/></linearGradient></defs>';
      svg += '<rect x="4" y="4" width="' + (W - 8) + '" height="' + (H - 8) + '" rx="16" fill="url(#mpbg)" stroke="#CBD9D2" stroke-width="1.5"/>';
      for (let gx = 34; gx < W - 6; gx += 34) svg += '<line x1="' + gx + '" y1="6" x2="' + gx + '" y2="' + (H - 6) + '" stroke="#DCE8E2" stroke-width="0.6"/>';
      for (let gy = 34; gy < H - 6; gy += 34) svg += '<line x1="6" y1="' + gy + '" x2="' + (W - 6) + '" y2="' + gy + '" stroke="#DCE8E2" stroke-width="0.6"/>';
      route.forEach(function (r, i) {
        const x = pinX(i), y = pinY(i);
        if (i > 0) {
          const px = pinX(i - 1), py = pinY(i - 1);
          const my = (py + y) / 2;
          svg += '<path d="M' + px + ' ' + py + ' C ' + px + ' ' + my + ' ' + x + ' ' + my + ' ' + x + ' ' + y + '" fill="none" stroke="#5B8C84" stroke-width="2.6" marker-end="url(#tarr)"/>';
          const label = trunc(((r.trans || '').replace(/[。，]/g, '') + ' ' + (r.dur || '')).trim(), 9);
          if (label) {
            svg += '<rect x="148" y="' + (my - 9) + '" width="64" height="18" rx="9" fill="#ffffff" stroke="#5B8C84" stroke-width="1"/>';
            svg += '<text x="180" y="' + (my + 4) + '" text-anchor="middle" font-size="9.5" fill="#3E6B62">' + escXml(label) + '</text>';
          }
        }
        svg += '<circle cx="' + x + '" cy="' + y + '" r="15" fill="#E07A5F" stroke="#ffffff" stroke-width="2.5"/>';
        svg += '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="#ffffff">D' + r.day + '</text>';
        const right = x < W / 2;
        const tx = right ? x + 22 : x - 22;
        const tAnc = right ? 'start' : 'end';
        svg += '<text x="' + tx + '" y="' + (y - 1) + '" text-anchor="' + tAnc + '" font-size="12" font-weight="700" fill="#2F2F2F">' + escXml(trunc(r.spot, 11)) + '</text>';
        svg += '<text x="' + tx + '" y="' + (y + 13) + '" text-anchor="' + tAnc + '" font-size="9.5" fill="#9A7B5F">' + escXml(trunc(r.ticket || '景点门票', 13)) + '</text>';
      });
      svg += '</svg>';
      const box = el('div', { class: 'route-map' });
      box.innerHTML = svg;
      return box;
    }

    // ===== 路线双栏：左文字版 / 右图文版（路线示意图）=====
    function routeSplit(route) {
      if (!route || !route.length) return null;
      const wrap = el('div', { class: 'route-split' });
      const left = el('div', { class: 'route-text' });
      left.appendChild(el('div', { class: 'rs-h' }, '📝 文字版路线'));
      route.forEach(function (r) {
        left.appendChild(el('div', { class: 'rt-day' }, [
          el('div', { class: 'rt-d' }, 'D' + r.day + ' · ' + r.spot),
          el('div', { class: 'rt-m' }, (r.trans || '—') + ' · ' + (r.dur || '—') + (r.ticket ? ' · ' + r.ticket : '')),
          r.play ? el('div', { class: 'rt-p' }, r.play) : null
        ]));
      });
      const right = el('div', { class: 'route-graphic' });
      right.appendChild(el('div', { class: 'rs-h' }, '🗺 图文版路线'));
      const rm = routeMap(route); if (rm) right.appendChild(rm);
      wrap.appendChild(left); wrap.appendChild(right);
      return wrap;
    }
    function bannerImg(url) {
      const d = el('div', { class: 'travel-banner' });
      const img = el('img', { class: 'travel-banner-img', src: url, alt: '', loading: 'lazy' });
      img.onerror = function () { d.remove(); };
      d.appendChild(img); return d;
    }

    // ===== 🎡 周末遛娃 =====
    const wkKids = (t.weekend || []).map(function (w) {
      const card = el('div', { class: 'card travel-card' });
      const body = el('div', { class: 'tc-body' });
      body.appendChild(el('div', { class: 'card-h' }, [
        Batch.item(w.id, function () { t.weekend = t.weekend.filter(function (x) { return x.id !== w.id; }); }),
        el('h3', null, ['🎡 ', w.dest, w.auto ? el('span', { class: 'pill sage' }, '自动') : null]),
        el('span', { class: 'pill brown' }, w.tag || '周边')
      ]));
      body.appendChild(el('div', { class: 'travel-meta' }, [
        el('span', null, '🚗 ' + (w.drive || '—')),
        el('span', null, '⏱ ' + (w.duration || '—'))
      ]));
      body.appendChild(el('div', { class: 'travel-why' }, '💡 ' + (w.why || '')));
      if (w.plays && w.plays.length) body.appendChild(el('div', { class: 'travel-plays' }, w.plays.map(function (pl) { return el('span', { class: 'chip' }, '🎯 ' + pl); })));
      body.appendChild(el('div', { class: 'row2' }, [el('b', null, '🎫 门票'), el('span', null, w.ticket || '—')]));
      body.appendChild(el('div', { class: 'travel-tip' }, '⚠️ ' + (w.tips || '')));
      if (w.sources && w.sources.length) {
        body.appendChild(el('div', { class: 'muted', style: { fontWeight: 600, margin: '6px 0 2px' } }, '📎 参考来源（小红书 / 抖音）'));
        const sc = el('div', { class: 'src-list' });
        w.sources.forEach(function (s) { const x = srcCard(s); if (x) sc.appendChild(x); });
        body.appendChild(sc);
      }
      body.appendChild(el('div', { class: 'act edit-only', style: { marginTop: '8px', gap: '8px' } }, [
        el('button', { class: 'btn sm', onclick: () => editWeekend(w) }, '改'),
        el('button', { class: 'btn sm', onclick: () => { if (confirm('删除？')) { t.weekend = t.weekend.filter(function (x) { return x.id !== w.id; }); DB.save(); rerender(); } } }, '删')
      ]));
      card.appendChild(body);
      card.appendChild(coverBox(w.dest, w.cover));
      return card;
    });
    if (!wkKids.length) wkKids.push(empty('暂无周末遛娃推荐，每日 6:00 自动推送'));
    const wkCard = card('🎡 周末遛娃（镇江周边 · 每日自动推送）', '', wkKids);
    wkCard.appendChild(el('button', { class: 'add-btn edit-only', onclick: () => UI.formModal({ title: '添加周末遛娃地', fields: [
      { key: 'dest', label: '目的地' }, { key: 'drive', label: '车程/交通' }, { key: 'tag', label: '标签', default: '寓教于乐' },
      { key: 'duration', label: '建议时长' }, { key: 'why', label: '推荐理由', type: 'textarea' },
      { key: 'plays', label: '玩法亮点(换行分隔)' }, { key: 'ticket', label: '门票/价格' }, { key: 'tips', label: '注意事项', type: 'textarea' }
    ], onSubmit: function (v) { t.weekend.push({ id: DB.uid(), dest: v.dest, drive: v.drive, tag: v.tag, duration: v.duration, why: v.why, plays: (v.plays || '').split('\n').filter(Boolean), ticket: v.ticket, tips: v.tips, sources: [] }); DB.save(); rerender(); UI.toast('已添加'); } } ) }, '+ 添加周末地'));
    // ===== 顶部 Tab：全部 / 我的收藏 =====
    const travelTab = window.__travelTab || 'all';
    c.appendChild(el('div', { class: 'seg' }, [ segBtn('all', '📋 全部'), segBtn('fav', '⭐ 我的收藏') ]));
    if (travelTab === 'fav') {
      c.appendChild(favView());
    } else {
      c.appendChild(wkCard);

    // ===== ✈️ 长途旅行 =====
    const ltKids = (t.longtrip || []).map(function (l) {
      const card = el('div', { class: 'card travel-card travel-col' });
      const body = el('div', { class: 'tc-body' });
      body.appendChild(el('div', { class: 'card-h' }, [
        Batch.item(l.id, function () { t.longtrip = t.longtrip.filter(function (x) { return x.id !== l.id; }); }),
        el('h3', null, ['✈️ ', l.dest, l.auto ? el('span', { class: 'pill sage' }, '自动') : null]),
        el('span', { class: 'pill sage' }, l.days + '天 · ' + (l.season || ''))
      ]));
      body.appendChild(el('div', { class: 'row2' }, [el('b', null, '🚉 从镇江出发'), el('span', null, l.fromTrans || '—')]));
      body.appendChild(el('div', { class: 'travel-tip' }, '🎫 ' + (l.ticketTip || '')));
      const rs = routeSplit(l.route); if (rs) body.appendChild(rs);
      if (l.budget && l.budget.length) {
        let sum = 0;
        const tbl = el('table', { class: 'tbl' });
        tbl.appendChild(el('tr', null, ['类别', '项目', '价格', '来源'].map(function (h) { return el('th', null, h); })));
        l.budget.forEach(function (b) { sum += (+b.price) || 0; tbl.appendChild(el('tr', null, [el('td', null, b.cat), el('td', null, b.item), el('td', null, '¥' + b.price), el('td', null, b.src || '')])); });
        body.appendChild(el('div', { class: 'muted', style: { fontWeight: 600, margin: '8px 0 2px' } }, '💰 预算清单（含来源）'));
        body.appendChild(el('div', { class: 'tbl-wrap' }, [tbl]));
        body.appendChild(el('div', { class: 'muted', style: { fontWeight: 700, marginTop: '4px' } }, '合计预估：¥' + sum));
      }
      if (l.stay && l.stay.length) body.appendChild(el('div', { class: 'travel-line' }, [el('b', null, '🏨 住：'), l.stay.join(' / ')]));
      if (l.eat && l.eat.length) body.appendChild(el('div', { class: 'travel-line' }, [el('b', null, '🍜 吃：'), l.eat.join(' / ')]));
      if (l.luggage && l.luggage.length) body.appendChild(el('div', { class: 'travel-line' }, [el('b', null, '🧳 行李：'), l.luggage.join(' · ')]));
      if (l.sources && l.sources.length) {
        body.appendChild(el('div', { class: 'muted', style: { fontWeight: 600, margin: '6px 0 2px' } }, '📎 参考来源（小红书 / 抖音）'));
        const sc = el('div', { class: 'src-list' });
        l.sources.forEach(function (s) { const x = srcCard(s); if (x) sc.appendChild(x); });
        body.appendChild(sc);
      }
      body.appendChild(el('div', { class: 'act edit-only', style: { marginTop: '8px', gap: '8px' } }, [
        el('button', { class: 'btn sm', onclick: () => editLongtrip(l) }, '改'),
        el('button', { class: 'btn sm', onclick: () => { if (confirm('删除？')) { t.longtrip = t.longtrip.filter(function (x) { return x.id !== l.id; }); DB.save(); rerender(); } } }, '删')
      ]));
      if (l.cover) card.appendChild(bannerImg(l.cover));
      card.appendChild(body);
      return card;
    });
    if (!ltKids.length) ltKids.push(empty('暂无长途旅行推荐，每日 6:00 自动推送'));
    const ltCard = card('✈️ 长途旅行（4-8天规划 · 每日自动推送）', '', ltKids);
    ltCard.appendChild(el('button', { class: 'add-btn edit-only', onclick: () => UI.formModal({ title: '添加长途旅行', fields: [
      { key: 'dest', label: '目的地' }, { key: 'days', label: '天数', type: 'number' }, { key: 'season', label: '季节适宜' },
      { key: 'fromTrans', label: '从镇江出发交通', type: 'textarea' }, { key: 'ticketTip', label: '订票建议', type: 'textarea' }
    ], onSubmit: function (v) { t.longtrip.push({ id: DB.uid(), dest: v.dest, days: +v.days, season: v.season, fromTrans: v.fromTrans, ticketTip: v.ticketTip, route: [], budget: [], stay: [], eat: [], luggage: [], sources: [] }); DB.save(); rerender(); UI.toast('已添加'); } } ) }, '+ 添加长途'));
      c.appendChild(ltCard);
    }

    // ===== 编辑函数 =====
    function editProfile(pr) {
      UI.formModal({ title: '编辑出游画像', fields: [
        { key: 'from', label: '出发地', default: pr.from || '' },
        { key: 'kid', label: '娃', default: pr.kid || '' },
        { key: 'rule', label: '交通规则', type: 'textarea', default: pr.rule || '' },
        { key: 'climate', label: '季节偏好', default: pr.climate || '' },
        { key: 'prefer', label: '偏好', default: pr.prefer || '' }
      ], onSubmit: function (v) { Object.assign(pr, v); DB.save(); rerender(); UI.toast('已保存'); } });
    }
    function editWeekend(w) {
      UI.formModal({ title: '编辑周末遛娃', fields: [
        { key: 'dest', label: '目的地', default: w.dest }, { key: 'drive', label: '车程/交通', default: w.drive || '' },
        { key: 'tag', label: '标签', default: w.tag || '' }, { key: 'duration', label: '建议时长', default: w.duration || '' },
        { key: 'why', label: '推荐理由', type: 'textarea', default: w.why || '' },
        { key: 'plays', label: '玩法亮点(换行)', type: 'textarea', default: (w.plays || []).join('\n') },
        { key: 'ticket', label: '门票/价格', type: 'textarea', default: w.ticket || '' },
        { key: 'tips', label: '注意事项', type: 'textarea', default: w.tips || '' },
        { key: 'cover', label: '封面图URL(可选)', default: w.cover || '' }
      ], onSubmit: function (v) { Object.assign(w, { dest: v.dest, drive: v.drive, tag: v.tag, duration: v.duration, why: v.why, plays: (v.plays || '').split('\n').filter(Boolean), ticket: v.ticket, tips: v.tips, cover: v.cover || '' }); DB.save(); rerender(); UI.toast('已保存'); } });
    }
    function editLongtrip(l) {
      UI.formModal({ title: '编辑长途旅行', fields: [
        { key: 'dest', label: '目的地', default: l.dest }, { key: 'days', label: '天数', type: 'number', default: l.days },
        { key: 'season', label: '季节适宜', default: l.season || '' }, { key: 'fromTrans', label: '从镇江出发', type: 'textarea', default: l.fromTrans || '' },
        { key: 'ticketTip', label: '订票建议', type: 'textarea', default: l.ticketTip || '' },
        { key: 'cover', label: '封面图URL(可选)', default: l.cover || '' }
      ], onSubmit: function (v) { Object.assign(l, { dest: v.dest, days: +v.days, season: v.season, fromTrans: v.fromTrans, ticketTip: v.ticketTip, cover: v.cover || '' }); DB.save(); rerender(); UI.toast('已保存'); } });
    }
  };
;

  /* ---------------- 英文政策雷达 ---------------- */
  V.english = function (c) {
    const d = DB.get();
    d.english.forEach(p => {
      const card = el('div', { class: 'card' });
      card.appendChild(el('div', { class: 'card-h' }, [
        Batch.item(p.id, () => { d.english = d.english.filter(x => x.id !== p.id); }),
        el('h3', null, [el('span', { class: 'pill ' + (p.bookmark ? 'coral' : 'brown'), onclick: () => { p.bookmark = !p.bookmark; DB.save(); rerender(); }, style: { cursor: 'pointer' } }, p.bookmark ? '⭐ 已收藏' : '☆ 收藏'), '  ', p.title]),
      ]));
      card.appendChild(el('div', { class: 'muted', style: { marginBottom: '8px' } }, '📄 出处：' + p.source + ' · ' + UI.prettyDate(p.date)));
      card.appendChild(el('div', null, [el('b', null, '重点：'), p.key]));
      card.appendChild(el('div', { style: { marginTop: '6px' } }, [el('b', null, '影响分析：'), p.impact]));
      card.appendChild(el('div', { class: 'act', style: { marginTop: '10px', gap: '8px' } }, [
        el('button', { class: 'btn sm edit-only', onclick: () => editPolicy(p) }, '改'),
        el('button', { class: 'btn sm edit-only', onclick: () => { if (confirm('删除？')) { d.english = d.english.filter(x => x.id !== p.id); DB.save(); rerender(); } } }, '删')
      ]));
      c.appendChild(card);
    });
    c.appendChild(el('button', { class: 'add-btn', onclick: () => UI.formModal({ title: '添加政策更新', fields: [
      { key: 'title', label: '标题' }, { key: 'source', label: '文件出处' }, { key: 'key', label: '重点内容', type: 'textarea' },
      { key: 'impact', label: '对学生/教学的影响', type: 'textarea' }
    ], onSubmit: v => { d.english.unshift({ id: DB.uid(), title: v.title, source: v.source, date: UI.todayStr(), key: v.key, impact: v.impact, bookmark: false }); DB.save(); rerender(); UI.toast('已添加政策'); } } ) }, '+ 添加政策更新'));

    function editPolicy(p) {
      UI.formModal({ title: '编辑政策', fields: [
        { key: 'title', label: '标题', default: p.title }, { key: 'source', label: '文件出处', default: p.source },
        { key: 'key', label: '重点内容', type: 'textarea', default: p.key }, { key: 'impact', label: '影响分析', type: 'textarea', default: p.impact }
      ], onSubmit: v => { Object.assign(p, v); DB.save(); rerender(); UI.toast('已保存'); } });
    }
  };

  /* ---------------- 菜谱与食材 ---------------- */
  V.recipe = function (c) {
    const d = DB.get(); const r = d.recipes; const recipes = r.recipes || [];
    // 食材管理
    const inv = el('div', { class: 'card' });
    inv.appendChild(el('div', { class: 'card-h' }, [el('h3', null, '🧺 食材耗材管理'), el('span', { class: 'pill brown' }, r.inventory.length + ' 项')]));
    const tbl = el('table', { class: 'tbl' });
    tbl.appendChild(el('tr', null, ['', '图标', '名称', '数量', '价格', '采购日', '渠道', '临期', ''].map(h => el('th', null, h))));
    r.inventory.forEach(it => {
      const exp = it.expire != null && it.expire <= 2;
      tbl.appendChild(el('tr', null, [
        el('td', null, Batch.item(it.id, () => { r.inventory = r.inventory.filter(x => x.id !== it.id); })),
        el('td', null, it.emoji), el('td', null, it.name), el('td', null, it.qty + it.unit),
        el('td', null, '¥' + it.price), el('td', null, it.buy), el('td', null, it.channel),
        el('td', null, el('span', { class: 'pill ' + (exp ? 'coral' : 'sage') }, exp ? '⚠️' + it.expire + '天' : (it.expire + '天'))),
        el('td', null, el('div', { class: 'act', style: { gap: '4px' } }, [
          el('button', { class: 'btn sm edit-only', onclick: () => editItem(it) }, '改'),
          el('button', { class: 'btn sm edit-only', onclick: () => { if (confirm('删除该食材？')) { r.inventory = r.inventory.filter(x => x.id !== it.id); DB.save(); rerender(); } } }, '删')
        ]))
      ]));
    });
    inv.appendChild(el('div', { class: 'tbl-wrap' }, [tbl]));
    inv.appendChild(el('button', { class: 'add-btn edit-only', onclick: () => UI.formModal({ title: '添加食材', fields: [
      { key: 'emoji', label: '图标emoji', default: '🥬' }, { key: 'name', label: '名称' }, { key: 'qty', label: '数量', type: 'number', default: 1 },
      { key: 'unit', label: '单位', default: '个' }, { key: 'price', label: '价格', type: 'number' }, { key: 'channel', label: '采购渠道', default: '盒马' },
      { key: 'expire', label: '保质天数', type: 'number', default: 7 }
    ], onSubmit: v => { r.inventory.push({ id: DB.uid(), emoji: v.emoji, name: v.name, qty: +v.qty, unit: v.unit, price: +v.price, buy: UI.todayStr(), channel: v.channel, expire: +v.expire }); DB.save(); rerender(); UI.toast('已入库'); } } ) }, '+ 添加食材'));
    c.appendChild(inv);

    // 按现有食材推荐
    const have = r.inventory.map(i => i.name);
    const matched = recipes.filter(rc => rc.need.some(n => have.includes(n)));
    const rec = el('div', { class: 'card' });
    rec.appendChild(el('div', { class: 'card-h' }, [el('h3', null, '👩‍🍳 现有食材可做的菜'), el('button', { class: 'btn sm', onclick: () => rerender() }, '刷新')]));
    if (matched.length) matched.forEach(m => rec.appendChild(el('div', { class: 'li' }, [
      el('div', { class: 'body' }, [el('div', { class: 't' }, m.emoji + ' ' + m.name), el('div', { class: 's' }, '需要：' + m.need.join('、'))]),
      el('button', { class: 'btn sm', onclick: () => { r.fav.push({ id: DB.uid(), name: m.name, emoji: m.emoji, ing: m.need.join('·'), note: '' }); DB.save(); UI.toast('已收藏 ' + m.name); } }, '收藏')
    ]))); else rec.appendChild(empty('现有食材暂无可匹配菜谱，去加采购吧'));
    c.appendChild(rec);

    // 菜谱知识库（可增删改，决定「现有食材可做的菜」）
    const rKids = recipes.map(rc => el('div', { class: 'li' }, [
      Batch.item(rc.id, () => { r.recipes = r.recipes.filter(x => x.id !== rc.id); }),
      el('div', { class: 'body' }, [el('div', { class: 't' }, (rc.emoji || '🍽') + ' ' + rc.name), el('div', { class: 's' }, '需要：' + rc.need.join('、'))]),
      el('button', { class: 'btn sm edit-only', onclick: () => editRecipe(rc) }, '改'),
      el('button', { class: 'btn sm edit-only', onclick: () => { if (confirm('删除该菜谱？')) { r.recipes = r.recipes.filter(x => x.id !== rc.id); DB.save(); rerender(); } } }, '删')
    ]));
    if (!rKids.length) rKids.push(empty('菜谱库为空，点击下方添加'));
    const rkCard = card('📖 菜谱知识库', '🗂', rKids);
    rkCard.appendChild(el('button', { class: 'add-btn edit-only', onclick: () => UI.formModal({ title: '添加菜谱', fields: [
      { key: 'name', label: '菜名' }, { key: 'emoji', label: '图标', default: '🍽' }, { key: 'need', label: '所需食材(逗号分隔)', default: '鸡蛋, 番茄' }
    ], onSubmit: v => { r.recipes.push({ id: DB.uid(), name: v.name, emoji: v.emoji, need: v.need.split(',').map(s => s.trim()).filter(Boolean) }); DB.save(); rerender(); UI.toast('已添加菜谱'); } } ) }, '+ 添加菜谱'));
    c.appendChild(rkCard);

    // 次日食谱
    ['早餐', '午餐', '晚餐'].forEach(type => {
      const items = r.plan.filter(p => p.type === type);
      const kids = items.map(p => el('div', { class: 'li' }, [
        Batch.item(p.id, () => { r.plan = r.plan.filter(x => x.id !== p.id); }),
        el('div', { class: 'body' }, [el('div', { class: 't' }, (p.emoji || '🍽') + ' ' + p.name),
          el('div', { class: 's' }, '食材：' + p.ing.map(i => i.n + (i.a ? '(' + i.a + ')' : '')).join('、') + (p.season && p.season.length ? ' ｜ 佐料：' + p.season.join('、') : '') + (p.media ? ' ｜🔗' + p.media : ''))]),
        el('button', { class: 'btn sm', onclick: () => { if (!r.fav.find(f => f.name === p.name)) r.fav.push({ id: DB.uid(), name: p.name, emoji: p.emoji, ing: p.ing.map(i => i.n).join('·'), note: '' }); DB.save(); UI.toast('已收藏'); } }, '⭐'),
        el('button', { class: 'btn sm edit-only', onclick: () => editMeal(p, type) }, '改'),
        el('button', { class: 'btn sm edit-only', onclick: () => { if (confirm('删除？')) { r.plan = r.plan.filter(x => x.id !== p.id); DB.save(); rerender(); } } }, '删')
      ]));
      if (!kids.length) kids.push(empty('暂无'));
      const mealCard = card(type, '🍽', kids);
      mealCard.appendChild(el('button', { class: 'add-btn edit-only', onclick: () => UI.formModal({ title: '添加' + type, fields: [
        { key: 'name', label: '菜名' }, { key: 'emoji', label: '图标', default: '🍽' },
        { key: 'ing', label: '食材(名称:用量, 逗号分隔)', default: '番茄:1个, 鸡蛋:2个' },
        { key: 'season', label: '佐料(逗号分隔)', default: '盐, 油' }, { key: 'media', label: '图文/视频链接' }
      ], onSubmit: v => {
        const ing = v.ing.split(',').map(s => { const [n, a] = s.split(':'); return { n: n.trim(), a: (a || '').trim() }; });
        const season = v.season.split(',').map(s => s.trim()).filter(Boolean);
        r.plan.push({ id: DB.uid(), type, name: v.name, emoji: v.emoji, media: v.media, ing, season });
        DB.save(); rerender(); UI.toast('已加入' + type);
      } } ) }, '+ 添加' + type));
      c.appendChild(mealCard);
    });

    // 收藏
    const fKids = r.fav.map(f => el('div', { class: 'li' }, [
      Batch.item(f.id, () => { r.fav = r.fav.filter(x => x.id !== f.id); }),
      el('div', { class: 'body' }, [el('div', { class: 't' }, (f.emoji || '⭐') + ' ' + f.name), el('div', { class: 's' }, f.ing + (f.note ? ' ｜' + f.note : ''))]),
      el('button', { class: 'btn sm edit-only', onclick: () => editFav(f) }, '改'),
      el('button', { class: 'btn sm edit-only', onclick: () => { if (confirm('取消收藏？')) { r.fav = r.fav.filter(x => x.id !== f.id); DB.save(); rerender(); } } }, '取消')
    ]));
    if (!fKids.length) fKids.push(empty('还没有收藏的菜谱'));
    c.appendChild(card('⭐ 收藏菜谱', '📌', fKids));

    function editItem(it) {
      UI.formModal({ title: '编辑食材', fields: [
        { key: 'emoji', label: '图标emoji', default: it.emoji }, { key: 'name', label: '名称', default: it.name },
        { key: 'qty', label: '数量', type: 'number', default: it.qty }, { key: 'unit', label: '单位', default: it.unit },
        { key: 'price', label: '价格', type: 'number', default: it.price }, { key: 'channel', label: '采购渠道', default: it.channel },
        { key: 'expire', label: '保质天数', type: 'number', default: it.expire }
      ], onSubmit: v => { Object.assign(it, { emoji: v.emoji, name: v.name, qty: +v.qty, unit: v.unit, price: +v.price, channel: v.channel, expire: +v.expire }); DB.save(); rerender(); UI.toast('已保存'); } });
    }
    function editMeal(p, type) {
      UI.formModal({ title: '编辑' + type, fields: [
        { key: 'name', label: '菜名', default: p.name }, { key: 'emoji', label: '图标', default: p.emoji || '🍽' },
        { key: 'ing', label: '食材(名称:用量, 逗号分隔)', default: p.ing.map(i => i.n + (i.a ? ':' + i.a : '')).join(', ') },
        { key: 'season', label: '佐料(逗号分隔)', default: (p.season || []).join(', ') }, { key: 'media', label: '图文/视频链接', default: p.media || '' }
      ], onSubmit: v => {
        const ing = v.ing.split(',').map(s => { const [n, a] = s.split(':'); return { n: n.trim(), a: (a || '').trim() }; });
        const season = v.season.split(',').map(s => s.trim()).filter(Boolean);
        Object.assign(p, { name: v.name, emoji: v.emoji, media: v.media, ing, season }); DB.save(); rerender(); UI.toast('已保存');
      } });
    }
    function editFav(f) {
      UI.formModal({ title: '编辑收藏菜谱', fields: [
        { key: 'name', label: '菜名', default: f.name }, { key: 'emoji', label: '图标', default: f.emoji || '⭐' },
        { key: 'ing', label: '食材(名称·用量 逗号分隔)', default: f.ing || '' }, { key: 'note', label: '备注/做法', type: 'textarea', default: f.note || '' }
      ], onSubmit: v => { Object.assign(f, { name: v.name, emoji: v.emoji, ing: v.ing, note: v.note }); DB.save(); rerender(); UI.toast('已保存'); } });
    }
    function editRecipe(rc) {
      UI.formModal({ title: '编辑菜谱', fields: [
        { key: 'name', label: '菜名', default: rc.name }, { key: 'emoji', label: '图标', default: rc.emoji || '🍽' },
        { key: 'need', label: '所需食材(逗号分隔)', default: rc.need.join(', ') }
      ], onSubmit: v => { Object.assign(rc, { name: v.name, emoji: v.emoji, need: v.need.split(',').map(s => s.trim()).filter(Boolean) }); DB.save(); rerender(); UI.toast('已保存'); } });
    }
  };

  /* ---------------- 灵光随手记 ---------------- */
  V.light = function (c) {
    const d = DB.get();
    c.appendChild(el('button', { class: 'btn', style: { marginBottom: '12px' }, onclick: () => {
      const v = prompt('✨ 记一笔：'); if (v) { d.notes.unshift({ id: DB.uid(), text: v, time: UI.todayStr() + ' ' + new Date().toTimeString().slice(0, 5) }); DB.save(); rerender(); UI.toast('已记录'); }
    } }, '✨ 随手记'));
    if (!d.notes.length) c.appendChild(empty('还没有记录，点上方记一笔'));
    d.notes.forEach(n => c.appendChild(el('div', { class: 'note' }, [
      Batch.item(n.id, () => { d.notes = d.notes.filter(x => x.id !== n.id); }),
      el('div', null, n.text),
      el('div', { class: 'muted', style: { fontSize: '11px', marginTop: '4px' } }, n.time),
      el('div', { class: 'act', style: { marginTop: '6px', gap: '6px' } }, [
        el('button', { class: 'btn sm', onclick: () => { const v = prompt('编辑这条：', n.text); if (v != null && v.trim()) { n.text = v.trim(); DB.save(); rerender(); } } }, '改'),
        el('button', { class: 'btn sm', onclick: () => { if (confirm('删除这条记录？')) { d.notes = d.notes.filter(x => x.id !== n.id); DB.save(); rerender(); } } }, '删')
      ])
    ])));
  };

  /* ---------------- WANZI 钢琴（卡通） ---------------- */
  V.wpiano = function (c) {
    const d = DB.get(); const list = d.wanzipiano;
    const done = list.filter(p => p.done).length;
    c.appendChild(el('div', { class: 'kpi' }, [kpiCard(done + '/' + list.length, '🐻打卡'), kpiCard(Math.round(done / list.length * 100) + '%', '完成度')]));
    list.forEach(p => {
      const play = el('div', { class: 'play' }, [
        Batch.item(p.id, () => { d.wanzipiano = d.wanzipiano.filter(x => x.id !== p.id); }),
        el('div', { class: 'big' }, '🎹'),
        el('div', { class: 't', style: { fontWeight: 700, marginTop: '4px' } }, 'Day ' + p.day + ' · ' + p.title),
        el('div', { class: 's', style: { fontSize: '13px', color: 'var(--muted)' } }, p.content + (p.media ? ' 🔗' + p.media : '')),
        guideBlock(p),
        el('div', { style: { marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' } }, [
          UI.switchEl(p.done, on => { p.done = on; DB.save(); rerender(); }),
          el('span', { class: 'muted', style: { fontSize: '12px' } }, p.done ? '今天打卡啦 🎉' : '还没打卡哦'),
          el('button', { class: 'btn sm edit-only', onclick: () => editLesson(p) }, '改'),
          el('button', { class: 'btn sm edit-only', onclick: () => { if (confirm('删除？')) { d.wanzipiano = d.wanzipiano.filter(x => x.id !== p.id); DB.save(); rerender(); } } }, '删')
        ])
      ]);
      c.appendChild(play);
    });
    c.appendChild(el('button', { class: 'add-btn edit-only', onclick: () => UI.formModal({ title: '添加钢琴课', fields: [
      { key: 'day', label: '天数', type: 'number', default: list.length + 1 }, { key: 'title', label: '标题(童趣)' }, { key: 'content', label: '内容', type: 'textarea' }, { key: 'media', label: '链接' }
    ].concat(GUIDE_FIELDS), onSubmit: v => { d.wanzipiano.push({ id: DB.uid(), day: +v.day, title: v.title, content: v.content, media: v.media, guide: v.guide, guideMedia: v.guideMedia, guideImages: v.guideImages, done: false }); DB.save(); rerender(); UI.toast('已添加'); } } ) }, '+ 添加课程'));

    function editLesson(p) {
      UI.formModal({ title: '编辑课程', fields: [
        { key: 'title', label: '标题(童趣)', default: p.title }, { key: 'content', label: '内容', type: 'textarea', default: p.content },
        { key: 'media', label: '链接', default: p.media || '' }
      ].concat(GUIDE_FIELDS.map(f => Object.assign({}, f, { default: p[f.key] || '' }))), onSubmit: v => { Object.assign(p, { title: v.title, content: v.content, media: v.media, guide: v.guide, guideMedia: v.guideMedia, guideImages: v.guideImages }); DB.save(); rerender(); UI.toast('已保存'); } });
    }
  };

  /* ---------------- WANZI 舞蹈 ---------------- */
  V.wdance = function (c) {
    const d = DB.get(); const w = d.wanzidance;
    const card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'card-h' }, [el('h3', null, '🩰 舞蹈课程'), el('span', { class: 'pill coral' }, '剩余 ' + w.remaining + ' 次')]));
    const todayLog = w.logs.find(l => l.date === UI.todayStr());
    if (todayLog) {
      card.appendChild(el('div', { class: 'li', style: { background: 'var(--coral-bg)' } }, [
        Batch.item(todayLog.id, () => { w.logs = w.logs.filter(x => x.id !== todayLog.id); }),
        el('div', { class: 'body' }, [el('div', { class: 't' }, '今日群内容：' + todayLog.content + (todayLog.media ? ' 🔗' + todayLog.media : '')),
          el('div', { class: 's' }, todayLog.done ? '✅ 已打卡' : '待打卡')]),
        el('div', { class: 'act', style: { gap: '6px' } }, [
          el('button', { class: 'btn sm edit-only', onclick: () => editLog(todayLog) }, '改'),
          UI.switchEl(todayLog.done, on => { todayLog.done = on; DB.save(); rerender(); })
        ])
      ]));
    } else {
      card.appendChild(el('div', { class: 'li' }, [el('div', { class: 'body' }, [el('div', { class: 't' }, '今日还没录入群内容')]),
        el('button', { class: 'btn sm edit-only', onclick: () => UI.formModal({ title: '录入今日群内容', fields: [{ key: 'content', label: '老师发的课程内容', type: 'textarea' }, { key: 'media', label: '视频/图文链接' }], onSubmit: v => { w.logs.unshift({ id: DB.uid(), date: UI.todayStr(), content: v.content, media: v.media, done: false }); DB.save(); rerender(); UI.toast('已录入'); } } ) }, '录入')]));
    }
    card.appendChild(el('button', { class: 'add-btn edit-only', onclick: () => UI.formModal({ title: '调整剩余次数', fields: [{ key: 'remaining', label: '剩余次数', type: 'number', default: w.remaining }], onSubmit: v => { w.remaining = +v.remaining; DB.save(); rerender(); UI.toast('已更新'); } } ) }, '调整剩余次数'));
    c.appendChild(card);

    const logs = el('div', { class: 'card' });
    logs.appendChild(el('div', { class: 'card-h' }, el('h3', null, '📜 往期练习记录')));
    w.logs.slice().reverse().forEach(l => logs.appendChild(el('div', { class: 'li' }, [
      Batch.item(l.id, () => { w.logs = w.logs.filter(x => x.id !== l.id); }),
      el('div', { class: 'body' }, [el('div', { class: 't' }, UI.prettyDate(l.date) + (l.done ? ' ✅' : '')), el('div', { class: 's' }, l.content)]),
      el('button', { class: 'btn sm edit-only', onclick: () => editLog(l) }, '改'),
      el('button', { class: 'btn sm edit-only', onclick: () => { if (confirm('删除？')) { w.logs = w.logs.filter(x => x.id !== l.id); DB.save(); rerender(); } } }, '删')
    ])));
    c.appendChild(logs);

    function editLog(l) {
      UI.formModal({ title: '编辑练习记录', fields: [
        { key: 'content', label: '课程内容', type: 'textarea', default: l.content || '' },
        { key: 'media', label: '视频/图文链接', default: l.media || '' },
        { key: 'date', label: '日期(YYYY-MM-DD)', default: l.date },
        { key: 'done', label: '是否已打卡', type: 'select', options: [{ value: '1', label: '已打卡' }, { value: '0', label: '未打卡' }], default: l.done ? '1' : '0' }
      ], onSubmit: v => { l.content = v.content; l.media = v.media; l.date = v.date; l.done = v.done === '1'; DB.save(); rerender(); UI.toast('已保存'); } });
    }
  };

  /* ---------------- WANZI 课表 ---------------- */
  V.wsched = function (c) {
    const d = DB.get();
    d.wanzisched.forEach(s => {
      const isToday = s.day === new Date().getDay();
      const card = el('div', { class: 'card' });
      card.appendChild(el('div', { class: 'card-h' }, [
        Batch.item(s.id, () => { d.wanzisched = d.wanzisched.filter(x => x.id !== s.id); }),
        el('h3', null, (isToday ? '⏰ 今天 ' : '') + s.label),
        el('span', { class: 'pill ' + (isToday ? 'sage' : 'brown') }, '已上 ' + s.taken + '/' + s.total)
      ]));
      card.appendChild(el('div', { class: 'muted' }, UI.weekdayCN(new Date(weekDate(s.day))) + ' ' + s.time));
      if (isToday) card.appendChild(el('button', { class: 'btn', style: { marginTop: '10px' }, onclick: () => { if (s.taken < s.total) { s.taken++; DB.save(); rerender(); UI.toast('今日打卡 +1'); } else UI.toast('已完成本周期'); } }, '✅ 今日打卡'));
      card.appendChild(el('div', { class: 'act', style: { marginTop: '8px', gap: '8px' } }, [
        el('button', { class: 'btn sm edit-only', onclick: () => UI.formModal({ title: '编辑课表', fields: [{ key: 'label', label: '名称', default: s.label }, { key: 'time', label: '时间', default: s.time }, { key: 'taken', label: '已上', type: 'number', default: s.taken }, { key: 'total', label: '总次', type: 'number', default: s.total }], onSubmit: v => { Object.assign(s, { label: v.label, time: v.time, taken: +v.taken, total: +v.total }); DB.save(); rerender(); UI.toast('已保存'); } } ) }, '改'),
        el('button', { class: 'btn sm edit-only', onclick: () => { if (confirm('删除？')) { d.wanzisched = d.wanzisched.filter(x => x.id !== s.id); DB.save(); rerender(); } } }, '删')
      ]));
      c.appendChild(card);
    });
    c.appendChild(el('button', { class: 'add-btn edit-only', onclick: () => UI.formModal({ title: '添加课表', fields: [
      { key: 'label', label: '名称(如 钢琴 🎹)' }, { key: 'day', label: '星期(1-6=周一至六,0=周日)', type: 'number', default: new Date().getDay() },
      { key: 'time', label: '时间', default: '19:00' }, { key: 'taken', label: '已上', type: 'number', default: 0 }, { key: 'total', label: '总次', type: 'number', default: 12 }
    ], onSubmit: v => { d.wanzisched.push({ id: DB.uid(), label: v.label, day: +v.day, time: v.time, taken: +v.taken, total: +v.total }); DB.save(); rerender(); UI.toast('已添加'); } } ) }, '+ 添加课程'));
  };

  const MODULES = [
    { group: 'VAVA', cls: 'vava', items: [
      { id: 'work', icon: '📅', title: '工作安排', render: V.work, home: true },
      { id: 'piano', icon: '🎹', title: '钢琴系统课', render: V.piano },
      { id: 'xhs', icon: '📕', title: '双账号运营', render: V.xhs },
      { id: 'travel', icon: '✈️', title: '旅游攻略', render: V.travel },
      { id: 'english', icon: '🔤', title: '英文政策雷达', render: V.english },
      { id: 'recipe', icon: '🍳', title: '菜谱与食材', render: V.recipe },
      { id: 'light', icon: '✨', title: '灵光随手记', render: V.light }
    ] },
    { group: 'WANZI', cls: 'wanzi', items: [
      { id: 'wpiano', icon: '🎹', title: '钢琴打卡', render: V.wpiano },
      { id: 'wdance', icon: '🩰', title: '舞蹈课程', render: V.wdance },
      { id: 'wsched', icon: '🗓', title: '课表提醒', render: V.wsched }
    ] }
  ];

  return { MODULES, V };
})();
