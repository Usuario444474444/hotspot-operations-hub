let allTickets = [],
    internetTickets = [],
    currentList = [],
    selected = '';
let historyExpanded = false;
let filtroFolios = 'activos';
let filtroTickets = 'todos';
const G = 'V-SIX-MX-SSO-AHS-BCS-SIX BLOCK NETWORKS_INTERNET';
const $ = i => document.getElementById(i);
const sap = t => ((t.short_description || '').match(/(\d{8,10})/) || [])[1] || '';
const ageHours = d => Math.floor((Date.now() - new Date(d)) / 3600000);
const age = d => {
    const h = ageHours(d);
    return h < 24 ? `${h}h` : `${Math.floor(h/24)}d`
};
const store = t =>
    t.caller_id?.display_value ||
    'Sucursal';


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
function toggleSidebar(){

    const sidebar =
        document.querySelector(
            '.sidebar-v040'
        );

    const btn =
        document.getElementById(
            'collapseBtn'
        );

    sidebar.classList.toggle(
        'sidebar-collapsed'
    );

    const collapsed =
        sidebar.classList.contains(
            'sidebar-collapsed'
        );

    btn.innerHTML =
        collapsed
            ? '→'
            : '← Colapsar';

}
function toggleAdvancedFilters(){

    const panel =
        document.getElementById(
            'advancedFilters'
        );

    panel.style.display =
        panel.style.display === 'none'
            ? 'flex'
            : 'none';

}
function applyAdvancedFilters(){

    let filtered =
        [...internetTickets];

    const estados =
        [...document.querySelectorAll(
            '.chip-active[data-filter]'
        )]
        .map(x => x.dataset.filter);

    const strikes =
        [...document.querySelectorAll(
            '.chip-active[data-strike]'
        )]
        .map(x =>
            Number(x.dataset.strike)
        );

    const responsables =
        [...document.querySelectorAll(
            '.chip-active[data-responsable]'
        )]
        .map(x =>
            x.dataset.responsable
        );

    if(estados.length){

        filtered =
            filtered.filter(t => {

                const s =
                    String(t.state || '')
                    .toLowerCase();

                return estados.some(
                    e => s.includes(e)
                );

            });

    }

    if(strikes.length){

        filtered =
            filtered.filter(t =>

                strikes.includes(
                    strike(
                        ageHours(
                            t.sys_created_on
                        )
                    )
                )

            );

    }

    if(responsables.length){

        filtered =
            filtered.filter(t => {

                const responsable =
                    t.assigned_to?.display_value ||
                    'SIN_ASIGNAR';

                return responsables.includes(
                    responsable
                );

            });

    }

    currentList = filtered;

    render(currentList);

}
function clearAdvancedFilters(){

    document
        .querySelectorAll('.chip')
        .forEach(chip => {

            chip.classList.remove(
                'chip-active'
            );

        });

    filtroTickets = 'todos';

    currentList = internetTickets;

    render(internetTickets);
    buildResponsablesFilters();

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
    currentList = internetTickets;
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

    //renderKpis();
    render(internetTickets);
}



function stateBadge(s = '') {
    const v = s.toLowerCase();
    let c = 'course';
    if (v.includes('espera')) c = 'wait';
    if (v.includes('resuelto')) c = 'res';
    return `<span class="badge ${c}">${s}</span>`
}

