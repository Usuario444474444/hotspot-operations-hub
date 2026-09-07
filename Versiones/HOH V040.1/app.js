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

    if (selected) {
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

    const t = internetTickets.find(
        x => x.number === n
    );

    if (!t) return;

    const cs = sap(t);

    const h = ageHours(
        t.sys_created_on
    );

    $('infoPanel').innerHTML = `

        <h3>Información del Ticket</h3>

        <p>
            <b>Estado:</b>
            ${t.state || '-'}
        </p>

        <p>
            <b>Asignado:</b>
            ${
                t.assigned_to?.display_value ||
                'Sin asignar'
            }
        </p>

        <p>
            <b>Grupo:</b>
            ${
                t.assignment_group?.display_value ||
                '-'
            }
        </p>

        <p>
            <b>SLA:</b>
            ${sla(h)[0]}
        </p>

        <p>
            <b>Strike:</b>
            ${strike(h)}
        </p>

        <p>
            <b>Edad:</b>
            ${age(t.sys_created_on)}
        </p>

        <p>
            <b>SAP:</b>
            ${cs}
        </p>

    `;

    $('detailContent').innerHTML = `

        <div class="ticket-header">

            <div class="ticket-number">
                ${t.number}
            </div>

            <div class="ticket-meta">

                <span class="ticket-status">
                    ${t.state || ''}
                </span>

                <span>
                    SAP ${cs}
                </span>

            </div>

        </div>

        <div class="conversation-card">

            <h3>
                ${store(t)}
            </h3>

            <div class="conversation-subtitle">

                SAP ${cs}

                <button
                    class="mini-btn"
                    onclick="copyText('${cs}')">

                    ⧉

                </button>

            </div>

            <p class="conversation-description">

                ${t.short_description || ''}

            </p>

        </div>

        <div class="ticket-summary">

            <h3>Próxima acción</h3>

            <div style="
                display:flex;
                flex-wrap:wrap;
                gap:8px;
                margin-top:12px;
            ">

                <button class="action-btn">
                    ✅ Resolver
                </button>

                <button class="action-btn">
                    📦 Vendor
                </button>

                <button class="action-btn">
                    🚚 On Site
                </button>

                <button class="action-btn">
                    ⚙ OSS
                </button>

            </div>

        </div>

        <h3>Seguimiento</h3>

        <div class="activity-item">
            📥 Ticket creado
        </div>

        <div class="activity-item">
            👤 Asignado
        </div>

        <div class="activity-item">
            ⚙ Estado actual:
            ${t.state || ''}
        </div>

        <div class="activity-item">
            📍 SAP ${cs}
        </div>

        <div class="activity-item">
            ⚠ Strike ${strike(h)}
        </div>

    `;

}

function applyFilters() {
    const q = $('searchBox').value.toLowerCase();
    render(internetTickets.filter(t => !q || (t.number || '').toLowerCase().includes(q) || (t.short_description || '').toLowerCase().includes(q) || sap(t).includes(q)))
}
window.addEventListener('DOMContentLoaded', loadTickets);