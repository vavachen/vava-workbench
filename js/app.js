/* ===== VAVA 工作台 · 应用骨架（路由/侧栏/密码锁） ===== */
const App = (function () {
  let current = 'work';

  function allModules() {
    // 合并内置模块 + 自定义模块，按 moduleOrder 排序，隐藏 hidden
    const d = DB.get();
    const order = d.moduleOrder && d.moduleOrder.length ? d.moduleOrder : null;
    let flat = [];
    Modules.MODULES.forEach(g => g.items.forEach(it => flat.push(Object.assign({ group: g.group }, it))));
    (d.custom || []).forEach(c => flat.push({ id: c.id, icon: '📌', title: c.title, render: makeCustomRender(c), custom: true }));
    if (order) {
      const map = {}; flat.forEach(m => map[m.id] = m);
      flat = order.map(id => map[id]).filter(Boolean).concat(flat.filter(m => !order.includes(m.id)));
    }
    return flat.filter(m => !(d.hidden && d.hidden[m.id]));
  }
  function makeCustomRender(c) {
    return function (container) {
      const d = DB.get();
      const card = UI.el('div', { class: 'card' });
      card.appendChild(UI.el('div', { class: 'card-h' }, UI.el('h3', null, c.icon + ' ' + c.title)));
      card.appendChild(UI.el('div', { class: 'muted', style: { whiteSpace: 'pre-wrap', lineHeight: '1.7' } }, c.text || '（空）'));
      card.appendChild(UI.el('button', { class: 'add-btn edit-only', onclick: () => UI.formModal({ title: '编辑「' + c.title + '」', fields: [{ key: 'text', label: '内容', type: 'textarea', default: c.text || '' }], onSubmit: v => { c.text = v.text; DB.save(); UI.toast('已保存'); App.refresh(); } }) }, '编辑内容'));
      card.appendChild(UI.el('button', { class: 'btn sm edit-only', style: { marginTop: '8px' }, onclick: () => { if (confirm('删除该自定义模块？')) { d.custom = d.custom.filter(x => x.id !== c.id); DB.save(); App.refresh(); } } }, '删除模块'));
      container.appendChild(card);
    };
  }

  function buildSidebar() {
    const d = DB.get();
    const sb = document.getElementById('sidebar');
    sb.innerHTML = '';
    sb.appendChild(UI.el('div', { class: 'sb-brand' }, [
      UI.el('span', { class: 'sb-logo' }, '🌸'),
      UI.el('div', null, [UI.el('div', { class: 'sb-title' }, 'VAVA 工作台'), UI.el('div', { class: 'sb-sub' }, '生活·教学·灵感中心')])
    ]));
    const list = allModules();
    let lastGroup = null;
    list.forEach((m, idx) => {
      if (m.group !== lastGroup) {
        lastGroup = m.group;
        const g = Modules.MODULES.find(g => g.group === m.group);
        sb.appendChild(UI.el('div', { class: 'sb-group ' + (g ? g.cls : '') }, m.group + ' · ' + (m.group === 'VAVA' ? '我的模块' : '宝贝模块')));
      }
      const item = UI.el('div', { class: 'sb-item' + (m.id === current ? ' active' : '') }, [
        UI.el('span', { class: 'ico' }, m.icon), UI.el('span', null, m.title)
      ]);
      item.addEventListener('click', () => go(m.id));
      if (d.editMode) {
        const ctl = UI.el('div', { class: 'act', style: { marginLeft: 'auto', display: 'flex', gap: '4px' } });
        ctl.appendChild(UI.el('button', { class: 'btn sm ghost', onclick: e => { e.stopPropagation(); move(m.id, -1); } }, '↑'));
        ctl.appendChild(UI.el('button', { class: 'btn sm ghost', onclick: e => { e.stopPropagation(); move(m.id, 1); } }, '↓'));
        ctl.appendChild(UI.el('button', { class: 'btn sm ghost', onclick: e => { e.stopPropagation(); if (confirm('隐藏「' + m.title + '」？可在编辑中恢复')) { d.hidden = d.hidden || {}; d.hidden[m.id] = true; DB.save(); buildSidebar(); } } }, '🚫'));
        item.appendChild(ctl);
      }
      sb.appendChild(item);
    });

    if (d.editMode) {
      sb.appendChild(UI.el('button', { class: 'add-btn', style: { marginTop: '10px' }, onclick: () => UI.formModal({ title: '添加自定义模块', fields: [{ key: 'title', label: '模块名' }, { key: 'icon', label: '图标emoji', default: '📌' }, { key: 'text', label: '初始内容', type: 'textarea' }], onSubmit: v => { d.custom = d.custom || []; d.custom.push({ id: DB.uid(), title: v.title, icon: v.icon, text: v.text }); DB.save(); UI.toast('已添加模块'); buildSidebar(); } }) }, '+ 添加自定义模块'));
      // 恢复隐藏
      const hid = (d.hidden && Object.keys(d.hidden)) || [];
      if (hid.length) sb.appendChild(UI.el('div', { class: 'muted', style: { fontSize: '11px', margin: '8px 8px 2px' } }, '已隐藏：' + hid.map(id => { const m = allModules().concat(Modules.MODULES.flatMap(g => g.items)).find(x => x.id === id); return m ? m.title : id; }).join('、')));
    }

    const lock = UI.el('div', { class: 'sb-lock' + (d.editMode ? ' unlocked' : '') }, d.editMode ? '🔓 编辑中·点此上锁' : '🔒 编辑已锁定·解锁');
    lock.addEventListener('click', () => d.editMode ? lockNow() : unlock());
    sb.appendChild(UI.el('div', { class: 'sb-spacer' }));
    sb.appendChild(lock);
  }

  function move(id, dir) {
    const d = DB.get();
    let order = d.moduleOrder && d.moduleOrder.length ? d.moduleOrder.slice() : Modules.MODULES.flatMap(g => g.items.map(i => i.id));
    const i = order.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    d.moduleOrder = order; DB.save(); buildSidebar();
  }

  function buildTopbar() {
    const d = DB.get();
    const m = allModules().find(x => x.id === current) || { title: '工作安排', icon: '📅' };
    const tb = document.getElementById('topbar');
    tb.innerHTML = '';
    const menu = UI.el('button', { class: 'menu', onclick: () => document.getElementById('sidebar').classList.toggle('open') }, '☰');
    const title = UI.el('div', { class: 'tb-title' }, [m.icon + ' ' + m.title, UI.el('small', null, 'VAVA 工作台')]);
    const badge = UI.el('span', { class: 'badge ' + (API.online ? 'on' : 'off'), id: 'net-badge' }, API.online ? '🟢 已联网' : '⚪ 本地');
    title.appendChild(badge);
    const edit = UI.el('button', { class: 'tb-edit' + (d.editMode ? ' on' : '') }, d.editMode ? '🔓 上锁' : '✏️ 编辑');
    edit.addEventListener('click', () => d.editMode ? lockNow() : unlock());
    const batchBtn = UI.el('button', { class: 'tb-gear', title: '批量选择删除', onclick: toggleBatch }, window.Batch && window.Batch.on ? '☑️' : '☐');
    const gear = UI.el('button', { class: 'tb-gear', title: '数据管理（导入/导出）', onclick: () => UI.dataModal() }, '⚙️');
    tb.appendChild(menu); tb.appendChild(title); tb.appendChild(edit); tb.appendChild(batchBtn); tb.appendChild(gear);
  }

  function renderView() {
    const d = DB.get();
    const m = allModules().find(x => x.id === current) || Modules.MODULES[0].items[0];
    const view = document.getElementById('view');
    view.innerHTML = '';
    try { m.render(view); } catch (e) { view.appendChild(UI.el('div', { class: 'card' }, '加载出错：' + e.message)); }
    document.body.classList.toggle('edit', !!d.editMode);
    if (window.Batch) { Batch.reset(); Batch.update(); }
  }

  function refresh() { buildSidebar(); buildTopbar(); renderView(); }

  function go(id) {
    current = id;
    location.hash = id;
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('mask').classList.remove('show');
    refresh();
    window.scrollTo(0, 0);
  }

  // ---- 密码锁 ----
  function unlock() {
    const d = DB.get();
    const root = document.getElementById('modal-root');
    const wrap = UI.el('div', { class: 'modal' });
    wrap.appendChild(UI.el('div', { style: { textAlign: 'center', fontSize: '38px' } }, '🔐'));
    wrap.appendChild(UI.el('h3', { style: { textAlign: 'center' } }, '输入 4 位密码解锁编辑'));
    wrap.appendChild(UI.el('div', { class: 'muted', style: { textAlign: 'center', marginBottom: '8px', fontSize: '12px' } }, '解锁后可增删模块、调顺序、改内容'));
    const pin = UI.el('div', { class: 'pin' });
    const inputs = [];
    for (let i = 0; i < 4; i++) {
      const s = UI.el('span', null, '');
      const inp = UI.el('input', { type: 'password', inputmode: 'numeric', maxlength: '1', style: { position: 'absolute', width: '52px', height: '60px', border: '0', background: 'transparent', textAlign: 'center', fontSize: '24px', fontWeight: '700', color: 'var(--sage-d)', borderRadius: '14px' } });
      inp.addEventListener('input', () => { if (inp.value && i < 3) inputs[i + 1].focus(); check(); });
      inp.addEventListener('keydown', e => { if (e.key === 'Backspace' && !inp.value && i > 0) inputs[i - 1].focus(); });
      s.style.position = 'relative';
      s.appendChild(inp);
      inputs.push(inp); pin.appendChild(s);
    }
    function check() {
      const code = inputs.map(i => i.value).join('');
      if (code.length === 4) {
        if (code === d.pwd) { UI.close(); d.editMode = true; DB.save(); refresh(); UI.toast('已解锁，可编辑 ✅'); }
        else { UI.toast('密码错误'); inputs.forEach(i => { i.value = ''; }); inputs[0].focus(); }
      }
    }
    wrap.appendChild(pin);
    wrap.appendChild(UI.el('div', { class: 'muted', style: { textAlign: 'center', marginTop: '6px', fontSize: '11px' } }, '不修改时自动上锁 · 防误触'));
    wrap.appendChild(UI.el('button', { class: 'btn ghost', style: { width: '100%', marginTop: '10px' }, onclick: () => { UI.close(); } }, '取消'));
    UI.open(wrap);
    setTimeout(() => inputs[0].focus(), 50);
  }
  function lockNow() { const d = DB.get(); d.editMode = false; DB.save(); refresh(); UI.toast('已上锁 🔒'); }
  function toggleBatch() {
    if (!window.Batch) return;
    window.Batch.on = !window.Batch.on;
    document.body.classList.toggle('batch', window.Batch.on);
    refresh();
    UI.toast(window.Batch.on ? '已开启批量选择，勾选内容后可批量删除' : '已退出批量选择');
  }

  function init() {
    DB.get();
    // 全局批量操作条
    const bb = document.getElementById('batch-bar');
    if (bb && window.Batch) {
      document.getElementById('batch-all').onclick = () => window.Batch.selectAll();
      document.getElementById('batch-del').onclick = () => window.Batch.deleteSelected();
      window.Batch.setUpdate((sel, all) => {
        const n = Object.keys(sel).length;
        document.getElementById('batch-info').textContent = '已选 ' + n + ' 项';
        document.getElementById('batch-all').textContent = (n === all.length && all.length) ? '取消全选' : '全选';
        bb.classList.toggle('show', window.Batch.on && all.length > 0);
      });
      window.Batch.update();
    }
    API.init().then(() => { const b = document.getElementById('net-badge'); if (b) { b.className = 'badge ' + (API.online ? 'on' : 'off'); b.textContent = API.online ? '🟢 已联网' : '⚪ 本地'; } }).catch(() => {});
    const hash = location.hash.replace('#', '');
    if (hash) { const all = allModules(); if (all.find(m => m.id === hash)) current = hash; }
    // 点击遮罩关侧栏
    document.getElementById('mask').addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));
    window.addEventListener('hashchange', () => { const h = location.hash.replace('#', ''); if (h && h !== current) { current = h; refresh(); } });
    refresh();
  }

  return { init, go, refresh, unlock, lockNow, allModules };
})();

document.addEventListener('DOMContentLoaded', App.init);
