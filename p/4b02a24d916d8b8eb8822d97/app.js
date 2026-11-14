(() => {
  'use strict';

  const KEY = 'dghub-proto-v4';
  const NB = ' ';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => (n == null ? '—' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB));
  const pc = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
  const pcs = x => String(x).replace('.', ',') + '%';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const clip = (s, n) => (s.length > n ? s.slice(0, Math.max(1, n - 1)) + '…' : s);
  const now = () => {
    const d = new Date(); const p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const $ = s => document.querySelector(s);

  /* ---------- icons ---------- */
  const P = {
    home: '<path d="M2.5 7.2 8 2.5l5.5 4.7V13a.5.5 0 0 1-.5.5H10V9.5H6v4H3a.5.5 0 0 1-.5-.5z"/>',
    search: '<circle cx="7" cy="7" r="4.6"/><path d="m10.5 10.5 3.2 3.2"/>',
    table: '<rect x="2" y="2.5" width="12" height="11" rx="1.5"/><path d="M2 6h12M2 9.5h12M6.5 6v7.5"/>',
    view: '<rect x="2" y="2.5" width="12" height="11" rx="1.5"/><path d="M2 6h12"/><circle cx="8" cy="9.6" r="1.6"/>',
    report: '<rect x="2.5" y="2" width="11" height="12" rx="1.5"/><path d="M5 11V8.5M8 11V6M11 11V9.5"/>',
    db: '<ellipse cx="8" cy="3.8" rx="5" ry="1.8"/><path d="M3 3.8v8.4c0 1 2.2 1.8 5 1.8s5-.8 5-1.8V3.8M3 8c0 1 2.2 1.8 5 1.8s5-.8 5-1.8"/>',
    col: '<path d="M4 3h8M4 8h8M4 13h8" />',
    shield: '<path d="M8 1.8 13 3.6v4.1c0 3.1-2.1 5.4-5 6.5-2.9-1.1-5-3.4-5-6.5V3.6z"/>',
    lineage: '<circle cx="3.5" cy="8" r="1.7"/><circle cx="12.5" cy="3.8" r="1.7"/><circle cx="12.5" cy="12.2" r="1.7"/><path d="M5.2 8h2.3c1.6 0 1.6-4.2 3.3-4.2M7.5 8c1.6 0 1.6 4.2 3.3 4.2"/>',
    book: '<path d="M3 2.5h7.5A1.5 1.5 0 0 1 12 4v9.5H4.5A1.5 1.5 0 0 1 3 12z"/><path d="M3 12a1.5 1.5 0 0 1 1.5-1.5H12M6 5.5h3.5"/>',
    quality: '<path d="M8 1.8 13 3.6v4.1c0 3.1-2.1 5.4-5 6.5-2.9-1.1-5-3.4-5-6.5V3.6z"/><path d="m5.7 8 1.6 1.6 3-3.2"/>',
    plug: '<path d="M6 2v3M10 2v3M4.5 5h7v2.5a3.5 3.5 0 0 1-7 0zM8 11v3"/>',
    check: '<rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="m5.3 8.2 1.9 1.9 3.6-3.8"/>',
    list: '<path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01"/>',
    star: '<path d="m8 2 1.8 3.8 4.1.5-3 2.8.8 4.1L8 11.2l-3.7 2 .8-4.1-3-2.8 4.1-.5z"/>',
    q: '<circle cx="8" cy="8" r="6"/><path d="M6.3 6.3a1.8 1.8 0 1 1 2.5 1.7c-.5.2-.8.6-.8 1.1v.4M8 11.3v.2"/>',
    code: '<path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5"/>',
    chev: '<path d="m4.5 6 3.5 3.5L11.5 6"/>',
    right: '<path d="m6 3.5 4.5 4.5L6 12.5"/>',
    x: '<path d="m4 4 8 8M12 4l-8 8"/>',
    fit: '<path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/>',
    target: '<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2"/>',
    reset: '<path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v3h3"/>',
    expand: '<path d="M3 3h10v10H3zM8 5.5v5M5.5 8h5"/>',
    collapse: '<path d="M3 3h10v10H3zM5.5 8h5"/>',
    bolt: '<path d="M9 1.8 3.5 9H8l-1 5.2L12.5 7H8z"/>',
    user: '<circle cx="8" cy="5.5" r="2.6"/><path d="M3 13.5c.6-2.5 2.6-3.8 5-3.8s4.4 1.3 5 3.8"/>',
    sun: '<circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/>',
    moon: '<path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z"/>',
    key: '<circle cx="5.5" cy="10.5" r="2.5"/><path d="m7.3 8.7 5.2-5.2M10.5 5.5l1.5 1.5"/>',
    clock: '<circle cx="8" cy="8" r="6"/><path d="M8 4.8V8l2.2 1.4"/>',
    warn: '<path d="M8 2.2 14 13H2z"/><path d="M8 6.5v3M8 11.2v.2"/>',
    lock: '<rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/>',
    plus: '<path d="M8 3v10M3 8h10"/>',
    out: '<path d="M9 2.5h4.5V7M13.5 2.5 7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/>',
    filter: '<path d="M2.5 3h11l-4.2 5v4.5l-2.6 1.2V8z"/>',
    dl: '<path d="M8 2.5v8M4.8 7.5 8 10.7l3.2-3.2M3 13.5h10"/>',
  };
  const ic = (n, s = 16, w = 1.5) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
  const tile = (kind, size = '') => {
    const m = { table: ['t-table', 'table'], view: ['t-view', 'view'], report: ['t-report', 'report'], db: ['t-db', 'db'], term: ['t-term', 'book'], col: ['t-col', 'col'], cde: ['t-cde', 'star'], link: ['t-q', 'q'], dyn: ['t-x', 'code'], pii: ['t-x', 'shield'] }[kind] || ['t-col', 'col'];
    const px = size === 'lg' ? 22 : size === 'sm' ? 14 : size === 'xs' ? 11 : 16;
    return `<span class="tile ${size} ${m[0]}">${ic(m[1], px)}</span>`;
  };
  const AVC = ['#4F46E5', '#0E7490', '#B45309', '#BE185D', '#047857', '#7C3AED', '#1D4ED8', '#C2410C'];
  const av = (name, size = '') => {
    if (!name) return `<span class="av ${size}" style="background:var(--border-2)">?</span>`;
    const clean = name.replace(/\s*\(.*\)$/, ''); let h = 0; for (const ch of clean) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const ini = clean.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `<span class="av ${size}" style="background:${AVC[h % AVC.length]}" aria-hidden="true">${esc(ini)}</span>`;
  };
  const person = (name, empty = 'Təyin olunmayıb') => (name ? `<span class="person">${av(name)}${esc(name)}</span>` : `<span class="chip c-bad">${ic('warn', 12)}${esc(empty)}</span>`);

  /* ---------- roles ---------- */
  const ROLES = {
    steward: { name: 'Data Steward', person: 'Nigar Əliyeva', short: 'Nigar Ə.' },
    operator: { name: 'DG Operator', person: 'Elvin Həsənov', short: 'Elvin H.' },
    owner: { name: 'Data Owner', person: 'Aktivin sahibi', short: null },
    infosec: { name: 'InfoSec', person: 'Leyla Qasımova', short: 'Leyla Q.' },
    auditor: { name: 'Auditor', person: 'Kamran Rzayev', short: 'Kamran R.' },
  };
  const CAN = {
    'source.manage': ['operator'], 'owner.assign': ['operator'], 'finding.review': ['steward'],
    'label.owner': ['owner'], 'label.infosec': ['infosec'], 'lineage.resolve': ['steward'], 'mapping.approve': ['steward'],
    'cde.submit': ['steward'], 'cde.approve': ['owner'], 'dq.run': ['steward', 'operator'], 'issue.fix': ['owner'],
  };
  const can = p => CAN[p].includes(S.role);
  const whoCan = p => CAN[p].map(r => ROLES[r].name).join(' və ya ');
  const lock = p => `<p class="lock">${ic('lock', 13)}Bu addımı ${esc(whoCan(p))} edir. Rolu sol aşağıda dəyişin.</p>`;
  const PEOPLE = ['Aynur S.', 'Rauf M.', 'Səbinə A.', 'Tural B.'];

  /* ---------- vocabulary ---------- */
  const FST = {
    CANDIDATE: ['Namizəd', 'c-warn'], CONFLICT: ['Konflikt', 'c-bad'], NEEDS_INVESTIGATION: ['Araşdırılır', 'c-info'],
    CONFIRMED: ['Təsdiqlənib', 'c-ok'], REJECTED: ['Rədd edilib', 'c-mute'],
  };
  const ST = {
    VERIFIED: ['Təsdiqli', 'c-ok'], CONFLICT: ['Kimlik konflikti', 'c-bad'], RETIRED: ['Ləğv edilib', 'c-mute'],
    SUCCEEDED: ['Uğurlu', 'c-ok'], PARTIAL: ['Qismən', 'c-warn'], RUNNING: ['İşləyir', 'c-info'], FAILED: ['Uğursuz', 'c-bad'],
    PASS: ['PASS', 'c-ok'], FAIL: ['FAIL', 'c-bad'], ERROR: ['ERROR', 'c-bad'], NOT_EVALUATED: ['Qiymətləndirilmədi', 'c-mute'],
    APPROVED: ['Təsdiqlənib', 'c-ok'], IN_REVIEW: ['Baxışda', 'c-warn'], DRAFT: ['Qaralama', 'c-mute'], PROPOSED: ['Təklif', 'c-warn'], BLOCKED: ['Bloklanıb', 'c-bad'],
    OPEN: ['Açıq', 'c-bad'], FIX_CLAIMED: ['Yoxlama gözləyir', 'c-warn'], CLOSED: ['Bağlanıb', 'c-ok'], RESOLVED: ['Həll edilib', 'c-ok'], DEFERRED: ['Sübut gözlənilir', 'c-warn'],
    AMBIGUOUS: ['Qeyri-müəyyən', 'c-warn'], UNRESOLVED: ['Həll edilməyib', 'c-bad'], MANUAL: ['Əl ilə, sübutla', 'c-info'],
    NOT_RUN: ['İşlədilməyib', 'c-mute'], PARTIAL_G: ['Qismən', 'c-warn'],
  };
  const chip = (t, cls, dot = true) => `<span class="chip ${cls}">${dot ? '<span class="dot"></span>' : ''}${esc(t)}</span>`;
  const st = k => { const v = ST[k] || [k, 'c-mute']; return chip(v[0], v[1]); };
  const stF = k => { const v = FST[k]; return chip(v[0], v[1]); };
  const POLICY = { FIN: 'Restricted', PAN: 'Restricted', S_NO: 'Restricted', IBAN: 'Confidential', ACCOUNT: 'Confidential', CIF: 'Internal', VOEN: 'Confidential', NAME: 'Confidential', PHONE: 'Confidential', EMAIL: 'Confidential', ADDRESS: 'Confidential', SWIFT: 'Internal', IP: 'Internal', GENDER: 'Confidential', MARITAL_STATUS: 'Confidential' };
  const NEED = lvl => (lvl === 'Restricted' ? ['owner', 'infosec'] : ['owner']);
  const ID_TYPES = ['FIN', 'VOEN', 'PAN', 'IBAN', 'ACCOUNT', 'S_NO', 'CIF'];
  const LVL_RANK = { Restricted: 4, Confidential: 3, Internal: 2, Public: 1 };

  /* ---------- state ---------- */
  let S;
  function fresh() {
    const s = JSON.parse(JSON.stringify(window.SEED));
    s.role = 'steward';
    s.route = { p: 'home' };
    s.ui = { dFilter: 'open', dTab: 'findings', qTab: 'binds', q: '', aq: '', facets: {}, srcNav: null, sel: null, ns: null };
    s.lg = { focal: 'R-101', up: 4, down: 2, view: 'graph', layer: 'none', dir: 'down' };
    s.drawer = null; s.linkRes = {}; s.manual = {};
    s.findings.forEach(f => {
      f.history = [];
      if (f.prev) f.history.push({ at: f.prev.at, by: f.prev.by, what: `${FST[f.prev.status][0]} (detektor ${f.prev.ver}, ${f.prev.sample} sətir)`, note: f.prev.comment });
      if (f.decision) f.history.push({ at: f.decision.at, by: f.decision.by, what: FST[f.status][0], note: f.decision.comment });
      if (f.label) Object.entries(f.label.approvals).forEach(([k, v]) => { if (v) f.history.push({ at: v.at, by: v.by, what: `Etiket təsdiqi (${k === 'owner' ? 'sahib' : 'InfoSec'}): ${f.label.level}` }); });
    });
    return s;
  }
  function load() { try { const raw = localStorage.getItem(KEY); if (raw) { S = JSON.parse(raw); return; } } catch (e) { /* storage unavailable */ } S = fresh(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
  const actor = () => ROLES[S.role].short || '—';
  function log(action, obj, detail, o = {}) { S.audit.push({ at: now(), actor: o.actor || actor(), role: o.role || ROLES[S.role].name, action, obj, detail }); }

  /* ---------- lookups ---------- */
  const src = id => S.sources.find(s => s.id === id);
  const tbl = id => S.tables.find(t => t.id === id);
  const rep = id => S.reports.find(r => r.id === id);
  const scanOf = id => S.scans.find(x => x.id === id);
  const findingOf = col => S.findings.find(f => f.col === col);
  const fnd = id => S.findings.find(f => f.id === id);
  const defOf = id => S.dqDefs.find(d => d.id === id);
  const bindOf = id => S.dqBinds.find(b => b.id === id);
  const cdeOf = id => S.cdes.find(c => c.id === id);
  const termOf = id => S.terms.find(t => t.id === id);
  const lastRun = bid => { const r = S.dqRuns.filter(x => x.bind === bid); return r[r.length - 1] || null; };
  const colParts = id => { const i = id.indexOf(':'); const s = id.slice(0, i); const p = id.slice(i + 1).split('.'); return { src: s, schema: p[0], table: p[1], col: p[2], tableId: `${s}:${p[0]}.${p[1]}` }; };
  const alias = sid => (src(sid) ? src(sid).alias : sid);
  function nodeInfo(id) {
    if (id.startsWith('R-')) { const [r, f] = id.split(':'); return { kind: 'report', rep: rep(r), field: f, group: r, label: f }; }
    if (id.startsWith('link:')) { const [link, path] = id.slice(5).split('/'); const p = path.split('.'); return { kind: 'link', link, path, group: `link:${link}/${p[0]}.${p[1]}`, label: p[2], gtitle: `${p[0]}.${p[1]}@${link}` }; }
    if (id.startsWith('dyn:')) return { kind: 'dyn', group: id, label: '? mənbə', gtitle: id.slice(4) };
    const c = colParts(id); return Object.assign({ kind: 'col', group: c.tableId, label: c.col }, c);
  }
  const shortName = id => { const n = nodeInfo(id); if (n.kind === 'col') return `${n.table}.${n.col}`; if (n.kind === 'report') return `${n.rep.id}.${n.field}`; if (n.kind === 'link') return `${n.path}@${n.link}`; return 'Dinamik SQL'; };
  const resolveNode = id => { if (id.startsWith('link:')) { const [link, path] = id.slice(5).split('/'); if (S.linkRes[link]) return `${S.linkRes[link]}:${path}`; } return id; };
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
    while (stack.length) { const n = stack.pop(); for (const e of E) { const a = dir === 'down' ? e.from : e.to; const b = dir === 'down' ? e.to : e.from; if (a === n && !out.has(b)) { out.add(b); stack.push(b); } } }
    return out;
  }
  const upEdges = (id, E) => { const up = walk(id, E, 'up'); up.add(id); return E.filter(e => up.has(e.to)); };
  const isSens = id => { const f = findingOf(id); return !!(f && f.status === 'CONFIRMED'); };
  const reportsOf = (id, E) => [...walk(id, E, 'down')].filter(x => x.startsWith('R-'));
  const lqFor = e => (e.link ? S.lineageQueue.find(q => q.link === e.link) : (S.edges[e.i] && S.edges[e.i].from.startsWith('dyn:')) ? S.lineageQueue.find(q => q.kind === 'DYNAMIC') : null);

  function labelState(f) {
    if (!f || f.status !== 'CONFIRMED' || !f.label) return null;
    const pend = f.label.need.filter(k => !f.label.approvals[k]);
    return { level: f.label.level, effective: pend.length === 0, pend };
  }
  const labelHtml = (f, none = '<span class="muted">—</span>') => {
    const l = labelState(f); if (!l) return none;
    return l.effective ? `<span class="lbl ${l.level}">${ic('shield', 12)}${l.level}</span>` : `<span class="lbl ${l.level} pending" title="Təsdiq gözləyir">${ic('shield', 12)}${l.level}</span>`;
  };
  const piiTag = f => (!f || f.status === 'REJECTED' ? '' : f.status === 'CONFIRMED' ? `<span class="tag pii">${ic('shield', 11)}${f.det}</span>` : `<span class="tag pii cand" title="${esc(FST[f.status][0])}">${f.det}?</span>`);
  const tableFindings = tid => S.findings.filter(f => f.col.startsWith(tid + '.'));
  const tableLevel = tid => { let best = null; tableFindings(tid).forEach(f => { const l = labelState(f); if (l && l.effective && (!best || LVL_RANK[l.level] > LVL_RANK[best])) best = l.level; }); return best; };
  const tableKind = t => (t.kind === 'VIEW' ? 'view' : 'table');

  function cdeChecks(c) {
    const E = effEdges(); const term = termOf(c.term); const dom = S.domains.find(d => d.id === term.domain);
    const ue = upEdges(c.report, E); const bad = ue.filter(e => !['VERIFIED', 'MANUAL'].includes(e.status));
    const dqs = c.dq.map(b => ({ b, r: lastRun(b) })); const okMaps = c.maps.filter(m => m.status === 'APPROVED').length;
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
      conf: S.findings.filter(f => f.status === 'CONFIRMED').length,
      noOwner: S.tables.filter(t => !t.owner).length,
      lq: S.lineageQueue.filter(q => q.status !== 'RESOLVED').length,
      cert: S.cdes.filter(certified).length,
      iss: S.issues.filter(i => i.status !== 'CLOSED').length,
      running: S.scans.filter(x => x.status === 'RUNNING').length,
    };
  }

  /* ---------- builders ---------- */
  const btn = (label, act, o = {}) => {
    const data = Object.entries(o.data || {}).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
    return `<button type="button" class="btn ${o.cls || ''}" data-act="${act}"${data}${o.dis ? ' disabled' : ''}${o.title ? ` title="${esc(o.title)}"` : ''}>${o.icon ? ic(o.icon, 14) : ''}${esc(label)}</button>`;
  };
  const stepper = steps => {
    let nowSet = false;
    return `<div class="stepper" role="list">${steps.map(([t, state]) => { let c = state; if (!state && !nowSet) { c = 'now'; nowSet = true; } if (state === 'stop') nowSet = true; return `<div class="s ${c || ''}" role="listitem">${esc(t)}</div>`; }).join('')}</div>`;
  };
  const kv = rows => `<dl class="kv">${rows.filter(Boolean).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;
  const empty = (b, t) => `<div class="empty"><b>${esc(b)}</b>${esc(t)}</div>`;
  const ring = (a, b, cls) => { const p = Math.round(pc(a, b)); return `<span class="ring ${cls || (p >= 100 ? 'ok' : p >= 60 ? '' : 'warn')}" style="--p:${p}" data-v="${p}%" role="img" aria-label="${p}%"></span>`; };
  const prop = (k, v, extra = '') => `<div class="prop"><div class="prop-k"><span>${esc(k)}</span>${extra}</div><div class="prop-v">${v}</div></div>`;
  const assetLink = (id, label) => `<a href="#/asset/${encodeURIComponent(id)}" data-go="asset" data-id="${esc(id)}">${esc(label)}</a>`;
  const colRef = (id, withTable = true) => {
    const n = nodeInfo(id);
    if (n.kind === 'col') return `<span class="row" style="gap:6px;flex-wrap:nowrap">${tile('col', 'xs')}<span>${withTable ? `<span class="muted">${esc(alias(n.src))} ${esc(n.schema)}.${esc(n.table)}.</span>` : ''}<b style="font-weight:500">${esc(n.col)}</b></span></span>`;
    if (n.kind === 'report') return `<span class="row" style="gap:6px;flex-wrap:nowrap">${tile('report', 'xs')}<span><span class="muted">${esc(n.rep.id)}.</span><b style="font-weight:500">${esc(n.field)}</b></span></span>`;
    if (n.kind === 'link') return `<span class="row" style="gap:6px;flex-wrap:nowrap">${tile('link', 'xs')}<span>${esc(n.path)}<span class="muted">@${esc(n.link)}</span></span></span>`;
    return `<span class="row" style="gap:6px;flex-wrap:nowrap">${tile('dyn', 'xs')}<span>Dinamik SQL</span></span>`;
  };

  /* ================= shell ================= */
  const NAV = [
    { p: 'home', t: 'Ana səhifə', i: 'home' },
    { p: 'search', t: 'Kataloq', i: 'search' },
    { h: 'İdarəetmə' },
    { p: 'discovery', t: 'Həssas data', i: 'shield', b: 'fOpen' },
    { p: 'lineage', t: 'Lineage', i: 'lineage', b: 'lq' },
    { p: 'glossary', t: 'Qlossari və CDE', i: 'book' },
    { p: 'quality', t: 'Data keyfiyyəti', i: 'quality', b: 'iss' },
    { h: 'Platforma' },
    { p: 'sources', t: 'Mənbələr', i: 'plug', b: 'srcConf' },
    { p: 'compliance', t: 'Uyğunluq', i: 'check' },
    { p: 'audit', t: 'Audit jurnalı', i: 'list' },
  ];
  const hrefOf = (p, id, tab) => `#/${p}${id ? '/' + encodeURIComponent(id) : ''}${tab ? '/' + tab : ''}`;
  const goA = (p, id, tab) => `href="${hrefOf(p, id, tab)}" data-go="${p}"${id ? ` data-id="${esc(id)}"` : ''}${tab ? ` data-tab="${tab}"` : ''}`;
  function renderNav() {
    const c = counts(); const cur = S.route.p === 'asset' ? 'search' : S.route.p;
    $('#nav').innerHTML = `<div class="brand"><span class="logo">${ic('lineage', 17, 1.8)}</span><div><b>DG Hub</b><span>Data Governance</span></div></div>
      ${NAV.map(n => n.h ? `<div class="nav-h">${esc(n.h)}</div>` : `<a ${goA(n.p)}${cur === n.p ? ' aria-current="page"' : ''}>${ic(n.i)}<span>${esc(n.t)}</span>${n.b && c[n.b] ? `<span class="cnt">${c[n.b]}</span>` : ''}</a>`).join('')}
      <div class="nav-foot"><div class="me">${av(ROLES[S.role].person, 'lg')}<div class="who"><b>${esc(ROLES[S.role].person)}</b><label class="sr" for="role">Rol</label>
        <select id="role" data-change="role">${Object.entries(ROLES).map(([k, r]) => `<option value="${k}"${S.role === k ? ' selected' : ''}>${esc(r.name)}${k === 'auditor' ? ', yalnız oxu' : ''}</option>`).join('')}</select></div></div>
        <div class="nav-note"><span>Prototip, saxta data</span><button type="button" data-act="reset">Sıfırla</button></div></div>`;
  }
  const isDark = () => (document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches));
  function renderTop() {
    $('#top').innerHTML = `<button type="button" class="search-trigger" data-act="palette">${ic('search')}<span>Cədvəl, sütun, hesabat və ya termin axtar</span><span class="kbd">⌘K</span></button>
      <div class="top-right"><span class="tenant">${esc(S.tenant.name)}</span><span class="env">${esc(S.tenant.env)}</span>
      <button type="button" class="icon-btn" data-act="theme" aria-label="${isDark() ? 'Açıq rejim' : 'Tünd rejim'}" title="${isDark() ? 'Açıq rejim' : 'Tünd rejim'}">${ic(isDark() ? 'sun' : 'moon')}</button></div>`;
  }

  /* ================= tasks & scenario ================= */
  function tasks() {
    const r = S.role; const out = [];
    const cp = id => colParts(id);
    if (r === 'operator') {
      S.sources.filter(s => s.identity.status === 'CONFLICT').forEach(s => out.push({ i: 'plug', t: `${s.id}: "${s.alias}" adı başqa mənbədə də var`, d: 'Fiziki DB fərqlidir. Ayrı mənbə kimi təsdiqləyin və ya qeydiyyatı ləğv edin.', dr: ['source', s.id] }));
      S.tables.filter(t => !t.owner).forEach(t => out.push({ i: 'user', t: `${t.schema}.${t.name}: sahib yoxdur`, d: 'Sahibi olmayan aktivin etiketi təsdiqlənə bilmir.', go: ['asset', t.id] }));
      S.tables.filter(t => t.scanFailed).forEach(t => out.push({ i: 'warn', t: `${t.schema}.${t.name} skan olunmayıb`, d: t.scanFailed, go: ['asset', t.id] }));
    }
    if (r === 'steward') {
      S.findings.filter(f => f.status === 'CONFLICT').forEach(f => out.push({ i: 'shield', t: `${cp(f.col).table}.${cp(f.col).col}: yeni sübut köhnə qərarla ziddir`, d: 'Əvvəlki qərar səssiz dəyişdirilmir, baxışınızı gözləyir.', go: ['discovery', f.id] }));
      const cand = S.findings.filter(f => f.status === 'CANDIDATE');
      if (cand.length) out.push({ i: 'shield', t: `${cand.length} namizəd tapıntı`, d: 'Sübuta baxın, təsdiqləyin və ya rədd edin.', go: ['discovery', cand[0].id] });
      S.lineageQueue.filter(q => q.status !== 'RESOLVED').forEach(q => out.push({ i: 'lineage', t: q.title, d: 'Lineage əlaqəsi sübut gözləyir.', dr: ['lq', q.id] }));
      S.cdes.forEach(c => c.maps.filter(m => m.status === 'PROPOSED').forEach(m => out.push({ i: 'star', t: `${c.name}: mapping təsdiqi`, d: shortName(resolveNode(m.node)), go: ['glossary', c.id] })));
      S.issues.filter(i => i.status === 'FIX_CLAIMED').forEach(i => out.push({ i: 'quality', t: `${i.id}: düzəliş qeyd olunub`, d: `${i.bind} qaydasını yenidən işlədin. PASS gələrsə problem bağlanır.`, go: ['quality', 'binds'] }));
    }
    if (r === 'owner') {
      S.findings.forEach(f => { const l = labelState(f); if (l && l.pend.includes('owner')) { const t = tbl(cp(f.col).tableId); out.push({ i: 'shield', t: `Etiket təsdiqi: ${cp(f.col).table}.${cp(f.col).col}`, d: t.owner ? `${l.level}, sahib: ${t.owner}` : 'Cədvəlin sahibi yoxdur, əvvəlcə DG Operator sahib təyin etməlidir.', go: ['discovery', f.id] }); } });
      S.cdes.filter(c => c.status === 'IN_REVIEW').forEach(c => out.push({ i: 'star', t: `${c.name}: tərif təsdiqi`, d: 'CDE baxışa göndərilib.', go: ['glossary', c.id] }));
      S.issues.filter(i => i.status === 'OPEN').forEach(i => out.push({ i: 'quality', t: `${i.id}: ${i.title}`, d: `Sizə təyin olunub, son tarix ${i.due}.`, go: ['quality', 'issues'] }));
    }
    if (r === 'infosec') {
      S.findings.forEach(f => { const l = labelState(f); if (l && l.pend.includes('infosec')) out.push({ i: 'shield', t: `Restricted etiket: ${cp(f.col).table}.${cp(f.col).col}`, d: 'InfoSec təsdiqi gözləyir.', go: ['discovery', f.id] }); });
      Object.entries(S.access).forEach(([tid, a]) => a.requests.filter(q => !q.applied).forEach(q => out.push({ i: 'key', t: `${q.id}: təsdiqlənib, tətbiq olunmayıb`, d: `${q.what}. ${q.ticket}.`, go: ['asset', tid, 'access'] })));
    }
    if (r === 'auditor') out.push({ i: 'list', t: 'Sizdə yazı hüququ yoxdur', d: 'Bütün ekranlara baxa və audit jurnalını ixrac edə bilərsiniz.', go: ['audit'] });
    return out;
  }
  function scenario() {
    const c1 = cdeOf('CDE-01'); const fx = c1.maps.find(m => m.node.includes('FX_RATES')); const iss = S.issues.find(i => i.id === 'ISS-07');
    return [
      { t: 'CORE_LNK linkinin hansı DB-yə getdiyini sübutla təsdiqləyin', r: 'Data Steward, Lineage', done: !!S.linkRes.CORE_LNK, dr: ['lq', 'LQ-1'] },
      { t: 'FX_RATES.RATE mapping-ini təsdiqləyin', r: 'Data Steward, Qlossari və CDE', done: fx.status === 'APPROVED', go: ['glossary', 'CDE-01'] },
      { t: 'ISS-07: düzəlişin mənbədə edildiyini qeyd edin', r: 'Data Owner, Data keyfiyyəti', done: iss.status !== 'OPEN', go: ['quality', 'issues'] },
      { t: 'DQB-03 qaydasını yenidən işlədin', r: 'Data Steward, Data keyfiyyəti', done: iss.status === 'CLOSED', go: ['quality', 'binds'] },
      { t: 'NPL nisbəti CDE-sinin tərifini təsdiqləyin', r: 'Data Owner, Qlossari və CDE', done: c1.status === 'APPROVED', go: ['glossary', 'CDE-01'] },
    ];
  }
  let LINKS = [];
  const linkBtn = (o, label = 'Aç', cls = 'sm') => { LINKS.push(o); return `<button type="button" class="btn ${cls}" data-act="link" data-i="${LINKS.length - 1}">${esc(label)}</button>`; };

  /* ================= home ================= */
  function vHome() {
    const c = counts(); const hr = new Date().getHours();
    const g = hr < 12 ? 'Sabahınız xeyir' : hr < 18 ? 'Günortanız xeyir' : 'Axşamınız xeyir';
    const nm = S.role === 'owner' ? 'Data Owner' : ROLES[S.role].person.split(' ')[0];
    const T = tasks(); const sc = scenario(); const c1 = cdeOf('CDE-01');
    const flow = [
      ['sources', 'Mənbəni qoş', `${c.srcOk} təsdiqli`, c.srcConf ? chip(`${c.srcConf} konflikt`, 'c-bad') : chip('Konflikt yoxdur', 'c-ok')],
      ['discovery', 'Həssas datanı tap', `${c.conf} təsdiqli sütun`, c.fOpen ? chip(`${c.fOpen} qərar gözləyir`, 'c-warn') : chip('Növbə boşdur', 'c-ok')],
      ['search', 'Etiketlə, sahib ver', `${c.noOwner} sahibsiz cədvəl`, c.lPend ? chip(`${c.lPend} etiket gözləyir`, 'c-warn') : chip('Etiketlər təsdiqli', 'c-ok')],
      ['lineage', 'Hesabata bağla', `${S.edges.length} sütun əlaqəsi`, c.lq ? chip(`${c.lq} sübut gözləyir`, 'c-warn') : chip('Hamısı sübutlu', 'c-ok')],
      ['glossary', 'Biznes mənası ver', `${S.cdes.length} kritik göstərici`, chip(`${c.cert}/${S.cdes.length} sertifikatlı`, c.cert === S.cdes.length ? 'c-ok' : 'c-warn')],
      ['quality', 'Keyfiyyəti yoxla', `${S.dqBinds.length} qayda bağlanıb`, c.iss ? chip(`${c.iss} açıq problem`, 'c-bad') : chip('Problem yoxdur', 'c-ok')],
    ];
    const kpi = (icn, cls, v, t) => `<div class="card card-b kpi"><span class="tile ${cls}">${ic(icn)}</span><div><b>${v}</b><span>${esc(t)}</span></div></div>`;
    const srcRows = S.sources.map(s => `<div class="list-row" data-act="drawer" data-k="source" data-id="${s.id}">${tile('db', 'sm')}<div class="grow"><div class="t">${esc(s.alias)} <span class="muted" style="font-weight:400">${esc(s.name)}</span></div><div class="s">${esc(s.type)}, ${esc(s.identity.dbName)}, ${S.tables.filter(t => t.src === s.id).length} cədvəl</div></div>${st(s.identity.status)}</div>`).join('');
    const domRows = S.domains.map(d => `<div class="list-row" data-act="go" data-p="glossary">${tile('term', 'sm')}<div class="grow"><div class="t">${esc(d.name)}</div><div class="s">${S.tables.filter(t => t.domain === d.name).length} cədvəl, ${S.cdes.filter(x => termOf(x.term).domain === d.id).length} CDE</div></div>${d.owner ? av(d.owner) : ''}${st(d.charter)}</div>`).join('');
    LINKS = [];
    return `<div class="hero"><h1>${g}, ${esc(nm)}</h1><p>${esc(S.tenant.name)}, TEST mühiti. Pilot: kredit hesabatlarında NPL nisbəti.</p>
        <button type="button" class="search-trigger" data-act="palette">${ic('search', 18)}<span>Cədvəl, sütun, hesabat və ya termin axtar</span><span class="kbd">⌘K</span></button></div>
      <div class="page stack">
        <div class="kpis">
          ${kpi('table', 't-table', S.tables.length + S.reports.length, 'aktiv kataloqda')}
          ${kpi('shield', 't-x', c.conf, 'təsdiqli həssas sütun')}
          ${kpi('star', 't-cde', `${c.cert}/${S.cdes.length}`, 'sertifikatlı CDE')}
          ${kpi('quality', 't-q', c.iss, 'açıq keyfiyyət problemi')}
        </div>
        <div class="card"><div class="card-h"><h2>Kredit pilotu: iş axını</h2><span class="small muted">Hər addım əvvəlkinin sübutuna söykənir</span></div>
          <nav class="pilot" aria-label="İş axını">${flow.map(([p, t, d, s], i) => `<a ${goA(p)}><span class="n"><i>${i + 1}</i>Addım ${i + 1}</span><b>${esc(t)}</b><span class="d">${esc(d)}</span><span>${s}</span></a>`).join('')}</nav></div>
        <div class="grid-2">
          <div class="card"><div class="card-h"><h2>Sizin tapşırıqlarınız</h2><span class="chip c-mute">${T.length}</span></div>
            <div>${T.length ? T.map(t => `<div class="list-row" style="cursor:default"><span class="tile sm t-col">${ic(t.i, 14)}</span><div class="grow"><div class="t">${esc(t.t)}</div><div class="s">${esc(t.d)}</div></div>${linkBtn(t)}</div>`).join('') : empty('Bu rol üçün iş yoxdur', 'Başqa rola keçib axını davam etdirin.')}</div></div>
          <div class="card scen"><div class="card-h"><h2>Nümunə ssenari</h2>${certified(c1) ? `<span class="cert">${ic('check', 14)}NPL nisbəti sertifikatlıdır</span>` : '<span class="small muted">NPL nisbətini sertifikatlı edin</span>'}</div>
            <ol>${sc.map(s => `<li class="${s.done ? 'done' : ''}"><div><div class="st">${esc(s.t)}</div><div class="sr2">${esc(s.r)}</div></div>${s.done ? '' : linkBtn(s, 'Aç', 'sm ghost')}</li>`).join('')}</ol></div>
        </div>
        <div class="grid-2">
          <div class="card"><div class="card-h"><h2>Mənbələr</h2><a ${goA('sources')} class="small">Hamısı</a></div><div>${srcRows}</div></div>
          <div class="card"><div class="card-h"><h2>Domenlər</h2><a ${goA('glossary')} class="small">Qlossari</a></div><div>${domRows}</div></div>
        </div>
      </div>`;
  }

  /* ================= catalog / search ================= */
  function assetsAll() {
    const E = effEdges();
    const tables = S.tables.map(t => {
      const fs = tableFindings(t.id); const s = src(t.src);
      return { id: t.id, kind: tableKind(t), name: t.name, path: [s ? s.alias : t.src, t.schema], desc: t.desc, owner: t.owner, domain: t.domain, src: t.src, level: tableLevel(t.id),
        pii: fs.filter(f => f.status === 'CONFIRMED').map(f => f.det), cand: fs.filter(f => ['CANDIDATE', 'CONFLICT', 'NEEDS_INVESTIGATION'].includes(f.status)).length,
        cols: t.cols.map(c => c[0]), reports: [...new Set(t.cols.flatMap(c => reportsOf(`${t.id}.${c[0]}`, E).map(x => x.split(':')[0])))] };
    });
    const reports = S.reports.map(r => ({ id: r.id, kind: 'report', name: r.name, path: ['Hesabat serveri', r.id], desc: `Sorğu ${r.query}, ${r.fields.length} sahə`, owner: r.owner, domain: r.domain || 'Kredit', src: 'REP', level: null, pii: [], cand: 0, cols: r.fields, reports: [] }));
    return tables.concat(reports);
  }
  const kindName = k => ({ table: 'Cədvəl', view: 'View', report: 'Hesabat' }[k] || k);
  const pathHtml = parts => parts.map(esc).join(` ${ic('right', 10)} `);
  function vSearch() {
    const q = (S.ui.q || '').trim().toUpperCase(); const F = S.ui.facets || {};
    let list = assetsAll();
    const all = list;
    if (S.ui.srcNav) list = list.filter(a => a.src === S.ui.srcNav);
    if (F.type) list = list.filter(a => (F.type === 'report' ? a.kind === 'report' : a.kind !== 'report'));
    if (F.sens) list = list.filter(a => a.pii.length || a.cand);
    if (F.noOwner) list = list.filter(a => !a.owner);
    if (F.domain) list = list.filter(a => a.domain === F.domain);
    const hits = list.map(a => {
      if (!q) return { a, m: null };
      if (a.name.toUpperCase().includes(q) || a.id.toUpperCase().includes(q) || (a.desc || '').toUpperCase().includes(q) || (a.domain || '').toUpperCase().includes(q)) return { a, m: null };
      const col = a.cols.find(c => c.toUpperCase().includes(q)); return col ? { a, m: col } : null;
    }).filter(Boolean);
    const sel = hits.find(h => h.a.id === S.ui.sel) || hits[0];
    const fb = (k, v, label) => `<button type="button" class="facet" data-act="facet" data-k="${k}" data-v="${v}" aria-pressed="${F[k] === v || (v === 'true' && F[k] === true)}">${label}</button>`;
    const domains = [...new Set(all.map(a => a.domain))];
    const navSrc = S.sources.filter(s => S.tables.some(t => t.src === s.id));
    const card = h => { const a = h.a; return `<div class="result${sel && sel.a.id === a.id ? ' sel' : ''}" data-act="pick" data-id="${esc(a.id)}" tabindex="0">
        <div class="top">${tile(a.kind)}<div style="flex:1;min-width:0"><div class="nm">${esc(a.name)}</div><div class="meta">${kindName(a.kind)} ${ic('right', 10)} ${pathHtml(a.path)}</div></div><div class="row">${a.level ? `<span class="lbl ${a.level}">${ic('shield', 12)}${a.level}</span>` : ''}</div></div>
        <div class="desc">${esc(a.desc)}</div>
        <div class="row">${a.owner ? person(a.owner) : chip('Sahibsiz', 'c-bad')}<span class="tag">${esc(a.domain)}</span>${a.pii.map(d => `<span class="tag pii">${ic('shield', 11)}${d}</span>`).join('')}${a.cand ? `<span class="tag pii cand">${a.cand} namizəd</span>` : ''}${a.reports.length ? `<span class="tag">${ic('report', 11)}${a.reports.length} hesabat</span>` : ''}</div>
        ${h.m ? `<div class="match">Uyğunluq: sütun <b>${esc(h.m)}</b></div>` : ''}</div>`; };
    return `<div class="search-page">
      <aside class="sp-nav"><h3>Naviqasiya</h3><div class="tree">
        <button type="button" data-act="srcnav" data-v="" aria-pressed="${!S.ui.srcNav}">${ic('list', 14)}Hamısı<span class="c">${all.length}</span></button>
        ${navSrc.map(s => `<button type="button" data-act="srcnav" data-v="${s.id}" aria-pressed="${S.ui.srcNav === s.id}">${tile('db', 'xs')}${esc(s.alias)}<span class="c">${S.tables.filter(t => t.src === s.id).length}</span></button>
          <div class="sub">${s.schemas.map(x => `<button type="button" data-act="srcnav" data-v="${s.id}">${ic('table', 13)}${esc(x)}</button>`).join('')}</div>`).join('')}
        <button type="button" data-act="srcnav" data-v="REP" aria-pressed="${S.ui.srcNav === 'REP'}">${tile('report', 'xs')}Hesabatlar<span class="c">${S.reports.length}</span></button>
      </div></aside>
      <section class="sp-main">
        <div class="sp-bar"><label class="sr" for="cq">Kataloqda axtar</label><input id="cq" class="input" data-input="q" value="${esc(S.ui.q)}" placeholder="Ad, sütun, domen və ya təsvir" autocomplete="off">
          <div class="facets">${fb('type', 'table', `${ic('table', 13)}Cədvəllər`)}${fb('type', 'report', `${ic('report', 13)}Hesabatlar`)}${fb('sens', 'true', `${ic('shield', 13)}Həssas data var`)}${fb('noOwner', 'true', `${ic('user', 13)}Sahibsiz`)}${domains.map(d => fb('domain', d, esc(d))).join('')}
          ${Object.values(F).some(Boolean) || S.ui.srcNav ? '<button type="button" class="linklike small" data-act="facetclear">Filtrləri təmizlə</button>' : ''}</div></div>
        <div class="sp-results"><div class="small muted">${hits.length} nəticə</div>${hits.length ? hits.map(card).join('') : empty('Heç nə tapılmadı', 'Axtarışı və ya filtrləri dəyişin.')}</div>
      </section>
      <aside class="sp-preview">${sel ? previewHtml(sel.a) : empty('Aktiv seçin', 'Nəticəyə klikləyin, xülasəsi burada görünəcək.')}</aside></div>`;
  }
  function previewHtml(a) {
    const isRep = a.kind === 'report';
    const t = isRep ? null : tbl(a.id); const s = t ? src(t.src) : null; const sc = t && t.scan ? scanOf(t.scan) : null;
    return `<div class="row" style="gap:12px;flex-wrap:nowrap">${tile(a.kind, 'lg')}<div style="min-width:0"><h2>${esc(a.name)}</h2><div class="small muted">${kindName(a.kind)} ${ic('right', 10)} ${pathHtml(a.path)}</div></div></div>
      <div class="btn-row"><a class="btn primary sm" ${goA('asset', a.id)}>Aç</a><a class="btn sm" ${goA('lineage', a.id)}>${ic('lineage', 14)}Lineage</a></div>
      <p style="color:var(--text-2)">${esc(a.desc)}</p>
      <div class="props">
        ${prop('Sahib', a.owner ? person(a.owner) : chip('Təyin olunmayıb', 'c-bad'))}
        ${prop('Domen', `<span class="tag">${esc(a.domain)}</span>`)}
        ${isRep ? '' : prop('Təsnifat', a.level ? `<span class="lbl ${a.level}">${ic('shield', 12)}${a.level}</span>` : '<span class="muted">Effektiv etiket yoxdur</span>')}
        ${isRep ? '' : prop('Həssas data', a.pii.length || a.cand ? a.pii.map(d => `<span class="tag pii">${ic('shield', 11)}${d}</span>`).join('') + (a.cand ? `<span class="tag pii cand">${a.cand} namizəd</span>` : '') : '<span class="muted">Tapılmadı</span>')}
        ${isRep ? prop('Sahələr', a.cols.map(f => `<span class="tag">${esc(f)}</span>`).join('')) : prop('Hesabatlarda', a.reports.length ? a.reports.map(r => `<a class="tag" ${goA('asset', r)}>${ic('report', 11)}${r}</a>`).join('') : '<span class="muted">Mövcud lineage-də yoxdur</span>')}
        ${s ? prop('Mənbə', `<span class="row" style="gap:6px">${tile('db', 'xs')}${esc(s.alias)} <span class="muted">${esc(s.identity.dbName)}</span></span>`) : ''}
        ${sc ? prop('Son skan', `${esc(sc.started)}, ${num(sc.sample)} sətir`) : ''}
      </div>`;
  }

  /* ================= asset pages ================= */
  function covHtml(colId, type) {
    const f = findingOf(colId); const t = tbl(colParts(colId).tableId);
    if (f && f.status !== 'REJECTED') return `${piiTag(f)}${f.status !== 'CONFIRMED' ? ' ' + stF(f.status) : ''}`;
    if (f) return `<span class="small muted">Rədd edilib (${esc(f.det)})</span>`;
    if (/LOB$/.test(type)) return '<span class="small muted">Dəstəklənmir (LOB)</span>';
    if (t.scanFailed) return chip('Skan olunmayıb', 'c-bad');
    const sc = scanOf(t.scan); return `<span class="small muted">Tapılmadı, ${num(sc.sample)} sətir</span>`;
  }
  const termsOfCol = id => S.cdes.filter(c => c.maps.some(m => resolveNode(m.node) === id)).map(c => termOf(c.term));
  function assetHeader(o) {
    return `<div class="asset-head"><div class="crumbs">${o.crumbs}</div>
      <div class="asset-title">${tile(o.kind, 'lg')}<div style="min-width:0"><h1>${esc(o.name)}${o.after || ''}</h1><div class="sub">${o.sub}</div></div><div class="acts">${o.acts || ''}</div></div>
      ${o.badges ? `<div class="asset-badges">${o.badges}</div>` : ''}
      <div class="tabs" role="tablist">${o.tabs.map(([k, l, n, w]) => `<button type="button" role="tab" data-act="tab" data-tab="${k}" aria-selected="${o.tab === k}">${esc(l)}${n != null ? `<span class="n${w ? ' warn' : ''}">${n}</span>` : ''}</button>`).join('')}</div></div>`;
  }
  function vAsset() {
    const id = S.route.id; if (id && id.startsWith('R-')) return vReport(id);
    const t = tbl(id); if (!t) return `<div class="page">${empty('Aktiv tapılmadı', 'Kataloqa qayıdın.')}</div>`;
    const s = src(t.src); const tab = S.route.tab || 'overview'; const E = effEdges();
    const fs = tableFindings(id); const conf = fs.filter(f => f.status === 'CONFIRMED'); const lvl = tableLevel(id);
    const binds = S.dqBinds.filter(b => b.node.startsWith(id + '.') || (b.ref || '').startsWith(id + '.'));
    const repIds = [...new Set(t.cols.flatMap(c => reportsOf(`${id}.${c[0]}`, E).map(x => x.split(':')[0])))];
    const terms = [...new Set(t.cols.flatMap(c => termsOfCol(`${id}.${c[0]}`)).map(x => x.name))];
    const head = assetHeader({
      crumbs: `<a ${goA('search')}>Kataloq</a>${ic('right', 10)}<span>${esc(s.alias)}</span>${ic('right', 10)}<span>${esc(t.schema)}</span>`,
      kind: tableKind(t), name: t.name, sub: `${kindName(tableKind(t))} ${ic('right', 10)} ${tile('db', 'xs')} ${esc(s.alias)} ${ic('right', 10)} ${esc(t.schema)}<span class="muted">, ${t.rows ? num(t.rows) + ' sətir' : 'view'}</span>`,
      after: lvl ? `<span class="lbl ${lvl}">${ic('shield', 12)}${lvl}</span>` : '',
      acts: `<a class="btn sm" ${goA('asset', id, 'lineage')}>${ic('lineage', 14)}Lineage</a>`,
      badges: `${conf.map(f => `<span class="tag pii">${ic('shield', 11)}${f.det}</span>`).join('')}${fs.filter(f => ['CANDIDATE', 'CONFLICT', 'NEEDS_INVESTIGATION'].includes(f.status)).map(f => `<span class="tag pii cand">${f.det}?</span>`).join('')}${terms.map(x => `<span class="tag term">${ic('book', 11)}${esc(x)}</span>`).join('')}`,
      tab, tabs: [['overview', 'Xülasə'], ['columns', 'Sütunlar', t.cols.length], ['lineage', 'Lineage'], ['quality', 'Keyfiyyət', binds.length || null], ['access', 'Giriş', S.access[id] ? S.access[id].grants.length : null], ['activity', 'Fəaliyyət']],
    });
    let body = '';
    if (tab === 'overview') {
      const sc = t.scan ? scanOf(t.scan) : null;
      body = `<div class="asset-body">
        <div class="card"><div class="card-b stack" style="gap:14px"><div><h3 style="margin-bottom:4px">Haqqında</h3><p style="color:var(--text-2)">${esc(t.desc)}</p></div>
          <div class="kpis">
            <div class="kpi"><span class="tile sm t-col">${ic('col', 14)}</span><div><b>${t.cols.length}</b><span>sütun</span></div></div>
            <div class="kpi"><span class="tile sm t-x">${ic('shield', 14)}</span><div><b>${conf.length}</b><span>həssas sütun</span></div></div>
            <div class="kpi"><span class="tile sm t-report">${ic('report', 14)}</span><div><b>${repIds.length}</b><span>hesabatda</span></div></div>
            <div class="kpi"><span class="tile sm t-q">${ic('quality', 14)}</span><div><b>${binds.length}</b><span>DQ qaydası</span></div></div></div></div></div>
        <div class="grid-2">
          <div class="card"><div class="card-h"><h3>Həssas sütunlar</h3><a class="small" ${goA('asset', id, 'columns')}>Bütün sütunlar</a></div>
            <div>${fs.length ? fs.map(f => `<div class="list-row" data-act="go" data-p="discovery" data-id="${f.id}">${tile('pii', 'sm')}<div class="grow"><div class="t">${esc(colParts(f.col).col)}</div><div class="s">${esc(f.det)}, ${num(f.matched)}/${num(f.nonNull)} uyğun</div></div>${labelHtml(f, stF(f.status))}</div>`).join('') : empty('Həssas data tapılmadı', 'Nümunə əsasında; bu, təmizlik sübutu deyil.')}</div></div>
          <div class="card"><div class="card-h"><h3>Asılı hesabatlar</h3><a class="small" ${goA('asset', id, 'lineage')}>Lineage</a></div>
            <div>${repIds.length ? repIds.map(r => `<div class="list-row" data-act="go" data-p="asset" data-id="${r}">${tile('report', 'sm')}<div class="grow"><div class="t">${esc(rep(r).name)}</div><div class="s">${r}, sahib ${esc(rep(r).owner)}</div></div>${ic('right', 14)}</div>`).join('') : empty('Hesabat tapılmadı', 'Yalnız parse olunmuş sorğulara əsaslanır.')}</div></div>
        </div>
        ${t.scanFailed ? `<div class="note bad">${ic('warn')}<div><b>Son skan uğursuz oldu.</b> ${esc(t.scanFailed)} Sütunlar "skan olunmayıb" kimi qalır.</div></div>` : sc ? `<div class="note">${ic('clock')}<div>Son skan <b>${esc(sc.id)}</b>, ${esc(sc.started)}: ${num(sc.sample)} sətir təsadüfi nümunə, detektor v${esc(sc.detVer)}. "Tapılmadı" sütunun təmiz olduğunu sübut etmir.</div></div>` : ''}
      </div>`;
    } else if (tab === 'columns') {
      body = `<div class="asset-body"><div class="tw"><table class="tbl"><thead><tr><th>Sütun</th><th>Tip</th><th>Həssaslıq</th><th>Etiket</th><th>Termin</th><th>Hesabatlar</th></tr></thead><tbody>
        ${t.cols.map(([c, ty]) => { const cid = `${id}.${c}`; const f = findingOf(cid); const rs = [...new Set(reportsOf(cid, E).map(x => x.split(':')[0]))]; const tm = termsOfCol(cid);
          return `<tr class="click" data-act="drawer" data-k="column" data-id="${esc(cid)}"><td><span class="colname">${tile('col', 'xs')}${esc(c)}</span></td><td><code>${esc(ty)}</code></td><td>${covHtml(cid, ty)}</td><td>${f ? labelHtml(f) : '<span class="muted">—</span>'}</td><td>${tm.length ? tm.map(x => `<span class="tag term">${ic('book', 11)}${esc(x.name)}</span>`).join(' ') : '<span class="muted">—</span>'}</td><td>${rs.length ? rs.map(r => `<span class="tag">${ic('report', 11)}${r}</span>`).join(' ') : '<span class="muted">—</span>'}</td></tr>`; }).join('')}
        </tbody></table></div></div>`;
    } else if (tab === 'lineage') {
      body = `<div class="asset-body flush">${lineageShell(false)}</div>`;
    } else if (tab === 'quality') {
      body = `<div class="asset-body">${binds.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Qayda</th><th>Sütun</th><th class="num">Hədd</th><th>Son nəticə</th><th></th></tr></thead><tbody>${binds.map(b => { const d = defOf(b.def); const r = lastRun(b.id); return `<tr><td><b style="font-weight:500">${esc(d.name)}</b><div class="small muted">${b.id}, ${esc(d.dim)}</div></td><td>${colRef(b.node, false)}</td><td class="num">${String(b.threshold).replace('.', ',')}%</td><td>${r ? `${st(r.result)} ${r.den ? `<span class="small muted">${pcs(pc(r.pass, r.den))}</span>` : ''}` : '<span class="muted">run yoxdur</span>'}</td><td>${d.status === 'APPROVED' && can('dq.run') ? btn('İndi işlət', 'runDQ', { cls: 'sm', data: { id: b.id } }) : ''}</td></tr>`; }).join('')}</tbody></table></div>` : empty('Bu cədvələ DQ qaydası bağlanmayıb', 'Qayda Data keyfiyyəti bölməsində bağlanır.')}</div>`;
    } else if (tab === 'access') {
      const a = S.access[id];
      body = `<div class="asset-body">${a ? `<div class="note">${ic('clock')}<div>Snapshot: ${esc(a.snapshot)}. Platforma özü GRANT və ya REVOKE etmir.</div></div>
        <div class="tw"><table class="tbl"><thead><tr><th>Kim</th><th>Növ</th><th class="num">İstifadəçi</th><th>Hüquq</th><th>Risk</th></tr></thead><tbody>${a.grants.map(g => `<tr><td><code>${esc(g.who)}</code></td><td>${esc(g.kind)}</td><td class="num">${g.n}</td><td><code>${g.priv}</code></td><td>${g.risk ? chip(g.risk, 'c-warn') : '<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div>
        ${a.requests.map(q => `<div class="card card-b stack" style="gap:8px"><div class="row"><b>${esc(q.id)}</b><span>${esc(q.what)}</span></div>${stepper([['Sorğu', 'done'], ['Sahib təsdiqi', 'done'], ['Mənbədə tətbiq', q.applied ? 'done' : ''], ['Yoxlanış', '']])}<p class="small muted">${esc(q.approved)} təsdiqləyib. ${esc(q.ticket)}. Təsdiq tətbiq demək deyil: iş yalnız mənbədə yoxlanandan sonra bağlanır.</p></div>`).join('')}` : empty('Giriş snapshot-u yoxdur', 'InfoSec/DBA idxalı bu cədvəl üçün hələ edilməyib.')}</div>`;
    } else {
      const keys = [t.name, ...fs.map(f => f.id)];
      const ev = S.audit.filter(a => keys.some(k => (a.obj + ' ' + a.detail).includes(k))).slice().reverse();
      body = `<div class="asset-body">${ev.length ? `<ul class="timeline">${ev.map(a => `<li><div class="w">${esc(a.action)} <span class="muted">${esc(a.obj)}</span></div><div class="m">${esc(a.actor)}, ${esc(a.role)}, ${esc(a.at)}. ${esc(a.detail)}</div></li>`).join('')}</ul>` : empty('Fəaliyyət yoxdur', '')}</div>`;
    }
    const sc = t.scan ? scanOf(t.scan) : null;
    const side = `<aside class="asset-side"><h3>Xülasə</h3><div class="props">
      ${prop('Sahib', person(t.owner), '')}
      ${can('owner.assign') ? `<div class="prop"><div class="row" style="flex-wrap:nowrap"><label class="sr" for="ownerSel">Sahib</label><select id="ownerSel" class="input" style="height:30px;flex:1">${PEOPLE.map(p => `<option${t.owner === p ? ' selected' : ''}>${p}</option>`).join('')}</select>${btn(t.owner ? 'Dəyiş' : 'Təyin et', 'assignOwner', { cls: 'sm primary', data: { id } })}</div></div>` : ''}
      ${prop('Steward', person(t.steward))}
      ${prop('Domen', `<span class="tag">${esc(t.domain)}</span>`)}
      ${prop('Təsnifat', lvl ? `<span class="lbl ${lvl}">${ic('shield', 12)}${lvl}</span>` : '<span class="muted">Effektiv etiket yoxdur</span>')}
      ${prop('Qlossari terminləri', terms.length ? terms.map(x => `<span class="tag term">${ic('book', 11)}${esc(x)}</span>`).join('') : '<span class="muted">—</span>')}
      ${prop('Mənbə', `<button type="button" class="pick" data-act="drawer" data-k="source" data-id="${s.id}">${tile('db', 'xs')}<span class="grow">${esc(s.alias)} <span class="muted">${esc(s.identity.dbName)}</span></span>${st(s.identity.status)}</button>`)}
      ${prop('Son skan', t.scanFailed ? chip('Uğursuz', 'c-bad') : sc ? `${esc(sc.started)}<span class="muted">, ${num(sc.sample)} sətir</span>` : '—')}
      ${prop('Aktiv ID', `<code style="font-size:11px">${esc(S.tenant.id)}/${esc(s.id)}/${esc(s.identity.dbid)}/${esc(t.schema)}.${esc(t.name)}</code>`)}
    </div></aside>`;
    return `<div class="asset${tab === 'lineage' ? ' wide' : ''}"><div class="asset-main">${head}${body}</div>${tab === 'lineage' ? '' : side}</div>`;
  }
  function vReport(id) {
    const r = rep(id); if (!r) return `<div class="page">${empty('Hesabat tapılmadı', '')}</div>`;
    const tab = S.route.tab || 'overview'; const E = effEdges();
    const gaps = []; r.fields.forEach(f => upEdges(`${id}:${f}`, E).forEach(e => { if (!['VERIFIED', 'MANUAL'].includes(e.status) && !gaps.includes(e.i)) gaps.push(e.i); }));
    const sensF = r.fields.filter(f => [...walk(`${id}:${f}`, E, 'up')].some(isSens));
    const cdes = S.cdes.filter(c => c.report.startsWith(id + ':'));
    const head = assetHeader({
      crumbs: `<a ${goA('search')}>Kataloq</a>${ic('right', 10)}<span>Hesabatlar</span>`,
      kind: 'report', name: r.name, sub: `Hesabat ${ic('right', 10)} ${esc(r.id)}<span class="muted">, sorğu ${esc(r.query)}</span>`,
      after: cdes.some(certified) ? `<span class="cert">${ic('check', 14)}Sertifikatlı CDE</span>` : '',
      acts: `<a class="btn sm" ${goA('asset', id, 'lineage')}>${ic('lineage', 14)}Lineage</a>`,
      badges: `${gaps.length ? chip(`${gaps.length} sübutsuz əlaqə`, 'c-warn') : chip('Lineage sübutlu', 'c-ok')}${sensF.length ? chip(`${sensF.length} sahə həssas mənbədən`, 'c-bad') : ''}${cdes.map(c => `<span class="tag" style="color:var(--accent)">${ic('star', 11)}${esc(c.name)}</span>`).join('')}`,
      tab, tabs: [['overview', 'Xülasə'], ['fields', 'Sahələr', r.fields.length], ['lineage', 'Lineage', gaps.length || null, gaps.length > 0], ['activity', 'Fəaliyyət']],
    });
    let body = '';
    if (tab === 'overview' || tab === 'fields') {
      body = `<div class="asset-body"><div class="tw"><table class="tbl"><thead><tr><th>Sahə</th><th>Mənbə sütunları</th><th>Transformasiya</th><th>Status</th></tr></thead><tbody>
        ${r.fields.map(f => { const fid = `${id}:${f}`; const inE = E.filter(e => e.to === fid); const up = [...walk(fid, E, 'up')].filter(x => !x.startsWith('R-')); const sens = up.some(isSens); const cde = S.cdes.find(c => c.report === fid);
          return `<tr><td><span class="colname">${tile('col', 'xs')}${esc(f)}${cde ? `<span class="tag" style="color:var(--accent)">${ic('star', 11)}CDE</span>` : ''}${sens ? `<span class="tag pii">${ic('shield', 11)}həssas</span>` : ''}</span></td>
            <td>${up.length ? up.filter(x => nodeInfo(x).kind !== 'report').slice(0, 4).map(x => `<div>${colRef(x)}</div>`).join('') : '<span class="muted">—</span>'}</td>
            <td>${inE.map(e => `<code>${esc(e.tf)}</code>`).join('<br>')}</td><td>${inE.map(e => st(e.status)).join(' ')}</td></tr>`; }).join('')}
        </tbody></table></div></div>`;
    } else if (tab === 'lineage') body = `<div class="asset-body flush">${lineageShell(false)}</div>`;
    else { const ev = S.audit.filter(a => (a.obj + a.detail).includes(id)).slice().reverse(); body = `<div class="asset-body">${ev.length ? `<ul class="timeline">${ev.map(a => `<li><div class="w">${esc(a.action)}</div><div class="m">${esc(a.actor)}, ${esc(a.at)}. ${esc(a.detail)}</div></li>`).join('')}</ul>` : empty('Fəaliyyət yoxdur', '')}</div>`; }
    const side = `<aside class="asset-side"><h3>Xülasə</h3><div class="props">
      ${prop('Sahib', person(r.owner))}${prop('Sorğu', `<code>${esc(r.query)}</code>`)}${prop('Son parse', esc(r.parsed))}${prop('Parser', 'Report Lineage 3.23.1, sqlglot 30.12.0')}
      ${prop('CDE', cdes.length ? cdes.map(c => `<a class="tag" ${goA('glossary', c.id)} style="color:var(--accent)">${ic('star', 11)}${esc(c.name)}</a>`).join('') : '<span class="muted">—</span>')}</div></aside>`;
    return `<div class="asset${tab === 'lineage' ? ' wide' : ''}"><div class="asset-main">${head}${body}</div>${tab === 'lineage' ? '' : side}</div>`;
  }

  /* ================= discovery ================= */
  const fFilters = {
    open: f => ['CANDIDATE', 'CONFLICT', 'NEEDS_INVESTIGATION'].includes(f.status),
    labels: f => { const l = labelState(f); return l && !l.effective; },
    confirmed: f => f.status === 'CONFIRMED', rejected: f => f.status === 'REJECTED', all: () => true,
  };
  function vDiscovery() {
    const c = counts(); const tab = S.ui.dTab;
    const tabs = `<div class="tabs" role="tablist" style="padding:0 18px">${[['findings', 'Tapıntılar', c.fOpen], ['scans', 'Skanlar', c.running || null], ['detectors', 'Detektorlar', null]].map(([k, l, n]) => `<button type="button" role="tab" data-act="ui" data-key="dTab" data-val="${k}" aria-selected="${tab === k}">${l}${n ? `<span class="n warn">${n}</span>` : ''}</button>`).join('')}</div>`;
    const head = `<div style="padding:18px 18px 0"><div class="page-head" style="margin-bottom:10px"><div><h1>Həssas data</h1><p>Detektorlar təsadüfi nümunədən sübut yığır, steward qərar verir, etiketi sahib və InfoSec təsdiqləyir. Heç bir nəticə avtomatik qəbul olunmur.</p></div></div></div>`;
    if (tab === 'scans') return `<div class="page full">${head}${tabs}<div class="page" style="max-width:none;width:100%"><div class="tw"><table class="tbl"><thead><tr><th>Skan</th><th>Mənbə və əhatə</th><th>Detektor və nümunə</th><th>Vəziyyət</th><th>İrəliləyiş</th><th>Başladı</th><th>Dərc</th></tr></thead><tbody>
        ${S.scans.slice().reverse().map(x => `<tr><td class="nowrap"><code>${x.id}</code></td><td><span class="row" style="gap:6px">${tile('db', 'xs')}${esc(alias(x.src))} <code>${esc(x.scope.join(', '))}</code></span>${x.note ? `<div class="small muted" style="max-width:48ch;margin-top:4px">${esc(x.note)}</div>` : ''}</td>
          <td>v${esc(x.detVer)}<div class="small muted">${num(x.sample)} sətir, ${esc(x.method)}</div></td><td>${st(x.status)}</td>
          <td style="min-width:140px"><div class="meter${x.failed ? ' warn' : x.status === 'SUCCEEDED' ? ' ok' : ''}"><div style="width:${pc(x.scanned + x.failed, x.planned)}%"></div></div><div class="small muted" style="margin-top:4px">${x.scanned} uğurlu, ${x.failed} uğursuz, plan ${x.planned}</div></td>
          <td class="small nowrap">${esc(x.started)}</td><td>${x.published ? chip('Dərc olunub', 'c-ok') : chip('Dərc olunmayıb', 'c-mute')}</td></tr>`).join('')}</tbody></table></div>
        <div class="note acc" style="margin-top:14px">${ic('clock')}<div><b>İş yaddaşda yox, bazada saxlanılır.</b> Səhifə yenilənsə iş qaldığı yerdən davam edir. Uğursuz obyekt "skan olunmayıb" qalır, son uğurlu nəticə silinmir.</div></div></div></div>`;
    if (tab === 'detectors') return `<div class="page full">${head}${tabs}<div class="page" style="max-width:none;width:100%"><div class="tw"><table class="tbl"><thead><tr><th>Kod</th><th>Nəyi tapır</th><th>Metod</th><th>Versiya</th><th class="num">Dəqiqlik</th><th class="num">Tamlıq</th></tr></thead><tbody>
        ${S.detectors.map(d => `<tr><td><span class="tag pii">${d.code}</span></td><td>${esc(d.name)}</td><td class="small">${esc(d.method)}</td><td><code>${d.ver}</code></td><td class="num">${pcs(Math.round(d.precision * 100))}</td><td class="num">${pcs(Math.round(d.recall * 100))}</td></tr>`).join('')}</tbody></table></div>
        <p class="small muted" style="margin-top:8px">Dəqiqlik və tamlıq golden korpusda ölçülür (burada nümunə rəqəmlərdir). Yeni detektor versiyası köhnə qərarları dəyişmir, fərq çıxsa yeni baxış açır.</p></div></div>`;
    const F = S.ui.dFilter; const list = S.findings.filter(fFilters[F]);
    const sel = fnd(S.route.id) || list[0] || null;
    const seg = [['open', 'Gözləyən'], ['labels', 'Etiket'], ['confirmed', 'Təsdiqli'], ['rejected', 'Rədd'], ['all', 'Hamısı']];
    const items = list.map(f => { const p = colParts(f.col); return `<div class="item${sel && sel.id === f.id ? ' sel' : ''}" data-act="go" data-p="discovery" data-id="${f.id}" tabindex="0">${tile('pii', 'sm')}<div style="min-width:0"><div class="t">${esc(p.col)}</div><div class="s">${esc(alias(p.src))} ${esc(p.schema)}.${esc(p.table)}</div><div class="row" style="margin-top:6px;gap:6px"><span class="tag pii${f.status === 'CONFIRMED' ? '' : ' cand'}">${f.det}</span><span class="small muted">${pcs(pc(f.matched, f.nonNull))} uyğun</span></div></div><div class="r">${stF(f.status)}${labelHtml(f, '')}</div></div>`; }).join('');
    return `<div class="page full">${head}${tabs}<div class="split" style="flex:1;min-height:0">
      <div class="split-list"><div class="bar"><div class="seg" role="group" aria-label="Filtr">${seg.map(([k, l]) => `<button type="button" data-act="ui" data-key="dFilter" data-val="${k}" aria-pressed="${F === k}">${l}</button>`).join('')}</div><span class="small muted">${list.length} tapıntı</span></div>
        <div class="items">${items || empty('Bu filtrdə tapıntı yoxdur', 'Başqa filtr seçin.')}</div></div>
      <div class="split-detail">${sel ? findingDetail(sel) : empty('Tapıntı seçin', '')}</div></div></div>`;
  }
  function findingSteps(f) {
    const need = f.label ? f.label.need : NEED(POLICY[f.det]);
    if (f.status === 'REJECTED') return stepper([['Namizəd', 'done'], ['Rədd edildi', 'done']]);
    const ap = (f.label && f.label.approvals) || {};
    const s = [['Namizəd', 'done']];
    if (f.status === 'CONFLICT') s.push(['Konflikt', 'stop']); else if (f.status === 'NEEDS_INVESTIGATION') s.push(['Araşdırılır', '']); else s.push(['Steward qərarı', f.status === 'CONFIRMED' ? 'done' : '']);
    s.push(['Etiket təklifi', f.status === 'CONFIRMED' ? 'done' : '']); s.push(['Sahib təsdiqi', ap.owner ? 'done' : '']);
    if (need.includes('infosec')) s.push(['InfoSec təsdiqi', ap.infosec ? 'done' : '']);
    const l = labelState(f); s.push(['Effektiv etiket', l && l.effective ? 'done' : '']);
    return stepper(s);
  }
  function findingDetail(f) {
    const p = colParts(f.col); const t = tbl(p.tableId); const s = src(p.src); const det = S.detectors.find(d => d.code === f.det);
    const lvl = f.label ? f.label.level : POLICY[f.det]; const need = f.label ? f.label.need : NEED(lvl); const ap = (f.label && f.label.approvals) || {};
    const low = ID_TYPES.includes(f.det) && f.distinct < 0.05;
    let act = '';
    if (['CANDIDATE', 'NEEDS_INVESTIGATION', 'CONFLICT'].includes(f.status)) {
      act = !can('finding.review') ? lock('finding.review') : `<div class="field"><label for="fnote">Şərh</label><textarea id="fnote" data-keep placeholder="Qərarın əsası. Rədd və araşdırma üçün məcburidir."></textarea></div><p class="err" id="ferr" hidden>Rədd etmək və ya araşdırmaya göndərmək üçün səbəbi yazın.</p>
        <div class="btn-row">${f.status === 'CONFLICT' ? btn('Yeni sübutu qəbul et', 'review', { cls: 'primary', data: { id: f.id, to: 'CONFIRMED' } }) + btn('Əvvəlki qərarı saxla', 'review', { data: { id: f.id, to: 'REJECTED' } })
          : btn('Təsdiqlə', 'review', { cls: 'primary', icon: 'check', data: { id: f.id, to: 'CONFIRMED' } }) + (f.status !== 'NEEDS_INVESTIGATION' ? btn('Araşdırmaya göndər', 'review', { data: { id: f.id, to: 'NEEDS_INVESTIGATION' } }) : '') + btn('Rədd et', 'review', { cls: 'danger', data: { id: f.id, to: 'REJECTED' } })}</div>`;
    } else if (f.status === 'CONFIRMED') {
      const l = labelState(f);
      if (l.effective) act = `<p class="small muted">Etiket effektivdir. Dəyişiklik yeni baxış tələb edir.</p>`;
      else {
        const parts = [];
        if (l.pend.includes('owner')) parts.push(!can('label.owner') ? lock('label.owner') : !t.owner ? `<p class="lock">${ic('warn', 13)}Cədvəlin sahibi yoxdur. Əvvəlcə DG Operator sahib təyin etməlidir.</p>` : btn(`Etiketi təsdiqlə (${t.owner} adından)`, 'approveLabel', { cls: 'primary', data: { id: f.id, as: 'owner' } }));
        if (l.pend.includes('infosec')) parts.push(can('label.infosec') ? btn('Etiketi təsdiqlə (InfoSec)', 'approveLabel', { cls: 'primary', data: { id: f.id, as: 'infosec' } }) : S.role === 'owner' ? '' : lock('label.infosec'));
        act = parts.filter(Boolean).join('');
      }
    } else act = '<p class="small muted">Rədd edilib. Yeni skan fərqli sübut gətirsə, tapıntı konflikt kimi yenidən açılacaq.</p>';
    const apRow = k => { const a = ap[k]; const who = k === 'owner' ? (t.owner || null) : 'Leyla Q.'; return `<div class="list-row" style="cursor:default">${who ? av(who) : av(null)}<div class="grow"><div class="t">${k === 'owner' ? 'Sahib' : 'InfoSec'}</div><div class="s">${esc(k === 'owner' ? (t.owner || 'təyin olunmayıb') : 'Leyla Q.')}</div></div>${a ? `${chip('Təsdiqlədi', 'c-ok')}<span class="small muted">${esc(a.at)}</span>` : f.status === 'CONFIRMED' ? chip('Gözləyir', 'c-warn') : '<span class="small muted">Steward qərarından sonra</span>'}</div>`; };
    return `<div class="detail">
      <div class="asset-title">${tile('pii', 'lg')}<div style="min-width:0"><h1>${esc(p.col)} ${stF(f.status)}</h1><div class="sub">${tile('db', 'xs')} ${esc(s.alias)} ${ic('right', 10)} ${assetLink(p.tableId, `${p.schema}.${p.table}`)}<span class="muted">, ${f.id}</span></div></div><div class="acts"><a class="btn sm" ${goA('asset', p.tableId, 'columns')}>Cədvələ keç</a></div></div>
      ${findingSteps(f)}
      ${f.status === 'CONFLICT' ? `<div class="note bad">${ic('warn')}<div><b>Yeni sübut əvvəlki qərarla ziddir.</b> Əvvəl: ${esc(FST[f.prev.status][0].toLowerCase())}, detektor v${esc(f.prev.ver)}, ${f.prev.sample} sətir ("${esc(f.prev.comment)}"). İndi: ${num(f.matched)}/${num(f.nonNull)} uyğun, v${esc(f.ver)}, ${num(f.sample)} sətir. Köhnə qərar səssiz dəyişmir, son sözü steward deyir.</div></div>` : ''}
      <div class="evidence"><div><b>${pcs(pc(f.matched, f.nonNull))}</b><span>uyğunluq, ${num(f.matched)}/${num(f.nonNull)}</span></div><div><b>${num(f.sample)}</b><span>sətir təsadüfi nümunə</span></div><div><b style="${low ? 'color:var(--warn)' : ''}">${pcs(Math.round(f.distinct * 1000) / 10)}</b><span>fərqli dəyər</span></div><div><b>${f.det}</b><span>${esc(det.name)}, v${esc(f.ver)}</span></div></div>
      ${f.hint ? `<div class="note warn">${ic('warn')}<div>${esc(f.hint)}</div></div>` : ''}
      ${f.checks ? `<p class="small muted">Əlavə yoxlama: ${esc(f.checks)}</p>` : ''}
      <div class="note">${ic('lock')}<div>Xam dəyər mərkəzə gəlmir və saxlanılmır. Burada yalnız say, nisbət və qaydanın versiyası var.</div></div>
      <div class="card"><div class="card-h"><h3>Etiket</h3><span class="lbl ${lvl}">${ic('shield', 12)}${lvl}</span></div><div class="card-b" style="color:var(--text-2)">Data tipi <span class="tag pii">${f.det}</span> faktdır. Giriş etiketi isə siyasətdir: siyasət v3 bu tip üçün <b>${lvl}</b> təklif edir. ${need.includes('infosec') ? 'Restricted üçün sahib və InfoSec ayrıca təsdiqləyir.' : 'Sahib təsdiqləyir.'}</div><div style="border-top:1px solid var(--border)">${need.map(apRow).join('')}</div></div>
      <div class="decide">${act || '<p class="small muted">Bu rol üçün addım yoxdur.</p>'}</div>
      <div><h3 style="margin-bottom:10px">Tarixçə</h3>${f.history.length ? `<ul class="timeline">${f.history.slice().reverse().map(h => `<li><div class="w">${esc(h.what)}</div><div class="m">${esc(h.by)}, ${esc(h.at)}${h.note ? `. ${esc(h.note)}` : ''}</div></li>`).join('')}</ul>` : '<p class="small muted">Hələ qərar yoxdur.</p>'}</div>
    </div>`;
  }

  /* ================= glossary & CDE ================= */
  function vGlossary() {
    const cur = cdeOf(S.route.id) || cdeOf('CDE-01');
    const list = S.domains.map(d => `<div style="padding:12px 14px 6px" class="row"><b>${esc(d.name)}</b>${st(d.charter)}</div>
      ${S.cdes.filter(c => termOf(c.term).domain === d.id).map(c => `<div class="item${cur.id === c.id ? ' sel' : ''}" data-act="go" data-p="glossary" data-id="${c.id}" tabindex="0">${tile('cde', 'sm')}<div style="min-width:0"><div class="t">${esc(c.name)}</div><div class="s">${esc(termOf(c.term).name)}</div></div><div class="r">${st(c.status)}${certified(c) ? `<span class="cert">${ic('check', 12)}Sertifikat</span>` : ''}</div></div>`).join('')}
      ${S.terms.filter(t => t.domain === d.id && !S.cdes.some(c => c.term === t.id)).map(t => `<div class="item" style="cursor:default">${tile('term', 'sm')}<div style="min-width:0"><div class="t">${esc(t.name)}</div><div class="s">Termin</div></div><div class="r">${st(t.status)}</div></div>`).join('')}`).join('');
    const term = termOf(cur.term); const checks = cdeChecks(cur); const cert = checks.every(x => x.ok); const rn = nodeInfo(cur.report);
    const order = ['DRAFT', 'IN_REVIEW', 'APPROVED']; const ix = order.indexOf(cur.status);
    const maps = cur.maps.map((m, i) => { const node = resolveNode(m.node);
      const act = m.status === 'PROPOSED' ? (can('mapping.approve') ? btn('Təsdiqlə', 'approveMap', { cls: 'sm', data: { c: cur.id, i } }) : '<span class="small muted">Steward təsdiqləyir</span>') : m.status === 'BLOCKED' ? `<button type="button" class="linklike small" data-act="drawer" data-k="lq" data-id="LQ-1">Lineage qeyri-müəyyəndir</button>` : '';
      return `<div class="list-row" style="cursor:default;flex-wrap:wrap;row-gap:6px"><div class="grow" style="min-width:200px">${colRef(node)}</div>${st(m.status)}${act}</div>`; }).join('');
    const dq = cur.dq.map(b => { const bd = bindOf(b); const r = lastRun(b); return `<tr><td><code>${b}</code></td><td>${esc(defOf(bd.def).name)}</td><td>${r ? `${st(r.result)}${r.den ? ` <span class="small muted">${pcs(pc(r.pass, r.den))}</span>` : ''}` : '<span class="muted">run yoxdur</span>'}</td></tr>`; }).join('');
    let act = '';
    if (cur.status === 'DRAFT') act = can('cde.submit') ? btn('Baxışa göndər', 'cdeSubmit', { cls: 'primary', data: { id: cur.id } }) : lock('cde.submit');
    if (cur.status === 'IN_REVIEW') act = can('cde.approve') ? btn(`Tərifi təsdiqlə (${cur.owner})`, 'cdeApprove', { cls: 'primary', data: { id: cur.id } }) : lock('cde.approve');
    return `<div class="split" style="height:100%"><div class="split-list"><div class="bar"><h2>Qlossari</h2><span class="small muted">Domenlər, terminlər və kritik data elementləri (CDE)</span></div><div class="items">${list}</div></div>
      <div class="split-detail"><div class="detail" style="max-width:1100px">
        <div class="asset-title">${tile('cde', 'lg')}<div style="min-width:0"><h1>${esc(cur.name)} ${st(cur.status)} ${cert ? `<span class="cert">${ic('check', 14)}Sertifikatlı</span>` : chip('Sertifikatsız', 'c-mute')}</h1><div class="sub">CDE ${ic('right', 10)} ${esc(S.domains.find(d => d.id === term.domain).name)}<span class="muted">, ${cur.id}, kritiklik: ${esc(cur.crit)}</span></div></div><div class="acts">${act}</div></div>
        ${stepper([['Qaralama', 'done'], ['Baxışda', ix >= 1 ? 'done' : ''], ['Təsdiqlənib', ix >= 2 ? 'done' : ''], ['Sertifikatlı', cert ? 'done' : '']])}
        <div class="card card-b">${kv([['Termin', `<b>${esc(term.name)}</b> ${st(term.status)}<div class="small" style="color:var(--text-2);margin-top:2px">${esc(term.def)}</div>`], ['Düstur', `<code>${esc(cur.formula)}</code>`], ['Hesabat sahəsi', `${colRef(cur.report)} <a class="small" ${goA('asset', rn.rep.id)}>${esc(rn.rep.name)}</a>`], ['Sahib', person(cur.owner)]])}</div>
        <div class="grid-2">
          <div class="card"><div class="card-h"><h3>Sertifikat şərtləri</h3>${ring(checks.filter(x => x.ok).length, checks.length)}</div><div class="card-b"><ul class="checklist">${checks.map(x => `<li class="${x.ok ? 'yes' : 'no'}"><span class="mk" aria-hidden="true">${x.ok ? '✓' : '×'}</span><div><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div></li>`).join('')}</ul></div></div>
          <div class="stack"><div class="card"><div class="card-h"><h3>Fiziki mapping</h3><a class="small" ${goA('lineage', cur.report.split(':')[0])}>Lineage</a></div><div>${maps}</div></div>
            <div class="card"><div class="card-h"><h3>DQ nəzarəti</h3><a class="small" ${goA('quality', 'binds')}>Keyfiyyət</a></div><div class="tw" style="border:0;border-radius:0"><table class="tbl"><tbody>${dq || '<tr><td class="muted">Qayda bağlanmayıb</td></tr>'}</tbody></table></div></div></div>
        </div>
        <div class="note">${ic('star')}<div><b>Təsdiq və sertifikat ayrıdır.</b> Sahib tərifi təsdiqləyə bilər, sertifikat isə yalnız altı şərtin hamısı sübutla ödənəndə avtomatik verilir.</div></div>
      </div></div></div>`;
  }

  /* ================= quality ================= */
  function vQuality() {
    const tab = S.route.id || 'binds'; const c = counts();
    const lastAll = S.dqBinds.map(b => lastRun(b.id)).filter(Boolean); const passN = lastAll.filter(r => r.result === 'PASS').length;
    const score = r => (r && r.den ? `${pcs(pc(r.pass, r.den))} <span class="small muted">(${num(r.pass)}/${num(r.den)})</span>` : '<span class="muted">—</span>');
    const tabs = [['binds', 'Bağlamalar', S.dqBinds.length], ['defs', 'Qaydalar', S.dqDefs.length], ['runs', 'Nəticələr', S.dqRuns.length], ['issues', 'Problemlər', c.iss || null]];
    let body = '';
    if (tab === 'binds') body = `<div class="tw"><table class="tbl"><thead><tr><th>Bağlama</th><th>Qayda</th><th>Aktiv</th><th class="num">Hədd</th><th>Cədvəl</th><th>Son nəticə</th><th></th></tr></thead><tbody>
      ${S.dqBinds.map(b => { const d = defOf(b.def); const r = lastRun(b.id); const ok = d.status === 'APPROVED';
        return `<tr><td><code>${b.id}</code></td><td><b style="font-weight:500">${esc(d.name)}</b><div class="small muted">${d.id}, v${d.ver}</div></td><td>${colRef(b.node)}${b.ref ? `<div class="small muted" style="margin-top:4px">müqayisə: ${shortName(b.ref)}</div>` : ''}</td><td class="num">${String(b.threshold).replace('.', ',')}%</td><td class="small">${esc(b.sched)}<div class="muted">${esc(b.coverage)}</div></td>
        <td>${r ? `${st(r.result)} ${score(r)}<div class="small muted">${esc(r.at)}</div>` : '<span class="muted">run yoxdur</span>'}</td><td>${!ok ? '<span class="small muted">Qayda təsdiqlənməyib</span>' : can('dq.run') ? btn('İndi işlət', 'runDQ', { cls: 'sm', icon: 'bolt', data: { id: b.id } }) : '<span class="small muted">Steward və ya Operator</span>'}</td></tr>`; }).join('')}</tbody></table></div>`;
    else if (tab === 'defs') body = `<div class="tw"><table class="tbl"><thead><tr><th>Qayda</th><th>Ölçü</th><th>Məntiq</th><th>Ciddilik</th><th>Versiya</th><th>Status</th></tr></thead><tbody>
      ${S.dqDefs.map(d => `<tr><td><b style="font-weight:500">${esc(d.name)}</b><div class="small muted">${d.id}${d.by ? `, təsdiq: ${esc(d.by)}` : ''}</div>${d.note ? `<div class="small" style="color:var(--warn);max-width:48ch">${esc(d.note)}</div>` : ''}</td><td>${esc(d.dim)}</td><td><code>${esc(d.logic)}</code></td><td>${esc(d.sev)}</td><td>v${d.ver}</td><td>${st(d.status)}</td></tr>`).join('')}</tbody></table></div>`;
    else if (tab === 'runs') body = `<div class="tw"><table class="tbl"><thead><tr><th>Run</th><th>Bağlama</th><th>Vaxt</th><th>Nəticə</th><th class="num">Bal</th><th>Qeyd</th></tr></thead><tbody>
      ${S.dqRuns.slice().reverse().map(r => { const b = bindOf(r.bind); return `<tr><td><code>${r.id}</code></td><td><code>${r.bind}</code><div class="small muted">hədd ${String(b.threshold).replace('.', ',')}%</div></td><td class="small nowrap">${esc(r.at)}</td><td>${st(r.result)}</td><td class="num">${score(r)}</td><td class="small" style="max-width:48ch">${esc(r.scoreNote || r.note || '')}</td></tr>`; }).join('')}</tbody></table></div>
      <p class="small muted" style="margin-top:8px">ERROR və "qiymətləndirilmədi" PASS sayılmır. Bal həmişə surət və məxrəclə göstərilir.</p>`;
    else body = S.issues.map(i => `<div class="card"><div class="card-h"><div class="row">${tile('pii', 'sm')}<div><h3>${esc(i.title)}</h3><div class="small muted">${i.id}, ${esc(i.sev)}, mənbə run ${i.run}</div></div></div>${st(i.status)}</div><div class="card-b stack" style="gap:12px">
        ${stepper([['Açıldı', 'done'], ['Sahib düzəldir', i.status !== 'OPEN' ? 'done' : ''], ['Təkrar run', i.status === 'CLOSED' ? 'done' : ''], ['Bağlandı', i.status === 'CLOSED' ? 'done' : '']])}
        ${kv([['Təyin olunub', person(i.assignee)], ['Son tarix', esc(i.due)], ['Bağlama', `<code>${i.bind}</code> ${esc(defOf(bindOf(i.bind).def).name)}`], i.closedBy ? ['Bağlanma sübutu', `<code>${esc(i.closedBy)}</code> PASS`] : null, i.fixNote ? ['Sahibin qeydi', esc(i.fixNote)] : null])}
        <p class="small" style="color:var(--text-2)">${esc(i.note)}</p>
        ${i.status === 'OPEN' ? (can('issue.fix') ? `<div class="field"><label for="fixnote">Nə edildi</label><textarea id="fixnote" data-keep placeholder="Məs. mənbədə məzənnə cədvəli düzəldildi, CHG-88240"></textarea></div><div class="btn-row">${btn('Düzəldildi, yoxlamaya göndər', 'claimFix', { cls: 'primary', data: { id: i.id } })}</div>` : lock('issue.fix')) : ''}
        ${i.status === 'FIX_CLAIMED' ? `<div class="note warn">${ic('clock')}<div>${esc(i.bind)} qaydası yenidən işlədiləndə PASS gələrsə problem özü bağlanacaq.</div></div>` : ''}</div></div>`).join('') || empty('Açıq problem yoxdur', '');
    const kpi = (icn, cls, v, t) => `<div class="card card-b kpi"><span class="tile ${cls}">${ic(icn)}</span><div><b>${v}</b><span>${esc(t)}</span></div></div>`;
    return `<div class="page"><div class="page-head"><div><h1>Data keyfiyyəti</h1><p>Qayda nəyi yoxladığını deyir, bağlama onu sütuna qoşur, run nəticəni saxlayır, problem cavabdeh şəxsi göstərir. Platforma mənbədə heç nəyi düzəltmir.</p></div></div>
      <div class="kpis" style="margin-bottom:18px">${kpi('quality', 't-term', S.dqDefs.filter(d => d.status === 'APPROVED').length + '/' + S.dqDefs.length, 'təsdiqli qayda')}${kpi('col', 't-table', S.dqBinds.length, 'bağlama')}${kpi('check', 't-cde', `${passN}/${lastAll.length}`, 'son run PASS')}${kpi('warn', 't-x', c.iss, 'açıq problem')}</div>
      <div class="tabs" role="tablist" style="margin-bottom:16px">${tabs.map(([k, l, n]) => `<button type="button" role="tab" data-act="go" data-p="quality" data-id="${k}" aria-selected="${tab === k}">${l}${n ? `<span class="n${k === 'issues' ? ' warn' : ''}">${n}</span>` : ''}</button>`).join('')}</div>${body}</div>`;
  }

  /* ================= sources ================= */
  function vSources() {
    const cards = S.sources.map(s => { const runs = S.scans.filter(x => x.src === s.id); const last = runs[runs.length - 1]; const n = S.tables.filter(t => t.src === s.id).length;
      return `<div class="card" style="cursor:pointer" data-act="drawer" data-k="source" data-id="${s.id}"><div class="card-b stack" style="gap:12px">
        <div class="row" style="flex-wrap:nowrap">${tile('db')}<div style="flex:1;min-width:0"><b>${esc(s.alias)}</b> <span class="small muted">${s.id}</span><div class="small muted">${esc(s.name)}</div></div>${st(s.identity.status)}</div>
        ${kv([['Növ', `${esc(s.type)} <span class="env" style="margin-left:4px">${esc(s.env)}</span>`], ['DB_NAME', `<code>${esc(s.identity.dbName)}</code>`], ['DBID', `<code>${esc(s.identity.dbid)}</code>`], ['Cədvəllər', String(n)], ['Son skan', last ? `${st(last.status)} <span class="small muted">${esc(last.started)}</span>` : '<span class="muted">yoxdur</span>']])}
      </div></div>`; }).join('');
    return `<div class="page"><div class="page-head"><div><h1>Mənbələr</h1><p>Hər mənbə fiziki kimliyi ilə qeyd olunur: DB_NAME, DBID, host və service. Alias yalnız göstərmə adıdır. Eyni alias iki fərqli DB-də görünsə, sistem nəşri dayandırır.</p></div>
      <div>${can('source.manage') ? btn('Mənbə əlavə et', 'drawer', { cls: 'primary', icon: 'plus', data: { k: 'newSource', id: 'new' } }) : lock('source.manage')}</div></div>
      <div class="grid-3">${cards}</div>
      <div class="note acc" style="margin-top:18px">${ic('lock')}<div><b>Şifrə platformada saxlanılmır.</b> DBA bağlantını bankın vault-unda yaradır, burada yalnız istinad qalır (məs. <code>vault://nb-test/cbs_ro</code>). Hesab yalnız oxu hüququna malikdir, sessiya READ ONLY açılır.</div></div></div>`;
  }

  /* ================= compliance ================= */
  function vCompliance() {
    const T = S.tables; const allCols = []; T.forEach(t => t.cols.forEach(c => allCols.push({ id: `${t.id}.${c[0]}`, type: c[1], t })));
    const live = S.sources.filter(x => x.identity.status !== 'RETIRED'); const ver = live.filter(x => x.identity.status === 'VERIFIED');
    const owned = T.filter(t => t.owner); const covered = allCols.filter(c => findingOf(c.id) || (!/LOB$/.test(c.type) && !c.t.scanFailed && c.t.scan));
    const conf = S.findings.filter(f => f.status === 'CONFIRMED'); const lab = conf.filter(f => labelState(f).effective); const E = effEdges();
    const gap = (items, fn) => items.length ? `<div class="stack" style="gap:4px;margin-top:10px">${items.slice(0, 5).map(fn).join('')}${items.length > 5 ? `<span class="small muted">və daha ${items.length - 5}</span>` : ''}</div>` : `<p class="small" style="color:var(--ok);margin-top:10px">Boşluq yoxdur</p>`;
    const gItem = (attrs, label) => `<button type="button" class="pick" ${attrs}><span class="grow">${label}</span>${ic('right', 12)}</button>`;
    const ctl = (t, ref, a, b, gaps) => `<div class="card card-b"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${ring(a, b)}<div style="flex:1;min-width:0"><h3>${esc(t)}</h3><p class="small muted">${esc(ref)}</p><p class="small" style="margin-top:2px"><b>${num(a)}</b> / ${num(b)}</p></div></div>${gaps}</div>`;
    const testPII = conf.filter(f => src(colParts(f.col).src).env === 'TEST');
    const pan = S.findings.filter(f => f.det === 'PAN' && f.status !== 'REJECTED');
    const panShown = S.reports.flatMap(r => r.fields.map(f => `${r.id}:${f}`)).filter(id => [...walk(id, E, 'up')].some(u => { const f = findingOf(u); return f && f.det === 'PAN' && f.status !== 'REJECTED'; }));
    const linOk = S.cdes.filter(c => upEdges(c.report, E).every(e => ['VERIFIED', 'MANUAL'].includes(e.status)));
    const dqOk = S.cdes.filter(c => c.dq.length && c.dq.every(b => { const r = lastRun(b); return r && r.result === 'PASS'; }));
    const cert = S.cdes.filter(certified);
    const cdeGap = list => gap(list, c => gItem(`data-act="go" data-p="glossary" data-id="${c.id}"`, `${tile('cde', 'xs')} ${esc(c.name)}`));
    const fGap = f => gItem(`data-act="go" data-p="discovery" data-id="${f.id}"`, `${tile('pii', 'xs')} ${esc(colParts(f.col).table)}.${esc(colParts(f.col).col)} <span class="muted">${f.det}</span>`);
    return `<div class="page"><div class="page-head"><div><h1>Uyğunluq</h1><p>Göstəricilər digər ekranlardakı qərarlardan avtomatik hesablanır. Bənd istinadları ilkin xəritədir, uyğunluq və hüquq bölməsi təsdiqləməlidir.</p></div></div>
      <h2 style="margin:6px 0 12px">AMB 14/2: aktivlərin uçotu və təsnifatı</h2>
      <div class="grid-2" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
        ${ctl('Mənbə kimliyi təsdiqlənib', 'Mənbələr, fiziki kimlik (DBID) yoxlanılıb', ver.length, live.length, gap(live.filter(x => !ver.includes(x)), x => gItem(`data-act="drawer" data-k="source" data-id="${x.id}"`, `${tile('db', 'xs')} ${x.id} ${esc(x.alias)}`)))}
        ${ctl('Sahib təyin olunub', 'Cədvəllər', owned.length, T.length, gap(T.filter(t => !t.owner), t => gItem(`data-act="go" data-p="asset" data-id="${esc(t.id)}"`, `${tile(tableKind(t), 'xs')} ${esc(t.schema)}.${esc(t.name)}`)))}
        ${ctl('Həssaslıq yoxlanılıb', 'Sütunlar, ən azı bir skanla', covered.length, allCols.length, gap(allCols.filter(c => !covered.includes(c)), c => gItem(`data-act="drawer" data-k="column" data-id="${esc(c.id)}"`, `${tile('col', 'xs')} ${esc(c.t.name)}.${esc(c.id.split('.').pop())}`)))}
        ${ctl('Etiket effektivdir', 'Təsdiqlənmiş həssas sütunlar', lab.length, conf.length, gap(conf.filter(f => !lab.includes(f)), fGap))}
      </div>
      <h2 style="margin:26px 0 6px">Test mühitində real şəxsi data</h2><p class="small muted" style="margin-bottom:12px">AMB 14/2 test üçün anonimləşdirilməmiş datanı məhdudlaşdırır. Pilot mənbələrinin hamısı TEST-dir.</p>
      <div class="card card-b"><div class="row">${testPII.length ? chip(`${testPII.length} sütun`, 'c-bad') : chip('Yoxdur', 'c-ok')}<span class="small">TEST mənbələrində təsdiqlənmiş PII/PCI sütunu. Anonimləşdirmə və ya maskalama planı tələb oluna bilər.</span></div>${gap(testPII, fGap)}</div>
      <h2 style="margin:26px 0 6px">PCI DSS 4.0.1: kart nömrəsi</h2><p class="small muted" style="margin-bottom:12px">3.5.1: saxlanılan PAN oxunmaz olmalıdır. 3.4.1: göstəriləndə maskalanmalıdır.</p>
      <div class="grid-2"><div class="card card-b"><div class="row"><h3 style="flex:1">PAN saxlanılan yerlər</h3>${pan.length ? chip(`${pan.length} yer`, 'c-bad') : chip('Yoxdur', 'c-ok')}</div><p class="small muted">Təsdiqli və namizəd. Maskalanmış PAN sayılmır.</p>${gap(pan, fGap)}</div>
        <div class="card card-b"><div class="row"><h3 style="flex:1">Hesabatda maskasız PAN</h3>${panShown.length ? chip(`${panShown.length} sahə`, 'c-bad') : chip('Yoxdur', 'c-ok')}</div><p class="small muted">R-104 maskalanmış sütundan oxuyur, ona görə sayılmır.</p></div></div>
      <h2 style="margin:26px 0 6px">BCBS 239: kritik göstəricilər</h2><p class="small muted" style="margin-bottom:12px">Hər CDE üçün tam lineage, keyfiyyət nəzarəti və sahib təsdiqi.</p>
      <div class="grid-3">${ctl('Lineage tamdır', 'CDE-lər, hesabatdan mənbəyə qədər', linOk.length, S.cdes.length, cdeGap(S.cdes.filter(c => !linOk.includes(c))))}${ctl('DQ son nəticəsi PASS', 'CDE-lər', dqOk.length, S.cdes.length, cdeGap(S.cdes.filter(c => !dqOk.includes(c))))}${ctl('Sertifikatlı', 'CDE-lər, bütün şərtlər ödənib', cert.length, S.cdes.length, cdeGap(S.cdes.filter(c => !cert.includes(c))))}</div></div>`;
  }

  /* ================= audit ================= */
  function vAudit() {
    const q = (S.ui.aq || '').trim().toLowerCase();
    const rows = S.audit.slice().reverse().filter(a => !q || Object.values(a).join(' ').toLowerCase().includes(q));
    return `<div class="page"><div class="page-head"><div><h1>Audit jurnalı</h1><p>Hər qərar və sistem hadisəsi buraya düşür və dəyişdirilmir. Prototipdə sizin etdiyiniz hər əməliyyat da burada görünür.</p></div>${btn('CSV ixrac et', 'exportAudit', { icon: 'dl' })}</div>
      <div style="margin-bottom:12px"><label for="aq" class="sr">Axtar</label><input id="aq" class="input" style="width:min(420px,100%)" data-input="aq" value="${esc(S.ui.aq)}" placeholder="Şəxs, obyekt və ya əməliyyat axtar"></div>
      <div class="tw"><table class="tbl"><thead><tr><th>Vaxt</th><th>Kim</th><th>Əməliyyat</th><th>Obyekt</th><th>Təfərrüat</th></tr></thead><tbody>
      ${rows.map(a => `<tr><td class="small nowrap">${esc(a.at)}</td><td><span class="person">${av(a.actor)}<span>${esc(a.actor)}<div class="small muted" style="font-weight:400">${esc(a.role)}</div></span></span></td><td>${esc(a.action)}</td><td><code>${esc(a.obj)}</code></td><td class="small" style="max-width:52ch">${esc(a.detail)}</td></tr>`).join('') || `<tr><td colspan="5">${empty('Heç nə tapılmadı', '')}</td></tr>`}</tbody></table></div></div>`;
  }

  /* ================= lineage engine ================= */
  const LG = { mounted: false, key: null, sig: null, prev: null, cam: null, open: new Set(), auto: new Set(), more: new Set(), sel: null, hover: null, manual: {}, raf: 0, drag: null, just: false };
  const LW = 280; const LX = 380; const LGAP = 34;
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduceMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const RANK = { UNRESOLVED: 3, AMBIGUOUS: 2, MANUAL: 1, VERIFIED: 0 };
  const lgFocalId = () => (S.route.p === 'asset' ? S.route.id : S.lg.focal);
  const lgOnCanvas = () => (S.route.p === 'lineage' && S.lg.view !== 'impact') || (S.route.p === 'asset' && S.route.tab === 'lineage');
  const lgRouteKey = () => (S.route.p === 'asset' ? `asset:${S.route.id}` : 'lineage');
  function lgSig() {
    return JSON.stringify([S.route.p, S.route.id, S.route.tab, S.lg, S.linkRes, S.manual, S.findings.map(f => f.status), S.lineageQueue.map(q => q.status), S.role, S.tables.length, S.dqRuns.length, S.cdes.map(c => c.status + c.maps.map(m => m.status).join())]);
  }
  function groupGraph(E) {
    const gOf = id => nodeInfo(id).group; const pairs = new Map(); const ins = new Map(); const outs = new Map();
    E.forEach(e => {
      const a = gOf(e.from); const b = gOf(e.to); if (a === b) return; const k = a + '>' + b;
      if (!pairs.has(k)) pairs.set(k, { a, b, edges: [], status: 'VERIFIED' });
      const p = pairs.get(k); p.edges.push(e); if (RANK[e.status] > RANK[p.status]) p.status = e.status;
      if (!outs.has(a)) outs.set(a, new Set()); outs.get(a).add(b); if (!ins.has(b)) ins.set(b, new Set()); ins.get(b).add(a);
    });
    return { pairs, ins, outs, gOf };
  }
  function bfs(start, adj, max) {
    const d = new Map([[start, 0]]); const q = [start];
    while (q.length) { const n = q.shift(); const k = d.get(n); if (k >= max) continue; (adj.get(n) || []).forEach(m => { if (!d.has(m)) { d.set(m, k + 1); q.push(m); } }); }
    return d;
  }
  function lgModel() {
    const E = effEdges(); const G = groupGraph(E); const focal = lgFocalId();
    const up = bfs(focal, G.ins, S.lg.up); const down = bfs(focal, G.outs, S.lg.down);
    const keys = new Set([...up.keys(), ...down.keys()]);
    const layer = new Map([[focal, 0]]);
    const longest = (adj, sign) => { const memo = new Map(); const f = g => { if (g === focal) return 0; if (memo.has(g)) return memo.get(g); let best = 0; (adj.get(g) || []).forEach(n => { if (keys.has(n) && (sign < 0 ? up.has(n) : down.has(n))) best = Math.max(best, f(n) + 1); }); memo.set(g, best); return best; }; return f; };
    const lu = longest(G.outs, -1); const ld = longest(G.ins, 1);
    up.forEach((v, g) => { if (g !== focal) layer.set(g, -Math.max(1, lu(g))); });
    down.forEach((v, g) => { if (g !== focal) layer.set(g, Math.max(1, ld(g))); });
    const cols = new Map(); const add = (g, id) => { if (!cols.has(g)) cols.set(g, []); if (!cols.get(g).includes(id)) cols.get(g).push(id); };
    keys.forEach(g => {
      if (g.startsWith('R-')) rep(g).fields.forEach(f => add(g, `${g}:${f}`));
      else if (!g.startsWith('link:') && !g.startsWith('dyn:') && tbl(g)) tbl(g).cols.forEach(c => add(g, `${g}.${c[0]}`));
    });
    const cE = E.filter(e => keys.has(G.gOf(e.from)) && keys.has(G.gOf(e.to)) && G.gOf(e.from) !== G.gOf(e.to));
    cE.forEach(e => { add(G.gOf(e.from), e.from); add(G.gOf(e.to), e.to); });
    if (!cols.has(focal) && focal.startsWith('R-')) rep(focal).fields.forEach(f => add(focal, `${focal}:${f}`));
    const linked = new Set(); cE.forEach(e => { linked.add(e.from); linked.add(e.to); });
    const hidden = g => ({
      up: [...(G.ins.get(g) || [])].filter(n => !keys.has(n)).length,
      down: [...(G.outs.get(g) || [])].filter(n => !keys.has(n)).length,
    });
    const nodes = [...keys].map(g => ({ key: g, L: layer.get(g), kind: g.startsWith('R-') ? 'report' : g.startsWith('link:') ? 'link' : g.startsWith('dyn:') ? 'dyn' : 'col', rows: cols.get(g) || [], hid: hidden(g) }));
    const pairs = [...G.pairs.values()].filter(p => keys.has(p.a) && keys.has(p.b));
    const sensRep = new Set(); nodes.filter(n => n.kind === 'report').forEach(n => n.rows.forEach(r => { if ([...walk(r, E, 'up')].some(isSens)) sensRep.add(r); }));
    return { E, G, focal, nodes, byKey: new Map(nodes.map(n => [n.key, n])), cE, pairs, linked, sensRep };
  }

  function ndHtml(m, n) {
    const id0 = n.rows[0] || n.key; const info = nodeInfo(n.key.startsWith('R-') ? (n.rows[0] || `${n.key}:x`) : n.key.startsWith('link:') || n.key.startsWith('dyn:') ? id0 : `${n.key}.x`);
    let kind; let type; let path; let name; let badges = ''; let ownerName = null; let colLabel = 'Sütunlar';
    if (n.kind === 'col') { const t = tbl(n.key); const p = colParts(`${n.key}.x`); kind = t ? tableKind(t) : 'table'; type = kindName(kind); path = `${alias(p.src)} ${ic('right', 9)} ${esc(p.schema)}`; name = p.table; ownerName = t ? t.owner : null;
      const dets = [...new Set(tableFindings(n.key).filter(f => f.status === 'CONFIRMED').map(f => f.det))]; const lv = tableLevel(n.key);
      badges = (lv ? `<span class="lbl ${lv}">${ic('shield', 11)}${lv}</span>` : '') + dets.map(d => `<span class="tag pii">${d}</span>`).join('') + (!t ? chip('Kataloqda yoxdur', 'c-mute') : '');
      if (S.lg.layer === 'dq') { const bs = S.dqBinds.filter(b => b.node.startsWith(n.key + '.')); const rs = bs.map(b => lastRun(b.id)).filter(Boolean); if (rs.length) badges += rs.some(r => r.result !== 'PASS') ? chip('DQ problemi', 'c-bad') : chip('DQ PASS', 'c-ok'); }
    } else if (n.kind === 'report') { const r = rep(n.key); kind = 'report'; type = 'Hesabat'; path = esc(r.id); name = r.name; ownerName = r.owner; colLabel = 'Sahələr';
      const cd = S.cdes.filter(c => c.report.startsWith(n.key + ':')); const sf = n.rows.filter(x => m.sensRep.has(x)).length;
      badges = cd.map(c => certified(c) ? `<span class="chip c-ok">${ic('check', 11)}${esc(c.name)}</span>` : `<span class="tag" style="color:var(--accent)">${ic('star', 11)}${esc(c.name)}</span>`).join('') + (sf ? `<span class="tag pii">${ic('shield', 11)}${sf} həssas sahə</span>` : '');
    } else if (n.kind === 'link') { kind = 'link'; type = 'Sübut olunmamış mənbə'; path = `DB link ${esc(info.link)}`; name = info.gtitle; const q = S.lineageQueue.find(x => x.link === info.link);
      badges = `${chip(`${q ? q.candidates.length : 2} mümkün DB`, 'c-warn')}${q ? `<button type="button" class="btn sm" data-lq="${q.id}" style="height:22px">Həll et</button>` : ''}`;
    } else { kind = 'dyn'; type = 'Dinamik SQL'; path = esc(n.key.slice(4)); name = 'Mənbə məlum deyil'; const q = S.lineageQueue.find(x => x.kind === 'DYNAMIC'); badges = q ? `<button type="button" class="btn sm" data-lq="${q.id}" style="height:22px">Həll et</button>` : ''; }
    const open = LG.open.has(n.key) || LG.auto.has(n.key); const lim = !LG.more.has(n.key) && n.rows.length > 10;
    const rows = n.rows.map((id, i) => {
      const ni = nodeInfo(id); const label = ni.kind === 'report' ? ni.field : ni.kind === 'dyn' ? '? mənbə' : ni.label;
      const f = ni.kind === 'col' ? findingOf(id) : null; const t = ni.kind === 'col' ? tbl(ni.tableId) : null; const ty = t ? (t.cols.find(c => c[0] === ni.col) || [])[1] : '';
      const hasIn = m.cE.some(e => e.to === id); const hasOut = m.cE.some(e => e.from === id);
      let tags = piiTag(f);
      if (ni.kind === 'report' && S.cdes.some(c => c.report === id)) tags += `<span class="tag" style="color:var(--accent)">${ic('star', 10)}CDE</span>`;
      if (ni.kind === 'report' && m.sensRep.has(id)) tags += `<span class="tag pii">${ic('shield', 10)}</span>`;
      if (S.lg.layer === 'dq') { const b = S.dqBinds.find(x => x.node === id); const r = b ? lastRun(b.id) : null; if (r) tags += chip(r.result, ST[r.result][1]); }
      return `<div class="cr${m.linked.has(id) ? '' : ' idle'}" data-col="${esc(id)}" tabindex="0" role="button"${lim && i >= 10 ? ' data-over hidden' : ''}>${hasIn ? '<span class="port in"></span>' : ''}<span class="nm" title="${esc(label)}">${esc(label)}</span>${tags}${ty ? `<span class="ty">${esc(String(ty).replace(/\(.*\)/, ''))}</span>` : ''}${hasOut ? '<span class="port out"></span>' : ''}</div>`;
    }).join('');
    const nLinked = n.rows.filter(r => m.linked.has(r)).length;
    return `<div class="nd k-${n.kind}${n.key === m.focal ? ' focal' : ''}${open ? ' open' : ''}" data-node="${esc(n.key)}">
      ${n.key === m.focal ? `<span class="nd-flag">${ic('target', 11)}Mərkəz</span>` : ''}
      <div class="nd-inner">
        <div class="nd-head" data-head="${esc(n.key)}">${tile(kind, 'sm')}<div class="info"><div class="nd-type">${esc(type)} ${ic('right', 9)} ${path}</div><div class="nd-name" title="${esc(name)}">${esc(name)}</div></div>${ownerName ? `<span title="Sahib: ${esc(ownerName)}">${av(ownerName)}</span>` : ''}</div>
        ${badges ? `<div class="nd-badges">${badges}</div>` : ''}
        ${n.rows.length ? `<div class="nd-foot"><button type="button" data-ntog="${esc(n.key)}" aria-expanded="${open}">${ic('col', 13)}${colLabel} <b>${n.rows.length}</b>${ic('chev', 12).replace('<svg', '<svg class="chev"')}</button><span style="flex:1"></span><span class="small muted">${nLinked} əlaqəli</span></div>` : ''}
        <div class="nd-cols"${open ? '' : ' hidden'}>${n.rows.length > 6 ? `<div class="find"><input type="search" data-nfind="${esc(n.key)}" placeholder="${colLabel === 'Sahələr' ? 'Sahə' : 'Sütun'} axtar" aria-label="Sütun axtar"></div>` : ''}${rows}${lim ? `<div style="padding:4px 12px 8px"><button type="button" class="linklike small" data-nmore="${esc(n.key)}">Daha ${n.rows.length - 10} sütun göstər</button></div>` : ''}</div>
      </div>
      ${n.hid.up && n.L <= 0 ? `<button type="button" class="nd-more l" data-more="up" title="${n.hid.up} yuxarı axın aktivi gizlidir">+${n.hid.up}</button>` : ''}
      ${n.hid.down && n.L >= 0 ? `<button type="button" class="nd-more r" data-more="down" title="${n.hid.down} aşağı axın aktivi gizlidir">+${n.hid.down}</button>` : ''}
    </div>`;
  }

  function lgLayout(m) {
    m.nodes.forEach(n => { n.h = n.el.offsetHeight; n.headY = Math.min(30, n.h / 2); n.rowY = new Map(); n.el.querySelectorAll('.cr').forEach(r => { if (!r.hidden && r.offsetParent !== null) n.rowY.set(r.dataset.col, r.offsetTop + r.offsetHeight / 2); }); });
    const layers = [...new Set(m.nodes.map(n => n.L))].sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
    const placed = new Map();
    const nbr = (n, dirIn) => { const set = dirIn ? m.G.ins.get(n.key) : m.G.outs.get(n.key); return [...(set || [])].filter(k => placed.has(k)); };
    layers.forEach(L => {
      const list = m.nodes.filter(n => n.L === L);
      list.forEach(n => { const ns = L < 0 ? nbr(n, false) : nbr(n, true); n.b = ns.length ? ns.reduce((a, k) => a + placed.get(k), 0) / ns.length : 0; });
      list.sort((a, b) => a.b - b.b || a.key.localeCompare(b.key));
      const tot = list.reduce((a, n) => a + n.h, 0) + LGAP * (list.length - 1);
      const center = list.length ? list.reduce((a, n) => a + n.b, 0) / list.length : 0;
      let y = center - tot / 2;
      list.forEach(n => { n.x = L * LX; n.y = y; placed.set(n.key, y + n.h / 2); y += n.h + LGAP; });
    });
    const man = LG.manual[lgRouteKey() + m.focal] || {};
    m.nodes.forEach(n => { if (man[n.key]) { n.x = man[n.key].x; n.y = man[n.key].y; } });
  }
  function lgVisibleEdges(m) {
    const out = [];
    m.pairs.forEach(p => {
      const A = m.byKey.get(p.a); const B = m.byKey.get(p.b); let drawn = 0;
      if (A.rowY && B.rowY) p.edges.forEach(e => { if (A.rowY.has(e.from) && B.rowY.has(e.to)) { out.push({ kind: 'col', a: p.a, b: p.b, from: e.from, to: e.to, status: e.status, e }); drawn++; } });
      if (!drawn) out.push({ kind: 'tbl', a: p.a, b: p.b, status: p.status, p });
    });
    return out;
  }
  function lgPort(m, v, side) {
    const k = side === 'out' ? v.a : v.b; const n = m.byKey.get(k); const id = v.kind === 'col' ? (side === 'out' ? v.from : v.to) : null;
    const y = id && n.rowY.has(id) ? n.rowY.get(id) : n.headY;
    return { x: n.cx + (side === 'out' ? LW : 0), y: n.cy + y };
  }
  const lgPath = (a, b) => { const dx = Math.max(50, Math.abs(b.x - a.x) * 0.5); return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} C${(a.x + dx).toFixed(1)} ${a.y.toFixed(1)} ${(b.x - dx - 8).toFixed(1)} ${b.y.toFixed(1)} ${(b.x - 7).toFixed(1)} ${b.y.toFixed(1)}`; };
  function lgDrawEdges(m) {
    m.vis = lgVisibleEdges(m);
    const g = LG.root.querySelector('.lg-edges .eg'); const bd = LG.root.querySelector('.lg-badges');
    g.innerHTML = m.vis.map((v, j) => `<g class="e ${v.status}${v.kind === 'col' ? ' e-col' : ''}" data-e="${j}"><path class="hit"/><path class="e-line" marker-end="url(#lgA-${v.status === 'AMBIGUOUS' ? 'w' : v.status === 'UNRESOLVED' ? 'b' : v.status === 'MANUAL' ? 'i' : 'n'})"/><path class="e-flow"/></g>`).join('');
    bd.innerHTML = m.vis.map((v, j) => (['AMBIGUOUS', 'UNRESOLVED'].includes(v.status) ? `<button type="button" class="e-badge ${v.status}" data-eb="${j}" title="Sübut gözləyir: həll et">?</button>` : '')).join('');
    const ge = g.querySelectorAll('.e'); m.vis.forEach((v, j) => { v.g = ge[j]; v.paths = [...ge[j].querySelectorAll('path')]; v.badge = bd.querySelector(`[data-eb="${j}"]`); });
  }
  function lgApply(m) {
    m.nodes.forEach(n => { n.el.style.transform = `translate(${n.cx.toFixed(1)}px, ${n.cy.toFixed(1)}px)`; });
    (m.vis || []).forEach(v => {
      const a = lgPort(m, v, 'out'); const b = lgPort(m, v, 'in'); const d = lgPath(a, b); v.paths.forEach(p => p.setAttribute('d', d));
      if (v.badge) { const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2; v.badge.style.transform = `translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px)`; }
    });
  }
  function lgBounds(m) {
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
    m.nodes.forEach(n => { x0 = Math.min(x0, n.x - 40); y0 = Math.min(y0, n.y - 16); x1 = Math.max(x1, n.x + LW + 40); y1 = Math.max(y1, n.y + n.h); });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function lgFit(m, panel) {
    const r = LG.wrap.getBoundingClientRect(); const b = lgBounds(m); const pw = panel ? 372 : 0;
    const k = clamp(Math.min((r.width - pw - 120) / b.w, (r.height - 140) / b.h), 0.35, 1.05);
    return { k, x: 60 + (r.width - pw - 120 - b.w * k) / 2 - b.x * k, y: 64 + (r.height - 140 - b.h * k) / 2 - b.y * k };
  }
  function lgCam() {
    if (!LG.world) return; const { x, y, k } = LG.cam;
    LG.world.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${k.toFixed(4)})`;
    LG.wrap.style.backgroundPosition = `${x}px ${y}px`; LG.wrap.style.backgroundSize = `${20 * k}px ${20 * k}px`;
    const z = LG.root.querySelector('.lg-zoom span'); if (z) z.textContent = `${Math.round(k * 100)}%`;
    lgMini();
  }
  const RAF = {};
  function lgAnimate(dur, step, done, ch = 'n') {
    cancelAnimationFrame(RAF[ch]);
    if (reduceMotion() || dur <= 0) { step(1); if (done) done(); return; }
    const t0 = performance.now();
    const tick = t => { const p = Math.min(1, (t - t0) / dur); step(ease(p)); if (p < 1) RAF[ch] = requestAnimationFrame(tick); else if (done) done(); };
    RAF[ch] = requestAnimationFrame(tick);
  }
  function lgCamTo(target, dur = 460) { const a = Object.assign({}, LG.cam); lgAnimate(dur, p => { LG.cam = { x: a.x + (target.x - a.x) * p, y: a.y + (target.y - a.y) * p, k: a.k + (target.k - a.k) * p }; lgCam(); }, null, 'c'); }
  function lgFitKeys(keys) {
    const m = LG.model; const ns = m.nodes.filter(n => keys.has(n.key)); if (!ns.length) return null;
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity; ns.forEach(n => { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + LW); y1 = Math.max(y1, n.y + n.h); });
    const r = LG.wrap.getBoundingClientRect(); const pw = r.width > 760 ? 372 : 0; const aw = r.width - pw - 110; const ah = r.height - 150;
    const k = clamp(Math.min(aw / (x1 - x0), ah / (y1 - y0)), 0.45, 1);
    return { k, x: 70 + (aw - (x1 - x0) * k) / 2 - x0 * k, y: 70 + (ah - (y1 - y0) * k) / 2 - y0 * k };
  }
  function lgZoomAt(px, py, f, anim) { const { x, y, k } = LG.cam; const k2 = clamp(k * f, 0.3, 2); const t = { k: k2, x: px - (px - x) * (k2 / k), y: py - (py - y) * (k2 / k) }; if (anim) lgCamTo(t, 220); else { LG.cam = t; lgCam(); } }
  function lgCenterOn(key, rowId) {
    const m = LG.model; const n = m.byKey.get(key); if (!n) return; const r = LG.wrap.getBoundingClientRect(); const k = Math.max(LG.cam.k, 0.85);
    const wy = n.y + (rowId && n.rowY.has(rowId) ? n.rowY.get(rowId) : n.h / 2); const wx = n.x + LW / 2; const pw = LG.sel ? 372 : 0;
    lgCamTo({ k, x: (r.width - pw) / 2 - wx * k, y: r.height / 2 - wy * k }, 520);
  }
  function lgMini() {
    const mm = LG.root && LG.root.querySelector('.lg-mini svg'); const m = LG.model; if (!mm || !m || !LG.cam) return;
    const b = lgBounds(m); const W = 190; const H = 120; const s = Math.min((W - 14) / b.w, (H - 14) / b.h);
    const ox = (W - b.w * s) / 2 - b.x * s; const oy = (H - b.h * s) / 2 - b.y * s; LG.mm = { s, ox, oy };
    const r = LG.wrap.getBoundingClientRect(); const { x, y, k } = LG.cam;
    mm.innerHTML = m.nodes.map(n => `<rect class="mm-n k-${n.kind}${n.key === m.focal ? ' focal' : ''}" x="${(ox + n.cx * s).toFixed(1)}" y="${(oy + n.cy * s).toFixed(1)}" width="${(LW * s).toFixed(1)}" height="${(n.h * s).toFixed(1)}" rx="2"/>`).join('')
      + `<rect class="mm-v" x="${(ox + (-x / k) * s).toFixed(1)}" y="${(oy + (-y / k) * s).toFixed(1)}" width="${((r.width / k) * s).toFixed(1)}" height="${((r.height / k) * s).toFixed(1)}" rx="3"/>`;
  }

  /* --- focus / highlight --- */
  function lgFocusSets() {
    const m = LG.model; const nodes = new Set(); const cols = new Set(); const vis = new Set(); let mode = null;
    const t = LG.hover || LG.sel;
    const colPath = (id, dirs) => { const set = new Set([id]); dirs.forEach(d => walk(id, m.cE, d).forEach(x => set.add(x))); return set; };
    const addCols = set => {
      set.forEach(c => { cols.add(c); nodes.add(m.G.gOf(c)); });
      m.vis.forEach((v, j) => { if (v.kind === 'col' ? set.has(v.from) && set.has(v.to) : v.p.edges.some(e => set.has(e.from) && set.has(e.to))) vis.add(j); });
    };
    if (t && t.type === 'node' && m.byKey.has(t.id)) {
      mode = 'path'; const upS = bfs(t.id, m.G.ins, 99); const dnS = bfs(t.id, m.G.outs, 99);
      [...upS.keys(), ...dnS.keys()].forEach(k => { if (m.byKey.has(k)) nodes.add(k); });
      m.vis.forEach((v, j) => { if ((upS.has(v.a) && upS.has(v.b)) || (dnS.has(v.a) && dnS.has(v.b))) vis.add(j); });
      nodes.forEach(k => m.byKey.get(k).rows.forEach(r => cols.add(r)));
    } else if (t && t.type === 'col' && m.G.gOf && m.byKey.has(m.G.gOf(t.id))) {
      mode = 'path'; const up = colPath(t.id, ['up']); const dn = colPath(t.id, ['down']); addCols(up); addCols(dn);
    } else if (t && t.type === 'edge' && m.vis[t.id]) {
      mode = 'path'; const v = m.vis[t.id]; vis.add(t.id); nodes.add(v.a); nodes.add(v.b); if (v.kind === 'col') { cols.add(v.from); cols.add(v.to); }
    } else if (S.lg.layer === 'sens') {
      mode = 'sens'; m.nodes.forEach(n => n.rows.filter(isSens).forEach(r => addCols(colPath(r, ['down']))));
    } else if (S.lg.layer === 'gaps') {
      mode = 'gap'; m.cE.filter(e => !['VERIFIED', 'MANUAL'].includes(e.status)).forEach(e => { const set = colPath(e.to, ['down']); set.add(e.from); addCols(set); });
    }
    return { mode, nodes, cols, vis };
  }
  function lgFocus() {
    const m = LG.model; if (!m || !LG.wrap) return;
    const f = lgFocusSets();
    LG.wrap.classList.toggle('lg-focus', !!f.mode); LG.wrap.dataset.mode = f.mode === 'sens' ? 'sens' : f.mode || '';
    m.nodes.forEach(n => { n.el.classList.toggle('on', f.nodes.has(n.key)); n.el.classList.toggle('sel', !!(LG.sel && LG.sel.type === 'node' && LG.sel.id === n.key)); });
    LG.root.querySelectorAll('.cr').forEach(el => { el.classList.toggle('on', f.cols.has(el.dataset.col)); el.classList.toggle('sel', !!(LG.sel && LG.sel.type === 'col' && LG.sel.id === el.dataset.col)); });
    m.vis.forEach((v, j) => {
      const on = f.vis.has(j); v.g.classList.toggle('on', on); if (v.badge) v.badge.classList.toggle('on', on);
      const base = v.status === 'AMBIGUOUS' ? 'w' : v.status === 'UNRESOLVED' ? 'b' : v.status === 'MANUAL' ? 'i' : 'n';
      v.paths[1].setAttribute('marker-end', `url(#lgA-${on && base === 'n' ? (f.mode === 'sens' ? 'b' : 'on') : base})`);
    });
  }

  /* --- side panel --- */
  function lgPanel() {
    const p = LG.root.querySelector('.lg-panel'); const m = LG.model; const sel = LG.sel;
    const open = !!sel; LG.wrap.classList.toggle('has-panel', open); p.classList.toggle('open', open); p.setAttribute('aria-hidden', String(!open));
    if (!open) return;
    const E = m.E; const pick = (x, extra = '') => `<button type="button" class="pick" data-lgpick="${esc(x)}">${colRef(x)}<span class="grow"></span>${extra}</button>`;
    let h = ''; let b = ''; let f = '';
    if (sel.type === 'col') {
      const id = sel.id; const n = nodeInfo(id); const fd = n.kind === 'col' ? findingOf(id) : null;
      const down = [...walk(id, E, 'down')].filter(x => x.startsWith('R-')); const up = [...walk(id, E, 'up')].filter(x => !x.startsWith('R-'));
      const inE = E.filter(e => e.to === id); const lqs = new Set(inE.concat(E.filter(e => e.from === id)).filter(e => !['VERIFIED', 'MANUAL'].includes(e.status)).map(e => (lqFor(e) || {}).id).filter(Boolean));
      const byRep = {}; down.forEach(x => { const r = x.split(':')[0]; (byRep[r] = byRep[r] || []).push(x); });
      h = `${tile(n.kind === 'report' ? 'report' : n.kind === 'col' ? 'col' : n.kind, 'sm')}<div class="grow"><span class="small" style="color:var(--accent);font-weight:500">${n.kind === 'report' ? 'Hesabat sahəsi' : n.kind === 'col' ? 'Sütun' : 'Sübut olunmamış mənbə'}</span><h3>${esc(n.kind === 'report' ? n.field : n.label)}</h3><p>${esc(n.kind === 'col' ? `${alias(n.src)} ${n.schema}.${n.table}` : n.kind === 'report' ? `${n.rep.id}, ${n.rep.name}` : shortName(id))}</p></div>`;
      b = `${fd || n.kind === 'report' ? `<div class="row">${fd ? `${piiTag(fd)} ${stF(fd.status)} ${labelHtml(fd, '')}` : ''}${S.cdes.some(c => c.report === id) ? `<span class="tag" style="color:var(--accent)">${ic('star', 11)}CDE</span>` : ''}${m.sensRep.has(id) ? `<span class="tag pii">${ic('shield', 11)}Həssas mənbədən</span>` : ''}</div>` : ''}
        ${n.kind !== 'report' ? `<section><h4>Təsir</h4><p style="margin-bottom:8px"><b style="font-size:18px">${down.length}</b> hesabat sahəsi, <b style="font-size:18px">${Object.keys(byRep).length}</b> hesabat</p>${down.length ? Object.entries(byRep).map(([r, xs]) => `<div class="small muted" style="margin:8px 0 4px">${esc(r)} ${esc(rep(r).name)}</div>${xs.map(x => pick(x)).join('')}`).join('') : '<p class="small muted">Mövcud lineage əhatəsində hesabat yoxdur. Bu, "istifadə olunmur" demək deyil.</p>'}</section>` : ''}
        ${up.length ? `<section><h4>Haradan gəlir</h4>${up.map(x => pick(x, isSens(x) ? `<span class="tag pii">${findingOf(x).det}</span>` : '')).join('')}</section>` : ''}
        ${inE.length ? `<section><h4>Transformasiya</h4>${inE.map(e => `<div class="tf"><div class="row" style="justify-content:space-between">${colRef(e.from)}${st(e.status)}</div><code>${esc(e.tf)}</code></div>`).join('')}</section>` : ''}`;
      const t = n.kind === 'col' ? tbl(n.tableId) : null;
      f = [...lqs].map(q => btn('Sübutla həll et', 'drawer', { cls: 'primary sm', data: { k: 'lq', id: q } })).join('') + (t ? btn('Sütun haqqında', 'drawer', { cls: 'sm', data: { k: 'column', id } }) : '') + (fd ? `<a class="btn sm" ${goA('discovery', fd.id)}>Tapıntı</a>` : '');
    } else if (sel.type === 'edge') {
      const v = m.vis[sel.id]; const edges = v.kind === 'col' ? [v.e] : v.p.edges; const lqs = new Set(edges.filter(e => !['VERIFIED', 'MANUAL'].includes(e.status)).map(e => (lqFor(e) || {}).id).filter(Boolean));
      const ra = rep(v.b) || null;
      h = `<span class="tile sm t-col">${ic('code', 14)}</span><div class="grow"><span class="small" style="color:var(--accent);font-weight:500">Transformasiya</span><h3>${esc(shortName(edges[0].from).split('.')[0])} ${ic('right', 11)} ${esc(ra ? ra.id : shortName(edges[0].to).split('.')[0])}</h3><p>${edges.length} sütun əlaqəsi</p></div>`;
      b = `<section><h4>Sütun əlaqələri</h4>${edges.map(e => `<div class="tf"><div>${colRef(e.from)}</div><div class="row" style="gap:6px">${ic('right', 12)}${colRef(e.to)}</div><code>${esc(e.tf)}</code><div class="row">${st(e.status)}<span class="small muted">Parser 3.23.1</span></div></div>`).join('')}</section>`;
      f = [...lqs].map(q => btn('Sübutla həll et', 'drawer', { cls: 'primary sm', data: { k: 'lq', id: q } })).join('');
    } else {
      const n = m.byKey.get(sel.id); const key = sel.id;
      const upN = [...bfs(key, m.G.ins, 99).keys()].filter(k => k !== key); const dnN = [...bfs(key, m.G.outs, 99).keys()].filter(k => k !== key);
      const nm = k => { if (k.startsWith('R-')) return rep(k).name; if (k.startsWith('link:')) return nodeInfo(`${k}.x`.replace(/\.x$/, '') + '.RATE').gtitle || k; if (k.startsWith('dyn:')) return 'Dinamik SQL'; const p = colParts(`${k}.x`); return `${p.schema}.${p.table}`; };
      const kd = k => (k.startsWith('R-') ? 'report' : k.startsWith('link:') ? 'link' : k.startsWith('dyn:') ? 'dyn' : (tbl(k) ? tableKind(tbl(k)) : 'table'));
      const nb = k => `<button type="button" class="pick" data-lgnode="${esc(k)}">${tile(kd(k), 'xs')}<span class="grow">${esc(nm(k))}</span>${m.byKey.has(k) ? '' : '<span class="small muted">gizli</span>'}</button>`;
      const t = n.kind === 'col' ? tbl(key) : null; const r = n.kind === 'report' ? rep(key) : null;
      const sensRows = n.rows.filter(isSens);
      h = `${tile(kd(key), 'sm')}<div class="grow"><span class="small" style="color:var(--accent);font-weight:500">${kindName(kd(key)) || 'Aktiv'}${key === m.focal ? ', mərkəz' : ''}</span><h3>${esc(r ? r.name : nm(key))}</h3><p>${esc(t ? `${src(t.src).alias}, ${t.desc}` : r ? `${r.id}, sorğu ${r.query}` : 'Kataloqda olmayan obyekt')}</p></div>`;
      b = `${t || r ? `<div class="props">${prop('Sahib', person(t ? t.owner : r.owner))}${t ? prop('Domen', `<span class="tag">${esc(t.domain)}</span>`) : ''}${t ? prop('Təsnifat', tableLevel(key) ? `<span class="lbl ${tableLevel(key)}">${ic('shield', 12)}${tableLevel(key)}</span>` : '<span class="muted">—</span>') : ''}</div>` : ''}
        ${sensRows.length ? `<section><h4>Həssas sütunlar</h4>${sensRows.map(x => pick(x, `<span class="tag pii">${findingOf(x).det}</span>`)).join('')}</section>` : ''}
        <section><h4>Yuxarı axın: ${upN.length}</h4>${upN.length ? upN.map(nb).join('') : '<p class="small muted">Yoxdur</p>'}</section>
        <section><h4>Aşağı axın: ${dnN.length}</h4>${dnN.length ? dnN.map(nb).join('') : '<p class="small muted">Mövcud əhatədə yoxdur</p>'}</section>`;
      const lq = key.startsWith('link:') ? S.lineageQueue.find(q => q.link === nodeInfo(`${key}.x`.replace(/\.x$/, '.RATE')).link) : key.startsWith('dyn:') ? S.lineageQueue.find(q => q.kind === 'DYNAMIC') : null;
      f = (key !== m.focal && (t || r) ? btn('Mərkəzə al', 'lgFocal', { cls: 'primary sm', icon: 'target', data: { id: key } }) : '') + (t || r ? `<a class="btn sm" ${goA('asset', key)}>Səhifəni aç</a>` : '') + (lq ? btn('Sübutla həll et', 'drawer', { cls: 'primary sm', data: { k: 'lq', id: lq.id } }) : '');
    }
    p.innerHTML = `<div class="lp-h">${h}<button type="button" class="icon-btn" data-lgx aria-label="Bağla">${ic('x')}</button></div><div class="lp-b">${b}</div><div class="lp-f">${f}</div>`;
  }

  /* --- build / mount --- */
  function lgBuild(anim) {
    const m = lgModel(); const prevModel = LG.model; LG.model = m;
    const nodesEl = LG.root.querySelector('.lg-nodes');
    nodesEl.innerHTML = m.nodes.map(n => ndHtml(m, n)).join('');
    nodesEl.querySelectorAll('.nd').forEach(el => { const n = m.byKey.get(el.dataset.node); n.el = el; });
    lgLayout(m);
    const prev = LG.prev || new Map();
    m.nodes.forEach(n => { const p = prev.get(n.key); if (p) { n.cx = p.x; n.cy = p.y; } else { n.cx = n.x; n.cy = n.y; if (anim !== 'none') { n.el.classList.add('enter'); n.el.style.setProperty('--d', `${Math.abs(n.L) * 90}ms`); } } });
    lgDrawEdges(m); lgApply(m);
    const from = m.nodes.map(n => [n.cx, n.cy]);
    const moving = m.nodes.some(n => n.cx !== n.x || n.cy !== n.y);
    LG.prev = new Map(m.nodes.map(n => [n.key, { x: n.x, y: n.y }]));
    if (moving && anim !== 'none') lgAnimate(480, p => { m.nodes.forEach((n, i) => { n.cx = from[i][0] + (n.x - from[i][0]) * p; n.cy = from[i][1] + (n.y - from[i][1]) * p; }); lgApply(m); lgMini(); });
    else { m.nodes.forEach(n => { n.cx = n.x; n.cy = n.y; }); lgApply(m); }
    if (LG.sel && LG.sel.type === 'node' && !m.byKey.has(LG.sel.id)) LG.sel = null;
    if (LG.sel && LG.sel.type === 'col' && !m.byKey.has(m.G.gOf(LG.sel.id))) LG.sel = null;
    if (LG.sel && LG.sel.type === 'edge') LG.sel = null;
    lgFocus(); lgPanel(); lgMini();
    return { m, prevModel };
  }
  function lgRelayout() {
    const m = LG.model; if (!m) return;
    m.nodes.forEach(n => { const open = LG.open.has(n.key) || LG.auto.has(n.key); n.el.classList.toggle('open', open); const c = n.el.querySelector('.nd-cols'); if (c) c.hidden = !open; const tg = n.el.querySelector('[data-ntog]'); if (tg) tg.setAttribute('aria-expanded', String(open)); });
    const from = m.nodes.map(n => [n.cx, n.cy]);
    lgLayout(m); lgDrawEdges(m);
    m.nodes.forEach((n, i) => { n.cx = from[i][0]; n.cy = from[i][1]; });
    LG.prev = new Map(m.nodes.map(n => [n.key, { x: n.x, y: n.y }]));
    lgApply(m); lgFocus();
    lgAnimate(420, p => { m.nodes.forEach((n, i) => { n.cx = from[i][0] + (n.x - from[i][0]) * p; n.cy = from[i][1] + (n.y - from[i][1]) * p; }); lgApply(m); lgMini(); });
  }
  function lineageShell() {
    const lay = S.lg.layer || 'none';
    return `<div class="lg-wrap" id="lg-root">
      <div class="lg-world"><svg class="lg-edges" width="1" height="1"><defs>${['n', 'on', 'w', 'b', 'i'].map(k => `<marker id="lgA-${k}" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 1L9 5L0 9z" class="mk-${k}"/></marker>`).join('')}</defs><g class="eg"></g></svg><div class="lg-nodes"></div><div class="lg-badges"></div></div>
      <div class="lg-rail" role="toolbar" aria-label="Xəritə alətləri">
        <button type="button" data-lg="fit" data-tip="Hamısını göstər" aria-label="Hamısını göstər">${ic('fit')}</button>
        <button type="button" data-lg="home" data-tip="Mərkəzə qayıt" aria-label="Mərkəzə qayıt">${ic('target')}</button>
        <button type="button" data-lg="relayout" data-tip="Düzümü sıfırla" aria-label="Düzümü sıfırla">${ic('reset')}</button>
        <div class="sep"></div>
        <button type="button" data-lg="openall" data-tip="Bütün sütunları aç" aria-label="Bütün sütunları aç">${ic('expand')}</button>
        <button type="button" data-lg="closeall" data-tip="Sütunları bağla" aria-label="Sütunları bağla">${ic('collapse')}</button>
      </div>
      <div class="lg-top">
        <div class="lg-search">${ic('search', 14)}<label class="sr" for="lg-search">Xəritədə axtar</label><input id="lg-search" autocomplete="off" placeholder="Xəritədə cədvəl və ya sütun axtar"><div class="lg-sugg" hidden></div></div>
        <div class="lg-pill"><span>Yuxarı</span><span class="hops">${[1, 2, 3, 4, 5].map(k => `<button type="button" data-hop="up" data-v="${k}" aria-pressed="${S.lg.up === k}">${k}</button>`).join('')}</span><span style="width:6px"></span><span>Aşağı</span><span class="hops">${[1, 2, 3, 4, 5].map(k => `<button type="button" data-hop="down" data-v="${k}" aria-pressed="${S.lg.down === k}">${k}</button>`).join('')}</span></div>
        <div class="seg" role="group" aria-label="Qat">${[['none', 'Qat yoxdur'], ['sens', 'Həssas data'], ['dq', 'Keyfiyyət'], ['gaps', 'Sübut']].map(([k, l]) => `<button type="button" data-layer="${k}" aria-pressed="${lay === k}">${l}</button>`).join('')}</div>
      </div>
      <div class="lg-zoom"><button type="button" data-lg="zout" aria-label="Kiçilt">−</button><span>100%</span><button type="button" data-lg="zin" aria-label="Böyüt">+</button></div>
      <div class="lg-legend"><span><svg width="26" height="8" aria-hidden="true"><path d="M1 4h24" stroke="var(--border-2)" stroke-width="1.8"/></svg>Sübutlu</span><span><svg width="26" height="8" aria-hidden="true"><path d="M1 4h24" stroke="var(--warn)" stroke-width="1.8" stroke-dasharray="6 4"/></svg>Qeyri-müəyyən</span><span><svg width="26" height="8" aria-hidden="true"><path d="M2 4h22" stroke="var(--bad)" stroke-width="2" stroke-dasharray="1.5 5" stroke-linecap="round"/></svg>Həll edilməyib</span><span><svg width="26" height="8" aria-hidden="true"><path d="M1 4h24" stroke="var(--info)" stroke-width="1.8"/></svg>Əl ilə, sübutla</span></div>
      <div class="lg-mini" title="İcmal: klikləyin"><svg width="190" height="120" aria-hidden="true"></svg></div>
      <aside class="lg-panel" aria-hidden="true" aria-label="Seçilmiş element"></aside>
      <div class="lg-tip" role="tooltip"></div>
    </div>`;
  }
  function lgMount() {
    const root = document.getElementById('lg-root'); if (!root) return;
    const key = lgRouteKey(); const entering = !LG.mounted || LG.key !== key; const focalChanged = LG.focal !== lgFocalId();
    LG.root = root; LG.wrap = root; LG.world = root.querySelector('.lg-world');
    if (entering) { LG.prev = null; LG.sel = null; LG.hover = null; LG.auto = new Set(); LG.more = new Set(); LG.open = new Set([lgFocalId()]); root.classList.add('intro'); setTimeout(() => root.classList.remove('intro'), 1200); }
    else if (focalChanged) { LG.open.add(lgFocalId()); }
    lgBuild(entering ? 'intro' : 'tween');
    if (entering || !LG.cam) { LG.cam = lgFit(LG.model, false); lgCam(); }
    else { lgCam(); if (focalChanged || LG.depthChanged) lgCamTo(lgFit(LG.model, !!LG.sel), 520); }
    LG.depthChanged = false; LG.mounted = true; LG.key = key; LG.focal = lgFocalId();
    lgWire(root);
  }
  function lgSelect(sel, center) {
    const was = !!LG.sel;
    if (sel && LG.sel && sel.type === LG.sel.type && sel.id === LG.sel.id && !center) sel = null;
    LG.sel = sel;
    const prevAuto = LG.auto; LG.auto = new Set();
    if (sel && sel.type === 'col') { const m = LG.model; const set = new Set([sel.id, ...walk(sel.id, m.cE, 'up'), ...walk(sel.id, m.cE, 'down')]); set.forEach(c => { const g = m.G.gOf(c); if (m.byKey.has(g) && !LG.open.has(g)) LG.auto.add(g); }); const g0 = m.G.gOf(sel.id); if (m.byKey.has(g0)) { const n = m.byKey.get(g0); if (n.rows.indexOf(sel.id) >= 10) LG.more.add(g0); } }
    const changed = prevAuto.size !== LG.auto.size || [...LG.auto].some(k => !prevAuto.has(k));
    if (changed) { LG.model.nodes.forEach(n => { if (LG.more.has(n.key)) n.el.querySelectorAll('[data-over]').forEach(r => { r.hidden = false; }); }); lgRelayout(); }
    lgFocus(); lgPanel();
    if (sel && sel.type !== 'edge') { const f = lgFocusSets(); const t = lgFitKeys(f.nodes); if (t) lgCamTo(t, 560); }
    else if (!sel && was) { const r = LG.wrap.getBoundingClientRect(); const b = lgBounds(LG.model); if ((LG.cam.x + (b.x + b.w) * LG.cam.k) < r.width - 40 && LG.cam.x + b.x * LG.cam.k > 0) { /* graph already visible */ } else lgCamTo(lgFit(LG.model, false), 500); }
  }
  function lgTip(e, j) {
    const tip = LG.root.querySelector('.lg-tip'); if (j == null || !LG.model.vis[j]) { tip.classList.remove('show'); return; }
    const v = LG.model.vis[j]; const r = LG.wrap.getBoundingClientRect(); const edges = v.kind === 'col' ? [v.e] : v.p.edges;
    tip.innerHTML = `<b>${esc(shortName(edges[0].from))}</b><span>${ic('right', 10)} ${esc(shortName(edges[0].to))}${edges.length > 1 ? `, +${edges.length - 1} sütun` : ''}</span><code>${esc(edges[0].tf)}</code><span>${esc(ST[v.status][0])}${['AMBIGUOUS', 'UNRESOLVED'].includes(v.status) ? ', kliklə həll et' : ', kliklə təfərrüat'}</span>`;
    const x = clamp(e.clientX - r.left + 14, 8, r.width - 330); const y = clamp(e.clientY - r.top + 14, 8, r.height - 110);
    tip.style.transform = `translate(${x}px, ${y}px)`; tip.classList.add('show');
  }
  function lgWire(root) {
    const wrap = root;
    root.addEventListener('mouseover', e => {
      if (LG.drag) return;
      const cr = e.target.closest('.cr'); const hd = e.target.closest('.nd-head'); const eg = e.target.closest('.e');
      const h = cr ? { type: 'col', id: cr.dataset.col } : hd ? { type: 'node', id: hd.dataset.head } : null;
      if (JSON.stringify(h) !== JSON.stringify(LG.hover)) { LG.hover = h; lgFocus(); }
      if (eg) lgTip(e, +eg.dataset.e); else lgTip(null, null);
    });
    root.addEventListener('mousemove', e => { const eg = e.target.closest('.e'); if (eg && !LG.drag) lgTip(e, +eg.dataset.e); });
    root.addEventListener('mouseleave', () => { LG.hover = null; lgFocus(); lgTip(null, null); });
    root.addEventListener('click', e => {
      if (LG.just) return;
      const t = e.target;
      const lq = t.closest('[data-lq]'); if (lq) { openDrawer('lq', lq.dataset.lq); return; }
      const eb = t.closest('[data-eb]'); if (eb) { const v = LG.model.vis[+eb.dataset.eb]; const es = v.kind === 'col' ? [v.e] : v.p.edges; const q = es.map(lqFor).find(Boolean); if (q) openDrawer('lq', q.id); return; }
      if (t.closest('[data-lgx]')) { lgSelect(null); return; }
      const pk = t.closest('[data-lgpick]'); if (pk) { const id = pk.dataset.lgpick; const g = LG.model.G.gOf(id); const sg = root.querySelector('.lg-sugg'); if (sg) sg.hidden = true; if (LG.model.byKey.has(g)) lgSelect({ type: 'col', id }, true); else { S.lg.focal = g; if (S.route.p === 'asset') go('asset', g, 'lineage'); else go('lineage', g); } return; }
      const pn = t.closest('[data-lgnode]'); if (pn) { const k = pn.dataset.lgnode; if (LG.model.byKey.has(k)) lgSelect({ type: 'node', id: k }, true); else ACT.lgFocal({ id: k }); return; }
      const hop = t.closest('[data-hop]'); if (hop) { S.lg[hop.dataset.hop] = +hop.dataset.v; LG.depthChanged = true; render(); return; }
      const ly = t.closest('[data-layer]'); if (ly) { S.lg.layer = ly.dataset.layer; LG.prev = new Map(LG.model.nodes.map(n => [n.key, { x: n.x, y: n.y }])); render(); return; }
      const more = t.closest('[data-more]'); if (more) { const k = more.dataset.more; S.lg[k] = Math.min(5, S.lg[k] + 1); LG.depthChanged = true; render(); return; }
      const tg = t.closest('[data-ntog]'); if (tg) { const k = tg.dataset.ntog; if (LG.open.has(k) || LG.auto.has(k)) { LG.open.delete(k); LG.auto.delete(k); } else LG.open.add(k); lgRelayout(); return; }
      const nm = t.closest('[data-nmore]'); if (nm) { const k = nm.dataset.nmore; LG.more.add(k); LG.model.byKey.get(k).el.querySelectorAll('[data-over]').forEach(r => { r.hidden = false; }); nm.parentElement.remove(); lgRelayout(); return; }
      const a = t.closest('[data-lg]');
      if (a) {
        const k = a.dataset.lg; const r = wrap.getBoundingClientRect();
        if (k === 'fit') lgCamTo(lgFit(LG.model, !!LG.sel));
        if (k === 'home') lgCenterOn(LG.model.focal);
        if (k === 'zin') lgZoomAt(r.width / 2, r.height / 2, 1.25, true);
        if (k === 'zout') lgZoomAt(r.width / 2, r.height / 2, 0.8, true);
        if (k === 'relayout') { LG.manual[lgRouteKey() + LG.model.focal] = {}; lgRelayout(); setTimeout(() => lgCamTo(lgFit(LG.model, !!LG.sel)), 440); }
        if (k === 'openall') { LG.model.nodes.forEach(n => { if (n.rows.length) LG.open.add(n.key); }); lgRelayout(); setTimeout(() => lgCamTo(lgFit(LG.model, !!LG.sel)), 440); }
        if (k === 'closeall') { LG.open = new Set(); LG.auto = new Set(); lgRelayout(); setTimeout(() => lgCamTo(lgFit(LG.model, !!LG.sel)), 440); }
        return;
      }
      const cr = t.closest('.cr'); if (cr) { lgSelect({ type: 'col', id: cr.dataset.col }); return; }
      if (t.closest('input')) return;
      const hd = t.closest('.nd-head'); if (hd) { lgSelect({ type: 'node', id: hd.dataset.head }); return; }
      const eg = t.closest('.e'); if (eg) { lgSelect({ type: 'edge', id: +eg.dataset.e }); return; }
    });
    root.addEventListener('dblclick', e => { const hd = e.target.closest('.nd-head'); if (hd && hd.dataset.head !== LG.model.focal) { const k = hd.dataset.head; if (!k.startsWith('link:') && !k.startsWith('dyn:')) ACT.lgFocal({ id: k }); } });
    root.addEventListener('keydown', e => {
      const cr = e.target.closest('.cr'); if (cr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); lgSelect({ type: 'col', id: cr.dataset.col }, true); }
    });
    root.addEventListener('input', e => {
      const fi = e.target.closest('[data-nfind]');
      if (fi) { const q = fi.value.trim().toUpperCase(); const n = LG.model.byKey.get(fi.dataset.nfind); n.el.querySelectorAll('.cr').forEach(r => { const hit = !q || r.dataset.col.toUpperCase().split(/[.:]/).pop().includes(q); r.hidden = !hit || (!q && r.hasAttribute('data-over') && !LG.more.has(n.key)); }); lgRelayout(); return; }
      if (e.target.id === 'lg-search') {
        const q = e.target.value.trim().toUpperCase(); const sg = root.querySelector('.lg-sugg'); if (!q) { sg.hidden = true; return; }
        const m = LG.model; const hits = [];
        m.nodes.forEach(n => { const nm = n.kind === 'report' ? rep(n.key).name : n.key; if (nm.toUpperCase().includes(q)) hits.push(`<button type="button" data-lgnode="${esc(n.key)}">${tile(n.kind === 'col' ? 'table' : n.kind, 'xs')}<span>${esc(n.kind === 'report' ? rep(n.key).name : n.key.split(':').pop())}</span></button>`); n.rows.forEach(r => { if (shortName(r).toUpperCase().includes(q)) hits.push(`<button type="button" data-lgpick="${esc(r)}">${colRef(r)}</button>`); }); });
        sg.innerHTML = hits.slice(0, 8).join('') || '<p class="small muted" style="padding:8px 10px">Bu xəritədə tapılmadı</p>'; sg.hidden = false;
      }
    });
    const inp = root.querySelector('#lg-search'); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { const b = root.querySelector('.lg-sugg button'); if (b) { e.preventDefault(); b.click(); inp.value = ''; } } if (e.key === 'Escape') { inp.value = ''; root.querySelector('.lg-sugg').hidden = true; e.stopPropagation(); } });
    inp.addEventListener('blur', () => setTimeout(() => { const sg = root.querySelector('.lg-sugg'); if (sg) sg.hidden = true; }, 180));

    wrap.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('.lg-rail, .lg-top, .lg-zoom, .lg-legend, .lg-mini, .lg-panel, .cr, button, input, .nd-cols')) return;
      const hd = e.target.closest('.nd-head'); const n = hd ? LG.model.byKey.get(hd.dataset.head) : null;
      if (!hd && e.target.closest('.nd')) return;
      LG.drag = { n, sx: e.clientX, sy: e.clientY, moved: false, cam0: Object.assign({}, LG.cam), p0: n ? { x: n.cx, y: n.cy } : null, pid: e.pointerId };
    });
    wrap.addEventListener('pointermove', e => {
      const d = LG.drag; if (!d) return; const dx = e.clientX - d.sx; const dy = e.clientY - d.sy;
      if (!d.moved) { if (Math.hypot(dx, dy) < 4) return; d.moved = true; try { wrap.setPointerCapture(d.pid); } catch (er) { /* pointer gone */ } wrap.classList.add(d.n ? 'dragging' : 'panning'); cancelAnimationFrame(LG.raf); lgTip(null, null); }
      if (d.n) { d.n.cx = d.p0.x + dx / LG.cam.k; d.n.cy = d.p0.y + dy / LG.cam.k; d.n.x = d.n.cx; d.n.y = d.n.cy; lgApply(LG.model); lgMini(); }
      else { LG.cam.x = d.cam0.x + dx; LG.cam.y = d.cam0.y + dy; lgCam(); }
    });
    const end = () => {
      const d = LG.drag; if (!d) return; LG.drag = null; wrap.classList.remove('panning', 'dragging');
      if (d.moved) { LG.just = true; setTimeout(() => { LG.just = false; }, 0); if (d.n) { const mk = lgRouteKey() + LG.model.focal; (LG.manual[mk] = LG.manual[mk] || {})[d.n.key] = { x: d.n.x, y: d.n.y }; LG.prev.set(d.n.key, { x: d.n.x, y: d.n.y }); } }
      else if (!d.n && LG.sel) lgSelect(null);
    };
    wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
    wrap.addEventListener('wheel', e => {
      if (e.target.closest('.lg-panel, .lg-sugg, .nd-cols')) return;
      e.preventDefault(); const r = wrap.getBoundingClientRect();
      const mouse = !e.ctrlKey && e.deltaX === 0 && Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY);
      if (e.ctrlKey || e.metaKey || mouse) lgZoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * (mouse ? 0.0015 : 0.01)), false);
      else { LG.cam.x -= e.deltaX; LG.cam.y -= e.deltaY; lgCam(); }
    }, { passive: false });
    root.querySelector('.lg-mini').addEventListener('click', e => {
      const r = e.currentTarget.querySelector('svg').getBoundingClientRect(); const mm = LG.mm; if (!mm) return;
      const wx = (e.clientX - r.left - mm.ox) / mm.s; const wy = (e.clientY - r.top - mm.oy) / mm.s; const cr = wrap.getBoundingClientRect();
      lgCamTo({ k: LG.cam.k, x: cr.width / 2 - wx * LG.cam.k, y: cr.height / 2 - wy * LG.cam.k }, 380);
    });
  }

  /* --- lineage page & impact --- */
  function impactRows() {
    const E = effEdges(); const G = groupGraph(E); const focal = S.lg.focal; const dir = S.lg.dir || 'down';
    const d = bfs(focal, dir === 'down' ? G.outs : G.ins, 99); d.delete(focal);
    return [...d.entries()].sort((a, b) => a[1] - b[1]).map(([k, deg]) => {
      const isR = k.startsWith('R-'); const t = !isR && !k.startsWith('link:') && !k.startsWith('dyn:') ? tbl(k) : null;
      const pathE = [...G.pairs.values()].filter(p => (dir === 'down' ? p.b === k : p.a === k));
      const gaps = pathE.some(p => p.status === 'AMBIGUOUS' || p.status === 'UNRESOLVED');
      const name = isR ? rep(k).name : k.startsWith('link:') ? nodeInfo(`${k}.x`.replace(/\.x$/, '.RATE')).gtitle : k.startsWith('dyn:') ? 'Dinamik SQL' : `${colParts(k + '.x').schema}.${colParts(k + '.x').table}`;
      return { k, deg, kind: isR ? 'report' : k.startsWith('link:') ? 'link' : k.startsWith('dyn:') ? 'dyn' : (t ? tableKind(t) : 'table'), name, owner: isR ? rep(k).owner : t ? t.owner : null, src: isR ? 'Hesabat serveri' : t ? alias(t.src) : '—', pii: t ? [...new Set(tableFindings(k).filter(f => f.status === 'CONFIRMED').map(f => f.det))] : [], gaps };
    });
  }
  function vLineage() {
    const focal = S.lg.focal; const fi = focal.startsWith('R-') ? { kind: 'report', name: rep(focal).name, sub: focal } : (() => { const t = tbl(focal); return t ? { kind: tableKind(t), name: t.name, sub: `${alias(t.src)} ${t.schema}` } : { kind: 'link', name: focal, sub: '' }; })();
    const E = effEdges(); const ue = focal.startsWith('R-') ? rep(focal).fields.flatMap(f => upEdges(`${focal}:${f}`, E)) : tbl(focal) ? tbl(focal).cols.flatMap(c => upEdges(`${focal}.${c[0]}`, E)) : [];
    const gaps = new Set(ue.filter(e => !['VERIFIED', 'MANUAL'].includes(e.status)).map(e => e.i)).size;
    const head = `<div class="lg-head"><span class="small muted">Mərkəz</span><button type="button" class="btn" data-act="palette" data-mode="focal">${tile(fi.kind, 'xs')}<b>${esc(clip(fi.name, 40))}</b><span class="muted" style="font-weight:400">${esc(fi.sub)}</span>${ic('chev', 12)}</button>
      ${gaps ? chip(`${gaps} sübutsuz əlaqə`, 'c-warn') : chip('Lineage sübutlu', 'c-ok')}
      <span class="grow"></span>
      <div class="seg" role="group" aria-label="Görünüş"><button type="button" data-act="lgView" data-v="graph" aria-pressed="${S.lg.view !== 'impact'}">${ic('lineage', 14)}Xəritə</button><button type="button" data-act="lgView" data-v="impact" aria-pressed="${S.lg.view === 'impact'}">${ic('list', 14)}Təsir analizi</button></div></div>`;
    if (S.lg.view === 'impact') {
      const rows = impactRows(); const dir = S.lg.dir || 'down';
      return `<div class="page full">${head}<div class="impact"><div class="row" style="justify-content:space-between;margin-bottom:12px"><div class="seg" role="group"><button type="button" data-act="lgDir" data-v="down" aria-pressed="${dir === 'down'}">Aşağı axın (təsir)</button><button type="button" data-act="lgDir" data-v="up" aria-pressed="${dir === 'up'}">Yuxarı axın (mənbə)</button></div>${btn('CSV ixrac et', 'exportImpact', { cls: 'sm', icon: 'dl' })}</div>
        <div class="tw"><table class="tbl"><thead><tr><th>Aktiv</th><th>Növ</th><th class="num">Dərəcə</th><th>Mənbə</th><th>Sahib</th><th>Həssas data</th><th>Sübut</th><th></th></tr></thead><tbody>
        ${rows.length ? rows.map(r => `<tr><td><span class="colname">${tile(r.kind, 'xs')}${esc(r.name)}</span></td><td>${esc(kindName(r.kind) || (r.kind === 'link' ? 'Sübutsuz mənbə' : 'Dinamik SQL'))}</td><td class="num"><span class="chip c-mute" style="justify-content:center;min-width:28px">${r.deg}</span></td><td>${esc(r.src)}</td><td>${r.owner ? person(r.owner) : '<span class="muted">—</span>'}</td><td>${r.pii.map(d => `<span class="tag pii">${d}</span>`).join(' ') || '<span class="muted">—</span>'}</td><td>${r.gaps ? chip('Sübut gözləyir', 'c-warn') : chip('Sübutlu', 'c-ok')}</td><td>${r.kind === 'report' || r.kind === 'table' || r.kind === 'view' ? `<button type="button" class="btn sm" data-act="lgFocal" data-id="${esc(r.k)}">Mərkəzə al</button>` : ''}</td></tr>`).join('') : `<tr><td colspan="8">${empty('Bu istiqamətdə aktiv yoxdur', 'Mövcud lineage əhatəsinə görə.')}</td></tr>`}
        </tbody></table></div><p class="small muted" style="margin-top:8px">Dərəcə: mərkəzdən neçə addım uzaqdır. Nəticə yalnız parse olunmuş sorğulara əsaslanır.</p></div></div>`;
    }
    return `<div class="page full">${head}${lineageShell()}</div>`;
  }

  /* ================= drawers ================= */
  function dSource(id) {
    const s = src(id); const I = s.identity; const runs = S.scans.filter(x => x.src === id);
    let conflict = '';
    if (I.status === 'CONFLICT') {
      const o = src(I.conflictWith); const J = o.identity;
      const row = (k, a, b) => `<tr><td class="muted small">${k}</td><td><code>${esc(a)}</code></td><td><code>${esc(b)}</code></td><td>${a === b ? chip('eyni', 'c-warn', false) : chip('fərqli', 'c-mute', false)}</td></tr>`;
      conflict = `<div class="note bad">${ic('warn')}<div><b>"${esc(s.alias)}" adı artıq ${o.id}-də istifadə olunur.</b> Adlar eynidir, fiziki DB fərqlidir. Sistem bunları birləşdirmir və nəticələri dərc etmir.</div></div>
        <div class="tw"><table class="tbl"><thead><tr><th></th><th>${o.id} (təsdiqli)</th><th>${s.id} (yeni)</th><th></th></tr></thead><tbody>${row('Alias', o.alias, s.alias)}${row('DB_NAME', J.dbName, I.dbName)}${row('DBID', J.dbid, I.dbid)}${row('Host', J.host, I.host)}${row('Service', J.service, I.service)}</tbody></table></div>`;
    }
    let foot = '';
    if (!can('source.manage')) foot = lock('source.manage');
    else if (I.status === 'CONFLICT') foot = `<div class="field"><label for="newAlias">Yeni alias</label><input id="newAlias" data-keep value="${esc(s.alias)}_UAT"><span class="hint">Ayrı mənbə kimi təsdiqləyəndə unikal ad verin.</span></div>
        <div class="btn-row">${btn('Ayrı mənbə kimi təsdiqlə', 'resolveIdentity', { cls: 'primary', data: { id } })}${btn('Birləşdir', 'noop', { dis: true, title: 'DBID fərqlidir' })}${btn('Qeydiyyatı ləğv et', 'retireSource', { cls: 'danger', data: { id } })}</div>
        <p class="lock">${ic('lock', 13)}Birləşdirmə yalnız eyni fiziki DB üçündür: DBID ${esc(src(I.conflictWith).identity.dbid)} ≠ ${esc(I.dbid)}.</p>`;
    else if (I.status === 'VERIFIED') {
      const busy = runs.some(x => x.status === 'RUNNING');
      foot = `<div class="form-grid"><div class="field"><label for="scanSample">Nümunə ölçüsü</label><select id="scanSample" data-keep><option value="100">100 sətir</option><option value="1000" selected>1 000 sətir</option><option value="10000">10 000 sətir</option></select><span class="hint">Təsadüfi seçim, ilk N sətir yox.</span></div>
        <div class="field"><label>Əhatə</label><code style="padding:9px 0">${esc(s.schemas.map(x => x + '.*').join(', '))}</code><span class="hint">15 detektor, v1.3.0</span></div></div>
        ${s.env === 'PROD' ? '<p class="lock">PROD-da skan InfoSec təsdiqi və dəyişiklik bileti olmadan başlamır.</p>' : ''}
        <div class="btn-row">${btn(busy ? 'Skan işləyir' : 'Skanı başlat', 'startScan', { cls: 'primary', icon: 'bolt', dis: busy || s.env === 'PROD', data: { id } })}${btn('Bağlantını yoxla', 'testConn', { data: { id } })}</div>`;
    } else foot = '<p class="small muted">Bu qeydiyyat ləğv edilib. Tarixçə audit jurnalında qalır.</p>';
    return { title: s.alias, sub: `${s.id}, ${s.name}`, chips: st(I.status), icon: tile('db'),
      body: `${conflict}<section><h3>Fiziki kimlik</h3>${kv([['DB_NAME', `<code>${esc(I.dbName)}</code>`], ['DBID', `<code>${esc(I.dbid)}</code>`], ['Host', `<code>${esc(I.host)}</code>`], ['Service', `<code>${esc(I.service)}</code>`], ['Təsdiq', I.by ? `${esc(I.by)}, ${esc(I.at)}` : '<span class="muted">Təsdiqlənməyib</span>']])}</section>
        <section><h3>Qeydiyyat</h3>${kv([['Növ', `${esc(s.type)} <span class="env">${esc(s.env)}</span>`], ['Sistem sahibi', esc(s.owner)], ['Secret istinadı', `<code>${esc(s.secretRef)}</code><div class="small muted">Şifrə burada yoxdur, yalnız vault-dakı yeri.</div>`], ['Sxemlər', `<code>${esc(s.schemas.join(', '))}</code>`]])}</section>
        <section><h3>Skanlar</h3>${runs.length ? `<div class="tw"><table class="tbl"><tbody>${runs.slice().reverse().map(x => `<tr><td><code>${x.id}</code></td><td>${st(x.status)}</td><td class="num">${x.scanned}/${x.planned}</td><td class="small nowrap">${esc(x.started)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small muted">Hələ skan olunmayıb.</p>'}</section>`, foot };
  }
  function dNewSource() {
    const ns = S.ui.ns || {}; const v = k => esc((ns.f || {})[k] || ''); const prod = (ns.f || {}).env === 'PROD';
    let result = '';
    if (ns.err) result = `<p class="err">${esc(ns.err)}</p>`;
    if (ns.ok) { const r = ns.ok; result = `<div class="note ${r.dup ? 'bad' : r.collide ? 'warn' : 'ok'}">${ic(r.dup || r.collide ? 'warn' : 'check')}<div><b>${r.dup ? 'Bu fiziki DB artıq qeydiyyatdadır.' : 'Bağlantı uğurludur.'}</b> DB_NAME <code>${esc(r.dbName)}</code>, DBID <code>${esc(r.dbid)}</code>, sxem <code>${esc(r.schemas.join(', '))}</code>. Hüquq: yalnız SELECT, sessiya READ ONLY.${r.dup ? ` Eyni DBID ${esc(r.dup)}-də var, yeni qeydiyyat yaradılmır.` : ''}${r.collide ? ` "${esc(ns.f.alias)}" adı ${esc(r.collide)}-də də var: kimlik konflikti açılacaq və nəticələr dərc olunmayacaq.` : ''}</div></div>`; }
    return { title: 'Mənbə əlavə et', sub: 'Oracle, yalnız oxu hüququ ilə', chips: '', icon: tile('db'),
      body: `<div class="form-grid">
        <div class="field"><label for="ns-alias">Alias</label><input id="ns-alias" data-keep value="${v('alias')}" placeholder="məs. TREASURY"><span class="hint">Göstərmə adı, kimlik deyil.</span></div>
        <div class="field"><label for="ns-name">Ad</label><input id="ns-name" data-keep value="${v('name')}"></div>
        <div class="field"><label for="ns-host">Host</label><input id="ns-host" data-keep value="${v('host')}" placeholder="trs-tst.nb.local"></div>
        <div class="field"><label for="ns-service">Service</label><input id="ns-service" data-keep value="${v('service')}" placeholder="trs_tst"></div>
        <div class="field"><label for="ns-env">Mühit</label><select id="ns-env" data-keep><option${prod ? '' : ' selected'}>TEST</option><option${prod ? ' selected' : ''}>PROD</option></select></div>
        <div class="field"><label for="ns-secret">Secret istinadı</label><input id="ns-secret" data-keep value="${v('secret')}" placeholder="vault://nb-test/trs_ro"><span class="hint">Şifrə yox, vault-dakı yer.</span></div></div>
        <div class="note acc">${ic('lock')}<div><b>Şifrə sahəsi yoxdur.</b> Bağlantını DBA bankın vault-unda yaradır, platforma yalnız istinadı saxlayır.</div></div>
        ${prod ? `<div class="note warn">${ic('warn')}<div><b>PROD mənbəsi.</b> Qeyd etmək olar, amma skan InfoSec təsdiqi və dəyişiklik bileti olmadan başlamayacaq.</div></div>` : ''}${result}`,
      foot: `<div class="btn-row">${btn('Bağlantını yoxla', 'nsTest')}${btn('Mənbəni qeyd et', 'nsSave', { cls: 'primary', dis: !ns.ok || !!ns.ok.dup })}</div>` };
  }
  function dLQ(id) {
    const q = S.lineageQueue.find(x => x.id === id); const open = q.status !== 'RESOLVED';
    let res = '';
    if (q.status === 'RESOLVED') res = `<div class="note ok">${ic('check')}<div><b>Həll edilib.</b> ${esc(q.res.by)}, ${esc(q.res.at)}: ${esc(q.res.what)}. Sübut: ${esc(q.res.note)}</div></div>`;
    if (q.status === 'DEFERRED') res = `<div class="note warn">${ic('clock')}<div><b>Sübut gözlənilir.</b> ${esc(q.res.by)}, ${esc(q.res.at)}: ${esc(q.res.note)}</div></div>`;
    const cands = q.candidates.map((c, i) => { const label = c.src ? `${c.src} ${alias(c.src)}, ${src(c.src).identity.dbName}` : `Manual mapping: ${shortName(c.node)}`;
      return `<label class="card card-b" style="display:grid;grid-template-columns:20px 1fr;gap:10px;cursor:pointer"><input type="radio" name="lqc" id="lqc-${i}" data-keep value="${i}"${i === 0 ? ' checked' : ''}><span><b>${esc(label)}</b><span class="small" style="display:block;color:var(--text-2);margin-top:2px">${esc(c.evidence)}</span></span></label>`; }).join('');
    return { title: q.title, sub: `${q.id}, ${q.kind === 'DB_LINK' ? 'DB link qeyri-müəyyənliyi' : 'dinamik SQL'}`, chips: st(q.status), icon: tile(q.kind === 'DB_LINK' ? 'link' : 'dyn'),
      body: `<p style="color:var(--text-2)">${esc(q.why)}</p>${kv([['Sorğular', esc(q.queries.join(', '))]])}${res}${open ? `<section><h3>Namizədlər</h3><div class="stack" style="gap:8px">${cands}</div></section>` : ''}`,
      foot: !open ? '' : !can('lineage.resolve') ? lock('lineage.resolve') : `<div class="field"><label for="lqnote">Sübut</label><textarea id="lqnote" data-keep placeholder="Məs. DBA-dan link tərifi, CHG nömrəsi, SQL sahibinin izahı"></textarea></div><p class="err" id="lqerr" hidden>Sübutu yazın. Sübutsuz əlaqə təsdiqlənmir.</p>
        <div class="btn-row">${btn(q.kind === 'DB_LINK' ? 'Seçilmiş mənbəni təsdiqlə' : 'Manual mapping-i qəbul et', 'resolveLQ', { cls: 'primary', data: { id } })}${q.status !== 'DEFERRED' ? btn('Sübut gözlənilir kimi saxla', 'deferLQ', { data: { id } }) : ''}</div>` };
  }
  function dColumn(id) {
    const p = colParts(id); const t = tbl(p.tableId); const s = src(p.src);
    if (!t) return { title: p.col, sub: `${alias(p.src)}, ${p.schema}.${p.table}`, chips: '', icon: tile('col'), body: '<p class="small muted">Bu cədvəl həmin mənbədə hələ skan olunmayıb, kataloqda yoxdur. Lineage onu yalnız SQL-dən tanıyır.</p>', foot: '' };
    const ty = (t.cols.find(c => c[0] === p.col) || [])[1]; const f = findingOf(id); const E = effEdges(); const reps = reportsOf(id, E);
    const cdes = S.cdes.filter(c => c.maps.some(m => resolveNode(m.node) === id)); const binds = S.dqBinds.filter(b => b.node === id || b.ref === id);
    return { title: p.col, sub: `${s.alias}, ${p.schema}.${p.table}`, chips: f ? stF(f.status) : '', icon: tile('col'),
      body: `${kv([['Aktiv ID', `<code style="font-size:11px">${esc(S.tenant.id)}/${esc(s.id)}/${esc(s.identity.dbid)}/${esc(p.schema)}.${esc(p.table)}.${esc(p.col)}</code>`], ['Fiziki tip', `<code>${esc(ty)}</code>`], ['Data tipi', covHtml(id, ty)], ['Giriş etiketi', f ? labelHtml(f) : '<span class="muted">—</span>'], ['Sahib', person(t.owner)]])}
        ${f ? `<div class="btn-row"><a class="btn sm" ${goA('discovery', f.id)}>${ic('shield', 14)}Tapıntını aç</a><a class="btn sm" ${goA('asset', p.tableId, 'lineage')}>${ic('lineage', 14)}Lineage</a></div>` : `<div class="btn-row"><a class="btn sm" ${goA('asset', p.tableId, 'lineage')}>${ic('lineage', 14)}Lineage</a></div>`}
        <section><h3>Hansı hesabatlarda görünür</h3>${reps.length ? reps.map(r => `<div style="padding:4px 0">${colRef(r)} <span class="small muted">${esc(nodeInfo(r).rep.name)}</span></div>`).join('') : '<p class="small muted">Mövcud lineage əhatəsində hesabat tapılmadı. Bu, "istifadə olunmur" demək deyil.</p>'}</section>
        ${cdes.length ? `<section><h3>CDE</h3>${cdes.map(c => `<a class="pick" ${goA('glossary', c.id)}>${tile('cde', 'xs')}<span class="grow">${esc(c.name)}</span>${st(c.status)}</a>`).join('')}</section>` : ''}
        ${binds.length ? `<section><h3>DQ qaydaları</h3>${binds.map(b => { const r = lastRun(b.id); return `<div class="row" style="padding:4px 0"><code>${b.id}</code>${esc(defOf(b.def).name)}${r ? st(r.result) : ''}</div>`; }).join('')}</section>` : ''}`, foot: '' };
  }
  const DRAWERS = { source: dSource, newSource: dNewSource, lq: dLQ, column: dColumn };
  let lastFocus = null;
  function renderDrawer() {
    const el = $('#drawer'); const scrim = $('#scrim');
    if (!S.drawer || !DRAWERS[S.drawer.k]) { el.classList.remove('open'); scrim.classList.remove('show'); setTimeout(() => { if (!S.drawer) scrim.hidden = true; }, 200); return; }
    const d = DRAWERS[S.drawer.k](S.drawer.id);
    el.innerHTML = `<div class="d-head">${d.icon || ''}<div class="t"><h2 id="d-title">${esc(d.title)}</h2><p>${esc(d.sub)}</p>${d.chips ? `<div style="margin-top:6px">${d.chips}</div>` : ''}</div><button type="button" class="icon-btn" data-act="close" aria-label="Bağla">${ic('x')}</button></div><div class="d-body">${d.body}</div>${d.foot ? `<div class="d-foot">${d.foot}</div>` : ''}`;
    scrim.hidden = false; requestAnimationFrame(() => { if (!S.drawer) return; scrim.classList.add('show'); el.classList.add('open'); });
  }
  function openDrawer(k, id) { if (!S.drawer) lastFocus = document.activeElement; S.drawer = { k, id }; render(); setTimeout(() => { const b = $('#drawer [data-act="close"]'); if (b) b.focus(); }, 40); }
  function closeDrawer() { S.drawer = null; S.ui.ns = null; render(); if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus(); }

  /* ================= command palette ================= */
  const PAL = { open: false, q: '', i: 0, mode: 'go', items: [] };
  function palItems(q) {
    q = q.trim().toUpperCase(); const out = [];
    const add = (grp, it) => { if (!q || (it.t + ' ' + (it.s || '')).toUpperCase().includes(q)) out.push(Object.assign({ grp }, it)); };
    S.tables.forEach(t => add('Cədvəllər', { k: tableKind(t), t: t.name, s: `${alias(t.src)} ${t.schema}, ${t.domain}`, id: t.id, p: 'asset' }));
    S.reports.forEach(r => add('Hesabatlar', { k: 'report', t: r.name, s: r.id, id: r.id, p: 'asset' }));
    if (PAL.mode === 'go') {
      S.cdes.forEach(c => add('CDE və terminlər', { k: 'cde', t: c.name, s: termOf(c.term).name, id: c.id, p: 'glossary' }));
      if (q) S.tables.forEach(t => t.cols.forEach(c => { if (c[0].includes(q)) out.push({ grp: 'Sütunlar', k: 'col', t: c[0], s: `${alias(t.src)} ${t.schema}.${t.name}`, id: `${t.id}.${c[0]}`, col: true }); }));
      NAV.filter(n => n.p).forEach(n => add('Səhifələr', { i: n.i, t: n.t, p: n.p }));
    }
    return out.slice(0, 40);
  }
  function renderPalette() {
    const el = $('#palette'); const sc = $('#palscrim');
    if (!PAL.open) { el.classList.remove('open'); sc.hidden = true; return; }
    sc.hidden = false; PAL.items = palItems(PAL.q); PAL.i = clamp(PAL.i, 0, Math.max(0, PAL.items.length - 1));
    let grp = null;
    const res = PAL.items.map((it, j) => { const h = it.grp !== grp ? `<div class="grp">${esc(it.grp)}</div>` : ''; grp = it.grp; return `${h}<button type="button" class="opt${j === PAL.i ? ' on' : ''}" data-pal="${j}">${it.k ? tile(it.k, 'sm') : `<span class="tile sm t-col">${ic(it.i, 14)}</span>`}<span class="grow"><span>${esc(it.t)}</span>${it.s ? `<span class="s"> ${esc(it.s)}</span>` : ''}</span>${j === PAL.i ? '<span class="kbd">↵</span>' : ''}</button>`; }).join('');
    if (!el.querySelector('input')) el.innerHTML = `<div class="pi">${ic('search', 18)}<input id="palin" placeholder="${PAL.mode === 'focal' ? 'Lineage üçün mərkəz aktiv seçin' : 'Cədvəl, sütun, hesabat, termin və ya səhifə'}" autocomplete="off" aria-label="Axtar"><span class="kbd">Esc</span></div><div class="res" role="listbox"></div><div class="ft"><span>↑↓ seç</span><span>↵ aç</span><span>Esc bağla</span></div>`;
    el.querySelector('.res').innerHTML = res || `<div class="empty"><b>Heç nə tapılmadı</b>Başqa söz yoxlayın.</div>`;
    el.classList.add('open');
    const on = el.querySelector('.opt.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  }
  function palOpen(mode) { PAL.open = true; PAL.q = ''; PAL.i = 0; PAL.mode = mode || 'go'; $('#palette').innerHTML = ''; renderPalette(); const i = $('#palin'); if (i) setTimeout(() => i.focus(), 10); }
  function palClose() { PAL.open = false; renderPalette(); }
  function palPick(j) {
    const it = PAL.items[j]; if (!it) return; palClose();
    if (PAL.mode === 'focal') { ACT.lgFocal({ id: it.id }); return; }
    if (it.col) { const tid = colParts(it.id).tableId; go('asset', tid, 'columns'); setTimeout(() => openDrawer('column', it.id), 60); return; }
    go(it.p, it.id);
  }

  /* ================= router & render ================= */
  const VIEWS = { home: vHome, search: vSearch, asset: vAsset, discovery: vDiscovery, lineage: vLineage, glossary: vGlossary, quality: vQuality, sources: vSources, compliance: vCompliance, audit: vAudit };
  function parseHash() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    const p = VIEWS[parts[0]] ? parts[0] : 'home';
    S.route = { p, id: parts[1] || null, tab: parts[2] || null };
    if (p === 'lineage' && S.route.id) S.lg.focal = S.route.id;
  }
  function go(p, id, tab) {
    S.route = { p, id: id || null, tab: tab || null }; if (p === 'lineage' && id) S.lg.focal = id;
    S.drawer = null; const h = hrefOf(p, id, tab);
    if (location.hash !== h) history.pushState(null, '', h);
    render(); const cp = $('#page'); if (cp) cp.scrollTop = 0;
  }
  function snapshot() {
    const m = {}; document.querySelectorAll('[data-keep], #cq, #aq').forEach(el => { if (el.id) m[el.id] = el.type === 'radio' || el.type === 'checkbox' ? el.checked : el.value; });
    const a = document.activeElement; return { m, focus: a && a.id ? a.id : null, sel: a && 'selectionStart' in a ? [a.selectionStart, a.selectionEnd] : null };
  }
  function restore(s) {
    Object.entries(s.m).forEach(([id, v]) => { const el = document.getElementById(id); if (!el) return; if (el.type === 'radio' || el.type === 'checkbox') el.checked = v; else el.value = v; });
    if (s.focus && s.focus !== 'palin') { const el = document.getElementById(s.focus); if (el) { el.focus({ preventScroll: true }); if (s.sel && el.setSelectionRange) try { el.setSelectionRange(s.sel[0], s.sel[1]); } catch (e) { /* not text */ } } }
  }
  function render() {
    const snap = snapshot(); LINKS = [];
    renderNav(); renderTop();
    const canvasNow = lgOnCanvas();
    if (canvasNow && LG.mounted && LG.sig === lgSig() && document.getElementById('lg-root') && LG.key === lgRouteKey()) { /* keep the live canvas */ }
    else {
      $('#page').innerHTML = VIEWS[S.route.p]();
      if (canvasNow) { LG.sig = lgSig(); lgMount(); } else { LG.mounted = false; LG.sig = null; }
    }
    renderDrawer(); renderPalette(); restore(snap); save();
  }
  let toastT = null;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2800); }

  /* ================= scans (simulated worker) ================= */
  function startScanJob(sid, sample) {
    const id = `SCAN-${String(S.scans.length + 6).padStart(4, '0')}`; const s = src(sid);
    let plan = S.tables.filter(t => t.src === sid).map(t => t.id); if (!plan.length) plan = [`${sid}:CBS.CUSTOMERS`];
    S.scans.push({ id, src: sid, scope: s.schemas.map(x => x + '.*'), detVer: '1.3.0', sample, method: 'Təsadüfi (SAMPLE BLOCK)', status: 'RUNNING', planned: plan.length, scanned: 0, failed: 0, skipped: 0, started: now(), published: false, plan, idx: 0, note: `Əhatə manifesti dondurulub: ${plan.length} obyekt. İdempotent açar: ${sid}/${sample}/1.3.0.` });
    log('Skan başladıldı', id, `${s.alias}: ${s.schemas.join(', ')}, detektor 1.3.0, ${sample} təsadüfi sətir`); return id;
  }
  function tickScans() {
    const run = S.scans.filter(x => x.status === 'RUNNING'); if (!run.length) return;
    run.forEach(x => { const t = tbl(x.plan[x.idx]); if (t && t.scanFailed) x.failed++; else x.scanned++; x.idx++; if (x.idx >= x.plan.length) finishScan(x); });
    render();
  }
  function finishScan(x) {
    if (x.src === 'SRC-05' && !S.tables.some(t => t.src === 'SRC-05')) {
      const base = tbl('SRC-01:CBS.CUSTOMERS');
      S.tables.push({ id: 'SRC-05:CBS.CUSTOMERS', src: 'SRC-05', schema: 'CBS', name: 'CUSTOMERS', kind: 'TABLE', rows: 52310, domain: 'Müştəri', owner: null, steward: 'Nigar Ə.', desc: 'Müştəri ana qeydləri (UAT nüsxəsi)', scan: x.id, cols: JSON.parse(JSON.stringify(base.cols)) });
      const mk = (id, c, det, nn, mt, d) => ({ id, col: `SRC-05:CBS.CUSTOMERS.${c}`, det, ver: '1.3.0', status: 'CANDIDATE', decision: null, label: null, history: [], scan: x.id, sample: x.sample, nonNull: nn, matched: mt, distinct: d });
      S.findings.push(mk('F-118', 'FIN_CODE', 'FIN', Math.round(x.sample * 0.984), Math.round(x.sample * 0.979), 0.99), mk('F-119', 'FULL_NAME', 'NAME', x.sample, Math.round(x.sample * 0.93), 0.97));
    }
    S.tables.filter(t => t.src === x.src && !t.scanFailed).forEach(t => { t.scan = x.id; });
    x.status = x.failed ? 'PARTIAL' : 'SUCCEEDED'; x.published = true; delete x.plan; delete x.idx;
    log(x.status === 'PARTIAL' ? 'Skan qismən bitdi' : 'Skan bitdi', x.id, `${x.scanned} uğurlu, ${x.failed} uğursuz. Uğurlu nəticələr dərc olundu.`, { actor: 'sistem', role: 'Skan worker' });
    toast(`${x.id} bitdi: ${x.scanned} uğurlu, ${x.failed} uğursuz`);
  }

  /* ================= actions ================= */
  const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const showErr = id => { const el = document.getElementById(id); if (el) el.hidden = false; };
  const hash = s => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 9000000000; return String(1000000000 + h); };
  const ACT = {
    noop() {},
    go(d) { go(d.p, d.id, d.tab); },
    link(d) { const o = LINKS[+d.i]; if (!o) return; if (o.dr) openDrawer(o.dr[0], o.dr[1]); else go(o.go[0], o.go[1], o.go[2]); },
    drawer(d) { openDrawer(d.k, d.id); },
    close() { closeDrawer(); },
    palette(d) { palOpen(d.mode); },
    theme() { const nd = isDark() ? 'light' : 'dark'; document.documentElement.dataset.theme = nd; try { localStorage.setItem('dghub-theme', nd); } catch (e) { /* ignore */ } render(); },
    tab(d) { go(S.route.p, S.route.id, d.tab); },
    ui(d) { S.ui[d.key] = d.val; if (d.key === 'dFilter' && S.route.p === 'discovery') S.route.id = null; render(); },
    role(d, el) { S.role = el.value; render(); toast(`Rol: ${ROLES[S.role].name}`); },
    reset() { if (!window.confirm('Demonu ilkin vəziyyətə qaytarmaq? Etdiyiniz bütün qərarlar silinəcək.')) return; S = fresh(); LG.mounted = false; history.replaceState(null, '', '#/home'); render(); toast('Demo sıfırlandı'); },
    q(d, el) { S.ui.q = el.value; render(); },
    aq(d, el) { S.ui.aq = el.value; render(); },
    facet(d) { const F = S.ui.facets || (S.ui.facets = {}); const v = d.v === 'true' ? true : d.v; F[d.k] = F[d.k] === v ? null : v; render(); },
    facetclear() { S.ui.facets = {}; S.ui.srcNav = null; render(); },
    srcnav(d) { S.ui.srcNav = d.v || null; render(); },
    pick(d) { if (S.ui.sel === d.id) { go('asset', d.id); return; } S.ui.sel = d.id; render(); },
    lgFocal(d) { if (S.route.p === 'asset') { go('asset', d.id, 'lineage'); return; } S.lg.focal = d.id; S.route = { p: 'lineage', id: d.id, tab: null }; history.replaceState(null, '', hrefOf('lineage', d.id)); render(); },
    lgView(d) { S.lg.view = d.v; render(); },
    lgDir(d) { S.lg.dir = d.v; render(); },
    exportImpact() {
      const rows = impactRows(); const head = ['asset', 'type', 'degree', 'source', 'owner', 'pii', 'evidence'];
      const csv = [head.join(',')].concat(rows.map(r => [r.name, r.kind, r.deg, r.src, r.owner || '', r.pii.join(' '), r.gaps ? 'pending' : 'verified'].map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))).join('\n');
      const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `impact-${S.lg.focal.replace(/[^\w-]/g, '_')}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    review(d) {
      const f = fnd(d.id); const note = val('fnote');
      if (d.to !== 'CONFIRMED' && !note) { showErr('ferr'); document.getElementById('fnote').focus(); return; }
      const at = now(); f.status = d.to; f.decision = { by: actor(), at, comment: note }; f.history.push({ at, by: actor(), what: FST[d.to][0], note });
      if (d.to === 'CONFIRMED') { const lvl = POLICY[f.det]; f.label = { level: lvl, policy: 'v3', need: NEED(lvl), approvals: {} }; }
      log(`Tapıntı: ${FST[d.to][0].toLowerCase()}`, f.id, `${f.col.split(':')[1]}, ${f.det}${note ? '. ' + note : ''}`);
      render(); toast(d.to === 'CONFIRMED' ? `Təsdiqləndi. ${f.label.level} etiketi təsdiqə göndərildi.` : `${FST[d.to][0]}: qərar tarixçəyə yazıldı`);
    },
    approveLabel(d) {
      const f = fnd(d.id); const t = tbl(colParts(f.col).tableId); const at = now(); const by = d.as === 'owner' ? t.owner : ROLES.infosec.short;
      f.label.approvals[d.as] = { by, at }; f.history.push({ at, by, what: `Etiket təsdiqi (${d.as === 'owner' ? 'sahib' : 'InfoSec'}): ${f.label.level}` });
      const l = labelState(f); log(`Etiket təsdiqləndi (${d.as === 'owner' ? 'sahib' : 'InfoSec'})`, f.id, `${f.label.level}${l.effective ? ', etiket effektiv oldu' : ''}`, { actor: by });
      render(); toast(l.effective ? `${f.label.level} etiketi effektivdir` : 'Təsdiq qeydə alındı, digər təsdiq gözlənilir');
    },
    assignOwner(d) { const t = tbl(d.id); const p = val('ownerSel'); const old = t.owner; t.owner = p; log('Sahib təyin olundu', `${t.schema}.${t.name}`, `${old || 'yox'} → ${p}`); render(); toast(`${t.schema}.${t.name}: sahib ${p}`); },
    resolveIdentity(d) {
      const s = src(d.id); const a = val('newAlias').toUpperCase();
      if (!a || S.sources.some(x => x.id !== s.id && x.alias === a)) { toast('Bu alias artıq var. Başqa ad seçin.'); return; }
      const old = s.alias; s.alias = a; s.identity.status = 'VERIFIED'; s.identity.by = actor(); s.identity.at = now(); delete s.identity.conflictWith;
      log('Kimlik konflikti həll edildi', s.id, `Ayrı mənbə: ${old} → ${a}, DBID ${s.identity.dbid}`); render(); toast(`${s.id} ayrı mənbə kimi təsdiqləndi (${a}). İndi skan etmək olar.`);
    },
    retireSource(d) { const s = src(d.id); s.identity.status = 'RETIRED'; log('Mənbə qeydiyyatı ləğv edildi', s.id, s.alias); render(); toast('Qeydiyyat ləğv edildi'); },
    testConn(d) { const s = src(d.id); log('Bağlantı yoxlandı', s.id, `Uğurlu. DBID ${s.identity.dbid} dəyişməyib.`); render(); toast(`Bağlantı uğurlu. DBID ${s.identity.dbid} dəyişməyib.`); },
    startScan(d) { const sample = +val('scanSample') || 1000; const id = startScanJob(d.id, sample); S.ui.dTab = 'scans'; go('discovery'); toast(`${id} başladı`); },
    nsTest() {
      const f = { alias: val('ns-alias').toUpperCase(), name: val('ns-name'), host: val('ns-host').toLowerCase(), service: val('ns-service').toLowerCase(), env: val('ns-env'), secret: val('ns-secret') };
      S.ui.ns = { f };
      if (!f.alias || !f.host || !f.service || !f.secret) S.ui.ns.err = 'Alias, host, service və secret istinadını doldurun.';
      else if (!f.secret.startsWith('vault://')) S.ui.ns.err = 'Secret istinadı vault:// ilə başlamalıdır. Şifrəni buraya yazmayın.';
      else { const same = S.sources.find(s => s.identity.host === f.host && s.identity.service === f.service); S.ui.ns.ok = { dbName: same ? same.identity.dbName : f.service.toUpperCase().replace(/_/g, ''), dbid: same ? same.identity.dbid : hash(f.host + f.service), schemas: [f.service.split('_')[0].toUpperCase()], dup: same ? same.id : null, collide: (S.sources.find(s => s.alias === f.alias && s.identity.status !== 'RETIRED') || {}).id || null }; }
      render();
    },
    nsSave() {
      const ns = S.ui.ns; if (!ns || !ns.ok || ns.ok.dup) return; const f = ns.f; const r = ns.ok; const id = `SRC-${String(S.sources.length + 1).padStart(2, '0')}`;
      S.sources.push({ id, alias: f.alias, name: f.name || f.alias, type: 'Oracle 19c', env: f.env, owner: '—', secretRef: f.secret, schemas: r.schemas, identity: { status: r.collide ? 'CONFLICT' : 'VERIFIED', dbName: r.dbName, dbid: r.dbid, service: f.service, host: f.host, conflictWith: r.collide || undefined, by: r.collide ? null : actor(), at: r.collide ? null : now() } });
      log('Mənbə qeyd olundu', id, r.collide ? `Alias "${f.alias}" ${r.collide} ilə toqquşur, nəşr dayandırıldı` : `DBID ${r.dbid}, ${f.env}`);
      S.ui.ns = null; S.drawer = { k: 'source', id }; render(); toast(`${id} qeyd olundu`);
    },
    resolveLQ(d) {
      const q = S.lineageQueue.find(x => x.id === d.id); const note = val('lqnote');
      if (!note) { showErr('lqerr'); document.getElementById('lqnote').focus(); return; }
      const i = +((document.querySelector('input[name="lqc"]:checked') || {}).value || 0); const c = q.candidates[i]; const at = now();
      if (q.kind === 'DB_LINK') { S.linkRes[q.link] = c.src; S.cdes.forEach(cd => cd.maps.forEach(m => { if (m.node.startsWith(`link:${q.link}/`) && m.status === 'BLOCKED') m.status = 'PROPOSED'; })); q.res = { by: actor(), at, what: `${q.link} → ${c.src} (${src(c.src).identity.dbName})`, note }; }
      else { S.manual['dyn:Q-5710'] = c.node; q.res = { by: actor(), at, what: `Manual mapping: ${shortName(c.node)}`, note }; }
      q.status = 'RESOLVED'; log('Lineage əlaqəsi təsdiqləndi', q.id, `${q.res.what}. Sübut: ${note}`);
      S.drawer = null; render(); toast(q.kind === 'DB_LINK' ? 'Link həll edildi. Xəritə yeniləndi, asılı mapping-lər təsdiqə açıldı.' : 'Manual mapping qəbul edildi');
    },
    deferLQ(d) { const q = S.lineageQueue.find(x => x.id === d.id); const note = val('lqnote') || 'Sübut gözlənilir'; q.status = 'DEFERRED'; q.res = { by: actor(), at: now(), note }; log('Lineage əlaqəsi gözləməyə qoyuldu', q.id, note); render(); toast('Əlaqə həll edilməmiş qalır'); },
    approveMap(d) { const c = cdeOf(d.c); const m = c.maps[+d.i]; m.status = 'APPROVED'; log('Fiziki mapping təsdiqləndi', c.id, shortName(resolveNode(m.node))); render(); toast('Mapping təsdiqləndi'); },
    cdeSubmit(d) { const c = cdeOf(d.id); c.status = 'IN_REVIEW'; log('CDE baxışa göndərildi', c.id, c.name); render(); toast('Baxışa göndərildi'); },
    cdeApprove(d) { const c = cdeOf(d.id); c.status = 'APPROVED'; log('CDE tərifi təsdiqləndi', c.id, `${c.name}${certified(c) ? ', sertifikatlı oldu' : ', sertifikat şərtləri hələ tam deyil'}`, { actor: c.owner }); render(); toast(certified(c) ? `${c.name} sertifikatlıdır` : 'Təsdiqləndi. Sertifikat üçün digər şərtlər gözlənilir.'); },
    runDQ(d) {
      const b = bindOf(d.id); const iss = S.issues.find(i => i.bind === b.id && i.status !== 'CLOSED'); let r;
      if (b.id === 'DQB-01') r = { result: 'PASS', pass: 96412, den: 96412 };
      else if (b.id === 'DQB-03') r = iss && iss.status === 'OPEN' ? { result: 'FAIL', pass: 9923, den: 10000, scoreNote: 'tutuşma 99,23%: fərq hələ də 3 məhsul qrupundadır' } : { result: 'PASS', pass: 9994, den: 10000, scoreNote: 'tutuşma 99,94%' };
      else r = { result: 'ERROR', note: 'ORA-01031: insufficient privileges. DBA-dan SELECT icazəsi lazımdır, platforma özü GRANT etmir.' };
      const id = `DQR-${1054 + S.dqRuns.filter(x => +x.id.slice(4) >= 1054).length}`; S.dqRuns.push(Object.assign({ id, bind: b.id, at: now() }, r));
      log(`DQ run: ${r.result}`, id, `${b.id}${r.den ? `, ${pcs(pc(r.pass, r.den))}` : ''}`);
      if (r.result === 'PASS' && iss && iss.status === 'FIX_CLAIMED') { iss.status = 'CLOSED'; iss.closedBy = id; log('Problem bağlandı', iss.id, `Sübut: ${id} PASS`, { actor: 'sistem', role: 'DQ mühərriki' }); }
      render(); toast(`${id}: ${r.result}${iss && iss.status === 'CLOSED' ? `, ${iss.id} bağlandı` : ''}`);
    },
    claimFix(d) { const i = S.issues.find(x => x.id === d.id); const note = val('fixnote') || 'Mənbə sahibi düzəlişi təsdiqlədi'; i.status = 'FIX_CLAIMED'; i.fixNote = note; log('Problem: düzəliş qeyd olundu', i.id, note, { actor: i.assignee }); render(); toast('Qeyd olundu. Bağlanma üçün təkrar run lazımdır.'); },
    exportAudit() {
      const head = ['at', 'actor', 'role', 'action', 'obj', 'detail'];
      const csv = [head.join(',')].concat(S.audit.map(a => head.map(k => `"${String(a[k]).replace(/"/g, '""')}"`).join(','))).join('\n');
      const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'dg-hub-audit.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      log('Audit jurnalı ixrac edildi', 'AUDIT', `${S.audit.length} qeyd`); render();
    },
  };

  /* ================= events ================= */
  document.addEventListener('click', e => {
    if (e.target.id === 'scrim') { closeDrawer(); return; }
    if (e.target.id === 'palscrim') { palClose(); return; }
    const po = e.target.closest('[data-pal]'); if (po) { palPick(+po.dataset.pal); return; }
    const g = e.target.closest('[data-go]'); if (g && !e.metaKey && !e.ctrlKey) { e.preventDefault(); go(g.dataset.go, g.dataset.id, g.dataset.tab); return; }
    const a = e.target.closest('[data-act]'); if (a && !a.disabled) { e.preventDefault(); if (ACT[a.dataset.act]) ACT[a.dataset.act](a.dataset, a); }
  });
  document.addEventListener('change', e => { const c = e.target.closest('[data-change]'); if (c && ACT[c.dataset.change]) ACT[c.dataset.change](c.dataset, c); });
  document.addEventListener('input', e => {
    if (e.target.id === 'palin') { PAL.q = e.target.value; PAL.i = 0; renderPalette(); return; }
    const c = e.target.closest('[data-input]'); if (c && ACT[c.dataset.input]) ACT[c.dataset.input](c.dataset, c);
  });
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (PAL.open) palClose(); else palOpen('go'); return; }
    if (PAL.open) {
      if (e.key === 'Escape') { palClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); PAL.i = Math.min(PAL.items.length - 1, PAL.i + 1); renderPalette(); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); PAL.i = Math.max(0, PAL.i - 1); renderPalette(); return; }
      if (e.key === 'Enter') { e.preventDefault(); palPick(PAL.i); return; }
      return;
    }
    if (e.key === 'Escape' && S.drawer) { closeDrawer(); return; }
    if (e.key === 'Escape' && LG.mounted && LG.sel) { lgSelect(null); return; }
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); palOpen('go'); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-act]:not(button):not(input):not(select):not(textarea)')) { e.preventDefault(); e.target.click(); }
  });
  window.addEventListener('popstate', () => { parseHash(); S.drawer = null; render(); });
  window.addEventListener('hashchange', () => { const before = JSON.stringify(S.route); parseHash(); if (JSON.stringify(S.route) !== before) render(); });

  /* ================= init ================= */
  try { const th = localStorage.getItem('dghub-theme'); if (th) document.documentElement.dataset.theme = th; } catch (e) { /* ignore */ }
  load(); if (!S.lg) S.lg = { focal: 'R-101', up: 4, down: 2, view: 'graph', layer: 'none', dir: 'down' };
  if (location.hash) parseHash(); else S.route = S.route || { p: 'home' };
  S.scans.filter(x => x.status === 'RUNNING').forEach(x => { if (!/yenidən açıldı/.test(x.note || '')) x.note = (x.note || '') + ' Səhifə yenidən açıldı: iş qaldığı yerdən davam edir, təkrar dərc olunmur.'; });
  render();
  setInterval(tickScans, 900);
  window.__dg = { get S() { return S; }, LG, ACT, render, certified, cdeChecks, lgSelect, go };
})();
