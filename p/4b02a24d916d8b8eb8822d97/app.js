(() => {
  'use strict';

  const KEY = 'dghub-proto-v2';
  const NB = ' ';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => (n == null ? '—' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB));
  const pc = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
  const pcs = x => String(x).replace('.', ',') + '%';
  const now = () => {
    const d = new Date(); const p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  /* ---------- roles and permissions ---------- */
  const ROLES = {
    steward: { name: 'Data Steward', person: 'Nigar Ə.', opt: 'Data Steward (Nigar Ə.)' },
    operator: { name: 'DG Operator', person: 'Elvin H.', opt: 'DG Operator (Elvin H.)' },
    owner: { name: 'Data Owner', person: null, opt: 'Data Owner (aktivin sahibi)' },
    infosec: { name: 'InfoSec', person: 'Leyla Q.', opt: 'InfoSec (Leyla Q.)' },
    auditor: { name: 'Auditor', person: 'Kamran R.', opt: 'Auditor, yalnız oxu (Kamran R.)' },
  };
  const CAN = {
    'source.manage': ['operator'],
    'owner.assign': ['operator'],
    'finding.review': ['steward'],
    'label.owner': ['owner'],
    'label.infosec': ['infosec'],
    'lineage.resolve': ['steward'],
    'mapping.approve': ['steward'],
    'cde.submit': ['steward'],
    'cde.approve': ['owner'],
    'dq.run': ['steward', 'operator'],
    'issue.fix': ['owner'],
  };
  const can = p => CAN[p].includes(S.role);
  const whoCan = p => CAN[p].map(r => ROLES[r].name).join(' və ya ');
  const lock = p => `<p class="why-locked">Bu addımı ${esc(whoCan(p))} edir. Rolu yuxarıda dəyişin.</p>`;
  const PEOPLE = ['Aynur S.', 'Rauf M.', 'Səbinə A.', 'Tural B.'];

  /* ---------- vocab ---------- */
  const FST = {
    CANDIDATE: ['Namizəd', 'c-warn', '●'],
    CONFLICT: ['Konflikt', 'c-bad', '!'],
    NEEDS_INVESTIGATION: ['Araşdırılır', 'c-info', '?'],
    CONFIRMED: ['Təsdiqlənib', 'c-ok', '✓'],
    REJECTED: ['Rədd edilib', 'c-mute', '×'],
  };
  const ST = {
    VERIFIED: ['Təsdiqli', 'c-ok', '✓'], CONFLICT: ['Kimlik konflikti', 'c-bad', '!'], RETIRED: ['Ləğv edilib', 'c-mute', '×'],
    SUCCEEDED: ['Uğurlu', 'c-ok', '✓'], PARTIAL: ['Qismən', 'c-warn', '!'], RUNNING: ['İşləyir', 'c-info', '◌'], FAILED: ['Uğursuz', 'c-bad', '×'],
    PASS: ['PASS', 'c-ok', '✓'], FAIL: ['FAIL', 'c-bad', '×'], ERROR: ['ERROR', 'c-bad', '!'], NOT_EVALUATED: ['Qiymətləndirilmədi', 'c-mute', '–'],
    APPROVED: ['Təsdiqlənib', 'c-ok', '✓'], IN_REVIEW: ['Baxışda', 'c-warn', '●'], DRAFT: ['Qaralama', 'c-mute', '○'],
    PROPOSED: ['Təklif', 'c-warn', '●'], BLOCKED: ['Bloklanıb', 'c-bad', '!'],
    OPEN: ['Açıq', 'c-bad', '●'], FIX_CLAIMED: ['Yoxlama gözləyir', 'c-warn', '●'], CLOSED: ['Bağlanıb', 'c-ok', '✓'],
    RESOLVED: ['Həll edilib', 'c-ok', '✓'], DEFERRED: ['Sübut gözlənilir', 'c-warn', '●'],
    AMBIGUOUS: ['Qeyri-müəyyən', 'c-warn', '?'], UNRESOLVED: ['Həll edilməyib', 'c-bad', '?'], MANUAL: ['Əl ilə, sübutla', 'c-info', '✓'],
    NOT_RUN: ['İşlədilməyib', 'c-mute', '○'],
  };
  const chip = (t, cls, ic) => `<span class="chip ${cls}">${ic ? `<i aria-hidden="true">${ic}</i>` : ''}${esc(t)}</span>`;
  const st = k => { const v = ST[k] || [k, 'c-mute', '']; return chip(v[0], v[1], v[2]); };
  const stF = k => { const v = FST[k]; return chip(v[0], v[1], v[2]); };
  const POLICY = { FIN: 'Restricted', PAN: 'Restricted', S_NO: 'Restricted', IBAN: 'Confidential', ACCOUNT: 'Confidential', CIF: 'Internal', VOEN: 'Confidential', NAME: 'Confidential', PHONE: 'Confidential', EMAIL: 'Confidential', ADDRESS: 'Confidential', SWIFT: 'Internal', IP: 'Internal', GENDER: 'Confidential', MARITAL_STATUS: 'Confidential' };
  const NEED = lvl => (lvl === 'Restricted' ? ['owner', 'infosec'] : ['owner']);
  const ID_TYPES = ['FIN', 'VOEN', 'PAN', 'IBAN', 'ACCOUNT', 'S_NO', 'CIF'];

  /* ---------- state ---------- */
  let S;
  function fresh() {
    const s = JSON.parse(JSON.stringify(window.SEED));
    s.role = 'steward';
    s.page = 'overview';
    s.ui = { dTab: 'queue', dFilter: 'open', qTab: 'binds', rep: 'R-101', node: null, cde: 'CDE-01', q: '', aq: '', ns: null };
    s.drawer = null;
    s.linkRes = {};
    s.manual = {};
    s.findings.forEach(f => {
      f.history = [];
      if (f.prev) f.history.push({ at: f.prev.at, by: f.prev.by, what: `${FST[f.prev.status][0]} (detektor ${f.prev.ver}, ${f.prev.sample} sətir)`, note: f.prev.comment });
      if (f.decision) f.history.push({ at: f.decision.at, by: f.decision.by, what: FST[f.status][0], note: f.decision.comment });
      if (f.label) Object.entries(f.label.approvals).forEach(([k, v]) => { if (v) f.history.push({ at: v.at, by: v.by, what: `Etiket təsdiqi (${k === 'owner' ? 'Owner' : 'InfoSec'}): ${f.label.level}` }); });
    });
    return s;
  }
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { S = JSON.parse(raw); return; } } catch (e) { /* storage unavailable */ }
    S = fresh();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
  function log(action, obj, detail, o = {}) {
    S.audit.push({ at: now(), actor: o.actor || ROLES[S.role].person || '—', role: o.role || ROLES[S.role].name, action, obj, detail });
  }

  /* ---------- lookups ---------- */
  const src = id => S.sources.find(s => s.id === id);
  const tbl = id => S.tables.find(t => t.id === id);
  const scanOf = id => S.scans.find(x => x.id === id);
  const findingOf = col => S.findings.find(f => f.col === col);
  const fnd = id => S.findings.find(f => f.id === id);
  const defOf = id => S.dqDefs.find(d => d.id === id);
  const bindOf = id => S.dqBinds.find(b => b.id === id);
  const cdeOf = id => S.cdes.find(c => c.id === id);
  const termOf = id => S.terms.find(t => t.id === id);
  const lastRun = bid => { const r = S.dqRuns.filter(x => x.bind === bid); return r[r.length - 1] || null; };
  const colParts = id => {
    const i = id.indexOf(':'); const s = id.slice(0, i); const p = id.slice(i + 1).split('.');
    return { src: s, schema: p[0], table: p[1], col: p[2], tableId: `${s}:${p[0]}.${p[1]}` };
  };
  const alias = sid => (src(sid) ? src(sid).alias : sid);
  const colName = (id, withSrc = true) => {
    const n = nodeInfo(id);
    if (n.kind === 'col') return `${withSrc ? `<span class="src">${esc(alias(n.src))}</span>` : ''}<span class="mono">${esc(`${n.schema}.${n.table}.${n.col}`)}</span>`;
    if (n.kind === 'link') return `<span class="src">?</span><span class="mono">${esc(`${n.path}@${n.link}`)}</span>`;
    if (n.kind === 'report') return `<span class="src">${esc(n.rep.id)}</span><span class="mono">${esc(n.field)}</span>`;
    return `<span class="mono">${esc(id)}</span>`;
  };
  function nodeInfo(id) {
    if (id.startsWith('R-')) { const [r, f] = id.split(':'); const rep = S.reports.find(x => x.id === r); return { kind: 'report', rep, field: f, group: r }; }
    if (id.startsWith('link:')) { const [link, path] = id.slice(5).split('/'); const p = path.split('.'); return { kind: 'link', link, path, group: `link:${link}/${p[0]}.${p[1]}`, label: p[2], gtitle: `${p[0]}.${p[1]}@${link}` }; }
    if (id.startsWith('dyn:')) return { kind: 'dyn', group: id, label: '? mənbə məlum deyil', gtitle: `Dinamik SQL (${id.slice(4)})` };
    const c = colParts(id); return Object.assign({ kind: 'col', group: c.tableId, label: c.col }, c);
  }
  const resolveNode = id => {
    if (id.startsWith('link:')) { const [link, path] = id.slice(5).split('/'); if (S.linkRes[link]) return `${S.linkRes[link]}:${path}`; }
    return id;
  };
  function effEdges() {
    return S.edges.map((e, i) => {
      let from = e.from; let status = e.status;
      if (e.link && S.linkRes[e.link]) { from = resolveNode(e.from); status = 'VERIFIED'; }
      if (from.startsWith('dyn:') && S.manual[from]) { from = S.manual[from]; status = 'MANUAL'; }
      return Object.assign({}, e, { i, from, status });
    });
  }
  function walk(id, E, dir) {
    const out = new Set(); const stack = [id];
    while (stack.length) {
      const n = stack.pop();
      for (const e of E) {
        const a = dir === 'down' ? e.from : e.to; const b = dir === 'down' ? e.to : e.from;
        if (a === n && !out.has(b)) { out.add(b); stack.push(b); }
      }
    }
    return out;
  }
  const upEdges = (id, E) => { const up = walk(id, E, 'up'); up.add(id); return E.filter(e => up.has(e.to)); };
  const isSens = id => { const f = findingOf(id); return !!(f && f.status === 'CONFIRMED'); };
  const reportsOf = (id, E) => [...walk(id, E, 'down')].filter(x => x.startsWith('R-'));

  function labelState(f) {
    if (!f || f.status !== 'CONFIRMED' || !f.label) return null;
    const pend = f.label.need.filter(k => !f.label.approvals[k]);
    return { level: f.label.level, effective: pend.length === 0, pend };
  }
  const labelHtml = f => {
    const l = labelState(f); if (!l) return '<span class="muted">—</span>';
    return l.effective ? `<span class="lbl ${l.level}">${l.level}</span>` : `<span class="lbl ${l.level} pending">${l.level}, təsdiq gözləyir</span>`;
  };

  function cdeChecks(c) {
    const E = effEdges();
    const term = termOf(c.term); const dom = S.domains.find(d => d.id === term.domain);
    const ue = upEdges(c.report, E); const bad = ue.filter(e => !['VERIFIED', 'MANUAL'].includes(e.status));
    const dqs = c.dq.map(b => ({ b, r: lastRun(b) }));
    const okMaps = c.maps.filter(m => m.status === 'APPROVED').length;
    return [
      { ok: term.status === 'APPROVED', t: 'Biznes termini təsdiqlənib', d: `${term.name}: ${ST[term.status][0].toLowerCase()}` },
      { ok: dom.charter === 'APPROVED' && !!dom.owner, t: 'Domen xartiyası və sahibi var', d: `${dom.name} domeni, xartiya: ${ST[dom.charter][0].toLowerCase()}` },
      { ok: okMaps === c.maps.length, t: 'Bütün fiziki mapping-lər təsdiqlənib', d: `${okMaps}/${c.maps.length} təsdiqli` },
      { ok: bad.length === 0, t: 'Hesabat sahəsinin lineage-i tamdır', d: bad.length ? `${bad.length} əlaqə sübut gözləyir` : `${ue.length} əlaqə, hamısı sübutlu` },
      { ok: dqs.length > 0 && dqs.every(x => x.r && x.r.result === 'PASS'), t: 'DQ nəzarəti bağlıdır və son nəticə PASS-dır', d: dqs.map(x => `${x.b}: ${x.r ? x.r.result : 'run yoxdur'}`).join(', ') },
      { ok: c.status === 'APPROVED', t: 'Sahib tərifi təsdiqləyib', d: `${c.owner}, status: ${ST[c.status][0].toLowerCase()}` },
    ];
  }
  const certified = c => cdeChecks(c).every(x => x.ok);

  function counts() {
    return {
      srcOk: S.sources.filter(s => s.identity.status === 'VERIFIED').length,
      srcConf: S.sources.filter(s => s.identity.status === 'CONFLICT').length,
      fOpen: S.findings.filter(f => ['CANDIDATE', 'CONFLICT', 'NEEDS_INVESTIGATION'].includes(f.status)).length,
      lPend: S.findings.filter(f => { const l = labelState(f); return l && !l.effective; }).length,
      noOwner: S.tables.filter(t => !t.owner).length,
      lq: S.lineageQueue.filter(q => q.status !== 'RESOLVED').length,
      cert: S.cdes.filter(certified).length,
      iss: S.issues.filter(i => i.status !== 'CLOSED').length,
      running: S.scans.filter(x => x.status === 'RUNNING').length,
    };
  }

  /* ---------- small builders ---------- */
  const btn = (label, act, o = {}) => {
    const data = Object.entries(o.data || {}).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
    return `<button type="button" class="btn ${o.cls || ''}" data-act="${act}"${data}${o.dis ? ' disabled' : ''}${o.title ? ` title="${esc(o.title)}"` : ''}>${esc(label)}</button>`;
  };
  const rail = steps => {
    let nowSet = false;
    const html = steps.map(([t, state]) => {
      let cls = state;
      if (!state && !nowSet) { cls = 'now'; nowSet = true; }
      if (state === 'stop') nowSet = true;
      return `<div class="st ${cls || ''}" role="listitem">${esc(t)}</div>`;
    }).join('');
    return `<div class="rail" role="list" aria-label="Həyat dövrü">${html}</div>`;
  };
  const facts = rows => `<dl class="facts">${rows.filter(Boolean).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;
  const empty = (b, t) => `<div class="empty"><b>${esc(b)}</b>${esc(t)}</div>`;
  const meter = (a, b) => { const p = pc(a, b); return `<div class="meter"><span class="small muted">${num(a)} / ${num(b)}</span><span class="val">${pcs(p)}</span><div class="track" role="img" aria-label="${pcs(p)}"><div class="fill" style="width:${p}%"></div></div></div>`; };
  const openRow = (k, id) => `class="click" data-act="open" data-k="${k}" data-id="${esc(id)}" tabindex="0"`;

  /* ---------- pages ---------- */
  const PAGES = [
    { id: 'overview', t: 'Ümumi baxış', icon: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>' },
    { sep: true },
    { id: 'sources', t: 'Mənbələr', n: 1 },
    { id: 'discovery', t: 'Kəşf', n: 2 },
    { id: 'catalog', t: 'Kataloq', n: 3 },
    { id: 'lineage', t: 'Lineage', n: 4 },
    { id: 'cde', t: 'Qlossari və CDE', n: 5 },
    { id: 'dq', t: 'Data keyfiyyəti', n: 6 },
    { sep: true },
    { id: 'compliance', t: 'Uyğunluq', icon: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2h10v12H3z M5.5 8l2 2 3.5-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>' },
    { id: 'audit', t: 'Audit jurnalı', icon: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4h10M3 8h10M3 12h7" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>' },
  ];

  function renderSide() {
    const c = counts();
    const badge = { sources: c.srcConf, discovery: c.fOpen, lineage: c.lq, dq: c.iss };
    $('#side').innerHTML = `
      <div class="brand"><div class="brand-mark" aria-hidden="true">DG</div><div><b>DG Hub</b><span>Data Governance portalı</span></div></div>
      <nav class="nav">${PAGES.map(p => p.sep ? '<div class="nav-sep"></div>' : `
        <a href="#/${p.id}" data-nav="${p.id}"${S.page === p.id ? ' aria-current="page"' : ''}>
          ${p.n ? `<span class="step" aria-hidden="true">${p.n}</span>` : `<span class="glyph">${p.icon}</span>`}
          <span>${esc(p.t)}</span>${badge[p.id] ? `<span class="count" aria-label="${badge[p.id]} açıq">${badge[p.id]}</span>` : ''}
        </a>`).join('')}</nav>
      <div class="side-foot">Prototip. Data saxtadır, brauzerdə saxlanılır.</div>`;
  }
  function renderTop() {
    $('#top').innerHTML = `
      <div class="tenant"><b>${esc(S.tenant.name)}</b><span class="env" title="Mühit">${esc(S.tenant.env)}</span></div>
      <div class="grow"></div>
      <div class="role"><label for="role">Rol</label>
        <select id="role" data-change="role">${Object.entries(ROLES).map(([k, r]) => `<option value="${k}"${S.role === k ? ' selected' : ''}>${esc(r.opt)}</option>`).join('')}</select></div>
      ${btn('Demonu sıfırla', 'reset', { cls: 'small' })}`;
  }

  /* ===== Overview ===== */
  let TASKS = [];
  function tasks() {
    const r = S.role; const out = [];
    if (r === 'operator') {
      S.sources.filter(s => s.identity.status === 'CONFLICT').forEach(s => out.push({ t: `${s.id}: "${s.alias}" adı başqa mənbədə də var`, d: 'Fiziki DB fərqlidir. Ayrı mənbə kimi təsdiqləyin və ya qeydiyyatı ləğv edin.', k: 'source', id: s.id }));
      S.tables.filter(t => !t.owner).forEach(t => out.push({ t: `${t.schema}.${t.name}: sahib təyin olunmayıb`, d: 'Sahibi olmayan aktivin etiketi təsdiqlənə bilmir.', k: 'table', id: t.id }));
      S.tables.filter(t => t.scanFailed).forEach(t => out.push({ t: `${t.schema}.${t.name} skan olunmayıb`, d: t.scanFailed, k: 'table', id: t.id }));
    }
    if (r === 'steward') {
      S.findings.filter(f => f.status === 'CONFLICT').forEach(f => out.push({ t: `${colParts(f.col).table}.${colParts(f.col).col}: yeni sübut köhnə qərarla ziddir`, d: 'Əvvəlki qərar səssiz dəyişdirilmir, sizin baxışınızı gözləyir.', k: 'finding', id: f.id }));
      const cand = S.findings.filter(f => f.status === 'CANDIDATE').length;
      if (cand) out.push({ t: `${cand} namizəd tapıntı`, d: 'Sübuta baxın, təsdiqləyin və ya rədd edin.', go: 'discovery', ui: { dTab: 'queue', dFilter: 'open' } });
      S.lineageQueue.filter(q => q.status !== 'RESOLVED').forEach(q => out.push({ t: q.title, d: 'Lineage əlaqəsi sübut gözləyir.', k: 'lq', id: q.id }));
      S.cdes.forEach(c => c.maps.filter(m => m.status === 'PROPOSED').forEach(m => out.push({ t: `${c.name}: mapping təsdiqi`, d: resolveNode(m.node).split(':').pop(), go: 'cde', ui: { cde: c.id } })));
      S.issues.filter(i => i.status === 'FIX_CLAIMED').forEach(i => out.push({ t: `${i.id}: düzəliş qeyd olunub`, d: `${i.bind} qaydasını yenidən işlədin. PASS gələrsə problem bağlanır.`, go: 'dq', ui: { qTab: 'binds' } }));
    }
    if (r === 'owner') {
      S.findings.forEach(f => { const l = labelState(f); if (l && l.pend.includes('owner')) { const t = tbl(colParts(f.col).tableId); out.push({ t: `Etiket təsdiqi: ${colParts(f.col).table}.${colParts(f.col).col}`, d: t.owner ? `${l.level}, sahib: ${t.owner}` : 'Cədvəlin sahibi yoxdur, əvvəlcə DG Operator sahib təyin etməlidir.', k: 'finding', id: f.id }); } });
      S.cdes.filter(c => c.status === 'IN_REVIEW').forEach(c => out.push({ t: `${c.name}: tərif təsdiqi`, d: 'CDE baxışa göndərilib.', go: 'cde', ui: { cde: c.id } }));
      S.issues.filter(i => i.status === 'OPEN').forEach(i => out.push({ t: `${i.id}: ${i.title}`, d: `Sizə təyin olunub, son tarix ${i.due}.`, go: 'dq', ui: { qTab: 'issues' } }));
    }
    if (r === 'infosec') {
      S.findings.forEach(f => { const l = labelState(f); if (l && l.pend.includes('infosec')) out.push({ t: `Restricted etiket: ${colParts(f.col).table}.${colParts(f.col).col}`, d: 'InfoSec təsdiqi gözləyir.', k: 'finding', id: f.id }); });
      Object.entries(S.access).forEach(([tid, a]) => a.requests.filter(q => !q.applied).forEach(q => out.push({ t: `${q.id}: təsdiqlənib, tətbiq olunmayıb`, d: `${q.what}. ${q.ticket}.`, k: 'table', id: tid })));
      S.findings.filter(f => f.det === 'PAN' && f.status === 'CANDIDATE').forEach(f => out.push({ t: `PAN namizədi: ${colParts(f.col).table}.${colParts(f.col).col}`, d: 'PCI DSS əhatəsini genişləndirə bilər. Steward qərarını izləyin.', k: 'finding', id: f.id }));
    }
    if (r === 'auditor') out.push({ t: 'Sizdə yazı hüququ yoxdur', d: 'Bütün ekranlara baxa və audit jurnalını ixrac edə bilərsiniz.', go: 'audit' });
    return out;
  }
  function scenario() {
    const c1 = cdeOf('CDE-01'); const fx = c1.maps.find(m => m.node.includes('FX_RATES')); const iss = S.issues.find(i => i.id === 'ISS-07');
    return [
      { t: 'CORE_LNK linkinin hansı DB-yə getdiyini sübutla təsdiqləyin', r: 'Data Steward, Lineage', done: !!S.linkRes.CORE_LNK, k: 'lq', id: 'LQ-1' },
      { t: 'FX_RATES.RATE mapping-ini təsdiqləyin', r: 'Data Steward, Qlossari və CDE', done: fx.status === 'APPROVED', go: 'cde', ui: { cde: 'CDE-01' } },
      { t: 'ISS-07: düzəlişin mənbədə edildiyini qeyd edin', r: 'Data Owner, Data keyfiyyəti', done: iss.status !== 'OPEN', go: 'dq', ui: { qTab: 'issues' } },
      { t: 'DQB-03 qaydasını yenidən işlədin', r: 'Data Steward, Data keyfiyyəti', done: iss.status === 'CLOSED', go: 'dq', ui: { qTab: 'binds' } },
      { t: 'NPL nisbəti CDE-sinin tərifini təsdiqləyin', r: 'Data Owner, Qlossari və CDE', done: c1.status === 'APPROVED', go: 'cde', ui: { cde: 'CDE-01' } },
    ];
  }
  function vOverview() {
    const c = counts();
    const flow = [
      { p: 'sources', t: 'Mənbəni qoş', w: 'DB-nin fiziki kimliyi (DBID, DB_NAME) təsdiqlənir. Ad və alias kimlik sayılmır.', s: chip(`${c.srcOk} təsdiqli`, 'c-ok', '✓') + (c.srcConf ? ' ' + chip(`${c.srcConf} konflikt`, 'c-bad', '!') : ''), who: 'DG Operator, DBA' },
      { p: 'discovery', t: 'Kəşf et', w: 'Detektorlar təsadüfi nümunəni oxuyur. Mərkəzə dəyər yox, yalnız say və nisbət gəlir.', s: c.fOpen ? chip(`${c.fOpen} qərar gözləyir`, 'c-warn', '●') : chip('Növbə boşdur', 'c-ok', '✓'), who: 'Skan worker, Data Steward' },
      { p: 'catalog', t: 'Etiketlə və sahib ver', w: 'Data tipini steward təsdiqləyir. Giriş etiketini sahib, Restricted üçün həm də InfoSec təsdiqləyir.', s: (c.lPend ? chip(`${c.lPend} etiket gözləyir`, 'c-warn', '●') : chip('Etiketlər təsdiqli', 'c-ok', '✓')) + (c.noOwner ? ' ' + chip(`${c.noOwner} sahibsiz`, 'c-bad', '!') : ''), who: 'Data Owner, InfoSec' },
      { p: 'lineage', t: 'Hesabata bağla', w: 'SQL-dən sütun → hesabat əlaqəsi çıxır. Sübutsuz əlaqə dərc olunmur, növbədə qalır.', s: c.lq ? chip(`${c.lq} sübut gözləyir`, 'c-warn', '?') : chip('Hamısı sübutlu', 'c-ok', '✓'), who: 'Report Lineage, Steward' },
      { p: 'cde', t: 'Biznes mənası ver', w: 'Kritik göstərici (CDE): tərif, düstur, sahib və təsdiqli fiziki mapping.', s: chip(`${c.cert}/${S.cdes.length} sertifikatlı`, c.cert === S.cdes.length ? 'c-ok' : 'c-warn', c.cert === S.cdes.length ? '✓' : '●'), who: 'Data Owner, Steward' },
      { p: 'dq', t: 'Keyfiyyəti yoxla', w: 'Qayda, bağlama, run və problem ayrı saxlanılır. Mənbədə heç nə dəyişdirilmir.', s: c.iss ? chip(`${c.iss} açıq problem`, 'c-bad', '●') : chip('Açıq problem yoxdur', 'c-ok', '✓'), who: 'DQ mühərriki, Data Owner' },
    ];
    TASKS = tasks();
    const sc = scenario(); const c1 = cdeOf('CDE-01');
    const rules = [
      ['Alias kimlik deyil.', 'Mənbə DBID və DB_NAME ilə tanınır. Eyni adlı iki DB avtomatik birləşmir.'],
      ['Mənbəyə yalnız oxu.', 'Skan READ ONLY sessiyada gedir. Platforma GRANT, UPDATE, DELETE etmir.'],
      ['Xam PII mərkəzə gəlmir.', 'Detektor yalnız say, nisbət və qayda versiyasını göndərir.'],
      ['"Tapılmadı" "həssas deyil" demək deyil.', 'Hər nəticənin yanında nümunə ölçüsü və tarixi görünür.'],
      ['Data tipi və etiket ayrıdır.', 'FIN data tipidir. Restricted giriş qaydasıdır və ayrıca təsdiqlənir.'],
      ['Sübutsuz lineage dərc olunmur.', 'Qeyri-müəyyən əlaqə növbədə qalır, oxşar ada görə bağlanmır.'],
      ['Təsdiq tətbiq demək deyil.', 'Sahibin təsdiqlədiyi dəyişiklik mənbədə edilənə qədər açıq qalır.'],
      ['Hər qərar audit olunur.', 'Kim, nə vaxt, hansı sübutla. Köhnə qərar silinmir, tarixçədə qalır.'],
    ];
    return `
      <div class="page-head"><div><h1>Kredit pilotu</h1>
        <p>Bir Oracle TEST mühiti və bir kritik hesabat göstəricisi: NPL nisbəti. Aşağıdakı altı addım platformanın iş prinsipidir. Hər addım əvvəlkinin sübutuna söykənir.</p></div></div>
      <nav class="flow" aria-label="İş axını">${flow.map((f, i) => `
        <a href="#/${f.p}" data-nav="${f.p}"><span class="n">Addım ${i + 1}</span><h3>${esc(f.t)}</h3><span class="what">${esc(f.w)}</span><span class="state">${f.s}</span><span class="who">${esc(f.who)}</span></a>`).join('')}
      </nav>
      <p class="small muted" style="margin-top:10px">Bu addımların sübutu <a href="#/compliance" data-nav="compliance">Uyğunluq</a> səhifəsində AMB 14/2, PCI DSS və BCBS 239 göstəricilərinə avtomatik yığılır.</p>
      <div class="cols section">
        <div>
          <h2 style="margin-bottom:10px">Sizin növbəniz <span class="muted" style="font-weight:400">(${esc(ROLES[S.role].name)})</span></h2>
          <div class="panel">${TASKS.length ? TASKS.map((t, i) => `<div class="task"><div class="t"><b>${esc(t.t)}</b><p>${esc(t.d)}</p></div>${btn('Aç', 'task', { cls: 'small', data: { i } })}</div>`).join('') : empty('Bu rol üçün iş yoxdur', 'Başqa rola keçib axını davam etdirin.')}</div>
        </div>
        <div class="scenario">
          <h2 style="margin-bottom:10px">Nümunə ssenari</h2>
          <div class="panel">
            <p class="small" style="padding:12px 16px 0;color:var(--ink2)">NPL nisbətini sertifikatlı etmək üçün beş addım. Rolu dəyişərək hər birini edin.</p>
            <ol style="margin-top:8px">${sc.map((s, i) => `<li class="${s.done ? 'done' : ''}"><div><div class="s-t">${esc(s.t)}</div><div class="s-r">${esc(s.r)}${s.done ? '' : ` <button type="button" class="linklike small" data-act="scen" data-i="${i}">aç</button>`}</div></div></li>`).join('')}</ol>
            <div style="padding:12px 16px;border-top:1px solid var(--rule)">${certified(c1) ? chip('NPL nisbəti sertifikatlıdır', 'c-ok', '✓') : '<span class="small muted">Hamısı bitəndə CDE-01 avtomatik sertifikatlı olur.</span>'}</div>
          </div>
        </div>
      </div>
      <div class="section"><h2>Qaydalar</h2><p class="lede">Köhnə iki alətdə olmayan, yeni platformada hər ekranın əməl etdiyi səkkiz qayda.</p>
        <div class="panel rules">${rules.map((r, i) => `<div><span class="k">${i + 1}</span><span><b>${esc(r[0])}</b> ${esc(r[1])}</span></div>`).join('')}</div></div>
      <div class="section"><h2>Pilot gate-ləri</h2><p class="lede">04 paketindəki G0–G6. Gate yalnız sübut və imza ilə keçir.</p>
        <div class="gates">${S.gates.map(g => `<div class="gate"><b>${g.id}</b><span>${esc(g.name)}</span>${g.status === 'PARTIAL' ? chip('Qismən', 'c-warn', '●') : st(g.status)}</div>`).join('')}</div></div>`;
  }

  /* ===== Sources ===== */
  function vSources() {
    const rows = S.sources.map(s => {
      const runs = S.scans.filter(x => x.src === s.id); const last = runs[runs.length - 1];
      return `<tr ${openRow('source', s.id)}>
        <td class="id"><b>${esc(s.alias)}</b> <span class="muted small">${s.id}</span><div class="small muted">${esc(s.name)}</div></td>
        <td>${esc(s.type)}</td><td><span class="env">${esc(s.env)}</span></td>
        <td><span class="mono">${esc(s.identity.dbName)}</span><div class="small muted mono">DBID ${esc(s.identity.dbid)}</div></td>
        <td>${st(s.identity.status)}</td>
        <td class="mono">${esc(s.schemas.join(', '))}</td>
        <td>${last ? `${st(last.status)}<div class="small muted">${esc(last.id)}, ${esc(last.started)}</div>` : '<span class="muted small">Skan olunmayıb</span>'}</td></tr>`;
    }).join('');
    return `
      <div class="page-head"><div><h1>Mənbələr</h1><p>Hər mənbə fiziki kimliyi ilə qeyd olunur: DB_NAME, DBID, host və service. Alias yalnız göstərmə adıdır. Eyni alias iki fərqli DB-də görünsə, sistem nəşri dayandırır və qərar gözləyir.</p></div>
        <div>${can('source.manage') ? btn('Mənbə əlavə et', 'open', { cls: 'primary', data: { k: 'newSource', id: 'new' } }) : `${btn('Mənbə əlavə et', 'noop', { dis: true })}${lock('source.manage')}`}</div></div>
      <div class="tw"><table class="grid"><thead><tr><th>Mənbə</th><th>Növ</th><th>Mühit</th><th>Fiziki kimlik</th><th>Kimlik statusu</th><th>Sxemlər</th><th>Son skan</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="section"><div class="rule-note"><span><b>Şifrə platformada saxlanılmır.</b> DBA bağlantını bankın vault-unda yaradır. Platformada yalnız istinad qalır, məsələn <span class="mono">vault://nb-test/cbs_ro</span>. Hesab yalnız oxu hüququna malikdir.</span></div></div>`;
  }
  function dSource(id) {
    const s = src(id); const I = s.identity;
    const runs = S.scans.filter(x => x.src === id);
    let conflict = '';
    if (I.status === 'CONFLICT') {
      const o = src(I.conflictWith); const J = o.identity;
      const row = (k, a, b) => `<tr><td class="muted small">${k}</td><td class="mono">${esc(a)}</td><td class="mono">${esc(b)}</td><td>${a === b ? chip('eyni', 'c-warn', '=') : chip('fərqli', 'c-mute', '≠')}</td></tr>`;
      conflict = `<div class="box bad"><h3>"${esc(s.alias)}" adı artıq ${o.id}-də istifadə olunur</h3>
        <p class="small">Adlar eynidir, fiziki DB fərqlidir. Sistem bunları birləşdirmir və bu mənbənin nəticələrini dərc etmir.</p></div>
        <div class="tw"><table class="grid"><thead><tr><th></th><th>${o.id} (təsdiqli)</th><th>${s.id} (yeni)</th><th></th></tr></thead><tbody>
          ${row('Alias', o.alias, s.alias)}${row('DB_NAME', J.dbName, I.dbName)}${row('DBID', J.dbid, I.dbid)}${row('Host', J.host, I.host)}${row('Service', J.service, I.service)}
        </tbody></table></div>`;
    }
    const scanRows = runs.length ? `<div class="tw"><table class="grid"><thead><tr><th>Skan</th><th>Vəziyyət</th><th class="num">Uğurlu / plan</th><th>Başladı</th></tr></thead><tbody>${runs.slice().reverse().map(x => `<tr><td class="mono">${x.id}</td><td>${st(x.status)}</td><td class="num">${x.scanned}/${x.planned}${x.failed ? ` <span class="muted">(${x.failed} uğursuz)</span>` : ''}</td><td class="small">${esc(x.started)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted small">Bu mənbə hələ skan olunmayıb.</p>';
    let foot = '';
    if (!can('source.manage')) foot = lock('source.manage');
    else if (I.status === 'CONFLICT') {
      foot = `<div class="field"><label for="newAlias">Yeni alias</label><input id="newAlias" data-keep value="${esc(s.alias)}_UAT"><span class="hint">Ayrı mənbə kimi təsdiqləyəndə unikal ad verin.</span></div>
        <div class="btn-row">${btn('Ayrı mənbə kimi təsdiqlə', 'resolveIdentity', { cls: 'primary', data: { id } })}${btn('Birləşdir', 'noop', { dis: true, title: 'DBID fərqlidir' })}${btn('Qeydiyyatı ləğv et', 'retireSource', { cls: 'danger', data: { id } })}</div>
        <p class="why-locked">Birləşdirmə yalnız eyni fiziki DB üçündür: DBID ${esc(src(I.conflictWith).identity.dbid)} ≠ ${esc(I.dbid)}.</p>`;
    } else if (I.status === 'VERIFIED') {
      const busy = runs.some(x => x.status === 'RUNNING');
      foot = `<div class="form-grid">
          <div class="field"><label for="scanSample">Nümunə ölçüsü</label><select id="scanSample" data-keep><option value="100">100 sətir</option><option value="1000" selected>1 000 sətir</option><option value="10000">10 000 sətir</option></select><span class="hint">Təsadüfi seçim (SAMPLE BLOCK), ilk N sətir yox.</span></div>
          <div class="field"><label>Əhatə</label><div class="mono" style="padding:7px 0">${esc(s.schemas.map(x => x + '.*').join(', '))}</div><span class="hint">Detektor versiyası 1.3.0, 15 detektor.</span></div>
        </div>
        ${s.env === 'PROD' ? '<p class="why-locked">PROD mənbəsində skan InfoSec təsdiqi və dəyişiklik bileti olmadan başlamır.</p>' : ''}
        <div class="btn-row">${btn(busy ? 'Skan işləyir' : 'Skanı başlat', 'startScan', { cls: 'primary', dis: busy || s.env === 'PROD', data: { id } })}${btn('Bağlantını yoxla', 'testConn', { data: { id } })}</div>`;
    } else foot = '<p class="muted small">Bu qeydiyyat ləğv edilib. Tarixçə audit jurnalında qalır.</p>';
    return {
      title: `${s.alias}`, sub: `${s.id}, ${s.name}`, chips: st(I.status),
      body: `${conflict}
        <section><h3>Fiziki kimlik</h3>${facts([
          ['DB_NAME', `<span class="mono">${esc(I.dbName)}</span>`], ['DBID', `<span class="mono">${esc(I.dbid)}</span>`],
          ['Host', `<span class="mono">${esc(I.host)}</span>`], ['Service', `<span class="mono">${esc(I.service)}</span>`],
          ['Təsdiq', I.by ? `${esc(I.by)}, ${esc(I.at)}` : '<span class="muted">Təsdiqlənməyib</span>'],
        ])}</section>
        <section><h3>Qeydiyyat</h3>${facts([
          ['Növ', esc(s.type)], ['Mühit', `<span class="env">${esc(s.env)}</span>`], ['Sistem sahibi', esc(s.owner)],
          ['Secret istinadı', `<span class="mono">${esc(s.secretRef)}</span><div class="small muted">Şifrə burada yoxdur, yalnız vault-dakı yeri.</div>`],
          ['Sxemlər', `<span class="mono">${esc(s.schemas.join(', '))}</span>`],
        ])}</section>
        <section><h3>Skanlar</h3>${scanRows}</section>`,
      foot,
    };
  }
  function dNewSource() {
    const ns = S.ui.ns || {};
    const v = k => esc((ns.f || {})[k] || '');
    let result = '';
    if (ns.err) result = `<p class="err">${esc(ns.err)}</p>`;
    if (ns.ok) {
      const r = ns.ok;
      result = `<div class="box ${r.dup ? 'bad' : r.collide ? 'warn' : 'ok'}"><h3>${r.dup ? 'Bu fiziki DB artıq qeydiyyatdadır' : 'Bağlantı uğurludur'}</h3>
        ${facts([['DB_NAME', `<span class="mono">${esc(r.dbName)}</span>`], ['DBID', `<span class="mono">${esc(r.dbid)}</span>`], ['Sxemlər', `<span class="mono">${esc(r.schemas.join(', '))}</span>`], ['Hüquq', 'Yalnız SELECT, sessiya READ ONLY']])}
        ${r.dup ? `<p class="small" style="margin-top:8px">Eyni DBID ${esc(r.dup)}-də var. Yeni qeydiyyat yaradılmır, mövcud mənbədən istifadə edin.</p>` : ''}
        ${r.collide ? `<p class="small" style="margin-top:8px">"${esc(ns.f.alias)}" adı ${esc(r.collide)}-də də var. Qeyd etmək mümkündür, amma kimlik konflikti açılacaq və nəticələr dərc olunmayacaq.</p>` : ''}</div>`;
    }
    const prod = (ns.f || {}).env === 'PROD';
    return {
      title: 'Mənbə əlavə et', sub: 'Oracle, yalnız oxu hüququ ilə', chips: '',
      body: `<div class="form-grid">
          <div class="field"><label for="ns-alias">Alias</label><input id="ns-alias" data-keep value="${v('alias')}" placeholder="məs. TREASURY"><span class="hint">Göstərmə adı. Kimlik deyil.</span></div>
          <div class="field"><label for="ns-name">Ad</label><input id="ns-name" data-keep value="${v('name')}"></div>
          <div class="field"><label for="ns-host">Host</label><input id="ns-host" data-keep value="${v('host')}" placeholder="trs-tst.nb.local"></div>
          <div class="field"><label for="ns-service">Service</label><input id="ns-service" data-keep value="${v('service')}" placeholder="trs_tst"></div>
          <div class="field"><label for="ns-env">Mühit</label><select id="ns-env" data-keep><option${prod ? '' : ' selected'}>TEST</option><option${prod ? ' selected' : ''}>PROD</option></select></div>
          <div class="field"><label for="ns-secret">Secret istinadı</label><input id="ns-secret" data-keep value="${v('secret')}" placeholder="vault://nb-test/trs_ro"><span class="hint">Şifrə yox, vault-dakı yer.</span></div>
        </div>
        <div class="rule-note"><span><b>Şifrə sahəsi yoxdur.</b> Bağlantını DBA bankın vault-unda yaradır, platforma yalnız istinadı saxlayır.</span></div>
        ${prod ? '<div class="box warn"><h3>PROD mənbəsi</h3><p class="small">Qeyd etmək olar, amma skan InfoSec təsdiqi və dəyişiklik bileti olmadan başlamayacaq.</p></div>' : ''}
        ${result}`,
      foot: `<div class="btn-row">${btn('Bağlantını yoxla', 'nsTest')}${btn('Mənbəni qeyd et', 'nsSave', { cls: 'primary', dis: !ns.ok || !!ns.ok.dup })}</div>`,
    };
  }

  /* ===== Discovery ===== */
  function vDiscovery() {
    const c = counts(); const tab = S.ui.dTab;
    const tabs = [['queue', 'Yoxlama növbəsi', c.fOpen], ['scans', 'Skanlar', c.running], ['detectors', 'Detektorlar', 0]];
    let body = '';
    if (tab === 'queue') {
      const F = S.ui.dFilter;
      const flt = {
        open: f => ['CANDIDATE', 'CONFLICT', 'NEEDS_INVESTIGATION'].includes(f.status),
        labels: f => { const l = labelState(f); return l && !l.effective; },
        confirmed: f => f.status === 'CONFIRMED', rejected: f => f.status === 'REJECTED', all: () => true,
      };
      const list = S.findings.filter(flt[F]);
      const seg = [['open', 'Qərar gözləyən'], ['labels', 'Etiket təsdiqi gözləyən'], ['confirmed', 'Təsdiqlənmiş'], ['rejected', 'Rədd edilmiş'], ['all', 'Hamısı']];
      body = `<div class="filters"><div class="seg" role="group" aria-label="Status filtri">${seg.map(([k, t]) => `<button type="button" data-act="ui" data-key="dFilter" data-val="${k}" aria-pressed="${F === k}">${t}</button>`).join('')}</div></div>
        <div class="tw"><table class="grid"><thead><tr><th>Sütun</th><th>Detektor</th><th class="num">Uyğunluq</th><th class="num">Fərqli dəyər</th><th>Status</th><th>Etiket</th></tr></thead><tbody>
        ${list.length ? list.map(f => {
          const low = ID_TYPES.includes(f.det) && f.distinct < 0.05;
          return `<tr ${openRow('finding', f.id)}><td>${colName(f.col)}</td><td><span class="dtype">${f.det}</span> <span class="small muted">v${f.ver}</span></td>
            <td class="num">${num(f.matched)}/${num(f.nonNull)} <span class="muted">(${pcs(pc(f.matched, f.nonNull))})</span><div class="small muted">${num(f.sample)} sətir nümunə</div></td>
            <td class="num">${low ? chip(pcs(Math.round(f.distinct * 1000) / 10), 'c-warn', '!') : pcs(Math.round(f.distinct * 1000) / 10)}</td>
            <td>${stF(f.status)}</td><td>${labelHtml(f)}</td></tr>`;
        }).join('') : `<tr><td colspan="6">${empty('Bu filtrdə tapıntı yoxdur', 'Başqa filtr seçin.')}</td></tr>`}
        </tbody></table></div>
        <div class="section"><div class="rule-note"><span><b>Uyğunluq faizi tək başına yetmir.</b> BRANCH_CODE-da FIN detektoru 100% uyğunluq verir, amma cəmi 38 fərqli dəyər var. Belə hallarda sistem xəbərdarlıq edir, qərarı insan verir.</span></div></div>`;
    } else if (tab === 'scans') {
      body = `<div class="tw"><table class="grid"><thead><tr><th>Skan</th><th>Mənbə və əhatə</th><th>Detektor və nümunə</th><th>Vəziyyət</th><th>İrəliləyiş</th><th>Başladı</th><th>Dərc</th></tr></thead><tbody>
        ${S.scans.slice().reverse().map(x => `<tr><td class="mono id">${x.id}</td><td><span class="src">${esc(alias(x.src))}</span><span class="mono">${esc(x.scope.join(', '))}</span>${x.note ? `<div class="small muted" style="max-width:46ch">${esc(x.note)}</div>` : ''}</td>
          <td>v${esc(x.detVer)}<div class="small muted">${num(x.sample)} sətir, ${esc(x.method)}</div></td><td>${st(x.status)}</td>
          <td><div class="prog" aria-label="${x.scanned + x.failed} / ${x.planned}"><div style="width:${pc(x.scanned + x.failed, x.planned)}%"></div></div><div class="small muted">${x.scanned} uğurlu, ${x.failed} uğursuz, ${x.skipped} atlanıb, plan ${x.planned}</div></td>
          <td class="small">${esc(x.started)}</td><td>${x.published ? chip('Dərc olunub', 'c-ok', '✓') : chip('Dərc olunmayıb', 'c-mute', '–')}</td></tr>`).join('')}
        </tbody></table></div>
        <div class="section"><div class="rule-note"><span><b>İş yaddaşda yox, bazada saxlanılır.</b> Server və ya brauzer yenidən açılsa, iş qaldığı yerdən davam edir. Uğursuz obyekt "skan olunmayıb" kimi qalır, son uğurlu nəticə silinmir.</span></div></div>`;
    } else {
      body = `<div class="tw"><table class="grid"><thead><tr><th>Kod</th><th>Nəyi tapır</th><th>Metod</th><th>Versiya</th><th class="num">Dəqiqlik</th><th class="num">Tamlıq</th></tr></thead><tbody>
        ${S.detectors.map(d => `<tr><td><span class="dtype">${d.code}</span></td><td>${esc(d.name)}</td><td class="small">${esc(d.method)}</td><td class="mono">${d.ver}</td><td class="num">${pcs(Math.round(d.precision * 100))}</td><td class="num">${pcs(Math.round(d.recall * 100))}</td></tr>`).join('')}
        </tbody></table></div>
        <p class="small muted" style="margin-top:8px">Dəqiqlik və tamlıq golden korpus üzərində ölçülür (burada nümunə rəqəmlərdir). Detektorun yeni versiyası köhnə qərarları dəyişmir, fərq çıxsa yeni baxış açır.</p>`;
    }
    return `<div class="page-head"><div><h1>Kəşf</h1><p>Detektorlar mənbədən təsadüfi nümunə oxuyur və hər sütun üçün sübut yığır. Steward hər tapıntını təsdiqləyir, rədd edir və ya araşdırmaya göndərir. Heç bir nəticə avtomatik qəbul olunmur.</p></div></div>
      <div class="tabs" role="tablist">${tabs.map(([k, t, n]) => `<button type="button" role="tab" data-act="ui" data-key="dTab" data-val="${k}" aria-selected="${tab === k}">${t}${n ? `<span class="count">${n}</span>` : ''}</button>`).join('')}</div>${body}`;
  }
  function findingRail(f) {
    const need = f.label ? f.label.need : NEED(POLICY[f.det]);
    if (f.status === 'REJECTED') return rail([['Namizəd', 'done'], ['Rədd edildi', 'done']]);
    const ap = (f.label && f.label.approvals) || {};
    const steps = [['Namizəd', 'done']];
    if (f.status === 'CONFLICT') steps.push(['Konflikt', 'stop']);
    else if (f.status === 'NEEDS_INVESTIGATION') steps.push(['Araşdırılır', '']);
    else steps.push(['Steward qərarı', f.status === 'CONFIRMED' ? 'done' : '']);
    steps.push(['Etiket təklifi', f.status === 'CONFIRMED' ? 'done' : '']);
    steps.push(['Sahib təsdiqi', ap.owner ? 'done' : '']);
    if (need.includes('infosec')) steps.push(['InfoSec təsdiqi', ap.infosec ? 'done' : '']);
    const l = labelState(f);
    steps.push(['Effektiv etiket', l && l.effective ? 'done' : '']);
    return rail(steps);
  }
  function dFinding(id) {
    const f = fnd(id); const cp = colParts(f.col); const t = tbl(cp.tableId); const s = src(cp.src); const det = S.detectors.find(d => d.code === f.det);
    const rate = pc(f.matched, f.nonNull);
    const lvl = f.label ? f.label.level : POLICY[f.det]; const need = f.label ? f.label.need : NEED(lvl);
    const conflict = f.status === 'CONFLICT' ? `<div class="box bad"><h3>Yeni sübut əvvəlki qərarla ziddir</h3>
      <div class="tw" style="margin-top:8px"><table class="grid"><thead><tr><th></th><th>Əvvəlki</th><th>İndiki</th></tr></thead><tbody>
      <tr><td class="muted small">Qərar</td><td>${stF(f.prev.status)}</td><td>${stF('CANDIDATE')}</td></tr>
      <tr><td class="muted small">Detektor</td><td>v${esc(f.prev.ver)}</td><td>v${esc(f.ver)}</td></tr>
      <tr><td class="muted small">Nümunə</td><td>${f.prev.sample} sətir</td><td>${num(f.sample)} sətir</td></tr>
      <tr><td class="muted small">Nəticə</td><td>${esc(f.prev.comment)}</td><td>${num(f.matched)}/${num(f.nonNull)} uyğun</td></tr></tbody></table></div>
      <p class="small" style="margin-top:8px">Sistem köhnə qərarı səssiz dəyişmir. İkisi də tarixçədə qalır, son sözü steward deyir.</p></div>` : '';
    const ap = (f.label && f.label.approvals) || {};
    const apRow = k => { const a = ap[k]; const nm = k === 'owner' ? `Sahib (${t.owner || 'təyin olunmayıb'})` : 'InfoSec'; return `<tr><td>${esc(nm)}</td><td>${a ? `${chip('Təsdiqlədi', 'c-ok', '✓')} <span class="small muted">${esc(a.by)}, ${esc(a.at)}</span>` : f.status === 'CONFIRMED' ? chip('Gözləyir', 'c-warn', '●') : '<span class="muted small">Steward qərarından sonra</span>'}</td></tr>`; };
    let foot = '';
    if (['CANDIDATE', 'NEEDS_INVESTIGATION', 'CONFLICT'].includes(f.status)) {
      if (!can('finding.review')) foot = lock('finding.review');
      else foot = `<div class="field"><label for="fnote">Şərh</label><textarea id="fnote" data-keep placeholder="Qərarın əsası. Rədd və araşdırma üçün məcburidir."></textarea></div>
        <p class="err" id="ferr" hidden>Rədd etmək və ya araşdırmaya göndərmək üçün səbəbi yazın.</p>
        <div class="btn-row">${f.status === 'CONFLICT'
          ? btn('Yeni sübutu qəbul et', 'review', { cls: 'primary', data: { id, to: 'CONFIRMED' } }) + btn('Əvvəlki qərarı saxla', 'review', { data: { id, to: 'REJECTED' } })
          : btn('Təsdiqlə', 'review', { cls: 'primary', data: { id, to: 'CONFIRMED' } }) + (f.status !== 'NEEDS_INVESTIGATION' ? btn('Araşdırmaya göndər', 'review', { data: { id, to: 'NEEDS_INVESTIGATION' } }) : '') + btn('Rədd et', 'review', { cls: 'danger', data: { id, to: 'REJECTED' } })}</div>`;
    } else if (f.status === 'CONFIRMED') {
      const l = labelState(f);
      if (l.effective) foot = `<p class="small muted">Etiket effektivdir. Dəyişiklik yeni baxış tələb edir.</p>`;
      else {
        const parts = [];
        if (l.pend.includes('owner')) parts.push(!can('label.owner') ? lock('label.owner') : !t.owner ? '<p class="why-locked">Cədvəlin sahibi yoxdur. Əvvəlcə DG Operator Kataloqda sahib təyin etməlidir.</p>' : btn(`Etiketi təsdiqlə (${t.owner} adından)`, 'approveLabel', { cls: 'primary', data: { id, as: 'owner' } }));
        if (l.pend.includes('infosec')) parts.push(can('label.infosec') ? btn('Etiketi təsdiqlə (InfoSec)', 'approveLabel', { cls: 'primary', data: { id, as: 'infosec' } }) : (S.role === 'owner' ? '' : lock('label.infosec')));
        foot = parts.filter(Boolean).join('');
      }
    } else foot = '<p class="small muted">Rədd edilib. Yeni skan fərqli sübut gətirsə, tapıntı konflikt kimi yenidən açılacaq.</p>';
    return {
      title: `${cp.schema}.${cp.table}.${cp.col}`, sub: `${f.id}, mənbə ${s.alias} (${s.identity.dbName})`, chips: stF(f.status),
      body: `${findingRail(f)}${conflict}
        <section><h3>Sübut</h3>${facts([
          ['Detektor', `<span class="dtype">${f.det}</span> ${esc(det.name)}, v${esc(f.ver)}`],
          ['Skan', `<span class="mono">${esc(f.scan)}</span>, ${num(f.sample)} sətir təsadüfi nümunə`],
          ['Dolu dəyər', `${num(f.nonNull)} / ${num(f.sample)}`],
          ['Uyğunluq', `<b>${num(f.matched)}</b> / ${num(f.nonNull)} (${pcs(rate)})`],
          ['Fərqli dəyər', pcs(Math.round(f.distinct * 1000) / 10)],
          f.checks ? ['Yoxlama', esc(f.checks)] : null,
        ])}
        ${f.hint ? `<div class="box warn" style="margin-top:10px"><p class="small">${esc(f.hint)}</p></div>` : ''}
        <p class="small muted" style="margin-top:8px">Xam dəyər mərkəzə gəlmir və saxlanılmır. Burada yalnız say, nisbət və qaydanın versiyası var.</p></section>
        <section><h3>Etiket</h3>
          <p class="small" style="margin-bottom:8px;color:var(--ink2)">Data tipi <span class="dtype">${f.det}</span> faktdır. Giriş etiketi isə siyasətdir: siyasət v3 bu tip üçün <span class="lbl ${lvl}">${lvl}</span> təklif edir. ${need.includes('infosec') ? 'Restricted üçün sahib və InfoSec ayrıca təsdiqləyir.' : 'Sahib təsdiqləyir.'}</p>
          <div class="tw"><table class="grid"><tbody>${need.map(apRow).join('')}</tbody></table></div></section>
        <section><h3>Qərar tarixçəsi</h3>${f.history.length ? `<div class="tw"><table class="grid"><tbody>${f.history.slice().reverse().map(h => `<tr><td class="small id">${esc(h.at)}</td><td><b>${esc(h.what)}</b><div class="small muted">${esc(h.by)}${h.note ? `: ${esc(h.note)}` : ''}</div></td></tr>`).join('')}</tbody></table></div>` : '<p class="small muted">Hələ qərar yoxdur.</p>'}</section>
        <section><h3>Aktiv</h3><p class="small">${colName(f.col)} ${btn('Kataloqda aç', 'open', { cls: 'small', data: { k: 'column', id: f.col, back: '1' } })}</p></section>`,
      foot,
    };
  }

  /* ===== Catalog ===== */
  function covCell(colId, type) {
    const f = findingOf(colId); const t = tbl(colParts(colId).tableId);
    if (f) return `<span class="dtype">${f.det}</span> ${stF(f.status)}`;
    if (/LOB$/.test(type)) return chip('Dəstəklənmir (LOB)', 'c-mute', '–');
    if (t.scanFailed) return chip('Skan olunmayıb', 'c-bad', '!');
    const sc = scanOf(t.scan);
    return `<span class="small muted">Nümunədə tapılmadı (${num(sc.sample)} sətir, ${esc(sc.started.slice(0, 10))})</span>`;
  }
  function vCatalog() {
    const q = (S.ui.q || '').trim().toUpperCase();
    const E = effEdges();
    const groups = S.sources.filter(s => S.tables.some(t => t.src === s.id)).map(s => {
      const ts = S.tables.filter(t => t.src === s.id && (!q || t.id.toUpperCase().includes(q) || t.cols.some(c => c[0].includes(q)) || (t.domain || '').toUpperCase().includes(q)));
      if (!ts.length) return '';
      return `<tr class="grp"><td colspan="6"><span class="src">${esc(s.alias)}</span>${esc(s.name)} <span class="mono muted">${esc(s.identity.dbName)}</span></td></tr>` + ts.map(t => {
        const fs = S.findings.filter(f => f.col.startsWith(t.id + '.') && f.status === 'CONFIRMED');
        const reps = new Set(); t.cols.forEach(c => reportsOf(`${t.id}.${c[0]}`, E).forEach(r => reps.add(r.split(':')[0])));
        return `<tr ${openRow('table', t.id)}><td><span class="mono">${esc(t.schema)}.${esc(t.name)}</span>${t.kind === 'VIEW' ? ' <span class="small muted">view</span>' : ''}<div class="small muted">${esc(t.desc)}</div></td>
          <td>${esc(t.domain)}</td><td>${t.owner ? esc(t.owner) : chip('Təyin olunmayıb', 'c-bad', '!')}</td><td class="num">${num(t.rows)}</td>
          <td>${fs.length ? fs.map(f => `<span class="dtype">${f.det}</span>`).join(' ') : '<span class="muted small">—</span>'}</td>
          <td>${reps.size ? [...reps].map(r => `<span class="src">${r}</span>`).join('') : '<span class="muted small">—</span>'}</td></tr>`;
      }).join('');
    }).join('');
    return `<div class="page-head"><div><h1>Kataloq</h1><p>Hər cədvəl və sütun bir dəfə, fiziki kimliyi ilə qeyd olunur. Eyni adlı cədvəl iki fərqli DB-də iki ayrı aktivdir. Sahib, həssaslıq, etiket və hesabat əlaqəsi bir yerdə görünür.</p></div></div>
      <div class="filters"><label class="sr" for="cq" style="position:absolute;left:-9999px">Axtar</label><input id="cq" class="search" data-input="q" data-keep value="${esc(S.ui.q)}" placeholder="Cədvəl, sütun və ya domen axtar"></div>
      <div class="tw"><table class="grid"><thead><tr><th>Cədvəl</th><th>Domen</th><th>Sahib</th><th class="num">Sətir</th><th>Təsdiqli həssas data</th><th>Hesabatlarda</th></tr></thead><tbody>${groups || `<tr><td colspan="6">${empty('Heç nə tapılmadı', 'Axtarışı dəyişin.')}</td></tr>`}</tbody></table></div>`;
  }
  function dTable(id) {
    const t = tbl(id); const s = src(t.src); const E = effEdges(); const acc = S.access[id];
    const cols = t.cols.map(([c, type]) => {
      const cid = `${id}.${c}`; const f = findingOf(cid); const reps = reportsOf(cid, E);
      return `<tr ${openRow('column', cid)} data-back="1"><td class="mono">${esc(c)}</td><td><span class="dtype">${esc(type)}</span></td><td>${covCell(cid, type)}</td><td>${f ? labelHtml(f) : '<span class="muted">—</span>'}</td><td>${reps.length ? [...new Set(reps.map(r => r.split(':')[0]))].map(r => `<span class="src">${r}</span>`).join('') : '<span class="muted small">—</span>'}</td></tr>`;
    }).join('');
    const ownerFoot = can('owner.assign') ? `<div class="form-grid"><div class="field"><label for="ownerSel">Sahib</label><select id="ownerSel" data-keep>${PEOPLE.map(p => `<option${t.owner === p ? ' selected' : ''}>${p}</option>`).join('')}</select><span class="hint">Domen xartiyasına əsasən.</span></div></div><div class="btn-row">${btn(t.owner ? 'Sahibi dəyiş' : 'Sahib təyin et', 'assignOwner', { cls: 'primary', data: { id } })}</div>` : lock('owner.assign');
    const scan = scanOf(t.scan);
    return {
      title: `${t.schema}.${t.name}`, sub: `${s.alias} (${s.identity.dbName}), ${t.kind === 'VIEW' ? 'view' : 'cədvəl'}`, chips: t.owner ? '' : chip('Sahibsiz', 'c-bad', '!'),
      body: `${facts([
          ['Aktiv ID', `<span class="mono small">${esc(S.tenant.id)} / ${esc(s.id)} / DBID ${esc(s.identity.dbid)} / ${esc(t.schema)}.${esc(t.name)}</span>`],
          ['Təsvir', esc(t.desc)], ['Domen', esc(t.domain)], ['Sahib', t.owner ? esc(t.owner) : chip('Təyin olunmayıb', 'c-bad', '!')], ['Steward', esc(t.steward)],
          ['Sətir', num(t.rows)],
          ['Son skan', t.scanFailed ? `${chip('Uğursuz', 'c-bad', '!')} <span class="small">${esc(t.scanFailed)}</span>` : `<span class="mono">${esc(t.scan)}</span>, ${num(scan.sample)} sətir, ${esc(scan.started)}`],
        ])}
        <section><h3>Sütunlar</h3><div class="tw"><table class="grid"><thead><tr><th>Sütun</th><th>Tip</th><th>Həssaslıq</th><th>Etiket</th><th>Hesabat</th></tr></thead><tbody>${cols}</tbody></table></div>
          <p class="small muted" style="margin-top:6px">"Nümunədə tapılmadı" sütunun təmiz olduğunu sübut etmir. Nümunə ölçüsü və tarixi ona görə göstərilir.</p></section>
        ${acc ? `<section><h3>Giriş sübutu</h3><p class="small muted" style="margin-bottom:6px">Snapshot: ${esc(acc.snapshot)}</p>
          <div class="tw"><table class="grid"><thead><tr><th>Kim</th><th class="num">Say</th><th>Hüquq</th><th>Risk</th></tr></thead><tbody>${acc.grants.map(g => `<tr><td class="mono">${esc(g.who)}<div class="small muted" style="font-family:var(--sans)">${esc(g.kind)}</div></td><td class="num">${g.n}</td><td class="mono">${g.priv}</td><td>${g.risk ? chip(g.risk, 'c-warn', '!') : '<span class="muted small">—</span>'}</td></tr>`).join('')}</tbody></table></div>
          ${acc.requests.map(q => `<div class="box warn" style="margin-top:10px"><h3>${esc(q.id)}: ${esc(q.what)}</h3><p class="small">${chip('Təsdiqlənib', 'c-ok', '✓')} ${esc(q.approved)} &nbsp; ${chip('Mənbədə tətbiq olunmayıb', 'c-warn', '●')}</p><p class="small" style="margin-top:6px">${esc(q.ticket)}. Platforma özü GRANT və ya REVOKE etmir; iş bağlanması üçün mənbədə yoxlanış lazımdır.</p></div>`).join('')}</section>` : ''}`,
      foot: ownerFoot,
    };
  }
  function dColumn(id) {
    const cp = colParts(id); const t = tbl(cp.tableId); const s = src(cp.src);
    if (!t) return { title: cp.col, sub: `${alias(cp.src)}, ${cp.schema}.${cp.table}`, chips: '', body: '<p class="small muted">Bu cədvəl həmin mənbədə hələ skan olunmayıb, ona görə kataloqda yoxdur. Lineage onu yalnız SQL-dən tanıyır.</p>', foot: '' };
    const type = (t.cols.find(c => c[0] === cp.col) || [])[1];
    const f = findingOf(id); const E = effEdges(); const reps = reportsOf(id, E);
    const cdes = S.cdes.filter(c => c.maps.some(m => resolveNode(m.node) === id));
    const binds = S.dqBinds.filter(b => b.node === id || b.ref === id);
    return {
      title: cp.col, sub: `${s.alias}, ${cp.schema}.${cp.table}`, chips: f ? stF(f.status) : '',
      body: `${facts([
          ['Aktiv ID', `<span class="mono small">${esc(S.tenant.id)} / ${esc(s.id)} / DBID ${esc(s.identity.dbid)} / ${esc(cp.schema)}.${esc(cp.table)}.${esc(cp.col)}</span>`],
          ['Fiziki tip', `<span class="dtype">${esc(type)}</span>`],
          ['Data tipi', f ? `<span class="dtype">${f.det}</span> ${stF(f.status)}` : covCell(id, type)],
          ['Giriş etiketi', f ? labelHtml(f) : '<span class="muted">—</span>'],
          ['Sahib', t.owner ? esc(t.owner) : chip('Təyin olunmayıb', 'c-bad', '!')],
        ])}
        ${f ? `<p>${btn('Tapıntını aç', 'open', { cls: 'small', data: { k: 'finding', id: f.id, back: '1' } })}</p>` : ''}
        <section><h3>Hansı hesabatlarda görünür</h3>${reps.length ? `<div class="tw"><table class="grid"><tbody>${reps.map(r => { const n = nodeInfo(r); return `<tr><td>${colName(r)}</td><td class="small">${esc(n.rep.name)}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="small muted">Mövcud lineage əhatəsində hesabat tapılmadı. Bu, "istifadə olunmur" demək deyil: nəticə yalnız parse olunmuş sorğulara əsaslanır.</p>'}</section>
        ${cdes.length ? `<section><h3>CDE</h3>${cdes.map(c => `<p>${esc(c.name)} ${st(c.status)} ${certified(c) ? chip('Sertifikatlı', 'c-ok', '✓') : ''}</p>`).join('')}</section>` : ''}
        ${binds.length ? `<section><h3>DQ qaydaları</h3><div class="tw"><table class="grid"><tbody>${binds.map(b => { const r = lastRun(b.id); return `<tr><td class="mono">${b.id}</td><td>${esc(defOf(b.def).name)}</td><td>${r ? st(r.result) : '<span class="muted small">run yoxdur</span>'}</td></tr>`; }).join('')}</tbody></table></div></section>` : ''}`,
      foot: '',
    };
  }

  /* ===== Lineage ===== */
  function buildGraph(E, rep) {
    let edges = E; let seeds = null;
    if (rep) {
      seeds = rep.fields.map(f => `${rep.id}:${f}`);
      const keep = new Set(); const seen = new Set(seeds); const stack = [...seeds];
      while (stack.length) { const n = stack.pop(); for (const e of E) if (e.to === n) { keep.add(e.i); if (!seen.has(e.from)) { seen.add(e.from); stack.push(e.from); } } }
      edges = E.filter(e => keep.has(e.i));
    }
    const ids = new Set(); edges.forEach(e => { ids.add(e.from); ids.add(e.to); }); if (seeds) seeds.forEach(x => ids.add(x));
    const layerOf = id => (id.startsWith('R-') ? 2 : id.startsWith('SRC-03:') ? 1 : 0);
    const groups = new Map();
    ids.forEach(id => {
      const n = nodeInfo(id);
      if (!groups.has(n.group)) groups.set(n.group, { key: n.group, L: layerOf(id), kind: n.kind, n, nodes: [] });
      groups.get(n.group).nodes.push(id);
    });
    const colIdx = id => { const n = nodeInfo(id); if (n.kind === 'col') { const t = tbl(n.tableId); return t ? t.cols.findIndex(c => c[0] === n.col) : 99; } if (n.kind === 'report') return n.rep.fields.indexOf(n.field); return 0; };
    groups.forEach(g => g.nodes.sort((a, b) => colIdx(a) - colIdx(b)));
    const X = [16, 362, 708]; const W = [272, 272, 256]; const RH = 30; const NH = 24; const GH = 24; const GG = 18; const TOP = 40;
    const pos = new Map();
    const place = (L, list) => { let y = TOP; list.forEach(g => { g.y = y; y += GH; g.nodes.forEach(id => { pos.set(id, { x: X[L], y, w: W[L] }); y += RH; }); y += GG; }); return y; };
    const rank = g => (g.kind === 'report' ? S.reports.findIndex(r => r.id === g.key) : g.kind === 'col' ? S.tables.findIndex(t => t.id === g.key) : g.kind === 'link' ? 60 : 90);
    const byL = [0, 1, 2].map(L => [...groups.values()].filter(g => g.L === L));
    byL[2].sort((a, b) => rank(a) - rank(b)); byL[1].sort((a, b) => rank(a) - rank(b));
    const h2 = place(2, byL[2]); const h1 = place(1, byL[1]);
    const bary = g => { const ys = []; g.nodes.forEach(id => edges.forEach(e => { if (e.from === id && pos.has(e.to)) ys.push(pos.get(e.to).y); })); return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 1e6; };
    byL[0].forEach(g => { g.b = bary(g); }); byL[0].sort((a, b) => a.b - b.b);
    const h0 = place(0, byL[0]);
    return { edges, groups: [...groups.values()], pos, H: Math.max(h0, h1, h2) + 4, NH };
  }
  function graphSvg(G, E) {
    const sel = S.ui.node && G.pos.has(S.ui.node) ? S.ui.node : null;
    let up = new Set(); let down = new Set();
    if (sel) { up = walk(sel, G.edges, 'up'); down = walk(sel, G.edges, 'down'); up.add(sel); down.add(sel); }
    const active = id => !sel || up.has(id) || down.has(id);
    const hot = e => sel && ((up.has(e.from) && up.has(e.to)) || (down.has(e.from) && down.has(e.to)));
    const cdeNodes = new Set(); S.cdes.forEach(c => { cdeNodes.add(c.report); });
    const edgesSvg = G.edges.map(e => {
      const a = G.pos.get(e.from); const b = G.pos.get(e.to); if (!a || !b) return '';
      const x1 = a.x + a.w; const y1 = a.y + G.NH / 2; const x2 = b.x; const y2 = b.y + G.NH / 2; const dx = Math.max(40, (x2 - x1) / 2);
      const cls = `${e.status}${sel ? (hot(e) ? ' hot' : ' dim') : ''}`;
      return `<path class="ln-edge ${cls}" d="M${x1} ${y1} C${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}"><title>${esc(e.tf)} (${esc(ST[e.status][0])})</title></path>`;
    }).join('');
    const groupsSvg = G.groups.map(g => {
      const p = G.pos.get(g.nodes[0]); const x = p.x; const y = g.y + 15;
      let title;
      if (g.kind === 'col') title = `${alias(g.n.src)}  ${g.n.schema}.${g.n.table}`;
      else if (g.kind === 'report') title = `${g.key}  ${g.n.rep.name}`;
      else title = g.n.gtitle;
      if (title.length > 38) title = title.slice(0, 37) + '…';
      return `<g class="ln-group"><text class="gtitle" x="${x}" y="${y}">${esc(title)}</text></g>`;
    }).join('');
    const nodesSvg = [...G.pos.entries()].map(([id, p]) => {
      const n = nodeInfo(id); const f = n.kind === 'col' ? findingOf(id) : null;
      const sens = n.kind === 'col' ? isSens(id) : n.kind === 'report' ? [...walk(id, G.edges, 'up')].some(isSens) : false;
      let cls = 'ln-node'; if (sens) cls += ' sens'; if (n.kind === 'link') cls += ' virt'; if (n.kind === 'dyn') cls += ' unres'; if (sel === id) cls += ' sel'; if (!active(id)) cls += ' dim';
      const label = n.kind === 'report' ? n.field : n.label;
      let tag = '';
      if (n.kind === 'col' && f && f.status === 'CONFIRMED') tag = `<text x="${p.x + p.w - 8}" y="${p.y + 16}" text-anchor="end" style="fill:var(--bad);font:600 10.5px var(--sans)">${f.det}</text>`;
      else if (n.kind === 'report' && cdeNodes.has(id)) tag = `<text x="${p.x + p.w - 8}" y="${p.y + 16}" text-anchor="end" style="fill:var(--accent);font:600 10.5px var(--sans)">CDE</text>`;
      else if (n.kind === 'report' && sens) tag = `<text x="${p.x + p.w - 8}" y="${p.y + 16}" text-anchor="end" style="fill:var(--bad);font:600 10.5px var(--sans)">həssas</text>`;
      return `<g class="${cls}" data-act="selNode" data-id="${esc(id)}" tabindex="0" role="button" aria-label="${esc(label)}"><rect class="box" x="${p.x}" y="${p.y}" width="${p.w}" height="${G.NH}" rx="5"/><rect class="flag" x="${p.x}" y="${p.y}" width="4" height="${G.NH}" rx="2" fill="transparent"/><text x="${p.x + 12}" y="${p.y + 16}">${esc(label)}</text>${tag}</g>`;
    }).join('');
    return `<svg width="980" height="${G.H}" viewBox="0 0 980 ${G.H}" role="img" aria-label="Lineage xəritəsi">
      <g class="ln-col"><text x="16" y="20">Mənbə sistemləri</text><text x="362" y="20">Məlumat anbarı (DWH)</text><text x="708" y="20">Hesabatlar</text></g>
      ${edgesSvg}${groupsSvg}${nodesSvg}</svg>`;
  }
  function nodePanel(E) {
    const id = S.ui.node;
    if (!id) return `<div class="panel panel-pad"><h3>Təsir təhlili</h3><p class="small" style="margin-top:6px;color:var(--ink2)">Xəritədə sütuna və ya hesabat sahəsinə klikləyin. Yuxarı axın (haradan gəlir) və aşağı axın (nəyə təsir edir) işıqlanacaq.</p></div>`;
    const n = nodeInfo(id); const down = [...walk(id, E, 'down')].filter(x => x.startsWith('R-')); const up = [...walk(id, E, 'up')].filter(x => !x.startsWith('R-'));
    const inE = E.filter(e => e.to === id); const outE = E.filter(e => e.from === id);
    const eRow = (e, other) => `<tr><td>${colName(other)}</td><td class="small">${esc(e.tf)}</td><td>${st(e.status)}</td></tr>`;
    return `<div class="panel panel-pad" style="display:flex;flex-direction:column;gap:14px">
      <div><h3>${colName(id)}</h3>${n.kind === 'col' && tbl(n.tableId) ? `<p style="margin-top:6px">${btn('Kataloqda aç', 'open', { cls: 'small', data: { k: 'column', id } })}</p>` : ''}${n.kind === 'link' ? '<p class="small" style="margin-top:6px;color:var(--warn)">Bu node real cədvəl deyil: link hansı DB-yə getdiyi sübut olunana qədər yer tutucudur.</p>' : ''}</div>
      ${n.kind !== 'report' ? `<div><h3>Təsir edir: ${down.length} hesabat sahəsi</h3>${down.length ? `<ul class="small" style="margin:6px 0 0;padding-left:18px">${down.map(r => `<li>${colName(r)}</li>`).join('')}</ul>` : '<p class="small muted" style="margin-top:4px">Mövcud əhatəyə görə hesabat yoxdur (bu, "istifadə olunmur" demək deyil).</p>'}</div>` : ''}
      ${n.kind === 'report' ? `<div><h3>Mənbə sütunları: ${up.length}</h3><ul class="small" style="margin:6px 0 0;padding-left:18px">${up.map(r => `<li>${colName(r)}</li>`).join('')}</ul></div>` : ''}
      ${inE.length ? `<div><h3>Haradan gəlir</h3><div class="tw"><table class="grid"><tbody>${inE.map(e => eRow(e, e.from)).join('')}</tbody></table></div></div>` : ''}
      ${outE.length ? `<div><h3>Hara gedir</h3><div class="tw"><table class="grid"><tbody>${outE.map(e => eRow(e, e.to)).join('')}</tbody></table></div></div>` : ''}
    </div>`;
  }
  function vLineage() {
    const E = effEdges(); const repId = S.ui.rep; const rep = repId === 'ALL' ? null : S.reports.find(r => r.id === repId);
    const G = buildGraph(E, rep);
    const repStat = r => { const ue = []; r.fields.forEach(f => upEdges(`${r.id}:${f}`, E).forEach(e => ue.push(e))); const bad = new Set(ue.filter(e => !['VERIFIED', 'MANUAL'].includes(e.status)).map(e => e.i)); const sens = r.fields.filter(f => [...walk(`${r.id}:${f}`, E, 'up')].some(isSens)); return { bad: bad.size, sens: sens.length }; };
    const list = [{ id: 'ALL', name: 'Bütün hesabatlar' }].concat(S.reports).map(r => {
      let meta = '';
      if (r.id !== 'ALL') { const x = repStat(r); meta = `<span>${x.bad ? chip(`${x.bad} sübutsuz əlaqə`, 'c-warn', '?') : chip('Sübutlu', 'c-ok', '✓')} ${x.sens ? chip(`${x.sens} həssas sahə`, 'c-bad', '!') : ''}</span>`; }
      return `<button type="button" data-act="ui" data-key="rep" data-val="${r.id}" aria-pressed="${repId === r.id}"><span class="rn">${r.id === 'ALL' ? '' : `<span class="src">${r.id}</span>`}${esc(r.name)}</span>${meta}</button>`;
    }).join('');
    const lq = S.lineageQueue;
    return `<div class="page-head"><div><h1>Lineage</h1><p>Report Lineage parser-i hesabat SQL-lərindən sütun səviyyəsində əlaqə çıxarır. Hansı mənbə olduğu sübut olunmayan əlaqə xəritədə qırıq xətlə qalır və heç bir CDE-ni sertifikatlı etmir.</p></div></div>
      <div class="rep-row" role="group" aria-label="Hesabat seçimi">${list}</div>
      <div>
        <div class="panel"><div class="canvas">${graphSvg(G, E)}</div>
          <div class="legend">
            <span><svg width="30" height="8"><path d="M0 4h30" stroke="var(--ink3)" stroke-width="1.5"/></svg>Sübutlu</span>
            <span><svg width="30" height="8"><path d="M0 4h30" stroke="var(--warn)" stroke-width="1.5" stroke-dasharray="6 4"/></svg>Qeyri-müəyyən (bir neçə mümkün mənbə)</span>
            <span><svg width="30" height="8"><path d="M0 4h30" stroke="var(--bad)" stroke-width="1.5" stroke-dasharray="3 4"/></svg>Həll edilməyib</span>
            <span><svg width="30" height="8"><path d="M0 4h30" stroke="var(--info)" stroke-width="1.5"/></svg>Əl ilə, sübutla</span>
            <span><svg width="12" height="14"><rect width="4" height="14" rx="2" fill="var(--bad)"/></svg>Təsdiqli həssas sütun</span>
          </div></div>
      </div>
      <div class="cols section">
        <div><h2 style="margin-bottom:10px">Sübut gözləyən əlaqələr</h2>
          <div class="tw"><table class="grid"><thead><tr><th>ID</th><th>Nə</th><th>Sorğular</th><th>Status</th></tr></thead><tbody>
          ${lq.map(q => `<tr ${openRow('lq', q.id)}><td class="mono id">${q.id}</td><td>${esc(q.title)}</td><td class="small">${esc(q.queries.join(', '))}</td><td>${st(q.status)}</td></tr>`).join('')}</tbody></table></div></div>
        <div>${nodePanel(E)}</div>
      </div>`;
  }
  function dLQ(id) {
    const q = S.lineageQueue.find(x => x.id === id);
    let res = '';
    if (q.status === 'RESOLVED') res = `<div class="box ok"><h3>Həll edilib</h3><p class="small">${esc(q.res.by)}, ${esc(q.res.at)}: ${esc(q.res.what)}</p><p class="small" style="margin-top:4px">Sübut: ${esc(q.res.note)}</p></div>`;
    if (q.status === 'DEFERRED') res = `<div class="box warn"><h3>Sübut gözlənilir</h3><p class="small">${esc(q.res.by)}, ${esc(q.res.at)}: ${esc(q.res.note)}</p></div>`;
    const cands = q.candidates.map((c, i) => {
      const label = c.src ? `${c.src} (${alias(c.src)}, ${src(c.src).identity.dbName})` : `Manual mapping: ${c.node.split(':')[1]}`;
      return `<label class="box" style="display:grid;grid-template-columns:20px 1fr;gap:8px;cursor:pointer"><input type="radio" name="lqc" id="lqc-${i}" data-keep value="${i}"${i === 0 ? ' checked' : ''}><span><b>${esc(label)}</b><span class="small" style="display:block;color:var(--ink2)">${esc(c.evidence)}</span></span></label>`;
    }).join('');
    const open = q.status !== 'RESOLVED';
    return {
      title: q.title, sub: `${q.id}, ${q.kind === 'DB_LINK' ? 'DB link qeyri-müəyyənliyi' : 'dinamik SQL'}`, chips: st(q.status),
      body: `<p style="color:var(--ink2)">${esc(q.why)}</p>${facts([['Sorğular', esc(q.queries.join(', '))]])}${res}
        ${open ? `<section><h3>Namizədlər</h3>${cands}</section>` : ''}`,
      foot: !open ? '' : !can('lineage.resolve') ? lock('lineage.resolve') : `<div class="field"><label for="lqnote">Sübut</label><textarea id="lqnote" data-keep placeholder="Məs. DBA-dan link tərifi, CHG nömrəsi, SQL sahibinin izahı"></textarea></div><p class="err" id="lqerr" hidden>Sübutu yazın. Sübutsuz əlaqə təsdiqlənmir.</p>
        <div class="btn-row">${btn(q.kind === 'DB_LINK' ? 'Seçilmiş mənbəni təsdiqlə' : 'Manual mapping-i qəbul et', 'resolveLQ', { cls: 'primary', data: { id } })}${q.status !== 'DEFERRED' ? btn('Sübut gözlənilir kimi saxla', 'deferLQ', { data: { id } }) : ''}</div>`,
    };
  }

  /* ===== Glossary and CDE ===== */
  function vCDE() {
    const cur = cdeOf(S.ui.cde) || S.cdes[0];
    const list = S.domains.map(d => `<div style="padding:12px 14px;border-top:1px solid var(--rule)"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>${esc(d.name)}</b>${st(d.charter)}</div><div class="small muted">Sahib: ${esc(d.owner || 'yoxdur')}</div></div>
      ${S.cdes.filter(c => termOf(c.term).domain === d.id).map(c => `<button type="button" data-act="ui" data-key="cde" data-val="${c.id}" aria-pressed="${cur.id === c.id}"><span class="rn">${esc(c.name)}</span><span>${st(c.status)} ${certified(c) ? chip('Sertifikatlı', 'c-ok', '✓') : ''}</span></button>`).join('')}`).join('');
    const term = termOf(cur.term); const checks = cdeChecks(cur); const cert = checks.every(x => x.ok);
    const repN = nodeInfo(cur.report);
    const order = ['DRAFT', 'IN_REVIEW', 'APPROVED'];
    const ix = order.indexOf(cur.status);
    const r = rail([['Qaralama', 'done'], ['Baxışda', ix >= 1 ? 'done' : ''], ['Təsdiqlənib', ix >= 2 ? 'done' : ''], ['Sertifikatlı', cert ? 'done' : '']]);
    const maps = cur.maps.map((m, i) => {
      const node = resolveNode(m.node);
      const act = m.status === 'PROPOSED' ? (can('mapping.approve') ? btn('Təsdiqlə', 'approveMap', { cls: 'small', data: { c: cur.id, i } }) : '<span class="small muted">Steward təsdiqləyir</span>') : m.status === 'BLOCKED' ? `<span class="small" style="color:var(--bad)">Lineage qeyri-müəyyəndir (${esc(m.node.slice(5).split('/')[0])})</span>` : '';
      return `<tr><td>${colName(node)}</td><td>${st(m.status)}</td><td>${act}</td></tr>`;
    }).join('');
    const dq = cur.dq.map(b => { const bd = bindOf(b); const rr = lastRun(b); return `<tr><td class="mono">${b}</td><td>${esc(defOf(bd.def).name)}</td><td>${rr ? `${st(rr.result)}${rr.den ? ` <span class="small muted">${pcs(pc(rr.pass, rr.den))}</span>` : ''}` : '<span class="small muted">run yoxdur</span>'}</td></tr>`; }).join('');
    let foot = '';
    if (cur.status === 'DRAFT') foot = can('cde.submit') ? btn('Baxışa göndər', 'cdeSubmit', { cls: 'primary', data: { id: cur.id } }) : lock('cde.submit');
    if (cur.status === 'IN_REVIEW') foot = can('cde.approve') ? btn(`Tərifi təsdiqlə (${cur.owner})`, 'cdeApprove', { cls: 'primary', data: { id: cur.id } }) : lock('cde.approve');
    return `<div class="page-head"><div><h1>Qlossari və CDE</h1><p>CDE (kritik data elementi) hesabatdakı bir göstəricinin biznes mənasıdır: tərif, düstur, sahib və onu qidalandıran fiziki sütunlar. Təsdiq və sertifikat ayrı şeylərdir: sahib tərifi təsdiqləyə bilər, amma sertifikat yalnız bütün şərtlər sübutla ödənəndə verilir.</p></div></div>
      <div class="lin-wrap">
        <div class="panel rep-list">${list}</div>
        <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
          <div class="panel panel-pad" style="display:flex;flex-direction:column;gap:14px">
            <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start"><div><h2>${esc(cur.name)}</h2><p class="small muted">${cur.id}, kritiklik: ${esc(cur.crit)}</p></div><div>${st(cur.status)} ${cert ? chip('Sertifikatlı', 'c-ok', '✓') : chip('Sertifikatsız', 'c-mute', '○')}</div></div>
            ${r}
            ${facts([
              ['Termin', `<b>${esc(term.name)}</b> ${st(term.status)}<div class="small" style="color:var(--ink2)">${esc(term.def)}</div>`],
              ['Düstur', `<span class="mono">${esc(cur.formula)}</span>`],
              ['Hesabat sahəsi', `${colName(cur.report)} <span class="small muted">${esc(repN.rep.name)}</span>`],
              ['Sahib', esc(cur.owner)],
            ])}
            ${foot ? `<div class="btn-row">${foot}</div>` : ''}
          </div>
          <div class="cols" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">
            <div class="panel panel-pad"><h3>Sertifikat şərtləri</h3><ul class="checklist" style="margin-top:6px">${checks.map(x => `<li class="${x.ok ? 'yes' : 'no'}"><span class="mk" aria-hidden="true">${x.ok ? '✓' : '×'}</span><div><b class="small">${esc(x.t)}</b><p>${esc(x.d)}</p></div></li>`).join('')}</ul></div>
            <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
              <div><h3 style="margin-bottom:8px">Fiziki mapping</h3><div class="tw"><table class="grid"><tbody>${maps}</tbody></table></div></div>
              <div><h3 style="margin-bottom:8px">DQ nəzarəti</h3><div class="tw"><table class="grid"><tbody>${dq || '<tr><td class="muted small">Qayda bağlanmayıb</td></tr>'}</tbody></table></div></div>
            </div>
          </div>
        </div>
      </div>
      <div class="section"><h2 style="margin-bottom:10px">Biznes terminləri</h2><div class="tw"><table class="grid"><thead><tr><th>Termin</th><th>Domen</th><th>Tərif</th><th>Status</th></tr></thead><tbody>
        ${S.terms.map(t => `<tr><td><b>${esc(t.name)}</b></td><td>${esc(S.domains.find(d => d.id === t.domain).name)}</td><td class="small" style="max-width:60ch">${esc(t.def)}</td><td>${st(t.status)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  /* ===== DQ ===== */
  function vDQ() {
    const tab = S.ui.qTab; const c = counts();
    const tabs = [['binds', 'Bağlamalar', 0], ['defs', 'Qaydalar', 0], ['runs', 'Nəticələr', 0], ['issues', 'Problemlər', c.iss]];
    const score = r => (r && r.den ? `${pcs(pc(r.pass, r.den))} <span class="small muted">(${num(r.pass)}/${num(r.den)})</span>` : '<span class="muted small">—</span>');
    let body = '';
    if (tab === 'binds') {
      body = `<div class="tw"><table class="grid"><thead><tr><th>Bağlama</th><th>Qayda</th><th>Aktiv</th><th class="num">Hədd</th><th>Cədvəl</th><th>Son nəticə</th><th></th></tr></thead><tbody>
        ${S.dqBinds.map(b => { const d = defOf(b.def); const r = lastRun(b.id); const ok = d.status === 'APPROVED';
          return `<tr><td class="mono id">${b.id}</td><td>${esc(d.name)}<div class="small muted">${d.id}, v${d.ver}</div></td><td>${colName(b.node)}${b.ref ? `<div class="small muted">müqayisə: ${colName(b.ref, false)}</div>` : ''}</td><td class="num">${String(b.threshold).replace('.', ',')}%</td><td class="small">${esc(b.sched)}<div class="muted">${esc(b.coverage)}</div></td>
          <td>${r ? `${st(r.result)} ${score(r)}<div class="small muted">${esc(r.at)}</div>` : '<span class="muted small">run yoxdur</span>'}</td>
          <td>${!ok ? '<span class="small muted">Qayda təsdiqlənməyib</span>' : can('dq.run') ? btn('İndi işlət', 'runDQ', { cls: 'small', data: { id: b.id } }) : '<span class="small muted">Steward və ya Operator</span>'}</td></tr>`; }).join('')}
        </tbody></table></div>`;
    } else if (tab === 'defs') {
      body = `<div class="tw"><table class="grid"><thead><tr><th>Qayda</th><th>Ölçü</th><th>Məntiq</th><th>Ciddilik</th><th>Versiya</th><th>Status</th></tr></thead><tbody>
        ${S.dqDefs.map(d => `<tr><td><b>${esc(d.name)}</b><div class="small muted">${d.id}${d.by ? `, təsdiq: ${esc(d.by)}` : ''}</div>${d.note ? `<div class="small" style="color:var(--warn);max-width:46ch">${esc(d.note)}</div>` : ''}</td><td>${esc(d.dim)}</td><td class="mono small">${esc(d.logic)}</td><td>${esc(d.sev)}</td><td>v${d.ver}</td><td>${st(d.status)}</td></tr>`).join('')}
        </tbody></table></div>`;
    } else if (tab === 'runs') {
      body = `<div class="tw"><table class="grid"><thead><tr><th>Run</th><th>Bağlama</th><th>Vaxt</th><th>Nəticə</th><th class="num">Bal</th><th>Qeyd</th></tr></thead><tbody>
        ${S.dqRuns.slice().reverse().map(r => { const b = bindOf(r.bind); return `<tr><td class="mono id">${r.id}</td><td class="mono">${r.bind}<div class="small muted" style="font-family:var(--sans)">hədd ${String(b.threshold).replace('.', ',')}%</div></td><td class="small">${esc(r.at)}</td><td>${st(r.result)}</td><td class="num">${score(r)}</td><td class="small" style="max-width:48ch">${esc(r.scoreNote || r.note || '')}</td></tr>`; }).join('')}
        </tbody></table></div>
        <p class="small muted" style="margin-top:8px">ERROR və "qiymətləndirilmədi" PASS sayılmır. Bal həmişə surət və məxrəclə göstərilir.</p>`;
    } else {
      body = S.issues.map(i => `<div class="panel panel-pad" style="display:flex;flex-direction:column;gap:10px;margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><h2>${esc(i.title)}</h2><p class="small muted">${i.id}, ${esc(i.sev)}, mənbə run ${i.run}</p></div><div>${st(i.status)}</div></div>
          ${rail([['Açıldı', 'done'], ['Sahib düzəldir', i.status !== 'OPEN' ? 'done' : ''], ['Təkrar run', i.status === 'CLOSED' ? 'done' : ''], ['Bağlandı', i.status === 'CLOSED' ? 'done' : '']])}
          ${facts([['Təyin olunub', esc(i.assignee)], ['Son tarix', esc(i.due)], ['Bağlama', `<span class="mono">${i.bind}</span> ${esc(defOf(bindOf(i.bind).def).name)}`], i.closedBy ? ['Bağlanma sübutu', `<span class="mono">${esc(i.closedBy)}</span> PASS`] : null, i.fixNote ? ['Sahibin qeydi', esc(i.fixNote)] : null])}
          <p class="small" style="color:var(--ink2)">${esc(i.note)}</p>
          ${i.status === 'OPEN' ? (can('issue.fix') ? `<div class="field"><label for="fixnote">Nə edildi</label><textarea id="fixnote" data-keep placeholder="Məs. mənbədə məzənnə cədvəli düzəldildi, CHG-88240"></textarea></div><div class="btn-row">${btn('Düzəldildi, yoxlamaya göndər', 'claimFix', { cls: 'primary', data: { id: i.id } })}</div>` : lock('issue.fix')) : ''}
          ${i.status === 'FIX_CLAIMED' ? `<p class="small">${chip('Yoxlama gözləyir', 'c-warn', '●')} ${esc(i.bind)} qaydası yenidən işlədiləndə PASS gələrsə problem özü bağlanacaq.</p>` : ''}
        </div>`).join('') || empty('Açıq problem yoxdur', '');
    }
    return `<div class="page-head"><div><h1>Data keyfiyyəti</h1><p>Qayda nəyi yoxladığını deyir, bağlama onu konkret sütuna qoşur, run nəticəni saxlayır, problem isə cavabdeh şəxsi göstərir. Dördünün ayrıca ID-si var. Platforma mənbədə heç nəyi düzəltmir.</p></div></div>
      <div class="tabs" role="tablist">${tabs.map(([k, t, n]) => `<button type="button" role="tab" data-act="ui" data-key="qTab" data-val="${k}" aria-selected="${tab === k}">${t}${n ? `<span class="count">${n}</span>` : ''}</button>`).join('')}</div>${body}`;
  }

  /* ===== Compliance ===== */
  function vCompliance() {
    const T = S.tables; const allCols = []; T.forEach(t => t.cols.forEach(c => allCols.push({ id: `${t.id}.${c[0]}`, type: c[1], t })));
    const liveSrc = S.sources.filter(x => x.identity.status !== 'RETIRED'); const verified = liveSrc.filter(x => x.identity.status === 'VERIFIED');
    const owned = T.filter(t => t.owner);
    const covered = allCols.filter(c => findingOf(c.id) || (!/LOB$/.test(c.type) && !c.t.scanFailed && c.t.scan));
    const conf = S.findings.filter(f => f.status === 'CONFIRMED'); const lab = conf.filter(f => labelState(f).effective);
    const E = effEdges();
    const gapLinks = (items, k, idf, txt) => items.length ? `<ul class="small" style="margin:8px 0 0;padding-left:18px">${items.slice(0, 5).map(x => `<li><button type="button" class="linklike" data-act="open" data-k="${k}" data-id="${esc(idf(x))}">${esc(txt(x))}</button></li>`).join('')}${items.length > 5 ? `<li class="muted">və daha ${items.length - 5}</li>` : ''}</ul>` : '<p class="small muted" style="margin-top:8px">Boşluq yoxdur.</p>';
    const ctl = (t, ref, a, b, gaps) => `<div class="panel panel-pad"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><h3>${esc(t)}</h3>${a === b ? chip('Tamam', 'c-ok', '✓') : chip('Boşluq var', 'c-warn', '!')}</div><p class="small muted" style="margin:2px 0 10px">${esc(ref)}</p>${meter(a, b)}${gaps}</div>`;
    const testPII = conf.filter(f => src(colParts(f.col).src).env === 'TEST');
    const pan = S.findings.filter(f => f.det === 'PAN' && f.status !== 'REJECTED');
    const panShown = S.reports.flatMap(r => r.fields.map(f => `${r.id}:${f}`)).filter(id => [...walk(id, E, 'up')].some(u => { const f = findingOf(u); return f && f.det === 'PAN' && f.status !== 'REJECTED'; }));
    const linOk = S.cdes.filter(c => upEdges(c.report, E).every(e => ['VERIFIED', 'MANUAL'].includes(e.status)));
    const dqOk = S.cdes.filter(c => c.dq.length && c.dq.every(b => { const r = lastRun(b); return r && r.result === 'PASS'; }));
    const cert = S.cdes.filter(certified);
    const noLin = S.cdes.filter(c => !linOk.includes(c)); const noDq = S.cdes.filter(c => !dqOk.includes(c)); const noCert = S.cdes.filter(c => !cert.includes(c));
    const cdeGap = list => list.length ? `<ul class="small" style="margin:8px 0 0;padding-left:18px">${list.map(c => `<li><button type="button" class="linklike" data-act="goCde" data-id="${c.id}">${esc(c.name)}</button></li>`).join('')}</ul>` : '<p class="small muted" style="margin-top:8px">Boşluq yoxdur.</p>';
    return `<div class="page-head"><div><h1>Uyğunluq</h1><p>Göstəricilər digər ekranlardakı qərarlardan avtomatik hesablanır, ayrıca doldurulmur. Bənd istinadları ilkin xəritədir; uyğunluq və hüquq bölməsi təsdiqləməlidir.</p></div></div>
      <div class="section" style="margin-top:0"><h2>AMB 14/2: aktivlərin uçotu və təsnifatı</h2><p class="lede">İnventar, sahib, təsnifat və etiket.</p>
        <div class="cols-3" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
          ${ctl('Mənbə kimliyi təsdiqlənib', 'Mənbələr, fiziki kimlik (DBID) yoxlanılıb', verified.length, liveSrc.length, gapLinks(liveSrc.filter(x => !verified.includes(x)), 'source', x => x.id, x => `${x.id} ${x.alias}: ${ST[x.identity.status][0].toLowerCase()}`))}
          ${ctl('Sahib təyin olunub', 'Cədvəllər', owned.length, T.length, gapLinks(T.filter(t => !t.owner), 'table', t => t.id, t => `${t.schema}.${t.name}`))}
          ${ctl('Həssaslıq yoxlanılıb', 'Sütunlar, ən azı bir skanla əhatə olunub', covered.length, allCols.length, gapLinks(allCols.filter(c => !covered.includes(c)), 'column', c => c.id, c => `${c.t.schema}.${c.t.name}.${c.id.split('.').pop()}`))}
          ${ctl('Etiket effektivdir', 'Təsdiqlənmiş həssas sütunlar', lab.length, conf.length, gapLinks(conf.filter(f => !lab.includes(f)), 'finding', f => f.id, f => `${colParts(f.col).table}.${colParts(f.col).col}`))}
        </div></div>
      <div class="section"><h2>Test mühitində real şəxsi data</h2><p class="lede">AMB 14/2 test üçün anonimləşdirilməmiş data istifadəsini məhdudlaşdırır. Bütün pilot mənbələri TEST-dir, təsdiqlənmiş həssas sütunlar isə realdır.</p>
        <div class="panel panel-pad"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${testPII.length ? chip(`${testPII.length} sütun`, 'c-bad', '!') : chip('Yoxdur', 'c-ok', '✓')}<span class="small">TEST mənbələrində təsdiqlənmiş PII/PCI sütunu. Anonimləşdirmə və ya maskalama planı tələb oluna bilər.</span></div>${gapLinks(testPII, 'finding', f => f.id, f => `${alias(colParts(f.col).src)} ${colParts(f.col).table}.${colParts(f.col).col} (${f.det})`)}</div></div>
      <div class="section"><h2>PCI DSS 4.0.1: kart nömrəsi</h2><p class="lede">3.5.1: saxlanılan PAN oxunmaz olmalıdır. 3.4.1: göstəriləndə maskalanmalıdır.</p>
        <div class="cols-3" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
          <div class="panel panel-pad"><div style="display:flex;justify-content:space-between;gap:8px"><h3>PAN saxlanılan yerlər</h3>${pan.length ? chip(`${pan.length} yer`, 'c-bad', '!') : chip('Yoxdur', 'c-ok', '✓')}</div><p class="small muted" style="margin:2px 0 6px">Təsdiqli və namizəd. Maskalanmış PAN sayılmır.</p>${gapLinks(pan, 'finding', f => f.id, f => `${colParts(f.col).table}.${colParts(f.col).col} (${FST[f.status][0].toLowerCase()})`)}</div>
          <div class="panel panel-pad"><div style="display:flex;justify-content:space-between;gap:8px"><h3>Hesabatda maskasız PAN</h3>${panShown.length ? chip(`${panShown.length} sahə`, 'c-bad', '!') : chip('Yoxdur', 'c-ok', '✓')}</div><p class="small muted" style="margin:2px 0 6px">R-104 maskalanmış sütundan oxuyur, ona görə sayılmır.</p>${panShown.length ? `<ul class="small">${panShown.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>
        </div></div>
      <div class="section"><h2>BCBS 239: kritik göstəricilər</h2><p class="lede">Hər CDE üçün tam lineage, keyfiyyət nəzarəti və sahib təsdiqi.</p>
        <div class="cols-3" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
          ${ctl('Lineage tamdır', 'CDE-lər, hesabatdan mənbəyə qədər sübutlu', linOk.length, S.cdes.length, cdeGap(noLin))}
          ${ctl('DQ son nəticəsi PASS', 'CDE-lər', dqOk.length, S.cdes.length, cdeGap(noDq))}
          ${ctl('Sertifikatlı', 'CDE-lər, bütün şərtlər ödənib', cert.length, S.cdes.length, cdeGap(noCert))}
        </div></div>`;
  }

  /* ===== Audit ===== */
  function vAudit() {
    const q = (S.ui.aq || '').trim().toLowerCase();
    const rows = S.audit.slice().reverse().filter(a => !q || Object.values(a).join(' ').toLowerCase().includes(q));
    return `<div class="page-head"><div><h1>Audit jurnalı</h1><p>Hər qərar və sistem hadisəsi buraya düşür və dəyişdirilmir. Prototipdə sizin kliklədiyiniz hər əməliyyat da burada görünür.</p></div><div>${btn('CSV ixrac et', 'exportAudit')}</div></div>
      <div class="filters"><label for="aq" style="position:absolute;left:-9999px">Axtar</label><input id="aq" class="search" data-input="aq" data-keep value="${esc(S.ui.aq)}" placeholder="Şəxs, obyekt və ya əməliyyat axtar"></div>
      <div class="tw"><table class="grid"><thead><tr><th>Vaxt</th><th>Kim</th><th>Rol</th><th>Əməliyyat</th><th>Obyekt</th><th>Təfərrüat</th></tr></thead><tbody>
      ${rows.map(a => `<tr><td class="small id">${esc(a.at)}</td><td>${esc(a.actor)}</td><td class="small">${esc(a.role)}</td><td>${esc(a.action)}</td><td class="mono">${esc(a.obj)}</td><td class="small" style="max-width:52ch">${esc(a.detail)}</td></tr>`).join('') || `<tr><td colspan="6">${empty('Heç nə tapılmadı', '')}</td></tr>`}
      </tbody></table></div>`;
  }

  /* ---------- drawer ---------- */
  const DRAWERS = { finding: dFinding, source: dSource, newSource: dNewSource, table: dTable, column: dColumn, lq: dLQ };
  let lastFocus = null;
  function renderDrawer() {
    const el = $('#drawer'); const scrim = $('#scrim');
    if (!S.drawer || !DRAWERS[S.drawer.k]) { el.classList.remove('open'); scrim.hidden = true; el.innerHTML = ''; return; }
    const d = DRAWERS[S.drawer.k](S.drawer.id);
    el.innerHTML = `<div class="d-head">${S.drawer.back ? `<button type="button" class="icon-btn" data-act="back" aria-label="Geri">‹</button>` : ''}<div class="t"><h2 id="d-title">${esc(d.title)}</h2><p>${esc(d.sub)}</p><div style="margin-top:6px">${d.chips || ''}</div></div><button type="button" class="icon-btn" data-act="close" aria-label="Bağla">×</button></div>
      <div class="d-body">${d.body}</div>${d.foot ? `<div class="d-foot">${d.foot}</div>` : ''}`;
    scrim.hidden = false;
    requestAnimationFrame(() => el.classList.add('open'));
  }
  function openDrawer(k, id, back) {
    if (!S.drawer) lastFocus = document.activeElement;
    S.drawer = { k, id, back: back && S.drawer ? { k: S.drawer.k, id: S.drawer.id, back: S.drawer.back } : null };
    render();
    setTimeout(() => { const b = $('#drawer .icon-btn[data-act="close"]'); if (b) b.focus(); }, 30);
  }
  function closeDrawer() { S.drawer = null; if (S.ui.ns) S.ui.ns = null; render(); if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus(); }

  /* ---------- render ---------- */
  const $ = s => document.querySelector(s);
  const VIEWS = { overview: vOverview, sources: vSources, discovery: vDiscovery, catalog: vCatalog, lineage: vLineage, cde: vCDE, dq: vDQ, compliance: vCompliance, audit: vAudit };
  function snapshot() {
    const m = {};
    document.querySelectorAll('[data-keep]').forEach(el => { if (el.id) m[el.id] = el.type === 'radio' || el.type === 'checkbox' ? el.checked : el.value; });
    const a = document.activeElement; const db = $('#drawer .d-body'); const cv = $('#main .canvas');
    return { m, focus: a && a.id ? a.id : null, sel: a && 'selectionStart' in a ? [a.selectionStart, a.selectionEnd] : null, dk: S.drawer ? S.drawer.k + S.drawer.id : null, dTop: db ? db.scrollTop : 0, cLeft: cv ? cv.scrollLeft : 0 };
  }
  function restore(s) {
    Object.entries(s.m).forEach(([id, v]) => { const el = document.getElementById(id); if (!el) return; if (el.type === 'radio' || el.type === 'checkbox') el.checked = v; else el.value = v; });
    const db = $('#drawer .d-body'); if (db && S.drawer && s.dk === S.drawer.k + S.drawer.id) db.scrollTop = s.dTop;
    const cv = $('#main .canvas'); if (cv) cv.scrollLeft = s.cLeft;
    if (s.focus) { const el = document.getElementById(s.focus); if (el) { el.focus(); if (s.sel && el.setSelectionRange) try { el.setSelectionRange(s.sel[0], s.sel[1]); } catch (e) { /* not a text input */ } } }
  }
  function render() {
    const snap = snapshot();
    if (!VIEWS[S.page]) S.page = 'overview';
    renderSide(); renderTop();
    $('#main').innerHTML = VIEWS[S.page]();
    renderDrawer();
    restore(snap);
    save();
  }
  let toastT = null;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
  function go(page, ui) { S.page = page; if (ui) Object.assign(S.ui, ui); S.drawer = null; if (location.hash !== '#/' + page) location.hash = '#/' + page; render(); $('#main').focus({ preventScroll: true }); window.scrollTo(0, 0); }

  /* ---------- scans (simulated worker) ---------- */
  function startScanJob(sid, sample) {
    const n = S.scans.length + 6; const id = `SCAN-${String(n).padStart(4, '0')}`;
    const s = src(sid);
    let plan = S.tables.filter(t => t.src === sid).map(t => t.id);
    if (!plan.length) plan = [`${sid}:CBS.CUSTOMERS`];
    S.scans.push({ id, src: sid, scope: s.schemas.map(x => x + '.*'), detVer: '1.3.0', sample, method: 'Təsadüfi (SAMPLE BLOCK)', status: 'RUNNING', planned: plan.length, scanned: 0, failed: 0, skipped: 0, started: now(), dur: '', published: false, plan, idx: 0, note: `Əhatə manifesti dondurulub: ${plan.length} obyekt. İdempotent açar: ${sid}/${sample}/1.3.0.` });
    log('Skan başladıldı', id, `${s.alias}: ${s.schemas.join(', ')}, detektor 1.3.0, ${sample} təsadüfi sətir`);
    return id;
  }
  function tickScans() {
    const run = S.scans.filter(x => x.status === 'RUNNING'); if (!run.length) return;
    run.forEach(x => {
      const tid = x.plan[x.idx]; const t = tbl(tid);
      if (t && t.scanFailed) x.failed++; else x.scanned++;
      x.idx++;
      if (x.idx >= x.plan.length) finishScan(x);
    });
    render();
  }
  function finishScan(x) {
    if (x.src === 'SRC-05' && !S.tables.some(t => t.src === 'SRC-05')) {
      const base = tbl('SRC-01:CBS.CUSTOMERS');
      S.tables.push({ id: 'SRC-05:CBS.CUSTOMERS', src: 'SRC-05', schema: 'CBS', name: 'CUSTOMERS', kind: 'TABLE', rows: 52310, domain: 'Müştəri', owner: null, steward: 'Nigar Ə.', desc: 'Müştəri ana qeydləri (UAT nüsxəsi)', scan: x.id, cols: JSON.parse(JSON.stringify(base.cols)) });
      const mk = (id, c, det, nn, m, d) => ({ id, col: `SRC-05:CBS.CUSTOMERS.${c}`, det, ver: '1.3.0', status: 'CANDIDATE', decision: null, label: null, history: [], scan: x.id, sample: x.sample, nonNull: nn, matched: m, distinct: d });
      S.findings.push(mk('F-118', 'FIN_CODE', 'FIN', Math.round(x.sample * 0.984), Math.round(x.sample * 0.979), 0.99), mk('F-119', 'FULL_NAME', 'NAME', x.sample, Math.round(x.sample * 0.93), 0.97));
    }
    S.tables.filter(t => t.src === x.src && !t.scanFailed).forEach(t => { t.scan = x.id; });
    x.status = x.failed ? 'PARTIAL' : 'SUCCEEDED'; x.published = true; x.dur = '0:0' + x.plan.length;
    delete x.plan; delete x.idx;
    log(x.status === 'PARTIAL' ? 'Skan qismən bitdi' : 'Skan bitdi', x.id, `${x.scanned} uğurlu, ${x.failed} uğursuz. Uğurlu nəticələr dərc olundu.`, { actor: 'sistem', role: 'Skan worker' });
    toast(`${x.id} bitdi: ${x.scanned} uğurlu, ${x.failed} uğursuz`);
  }

  /* ---------- actions ---------- */
  const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const showErr = id => { const el = document.getElementById(id); if (el) el.hidden = false; };
  const hash = s => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 9000000000; return String(1000000000 + h); };
  const ACT = {
    noop() {},
    open(d) { openDrawer(d.k, d.id, d.back === '1'); },
    close() { closeDrawer(); },
    back() { S.drawer = S.drawer.back; render(); },
    ui(d) { S.ui[d.key] = d.val; if (d.key === 'rep') S.ui.node = null; render(); },
    role(d, el) { S.role = el.value; render(); toast(`Rol: ${ROLES[S.role].opt}`); },
    reset() { if (!window.confirm('Demonu ilkin vəziyyətə qaytarmaq? Etdiyiniz bütün qərarlar silinəcək.')) return; S = fresh(); history.replaceState(null, '', '#/overview'); render(); toast('Demo sıfırlandı'); },
    task(d) { const t = TASKS[+d.i]; if (!t) return; if (t.k) openDrawer(t.k, t.id); else go(t.go, t.ui); },
    scen(d) { const t = scenario()[+d.i]; if (t.k) openDrawer(t.k, t.id); else go(t.go, t.ui); },
    goCde(d) { go('cde', { cde: d.id }); },
    q(d, el) { S.ui.q = el.value; render(); },
    aq(d, el) { S.ui.aq = el.value; render(); },
    selNode(d) { S.ui.node = S.ui.node === d.id ? null : d.id; render(); },

    review(d) {
      const f = fnd(d.id); const note = val('fnote');
      if (d.to !== 'CONFIRMED' && !note) { showErr('ferr'); document.getElementById('fnote').focus(); return; }
      const who = ROLES[S.role].person; const at = now();
      f.status = d.to; f.decision = { by: who, at, comment: note };
      f.history.push({ at, by: who, what: FST[d.to][0], note });
      if (d.to === 'CONFIRMED') { const lvl = POLICY[f.det]; f.label = { level: lvl, policy: 'v3', need: NEED(lvl), approvals: {} }; }
      log(`Tapıntı: ${FST[d.to][0].toLowerCase()}`, f.id, `${f.col.split(':')[1]}, ${f.det}${note ? '. ' + note : ''}`);
      render(); toast(d.to === 'CONFIRMED' ? `Təsdiqləndi. ${f.label.level} etiketi təsdiqə göndərildi.` : `${FST[d.to][0]}: qərar tarixçəyə yazıldı`);
    },
    approveLabel(d) {
      const f = fnd(d.id); const t = tbl(colParts(f.col).tableId); const at = now();
      const by = d.as === 'owner' ? t.owner : ROLES.infosec.person;
      f.label.approvals[d.as] = { by, at };
      f.history.push({ at, by, what: `Etiket təsdiqi (${d.as === 'owner' ? 'Owner' : 'InfoSec'}): ${f.label.level}` });
      const l = labelState(f);
      log(`Etiket təsdiqləndi (${d.as === 'owner' ? 'Owner' : 'InfoSec'})`, f.id, `${f.label.level}${l.effective ? ', etiket effektiv oldu' : ''}`, { actor: by });
      render(); toast(l.effective ? `${f.label.level} etiketi effektivdir` : 'Təsdiq qeydə alındı, digər təsdiq gözlənilir');
    },
    assignOwner(d) {
      const t = tbl(d.id); const p = val('ownerSel'); const old = t.owner; t.owner = p;
      log('Sahib təyin olundu', `${t.schema}.${t.name}`, `${old || 'yox'} → ${p}`);
      render(); toast(`${t.schema}.${t.name}: sahib ${p}`);
    },
    resolveIdentity(d) {
      const s = src(d.id); const a = val('newAlias').toUpperCase();
      if (!a || S.sources.some(x => x.id !== s.id && x.alias === a)) { toast('Bu alias artıq var. Başqa ad seçin.'); return; }
      const old = s.alias; s.alias = a; s.identity.status = 'VERIFIED'; s.identity.by = ROLES[S.role].person; s.identity.at = now(); delete s.identity.conflictWith;
      log('Kimlik konflikti həll edildi', s.id, `Ayrı mənbə: ${old} → ${a}, DBID ${s.identity.dbid}`);
      render(); toast(`${s.id} ayrı mənbə kimi təsdiqləndi (${a}). İndi skan etmək olar.`);
    },
    retireSource(d) { const s = src(d.id); s.identity.status = 'RETIRED'; log('Mənbə qeydiyyatı ləğv edildi', s.id, s.alias); render(); toast('Qeydiyyat ləğv edildi'); },
    testConn(d) { const s = src(d.id); log('Bağlantı yoxlandı', s.id, `Uğurlu. DBID ${s.identity.dbid} dəyişməyib.`); render(); toast(`Bağlantı uğurlu. DBID ${s.identity.dbid} dəyişməyib.`); },
    startScan(d) { const sample = +val('scanSample') || 1000; const id = startScanJob(d.id, sample); S.drawer = null; go('discovery', { dTab: 'scans' }); toast(`${id} başladı`); },
    nsTest() {
      const f = { alias: val('ns-alias').toUpperCase(), name: val('ns-name'), host: val('ns-host').toLowerCase(), service: val('ns-service').toLowerCase(), env: val('ns-env'), secret: val('ns-secret') };
      S.ui.ns = { f };
      if (!f.alias || !f.host || !f.service || !f.secret) S.ui.ns.err = 'Alias, host, service və secret istinadını doldurun.';
      else if (!f.secret.startsWith('vault://')) S.ui.ns.err = 'Secret istinadı vault:// ilə başlamalıdır. Şifrəni buraya yazmayın.';
      else {
        const same = S.sources.find(s => s.identity.host === f.host && s.identity.service === f.service);
        const dbid = same ? same.identity.dbid : hash(f.host + f.service);
        S.ui.ns.ok = { dbName: same ? same.identity.dbName : f.service.toUpperCase().replace(/_/g, ''), dbid, schemas: [f.service.split('_')[0].toUpperCase()], dup: same ? same.id : null, collide: (S.sources.find(s => s.alias === f.alias && s.identity.status !== 'RETIRED') || {}).id || null };
      }
      render();
    },
    nsSave() {
      const ns = S.ui.ns; if (!ns || !ns.ok || ns.ok.dup) return; const f = ns.f; const r = ns.ok;
      const id = `SRC-${String(S.sources.length + 1).padStart(2, '0')}`;
      S.sources.push({ id, alias: f.alias, name: f.name || f.alias, type: 'Oracle 19c', env: f.env, owner: '—', secretRef: f.secret, schemas: r.schemas,
        identity: { status: r.collide ? 'CONFLICT' : 'VERIFIED', dbName: r.dbName, dbid: r.dbid, service: f.service, host: f.host, conflictWith: r.collide || undefined, by: r.collide ? null : ROLES[S.role].person, at: r.collide ? null : now() } });
      log('Mənbə qeyd olundu', id, r.collide ? `Alias "${f.alias}" ${r.collide} ilə toqquşur, nəşr dayandırıldı` : `DBID ${r.dbid}, ${f.env}`);
      S.ui.ns = null; S.drawer = { k: 'source', id, back: null }; render(); toast(`${id} qeyd olundu`);
    },
    resolveLQ(d) {
      const q = S.lineageQueue.find(x => x.id === d.id); const note = val('lqnote');
      if (!note) { showErr('lqerr'); document.getElementById('lqnote').focus(); return; }
      const i = +((document.querySelector('input[name="lqc"]:checked') || {}).value || 0); const c = q.candidates[i];
      const by = ROLES[S.role].person; const at = now();
      if (q.kind === 'DB_LINK') {
        S.linkRes[q.link] = c.src;
        S.cdes.forEach(cd => cd.maps.forEach(m => { if (m.node.startsWith(`link:${q.link}/`) && m.status === 'BLOCKED') m.status = 'PROPOSED'; }));
        q.res = { by, at, what: `${q.link} → ${c.src} (${src(c.src).identity.dbName})`, note };
      } else { S.manual['dyn:Q-5710'] = c.node; q.res = { by, at, what: `Manual mapping: ${c.node.split(':')[1]}`, note }; }
      q.status = 'RESOLVED';
      log('Lineage əlaqəsi təsdiqləndi', q.id, `${q.res.what}. Sübut: ${note}`);
      render(); toast(q.kind === 'DB_LINK' ? 'Link həll edildi. Asılı mapping-lər təsdiqə açıldı.' : 'Manual mapping qəbul edildi');
    },
    deferLQ(d) {
      const q = S.lineageQueue.find(x => x.id === d.id); const note = val('lqnote') || 'Sübut gözlənilir';
      q.status = 'DEFERRED'; q.res = { by: ROLES[S.role].person, at: now(), note };
      log('Lineage əlaqəsi gözləməyə qoyuldu', q.id, note); render(); toast('Əlaqə həll edilməmiş qalır');
    },
    approveMap(d) {
      const c = cdeOf(d.c); const m = c.maps[+d.i]; m.status = 'APPROVED';
      log('Fiziki mapping təsdiqləndi', c.id, resolveNode(m.node).split(':').pop()); render(); toast('Mapping təsdiqləndi');
    },
    cdeSubmit(d) { const c = cdeOf(d.id); c.status = 'IN_REVIEW'; log('CDE baxışa göndərildi', c.id, c.name); render(); toast('Baxışa göndərildi'); },
    cdeApprove(d) {
      const c = cdeOf(d.id); c.status = 'APPROVED';
      log('CDE tərifi təsdiqləndi', c.id, `${c.name}${certified(c) ? ', sertifikatlı oldu' : ', sertifikat şərtləri hələ tam deyil'}`, { actor: c.owner });
      render(); toast(certified(c) ? `${c.name} sertifikatlıdır` : 'Təsdiqləndi. Sertifikat üçün digər şərtlər gözlənilir.');
    },
    runDQ(d) {
      const b = bindOf(d.id); const iss = S.issues.find(i => i.bind === b.id && i.status !== 'CLOSED');
      let r;
      if (b.id === 'DQB-01') r = { result: 'PASS', pass: 96412, den: 96412 };
      else if (b.id === 'DQB-03') r = iss && iss.status === 'OPEN' ? { result: 'FAIL', pass: 9923, den: 10000, scoreNote: 'tutuşma 99,23%: fərq hələ də 3 məhsul qrupundadır' } : { result: 'PASS', pass: 9994, den: 10000, scoreNote: 'tutuşma 99,94%' };
      else r = { result: 'ERROR', note: 'ORA-01031: insufficient privileges. DBA-dan SELECT icazəsi lazımdır, platforma özü GRANT etmir.' };
      const id = `DQR-${1054 + S.dqRuns.filter(x => +x.id.slice(4) >= 1054).length}`;
      S.dqRuns.push(Object.assign({ id, bind: b.id, at: now() }, r));
      log(`DQ run: ${r.result}`, id, `${b.id}${r.den ? `, ${pcs(pc(r.pass, r.den))}` : ''}`);
      if (r.result === 'PASS' && iss && iss.status === 'FIX_CLAIMED') { iss.status = 'CLOSED'; iss.closedBy = id; log('Problem bağlandı', iss.id, `Sübut: ${id} PASS`, { actor: 'sistem', role: 'DQ mühərriki' }); }
      render(); toast(`${id}: ${r.result}${iss && iss.status === 'CLOSED' ? `, ${iss.id} bağlandı` : ''}`);
    },
    claimFix(d) {
      const i = S.issues.find(x => x.id === d.id); const note = val('fixnote') || 'Mənbə sahibi düzəlişi təsdiqlədi';
      i.status = 'FIX_CLAIMED'; i.fixNote = note;
      log('Problem: düzəliş qeyd olundu', i.id, note, { actor: i.assignee }); render(); toast('Qeyd olundu. Bağlanma üçün təkrar run lazımdır.');
    },
    exportAudit() {
      const head = ['at', 'actor', 'role', 'action', 'obj', 'detail'];
      const csv = [head.join(',')].concat(S.audit.map(a => head.map(k => `"${String(a[k]).replace(/"/g, '""')}"`).join(','))).join('\n');
      const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = 'dg-hub-audit.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      log('Audit jurnalı ixrac edildi', 'AUDIT', `${S.audit.length} qeyd`); render();
    },
  };

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    if (e.target.id === 'scrim') { closeDrawer(); return; }
    const n = e.target.closest('[data-nav]'); if (n) { e.preventDefault(); go(n.dataset.nav); return; }
    const a = e.target.closest('[data-act]'); if (a && !a.disabled) { e.preventDefault(); if (ACT[a.dataset.act]) ACT[a.dataset.act](a.dataset, a); }
  });
  document.addEventListener('change', e => { const c = e.target.closest('[data-change]'); if (c && ACT[c.dataset.change]) ACT[c.dataset.change](c.dataset, c); });
  document.addEventListener('input', e => { const c = e.target.closest('[data-input]'); if (c && ACT[c.dataset.input]) ACT[c.dataset.input](c.dataset, c); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && S.drawer) { closeDrawer(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-act]:not(button):not(input):not(select):not(textarea)')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  window.addEventListener('hashchange', () => { const p = location.hash.replace('#/', ''); if (VIEWS[p] && p !== S.page) go(p); });

  load();
  const h0 = location.hash.replace('#/', ''); if (VIEWS[h0]) S.page = h0;
  S.scans.filter(x => x.status === 'RUNNING').forEach(x => { x.note = (x.note || '') + ' Səhifə yenidən açıldı: iş qaldığı yerdən davam edir, təkrar dərc olunmur.'; });
  render();
  setInterval(tickScans, 900);
  window.__dg = { get S() { return S; }, ACT, render, certified, cdeChecks };
})();