function render(list) {

    if (filtroTickets === 'activos') {

        list = list.filter(t => {

            const s =
                String(t.state || '')
                .toLowerCase();

            return !(
                s.includes('resuelto') ||
                s.includes('cerrado') ||
                s.includes('cancelado')
            );

        });

    }
    const btnTodos =
    document.getElementById('btnTodos');

const btnActivos =
    document.getElementById('btnActivos');

const btnResueltos =
    document.getElementById('btnResueltos');

btnTodos?.classList.remove('active');
btnActivos?.classList.remove('active');
btnResueltos?.classList.remove('active');

if (filtroTickets === 'todos') {
    btnTodos?.classList.add('active');
}

if (filtroTickets === 'activos') {
    btnActivos?.classList.add('active');
}

if (filtroTickets === 'resueltos') {
    btnResueltos?.classList.add('active');
}

    if (filtroTickets === 'resueltos') {

        list = list.filter(t => {

            const s =
                String(t.state || '')
                .toLowerCase();

            return (
                s.includes('resuelto') ||
                s.includes('cerrado') ||
                s.includes('cancelado')
            );

        });

    }

    const ticketsContainer =
        document.getElementById(
            'ticketsContainer'
        );

    if (!ticketsContainer)
        return;

    ticketsContainer.innerHTML =
    list.map(t => {

        const estado =
            String(t.state || '')
            .toLowerCase();

        let colorClass = 'dot-blue';
        let stateClass = 'state-blue';
        let strikeClass = 'strike-blue';

        if (estado.includes('resuelto')) {

            colorClass = 'dot-green';
            stateClass = 'state-green';
            strikeClass = 'strike-green';

        }
        else if (
            estado.includes('cerrado') ||
            estado.includes('cancelado')
        ) {

            colorClass = 'dot-red';
            stateClass = 'state-red';
            strikeClass = 'strike-red';

        }
        else if (
            estado.includes('espera')
        ) {

            colorClass = 'dot-orange';
            stateClass = 'state-orange';
            strikeClass = 'strike-orange';

        }

        const nombreAgente =
            t.assigned_to?.display_value || '';

        const iniciales =
            nombreAgente
                ? nombreAgente
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(x => x[0])
                    .join('')
                    .toUpperCase()
                : '';
        const avatarColors = [
    'avatar-purple',
    'avatar-indigo',
    'avatar-rose',
    'avatar-cyan',
    'avatar-slate',
    'avatar-teal'
];

const avatarClass =
    iniciales
        ? avatarColors[
            iniciales.charCodeAt(0) %
            avatarColors.length
          ]
        : '';

        return `

            <div
                class="ticket ${selected===t.number ? 'active' : ''}"
                onclick="showDetail('${t.number}')">

                <div class="ticket-line1">

                    <div class="ticket-inc-wrapper">

                        <span class="ticket-dot ${colorClass}"></span>

                        <span class="ticket-inc">
                            ${t.number}
                        </span>

                    </div>

                    <span class="ticket-time">
                        ${age(t.sys_created_on)}
                    </span>

                </div>

                <div class="ticket-line2">

                    <span class="ticket-sap">
                        ${sap(t)}
                    </span>

                    <span class="ticket-store">
                        ${store(t)}
                    </span>

                    ${
                        nombreAgente
                        ? `
                        <span class="ticket-avatar ${avatarClass}">
    ${iniciales}
</span>
                        `
                        : ''
                    }

                </div>

                <div class="ticket-line3">

                    <span class="ticket-state ${stateClass}">
                        ${t.state || ''}
                    </span>

                    <span class="ticket-strike ${strikeClass}">
                        Strike ${strike(
                            ageHours(
                                t.sys_created_on
                            )
                        )}
                    </span>

                </div>

            </div>

        `;

    }).join('');

}
function buildResponsablesFilters() {

    const container =
        document.getElementById(
            'responsablesFilters'
        );

    if (!container)
        return;

    const responsables =
        [...new Set(
            internetTickets
                .map(t =>
                    t.assigned_to?.display_value
                )
                .filter(Boolean)
        )];

    container.innerHTML =
        responsables.map(nombre => `

            <button
                class="chip responsable-chip"
                data-responsable="${nombre}"
                onclick="
                    this.classList.toggle('chip-active')
                ">

                ${nombre}

            </button>

        `).join('') +

        `

        <button
            class="chip responsable-chip"
            data-responsable="SIN_ASIGNAR"
            onclick="
                this.classList.toggle('chip-active')
            ">

            Sin asignar

        </button>

        `;
}
function showDetail(n) {

    selected = n;

    render(currentList);

    const t = internetTickets.find(
        x => x.number === n
    );

    if (!t) return;

    const cs = sap(t);
    const related = internetTickets.filter(
    x =>
        sap(x) === cs &&
        x.number !== t.number
);

const active = related.filter(x => {

    const s =
        String(x.state || '')
        .toLowerCase();

    return (
        s.includes('abierto') ||
        s.includes('espera') ||
        s.includes('curso') ||
        s.includes('asignado') ||
        s.includes('pendiente')
    );

});

const hist = related.filter(x => {

    const s =
        String(x.state || '')
        .toLowerCase();

    return (
        s.includes('resuelto') ||
        s.includes('cerrado') ||
        s.includes('cancelado')
    );

});

const fmt = v =>
    v
        ? new Date(v)
            .toLocaleDateString('es-MX')
        : '';

const recurrencia =
    hist.length >= 11
        ? '🔴 Alta'
        : hist.length >= 4
            ? '🟡 Media'
            : '🟢 Baja';

const ultimoHistorico =
    hist.length > 0
        ? fmt(hist[0].sys_created_on)
        : 'Sin historial';

    const h = ageHours(
        t.sys_created_on
    );

    $('infoPanel').innerHTML = `

    <h2>Información del Ticket</h2>

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
    <hr>

<h3>Resumen SAP</h3>

<p>
    <b>Duplicados activos:</b>
    ${active.length}
</p>

<p>
    <b>Históricos:</b>
    ${hist.length}
</p>

<p>
    <b>Último ticket:</b>
    ${ultimoHistorico}
</p>

<p>
    <b>Recurrencia:</b>
    ${recurrencia}
</p>

    <hr>

    <h3>Duplicados Activos</h3>

    <p>
        🔴 ${active.length}
    </p>

    ${
        active.length > 0
        ? active.map(x => `
            <div class="dup-row">

                <span>${x.number}</span>

                <span>
                    ${x.state || ''}
                </span>

            </div>
        `).join('')
        : `
            <div class="empty-dup">
                ✅ Sin duplicados
            </div>
        `
    }

    <hr>

    <h3>Histórico SAP</h3>

    <p>
        📚 ${hist.length}
    </p>

    <p>
        Último:
        ${ultimoHistorico}
    </p>

    <p>
        ${recurrencia}
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

<div class="timeline">

    <div class="timeline-event">

        <div class="timeline-icon">
            📥
        </div>

        <div class="timeline-content">

            <div class="timeline-title">
                Ticket creado
            </div>

            <div class="timeline-subtitle">
                ${age(t.sys_created_on)} atrás
            </div>

        </div>

    </div>

    <div class="timeline-event">

        <div class="timeline-icon">
            👤
        </div>

        <div class="timeline-content">

            <div class="timeline-title">
                Ticket asignado
            </div>

            <div class="timeline-subtitle">
                ${
                    t.assigned_to?.display_value ||
                    'Sin asignar'
                }
            </div>

        </div>

    </div>

    <div class="timeline-event">

        <div class="timeline-icon">
            ⚠️
        </div>

        <div class="timeline-content">

            <div class="timeline-title">
                Strike ${strike(h)}
            </div>

            <div class="timeline-subtitle">
                Seguimiento operativo
            </div>

        </div>

    </div>

    <div class="timeline-event">

        <div class="timeline-icon">
            🟡
        </div>

        <div class="timeline-content">

            <div class="timeline-title">
                Estado actual
            </div>

            <div class="timeline-subtitle">
                ${t.state || ''}
            </div>

        </div>

    </div>

</div>

    `;

}

function applyFilters() {

    const raw =
        $('searchBox')
        .value
        .toLowerCase()
        .trim();

    if (!raw) {

        currentList = internetTickets;

        render(currentList);

        return;

    }

    const terms = raw
        .split(',')
        .map(x => x.trim())
        .filter(Boolean);

    currentList = internetTickets.filter(t => {

        const numero =
            (t.number || '')
            .toLowerCase();

        const descripcion =
            (t.short_description || '')
            .toLowerCase();

        const ticketSap =
            sap(t).toLowerCase();

        return terms.some(term =>

            numero === term ||

            ticketSap === term ||

            descripcion.includes(term)

        );

    });

    render(currentList);

}
window.addEventListener('DOMContentLoaded', loadTickets);