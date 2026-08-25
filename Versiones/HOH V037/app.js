let allTickets = [],
    internetTickets = [],
    selected = '';
historyExpanded = false;
const G = 'V-SIX-MX-SSO-AHS-BCS-SIX BLOCK NETWORKS_INTERNET';
const $ = i => document.getElementById(i);
const sap = t => ((t.short_description || '').match(/(\d{8,10})/) || [])[1] || '';
const ageHours = d => Math.floor((Date.now() - new Date(d)) / 3600000);
const age = d => {
    const h = ageHours(d);
    return h < 24 ? `${h}h` : `${Math.floor(h/24)}d`
};
const store = t => ((t.short_description || '').match(/SIX\s([^\.\-]+)/i) || ['Sucursal'])[0];

function strike(h) {
    if (h < 24) return 0;
    if (h < 48) return 1;
    if (h < 72) return 2;
    return 3
}

function sla(h) {
    if (h < 24) return ['🟢 Dentro SLA'];
    if (h < 48) return ['🟡 Riesgo SLA'];
    return ['🔴 SLA vencido']
}

function copyText(v) {
    navigator.clipboard.writeText(v)
}

function toggleHistory() {
    historyExpanded = !historyExpanded;

    if (selected) {
        showDetail(selected);
    }
}
async function loadTickets() {
    const r = await fetch('/api/hotspot');
    const d = await r.json();
    allTickets = d.result || [];
    internetTickets = allTickets.filter(t => t.assignment_group?.display_value === G);
    renderKpis();
    render(internetTickets)
}

function renderKpis() {
    $('kpis').innerHTML = `<div class="kpi"><b>${internetTickets.length}</b><div>Tickets</div></div>`
}

function stateBadge(s = '') {
    const v = s.toLowerCase();
    let c = 'course';
    if (v.includes('espera')) c = 'wait';
    if (v.includes('resuelto')) c = 'res';
    return `<span class="badge ${c}">${s}</span>`
}

function render(list) {
    $('feed').innerHTML = list.map(t => `<div class="ticket ${selected===t.number?'active':''}" onclick="showDetail('${t.number}')"><b>${store(t)}</b><div>${t.number}</div><small>SAP ${sap(t)} | ${age(t.sys_created_on)}</small><div>${stateBadge(t.state||'')}</div></div>`).join('')
}

function showDetail(n) {
    selected = n;
    render(internetTickets);
    const t = internetTickets.find(x => x.number === n);
    if (!t) return;
    const cs = sap(t);
    const related = internetTickets.filter(x => sap(x) === cs && x.number !== t.number);
    const active = related.filter(x => {
        const s = String(x.state || '').toLowerCase();
        return s.includes('abierto') || s.includes('espera') || s.includes('curso') || s.includes('asignado') || s.includes('pendiente')
    });
    const hist = related.filter(x => {
        const s = String(x.state || '').toLowerCase();
        return s.includes('resuelto') || s.includes('cerrado') || s.includes('cancelado')
    });
    const fmt = v => v ? new Date(v).toLocaleDateString('es-MX') : '';
    const recurrencia =
    hist.length >= 11
        ? "🔴 Alta"
        : hist.length >= 4
            ? "🟡 Media"
            : "🟢 Baja";

    const ultimoHistorico =
    hist.length > 0
        ? fmt(hist[0].sys_created_on)
        : 'Sin historial';
    const h = ageHours(t.sys_created_on);
    $('detailContent').innerHTML = `
<h2>${t.number}</h2>

${stateBadge(t.state || '')}

<p>
    <b>SAP:</b> ${cs}
    <button class='action-btn'
        onclick="copyText('${cs}')">
        📋 Copiar SAP
    </button>
</p>

<div class="sap-center">

    <h3>SAP CENTER</h3>

    <div>
        <b>SAP:</b> ${cs}
    </div>

    <div>
        🔴 Activos: ${active.length}
    </div>

    <div>
        📚 Históricos: ${hist.length}
    </div>

    <div>
        🕒 Último ticket: ${ultimoHistorico}
    </div>

    <div>
        ${recurrencia}
    </div>

</div>

<p>
    <b>INC:</b> ${t.number}
    <button class='action-btn'
        onclick="copyText('${t.number}')">
        📋 Copiar INC
    </button>
</p>

<p>
    <b>Edad:</b> ${age(t.sys_created_on)}
</p>

<p class='strike${strike(h)}'>
    <b>Strike ${strike(h)}</b>
</p>

<p>
    <b>${sla(h)[0]}</b>
</p>

<h3>Duplicados Activos (${active.length})</h3>

${
active.length
? active.map(x => `
<div class='dup-row'>
    <span>
        ${String(x.state || '').toLowerCase().includes('espera')
            ? '🟡'
            : '🔴'}
    </span>

    <span>${x.state || ''}</span>

    <span>${x.number}</span>

    <span>${fmt(x.sys_created_on)}</span>

</div>
`).join('')
: `
<div class="empty-dup">
✅ Sin duplicados activos
</div>
`
}

<h3>Histórico SAP (${hist.length})</h3>

${
hist.length > 0
? `
<div class="history-summary">

    <small>
        Último ticket:
        ${fmt(hist[0].sys_created_on)}
    </small>

    <div
        id="historyToggle"
        class="history-toggle"
        onclick="toggleHistory()"
    >
        ${
            historyExpanded
                ? '▼ Ocultar tickets'
                : '▶ Ver tickets'
        }
    </div>

</div>

${
historyExpanded
? hist.map(x => `
<div class="history-row">

    <span>✅</span>

    <span>${x.state || ''}</span>

    <span>${x.number}</span>

    <span>${fmt(x.sys_created_on)}</span>

</div>
`).join('')
: ''
}
`
: `
<div class="empty-dup">
Sin historial
</div>
`
}
<h3>Timeline</h3><div class='timeline-item'>Ticket creado</div><div class='timeline-item'>Asignado</div><div class='timeline-item'>Estado actual: ${t.state||''}</div>`
}

function applyFilters() {
    const q = $('searchBox').value.toLowerCase();
    render(internetTickets.filter(t => !q || (t.number || '').toLowerCase().includes(q) || (t.short_description || '').toLowerCase().includes(q) || sap(t).includes(q)))
}
window.addEventListener('DOMContentLoaded', loadTickets);