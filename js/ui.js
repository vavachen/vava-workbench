/* ===== VAVA 工作台 · UI 通用组件 ===== */
const UI = (function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 1900);
  }
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (children != null) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null) return;
        e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return e;
  }
  // 通用表单弹窗
  function formModal({ title, fields, values = {}, onSubmit, submitText = '保存' }) {
    const root = document.getElementById('modal-root');
    const body = el('div');
    const inputs = {};
    fields.forEach(f => {
      const val = values[f.key] != null ? values[f.key] : (f.default || '');
      let input;
      if (f.type === 'textarea') input = el('textarea', { name: f.key, placeholder: f.placeholder || '' });
      else if (f.type === 'select') {
        input = el('select', { name: f.key });
        (f.options || []).forEach(o => {
          const opt = el('option', { value: o.value != null ? o.value : o }, o.label != null ? o.label : o);
          if (String(val) === String(o.value != null ? o.value : o)) opt.selected = true;
          input.appendChild(opt);
        });
      } else if (f.type === 'checkbox') { input = el('input', { name: f.key, type: 'checkbox' }); input.checked = !!val; }
      else input = el('input', { name: f.key, type: f.type || 'text', placeholder: f.placeholder || '', value: val });
      input.value = val;
      inputs[f.key] = input;
      body.appendChild(wrapField(f.label, input));
    });
    const modal = el('div', { class: 'modal' }, [
      el('h3', null, title),
      body,
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn ghost', onclick: close }, '取消'),
        el('button', { class: 'btn', onclick: () => {
          const out = {}; fields.forEach(f => { out[f.key] = f.type === 'checkbox' ? inputs[f.key].checked : inputs[f.key].value; }); close(); onSubmit(out);
        } }, submitText)
      ])
    ]);
    open(modal);
  }
  function wrapField(label, input) {
    return el('div', { class: 'field' }, [el('label', null, label), input]);
  }
  function confirmModal(msg, onYes, yesText = '确定') {
    const modal = el('div', { class: 'modal' }, [
      el('h3', null, '请确认'),
      el('p', { class: 'muted', style: { margin: '0 0 14px' } }, msg),
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn ghost', onclick: close }, '取消'),
        el('button', { class: 'btn coral', onclick: () => { close(); onYes(); } }, yesText)
      ])
    ]);
    open(modal);
  }
  function open(node) {
    const root = document.getElementById('modal-root');
    root.innerHTML = ''; root.appendChild(node);
    document.getElementById('mask').classList.add('show');
  }
  function close() {
    document.getElementById('modal-root').innerHTML = '';
    document.getElementById('mask').classList.remove('show');
  }
  document.getElementById('mask').addEventListener('click', close);

  // 日期工具
  function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function weekdayCN(d) { return ['周日','周一','周二','周三','周四','周五','周六'][new Date(d).getDay()]; }
  function prettyDate(d) { const dt = new Date(d + 'T00:00:00'); return `${dt.getMonth()+1}月${dt.getDate()}日 ${weekdayCN(d)}`; }

  // 开关
  function switchEl(on, onChange) {
    const s = el('div', { class: 'switch' + (on ? ' on' : '') }, el('i'));
    s.addEventListener('click', () => { on = !on; s.classList.toggle('on', on); onChange(on); });
    return s;
  }

  // 语音输入（Web Speech API，不支持时回退文本）
  function voiceInput(onResult) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('当前浏览器不支持语音，已切换为手动输入'); fallback(); return; }
    try {
      const rec = new SR();
      rec.lang = 'zh-CN'; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onresult = e => { onResult(e.results[0][0].transcript); rec.stop(); };
      rec.onerror = () => { toast('语音识别失败，可手动输入'); fallback(); };
      rec.start(); toast('🎤 请口述…');
    } catch (err) { fallback(); }
    function fallback() {
      const v = prompt('🎤 手动输入口述内容：');
      if (v) onResult(v);
    }
  }

  function downloadJSON(obj) {
    const blob = new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'vava-data-' + todayStr() + '.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  // 数据管理：导出 / 导入真实数据 / 清空
  function dataModal() {
    const d = DB.get();
    const ta = el('textarea', { style: { width: '100%', height: '170px', fontSize: '12px', fontFamily: 'monospace' } });
    ta.value = JSON.stringify(d, null, 1);
    const modal = el('div', { class: 'modal' }, [
      el('h3', null, '⚙️ 数据管理（导入你的真实数据）'),
      el('p', { class: 'muted', style: { fontSize: '12px', marginTop: '-6px' } }, '导出可备份/迁移；把你的真实课程、学员、目的地粘进来后「导入替换」即可。数据仅存本机浏览器。'),
      el('div', { class: 'field' }, [el('label', null, '当前数据 JSON'), ta]),
      el('div', { class: 'divider' }),
      el('h4', { class: 'api-h' }, '🔌 小红书 / 抖音 真实 API（联网实时爆款）'),
      el('p', { class: 'muted', style: { fontSize: '12px', marginTop: '-6px', marginBottom: '8px' } }, '粘贴你购买的小红书 / 抖音数据 API（第三方如新红·千瓜·飞瓜·蝉妈妈等）。保存后后端会定时拉取真实爆款并自动配图。需运行后端服务才会生效（见末尾说明）。'),
      (function () {
        const cfg0 = (DB.get().settings && DB.get().settings.xhsApi) || {};
        const sw = UI.switchEl(!!cfg0.enabled);
        const typeSel = el('select', {});
        [['小红书', '小红书'], ['抖音', '抖音']].forEach(([v, l]) => { const o = el('option', { value: v }, l); if ((cfg0.type || '小红书') === v) o.selected = true; typeSel.appendChild(o); });
        const urlIn = el('input', { type: 'text', placeholder: 'https://...' }); urlIn.value = cfg0.url || '';
        const keyIn = el('input', { type: 'text', placeholder: 'API Key / Token' }); keyIn.value = cfg0.key || '';
        const authSel = el('select', {});
        [['header', 'Bearer 请求头（默认）'], ['query', 'URL 参数 key='], ['custom', '自定义请求头']].forEach(([v, l]) => { const o = el('option', { value: v }, l); if ((cfg0.auth || 'header') === v) o.selected = true; authSel.appendChild(o); });
        const hnIn = el('input', { type: 'text', placeholder: '如 X-API-Key' }); hnIn.value = cfg0.headerName || '';
        const fmTa = el('textarea', { placeholder: '可选·字段映射，如 title=note_title,cover=cover_url,url=share_url' });
        fmTa.value = (cfg0.fieldMap && Object.keys(cfg0.fieldMap).length) ? Object.entries(cfg0.fieldMap).map(([k, v]) => k + '=' + v).join(',') : '';
        function collect() {
          const fm = {}; (fmTa.value || '').split(',').forEach(p => { const i = p.indexOf('='); if (i > 0) fm[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
          return { enabled: sw.classList.contains('on'), type: typeSel.value, url: urlIn.value.trim(), key: keyIn.value.trim(), auth: authSel.value, headerName: hnIn.value.trim(), fieldMap: fm };
        }
        const testBtn = el('button', { class: 'btn ghost sm', onclick: async () => {
          UI.toast('测试中…'); const r = await API.testXhs(collect());
          if (r.ok) UI.toast('✅ 连接成功，返回 ' + r.count + ' 条真实爆款'); else UI.toast('❌ ' + (r.error || '连接失败'));
        } }, '测试连接');
        const saveBtn = el('button', { class: 'btn sm', onclick: async () => {
          const cfg = collect();
          DB.get().settings.xhsApi = cfg; DB.save();
          UI.toast('已存本机，正在推送到后端…');
          const r = await API.setXhsConfig(cfg);
          if (r.ok) UI.toast('✅ 真实 API 已启用，返回 ' + r.count + ' 条，正在刷新'); else UI.toast('⚠️ ' + (r.error || '保存失败'));
          if (window.App) App.refresh();
        } }, '保存配置');
        return el('div', { class: 'xhs-api' }, [
          el('div', { class: 'field row' }, [el('label', null, '启用'), sw]),
          el('div', { class: 'field' }, [el('label', null, '平台'), typeSel]),
          el('div', { class: 'field' }, [el('label', null, 'API 地址'), urlIn]),
          el('div', { class: 'field' }, [el('label', null, 'API 密钥'), keyIn]),
          el('div', { class: 'field' }, [el('label', null, '鉴权方式'), authSel]),
          el('div', { class: 'field' }, [el('label', null, '自定义请求头名'), hnIn]),
          el('div', { class: 'field' }, [el('label', null, '字段映射（可选）'), fmTa]),
          el('div', { class: 'actions' }, [testBtn, saveBtn])
        ]);
      })(),
      el('div', { class: 'divider' }),
      el('h4', { class: 'api-h' }, '🔗 后端服务地址（解析抖音 / 小红书视频用）'),
      el('p', { class: 'muted', style: { fontSize: '12px', marginTop: '-6px', marginBottom: '8px' } }, '留空则用同源 /api（前端与后端部署在同一地址时即可用）。若把后端 server/server.js 部署到别的地址，把这里填成「https://你的后端/api」即可开启「解析并内嵌播放」。'),
      (function () {
        const s = DB.get().settings;
        const inp = el('input', { type: 'text', placeholder: 'https://你的后端/api  （留空 = 同源）' });
        inp.value = (s.apiBase || '');
        const saveB = el('button', { class: 'btn sm', onclick: () => {
          s.apiBase = inp.value.trim(); DB.save();
          UI.toast(s.apiBase ? ('已指向后端：' + s.apiBase) : '已恢复为同源 /api');
        } }, '保存后端地址');
        return el('div', { class: 'xhs-api' }, [
          el('div', { class: 'field' }, [el('label', null, '后端服务地址'), inp]),
          el('div', { class: 'actions' }, [saveB])
        ]);
      })(),
      el('p', { class: 'muted', style: { fontSize: '11px', marginTop: '4px' } }, '说明：真实 API 调用需经后端转发（密钥不能暴露在前端）。请在可联网的服务器/电脑运行 `node server/server.js`，再把前端「后端服务地址」指向该地址；配置即生效，后端每 30 分钟自动刷新。'),
      el('div', { class: 'divider' }),
      el('h4', { class: 'api-h', style: { marginTop: '18px' } }, '💾 备份与恢复（防丢失）'),
      el('p', { class: 'muted', style: { fontSize: '12px', marginTop: '-6px', marginBottom: '8px' } }, '数据仅存本机浏览器，换设备 / 清缓存会丢。建议定期「导出备份」存成 .json 文件；换设备或重装后用「从备份恢复」一键还原全部内容。'),
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn', onclick: () => { UI.downloadJSON(DB.get()); UI.toast('已导出备份文件 ✅'); } }, '📤 导出备份 (.json)'),
        (function () {
          const inp = el('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
          inp.addEventListener('change', () => {
            const f = inp.files && inp.files[0]; if (!f) return;
            const fr = new FileReader();
            fr.onload = () => {
              try {
                const obj = JSON.parse(fr.result);
                if (!confirm('从备份恢复将覆盖当前所有数据，确定继续？\n（建议先导出一次当前备份再恢复）')) return;
                DB.replace(obj); UI.close(); UI.toast('已从备份恢复 ✅'); App.refresh();
              } catch (e) { UI.toast('备份文件无效：' + e.message); }
            };
            fr.readAsText(f, 'utf-8');
          });
          document.body.appendChild(inp);
          return el('button', { class: 'btn ghost', onclick: () => inp.click() }, '📥 从备份恢复');
        })()
      ]),
      el('h4', { class: 'api-h', style: { marginTop: '18px' } }, '🧹 按模块清空'),
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn coral ghost', onclick: () => { if (confirm('确定清空「工作安排」模块的所有内容？\n含：学员 / 课表 / 试听 / 节假日 / 学情反馈 / 导入表格\n此操作不可撤销，不影响其他模块。')) { DB.clearWork(); UI.close(); UI.toast('已清空工作安排 ✅'); App.refresh(); } } }, '清空工作安排'),
        el('button', { class: 'btn', onclick: () => { if (confirm('一键重置「工作安排」为默认 2 班（Andy · B3 / Chen Han · HFG，含逐课计划）？\n将替换当前所有学员与课表，此操作不可撤销。')) { DB.replaceWorkWithDefaults(); UI.close(); UI.toast('已恢复默认 2 班 ✅'); App.refresh(); } } }, '🔄 重置 → 默认 2 班')
      ]),
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn ghost', onclick: () => { ta.select(); try { document.execCommand('copy'); UI.toast('已复制 JSON'); } catch (e) { UI.toast('复制失败'); } } }, '复制'),
        el('button', { class: 'btn ghost', onclick: () => { downloadJSON(d); UI.toast('已下载文件'); } }, '下载文件'),
        el('button', { class: 'btn', onclick: () => { try { const obj = JSON.parse(ta.value); DB.replace(obj); UI.close(); UI.toast('已导入真实数据 ✅'); App.refresh(); } catch (e) { UI.toast('JSON 格式错误，请检查'); } } }, '导入替换'),
        el('button', { class: 'btn coral', onclick: () => { if (confirm('确定清空所有内容（保留模块结构）？')) { DB.clearContent(); UI.close(); UI.toast('已清空内容'); App.refresh(); } } }, '清空内容')
      ])
    ]);
    open(modal);
  }

  // 小窗预览播放器（卡片内点击 → 应用内浮层，不跳走）
  function lightbox(opts) {
    if (!opts) opts = {};
    closeLightbox();
    const ov = el('div', { class: 'lb-overlay' });
    const box = el('div', { class: 'lb-box' + (opts.wide ? ' wide' : '') }, [
      el('div', { class: 'lb-head' }, [
        el('strong', null, opts.title || '预览'),
        el('button', { class: 'lb-x', onclick: closeLightbox }, '✕')
      ]),
      el('div', { class: 'lb-body' }, [opts.body])
    ]);
    ov.appendChild(box);
    ov.addEventListener('click', function (e) { if (e.target === ov) closeLightbox(); });
    document.body.appendChild(ov);
    UI._lb = ov;
  }
  function closeLightbox() {
    if (UI._lb && UI._lb.parentNode) UI._lb.parentNode.removeChild(UI._lb);
    UI._lb = null;
  }

  return { esc, toast, el, formModal, confirmModal, open, close, lightbox, closeLightbox, todayStr, addDays, weekdayCN, prettyDate, switchEl, voiceInput, dataModal, downloadJSON };
})();
