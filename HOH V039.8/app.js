let allTickets = [],
    internetTickets = [],
    selected = '';
let historyExpanded = false;
let filtroFolios = 'activos';
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

function showOperacion() {

    document
        .getElementById('tabOperacion')
        .classList
        .add('active-tab');

    document
        .getElementById('tabFolios')
        .classList
        .remove('active-tab');

    render(internetTickets);

    if(selected){
        showDetail(selected);
    }

}

async function showFolios() {

    document
        .getElementById('tabFolios')
        .classList
        .add('active-tab');

    document
        .getElementById('tabOperacion')
        .classList
        .remove('active-tab');

    const folios =
        await loadFolios();

    const activos =
        folios.filter(
            f => f.activo === true
        );

    const historicos =
        folios.filter(
            f => f.activo === false
        );
        let foliosFiltrados = folios;

if (filtroFolios === 'activos') {

    foliosFiltrados = activos;

}

if (filtroFolios === 'historicos') {

    foliosFiltrados = historicos;

}

    document
        .getElementById('feed')
        .innerHTML = ativosFirst(foliosFiltrados);

    document
        .getElementById('detailContent')
        .innerHTML = `

            <h3>Control de Folios</h3>

            <p>
                📂 Total:
                ${folios.length}
            </p>

            <div style="margin-bottom:12px;">

<button onclick="
filtroFolios='todos';
showFolios();
">
📂 Todos
</button>

<button onclick="
filtroFolios='activos';
showFolios();
">
🟢 Activos
</button>

<button onclick="
filtroFolios='historicos';
showFolios();
">
⚪ Históricos
</button>

</div>

        `;

}
async function loadFolios() {

    const r =
        await fetch('/api/control-folios');

    const folios =
        await r.json();

    return folios;

}

function ativosFirst(folios) {

    return folios
        .sort((a, b) => {

            if (a.activo && !b.activo)
                return -1;

            if (!a.activo && b.activo)
                return 1;

            return new Date(
                b.sys_created_on
            ) - new Date(
                a.sys_created_on
            );

        })
        .slice(0, 50)
        .map(f => `

            <div class="ticket">

                <b>${f.number}</b>

                <div>
                    SAP ${f.sap}
                </div>

                <small>
                    ${
                        f.activo
                        ? '🟢 Activo'
                        : '⚪ Histórico'
                    }
                    ·
                    ${f.estado}
                </small>

  <div>
    ${f.grupo}
</div>

<div style="font-size:12px;color:#64748b;">
    👤 ${f.asignado || 'Sin asignar'}
</div>

<div style="font-size:12px;color:#94a3b8;">
    🕒 ${
        f.sys_updated_on
            ? new Date(
                f.sys_updated_on
              ).toLocaleDateString('es-MX')
            : '-'
    }
</div>

<div style="font-size:12px;color:#64748b;">
    👤 ${f.asignado || 'Sin asignar'}
</div>

            </div>

        `)
        .join('');

}
async function loadTickets() {
    const r = await fetch('/api/hotspot');
    const d = await r.json();
    allTickets = d.result || [];
    await fetch('/api/control-folios/sync', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(allTickets)
    });
    internetTickets = allTickets;
    internetTickets.sort((a, b) => {

        const abiertos = [
      'nuevo',
      'en espera',
      'en curso',
      'asignado'
    ];

        const aActivo =
            abiertos.some(x =>
                String(a.state || '')
                .toLowerCase()
                .includes(x)
            );

        const bActivo =
            abiertos.some(x =>
                String(b.state || '')
                .toLowerCase()
                .includes(x)
            );

        if (aActivo && !bActivo) return -1;
        if (!aActivo && bActivo) return 1;

        return new Date(b.sys_created_on) -
            new Date(a.sys_created_on);

    });

    renderKpis();
    render(internetTickets);
}

function renderKpis() {

    const masReciente =
        internetTickets.length ?
        new Date(
            internetTickets[0].sys_created_on
        ).toLocaleDateString('es-MX') :
        '-';

    const masAntiguo =
        internetTickets.length ?
        new Date(
            internetTickets[
                internetTickets.length - 1
            ].sys_created_on
        ).toLocaleDateString('es-MX') :
        '-';

    const abiertos =
        internetTickets.filter(t => {
            const s = String(
                t.state || ''
            ).toLowerCase();

            return (
                s.includes('abierto') ||
                s.includes('espera') ||
                s.includes('curso')
            );
        }).length;

    const resueltos =
        internetTickets.filter(t => {
            const s =
                String(t.state || '')
                .toLowerCase();

            return (
                s.includes('resuelto') ||
                s.includes('cerrado')
            );
        }).length;

    $('kpis').innerHTML = `

        <div class="kpi">
            <b>${internetTickets.length}</b>
            <div>Tickets</div>
        </div>

        <div class="kpi">
            <b>${abiertos}</b>
            <div>Activos</div>
        </div>

        <div class="kpi">
            <b>${resueltos}</b>
            <div>Resueltos</div>
        </div>

        <div class="kpi">
            <b>${masReciente}</b>
            <div>Más reciente</div>
        </div>

        <div class="kpi">
            <b>${masAntiguo}</b>
            <div>Más antiguo</div>
        </div>

    `;
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
        hist.length >= 11 ?
        "🔴 Alta" :
        hist.length >= 4 ?
        "🟡 Media" :
        "🟢 Baja";

    const ultimoHistorico =
        hist.length > 0 ?
        fmt(hist[0].sys_created_on) :
        'Sin historial';
    const h = ageHours(t.sys_created_on);
    $('detailContent').innerHTML = `
<h2>${t.number}</h2>

${stateBadge(t.state || '')}

<b>SAP:</b> ${cs}

<button
    class="mini-btn"
    onclick="copyText('${cs}')"
    title="Copiar SAP">
    ⧉
</button>

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

<b>INC:</b> ${t.number}

<button
    class="mini-btn"
    onclick="copyText('${t.number}')"
    title="Copiar INC">
    ⧉
</button>

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
    <h3>Actividad</h3><div class='activity-item'>● Ticket creado</div><div class='activity-item'>● Asignado</div><div class='activity-item'>● Estado actual: ${t.state||''}</div><div class='activity-item'>● SAP ${cs}</div><div class='activity-item'>● Strike ${strike(h)}</div>`
}

function applyFilters() {
    const q = $('searchBox').value.toLowerCase();
    render(internetTickets.filter(t => !q || (t.number || '').toLowerCase().includes(q) || (t.short_description || '').toLowerCase().includes(q) || sap(t).includes(q)))
}
window.addEventListener('DOMContentLoaded', loadTickets);