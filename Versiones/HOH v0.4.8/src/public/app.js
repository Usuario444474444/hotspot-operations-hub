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

function toggleSidebar() {

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
        collapsed ?
        '→' :
        '← Colapsar';

}

function toggleAdvancedFilters() {

    const panel =
        document.getElementById(
            'advancedFilters'
        );

    panel.style.display =
        panel.style.display === 'none' ?
        'flex' :
        'none';

}

function applyAdvancedFilters() {

    let filtered = [...internetTickets];

    const estados = [...document.querySelectorAll(
            '.chip-active[data-filter]'
        )]
        .map(x => x.dataset.filter);

    const strikes = [...document.querySelectorAll(
            '.chip-active[data-strike]'
        )]
        .map(x =>
            Number(x.dataset.strike)
        );

    const responsables = [...document.querySelectorAll(
            '.chip-active[data-responsable]'
        )]
        .map(x =>
            x.dataset.responsable
        );

    if (estados.length) {

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

    if (strikes.length) {

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

    if (responsables.length) {

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

function clearAdvancedFilters() {

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

    render(internetTickets);

    if (selected) {
        showDetail(selected);
    }

}

function setActiveMenu(menu) {

    document
        .getElementById('menuTickets')
        ?.classList.remove('active');

    document
        .getElementById('menuFolios')
        ?.classList.remove('active');

    document
        .getElementById(menu)
        ?.classList.add('active');
}

function showTicketsView() {

    setActiveMenu(
        'menuTickets'
    );

    currentList = internetTickets;

    render(internetTickets);

    document.getElementById(
            'detailContent'
        ).innerHTML =
        'Seleccione un ticket';

    document.getElementById(
        'infoPanel'
    ).innerHTML = `
        <h3>Información</h3>
        <p>Seleccione un ticket</p>
    `;

}

function showFoliosView() {

    setActiveMenu(
        'menuFolios'
    );

    currentList = [];

    showFolios();

}
async function showFolios() {

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
    const hotspot =
        folios.filter(
            f => f.tipo === 'HOTSPOT'
        );
    const strikes =
        folios.filter(
            f =>
            detectResultado(f) === '🔒 Strike'
        );

    const duplicados =
        folios.filter(
            f =>
            detectResultado(f) === '🔁 Duplicado'
        );

    let foliosFiltrados = folios;
    if (
        filtroFolios === 'vendor'
    ) {
        foliosFiltrados =
            folios.filter(
                f =>
                detectResultado(f) ===
                '📦 Vendor'
            );
    }

    if (
        filtroFolios === 'oss'
    ) {
        foliosFiltrados =
            folios.filter(
                f =>
                detectResultado(f) ===
                '⚙️ OSS'
            );
    }

    if (
        filtroFolios === 'onsite'
    ) {
        foliosFiltrados =
            folios.filter(
                f =>
                detectResultado(f) ===
                '🚚 On Site'
            );
    }

    if (
        filtroFolios === 'strike'
    ) {
        foliosFiltrados =
            folios.filter(
                f =>
                detectResultado(f) ===
                '🔒 Strike'
            );
    }

    if (
        filtroFolios === 'duplicado'
    ) {
        foliosFiltrados =
            folios.filter(
                f =>
                detectResultado(f) ===
                '🔁 Duplicado'
            );
    }
    if (
        filtroFolios === 'hotspot'
    ) {

        foliosFiltrados =
            folios.filter(
                f => f.tipo === 'HOTSPOT'
            );

    }


    if (filtroFolios === 'activos') {

        foliosFiltrados = activos;

    }

    if (filtroFolios === 'historicos') {

        foliosFiltrados = historicos;

    }
    currentList = foliosFiltrados;

    document
        .getElementById('ticketsContainer')
        .innerHTML = ativosFirst(foliosFiltrados);

    document
        .getElementById('detailContent')
        .innerHTML = `
        

            <h3>Control de Folios</h3>
            <button
    onclick="loadHistoricalFolios()"
    style="
        margin-bottom:12px;
    "
>
    🔄 Cargar Histórico 2026
</button> 

            <p>
                📂 Total:
                ${folios.length}
            </p>
            <p>
    🔒 Strike:
    ${strikes.length}
</p>

<p>
    🔁 Duplicados:
    ${duplicados.length}
</p>

<p>
    🔥 Hotspot:
    ${hotspot.length}
</p>


            <div style="margin-bottom:12px;">

<button onclick="
filtroFolios='todos';
showFolios();
">
📂 Todos
</button>
<button onclick="
filtroFolios='hotspot';
showFolios();
">
🔥 Hotspot
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
<!--
</button>
<button onclick="
filtroFolios='vendor';
showFolios();
">
📦 Vendor
</button>

<button onclick="
filtroFolios='oss';
showFolios();
">
⚙️ OSS
</button>

<button onclick="
filtroFolios='onsite';
showFolios();
">
🚚 On Site
</button>
-->
<button onclick="
filtroFolios='strike';
showFolios();
">
🔒 Strike
</button>

<button onclick="
filtroFolios='duplicado';
showFolios();
">
🔁 Duplicado
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
async function loadHistoricalFolios() {

    try {

        const r =
            await fetch(
                '/api/control-folios/load-history', {
                    method: 'POST'
                }
            );

        const d =
            await r.json();

        alert(
            `Histórico cargado: ${d.registros}`
        );

        showFolios();

    } catch (e) {

        alert(
            'Error cargando histórico'
        );

    }

}

function detectProblema(f) {

    const txt = `
    ${f.short_description || ''}
    ${f.description || ''}
`.toUpperCase();

    if (
        txt.includes('INTERMITENCIA') ||
        txt.includes('LENTITUD')
    ) {
        return '📶 Intermitencia';
    }

    if (
        txt.includes('ERROR SIN ENLACE')
    ) {
        return '🔌 Sin Enlace';
    }

    if (
        txt.includes('NO ENCIENDE')
    ) {
        return '⚡ No Enciende';
    }

    if (
        txt.includes('REPOSICION')
    ) {
        return '📦 Reposición';
    }

    if (
        txt.includes('ROBO')
    ) {
        return '🚨 Robo';
    }

    if (
        txt.includes('DAÑADO') ||
        txt.includes('DANADO')
    ) {
        return '📡 Hotspot Dañado';
    }

    if (
        txt.includes('SIN INTERNET') ||
        txt.includes('SIN CONEXION') ||
        txt.includes('SIN CONEXIÓN') ||
        txt.includes('SIN ACCESO A INTERNET')
    ) {
        return '🌐 Sin Internet';
    }

    return '🌐 Internet';

}

function detectResultado(f) {

    const estado =
        String(f.estado || '')
        .toUpperCase();

    const notes =
        String(f.close_notes || '')
        .toUpperCase();

    const grupo =
        String(f.grupo || '')
        .toUpperCase();

    if (
        notes.includes('DUPLICADO')
    ) {
        return '🔁 Duplicado';
    }

    if (
        notes.includes('STRIKE')
    ) {
        return '🔒 Strike';
    }

    if (
        grupo.includes(
            'VENDOR MGNT SUPPORT'
        )
    ) {
        return '📦 Vendor';
    }

    if (
        grupo.includes(
            'ON SITE SUPPORT'
        )
    ) {
        return '🚚 On Site';
    }

    if (
        grupo.includes('OSS')
    ) {
        return '⚙️ OSS';
    }

    if (
        estado.includes('RESUELTO') ||
        estado.includes('RESOLVED')
    ) {
        return '✅ Resuelto';
    }

    if (
        estado.includes('CERRADO') ||
        estado.includes('CLOSED')
    ) {
        return '⚫ Cerrado';
    }

    return '🟢 Activo';

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
        .slice(0, 200)
        .map(f => `

            <div
                class="ticket"
                onclick="showFolioTicket('${f.number}')"
            >

                <b>${f.number}</b>

                <div style="
                    color:#2563eb;
                    font-size:11px;
                    font-weight:700;
                ">
                    ${detectProblema(f)}
                </div>
                <div>
                    SAP ${f.sap || '-'}
                </div>

                <small>
                    ${
                        f.activo
                        ? '🟢 Activo'
                        : '⚪ Histórico'
                    }
                    ·
                    ${f.estado || ''}
                </small>

                <div style="
                    font-size:11px;
                    color:#64748b;
                    white-space:nowrap;
                    overflow:hidden;
                    text-overflow:ellipsis;
                ">
                    ${f.grupo || ''}
                </div>

                <div style="
                    font-size:12px;
                    color:#94a3b8;
                ">
                    🕒 ${
                        f.sys_updated_on
                            ? new Date(
                                f.sys_updated_on
                              ).toLocaleDateString('es-MX')
                            : '-'
                    }
                </div>

                <div style="
                    font-size:12px;
                    color:#64748b;
                ">
                    👤 ${f.asignado || 'Sin asignar'}
                </div>

            </div>

        `)
        .join('');

}

function showFolioTicket(numero) {

    const f = currentList.find(
        x => x.number === numero
    );

    if (!f) return;




    const estado =
        f.estado || '-';

    const grupo =
        f.grupo?.display_value ||
        f.grupo ||
        '-';

    const asignado =
        f.asignado?.display_value ||
        f.asignado ||
        'Sin asignar';

    document.getElementById(
        'detailContent'
    ).innerHTML = `

        <div class="ticket-header">

            <div class="ticket-number">
                ${f.number}
            </div>

            <div class="ticket-business">
                SAP ${f.sap || '-'}
            </div>

        </div>

        <h3>${detectProblema(f)}</h3>

        <p><b>Estado:</b> ${estado}</p>

        <p><b>Grupo:</b> ${grupo}</p>

        <p><b>Asignado:</b> ${asignado}</p>

        <p><b>Descripción breve:</b></p>

        <p>
            ${f.short_description || '-'}
        </p>

        <p><b>Descripción:</b></p>

        <p>
            ${f.description || '-'}
        </p>

    `;

    document.getElementById(
        'infoPanel'
    ).innerHTML = `

        <h3>Información del Folio</h3>

        <p>
            <b>Estado:</b>
            ${estado}
        </p>

        <p>
            <b>Asignado:</b>
            ${asignado}
        </p>

        <p>
            <b>Grupo:</b>
            ${grupo}
        </p>

        <p>
            <b>SAP:</b>
            ${f.sap || '-'}
        </p>

        <p>
            <b>Fecha:</b>
            ${f.sys_created_on || '-'}
        </p>

    `;
}


async function loadTickets() {
    const r = await fetch('/api/hotspot');
    const d = await r.json();
    allTickets = d.result || [];
    /*
await fetch('/api/control-folios/sync', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(allTickets)
});
*/
    internetTickets = allTickets;
    currentList = internetTickets;
    internetTickets.sort((a, b) => {

        const abiertos = [
    'nuevo',
    'new',
    'en espera',
    'hold',
    'en curso',
    'progress',
    'asignado',
    'assigned'
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

            if (
                estado.includes('resuelto') ||
                estado.includes('resolved')
            ) {

                colorClass = 'dot-green';
                stateClass = 'state-green';
                strikeClass = 'strike-green';

            } else if (
                estado.includes('cerrado') ||
                estado.includes('closed') ||
                estado.includes('cancelado')
            ) {

                colorClass = 'dot-red';
                stateClass = 'state-red';
                strikeClass = 'strike-red';

            } else if (
                estado.includes('espera') ||
                estado.includes('hold')
            ) {

                colorClass = 'dot-orange';
                stateClass = 'state-orange';
                strikeClass = 'strike-orange';

            }

            const nombreAgente =
                t.assigned_to?.display_value || '';

            const iniciales =
                nombreAgente ?
                nombreAgente
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map(x => x[0])
                .join('')
                .toUpperCase() :
                '';
            const avatarColors = [
    'avatar-purple',
    'avatar-indigo',
    'avatar-rose',
    'avatar-cyan',
    'avatar-slate',
    'avatar-teal'
];

            const avatarClass =
                iniciales ?
                avatarColors[
                    iniciales.charCodeAt(0) %
                    avatarColors.length
                ] :
                '';

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

    const responsables = [...new Set(
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

function detectOperationalStage(ticket, activity) {

    const comments =
        (
            activity?.comments_and_work_notes ||
            ''
        ).toLowerCase();


    const closeNotes =
        (
            activity?.close_notes ||
            ''
        ).toLowerCase();

    const closeCode =
        (
            activity?.close_code ||
            ''
        ).toLowerCase();

    const cause =
        (
            activity?.cause ||
            ''
        ).toLowerCase();

    const estado =
        (
            ticket?.state ||
            ''
        ).toLowerCase();

    const grupo =
        (
            ticket?.assignment_group?.display_value ||
            ticket?.assignment_group ||
            ''
        ).toLowerCase();

    // DUPLICADO

    if (
        closeNotes.includes('duplicado') ||
        closeNotes.includes('seguimiento con inc')
    ) {

        const inc =
            closeNotes.match(
                /INC\d+/i
            );

        return {
            icon: '🔁',
            stage: 'Duplicado',
            related: inc?.[0] || ''
        };
    }

    // STRIKE CERRADO

    if (
        cause.includes('incidente no valido') &&
        (
            closeNotes.includes('strike') ||
            closeNotes.includes('falta de respuesta')
        )
    ) {

        return {
            icon: '🔒',
            stage: 'Cerrado por Strike'
        };
    }

    // STRIKE 2

    if (
        comments.includes('strike 2') ||
        comments.includes('contacto alterno')
    ) {

        return {
            icon: '⚠️',
            stage: 'Strike 2'
        };
    }

    // STRIKE 1

    if (
        comments.includes('strike 1') ||
        comments.includes('primer contacto') ||
        comments.includes('whatsapp')
    ) {

        return {
            icon: '⚠️',
            stage: 'Strike 1'
        };
    }

    // OSS

    if (
        grupo.includes('oss')
    ) {

        return {
            icon: '⚙️',
            stage: 'OSS'
        };
    }

    // VENDOR

    if (
        estado.includes('proveedor')
    ) {

        return {
            icon: '📦',
            stage: 'Vendor'
        };
    }

    // ON SITE

    if (
        comments.includes('visita') ||
        comments.includes('on site') ||
        comments.includes('onsite')
    ) {

        return {
            icon: '🚚',
            stage: 'On Site'
        };
    }

    // RESUELTO

    if (
        estado.includes('resuelto') ||
        estado.includes('cerrado')
    ) {

        return {
            icon: '✅',
            stage: 'Resuelto'
        };
    }

    return {
        icon: '🟢',
        stage: 'Operación'
    };

}

function showDetail(n) {

    selected = n;

    render(currentList);

    const t = internetTickets.find(
        x => x.number === n
    );

    if (!t) return;

 
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
        v ?
        new Date(v)
        .toLocaleDateString('es-MX') :
        '';

    const recurrencia =
        hist.length >= 11 ?
        '🔴 Alta' :
        hist.length >= 4 ?
        '🟡 Media' :
        '🟢 Baja';

    const ultimoHistorico =
        hist.length > 0 ?
        fmt(hist[0].sys_created_on) :
        'Sin historial';

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

     <div class="ticket-header-status">

        <span class="ticket-status">
            ${t.state || ''}
        </span>

     </div>


     <div class="ticket-number">
        ${t.number}
     </div>

     <div class="ticket-business">

        ${cs} ${store(t)}

     </div>

</div>
 <div class="ticket-summary">

            <h3>Acciones rápidas</h3>

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
        <div class="ticket-tabs">

    <button class="ticket-tab active">
        Información
    </button>

    <button class="ticket-tab">
        Conversación
    </button>

    <button class="ticket-tab">
        Historial SAP
    </button>

    <button class="ticket-tab">
        Notas
    </button>

    <button class="ticket-tab">
        Archivos
    </button>

</div>

   <div class="conversation-card">

    <h3>
        Descripción breve
    </h3>

    <p class="conversation-description">

        ${t.short_description || ''}

    </p>
    

    <hr style="
    margin:20px 0;
    border:none;
    border-top:1px solid #e5e7eb;
">

<div style="
    background:#f8fafc;
    border:1px solid #e5e7eb;
    border-radius:12px;
    padding:16px;
    margin:16px 0;
">

    <div style="margin-bottom:8px;">
        <strong>Asignado:</strong>
        ${
            t.assigned_to?.display_value ||
            'Sin asignar'
        }
    </div>

    <div style="margin-bottom:8px;">
        <strong>Grupo:</strong>
        ${
            t.assignment_group?.display_value ||
            '-'
        }
    </div>

    <div>
        <strong>Creado:</strong>
        ${t.sys_created_on || '-'}
    </div>

</div>

    <h3>
        Descripción
    </h3>

    <p class="conversation-description">

        ${t.description || 'Sin descripción disponible'}

    </p>
    <hr style="
    margin:20px 0;
    border:none;
    border-top:1px solid #e5e7eb;
">


<hr style="
    margin:20px 0;
    border:none;
    border-top:1px solid #e5e7eb;
">
</div>
    `;
       fetch(
            `/api/ticket/${t.sys_id}/activity`
        )
        .then(r => r.json())
        .then(data => {
            const etapa =
                detectOperationalStage(
                    t,
                    data.result
                );

            console.log(
                'ETAPA DETECTADA:',
                etapa
            );
            const etapaHtml = `
<div style="
    margin-bottom:16px;
    padding:12px 16px;
    border-radius:12px;
    background:#f8fafc;
    border:1px solid #e5e7eb;
    font-weight:600;
">
    ${etapa.icon}
    ${etapa.stage}
</div>
`;
            const seguimiento =
                data.result.work_notes ||
                data.result.comments_and_work_notes ||
                'Sin seguimiento';
            const actividades =
                seguimiento
                .split(/\n\s*\n/)
                .filter(Boolean);
            console.log(
                'ACTIVITY',
                data.result
            );

            document.getElementById(
                'detailContent'
            ).insertAdjacentHTML(
                'beforeend',
                `
        <div style="
            margin-top:20px;
            padding:16px;
            border:1px solid #e5e7eb;
            border-radius:12px;
            background:white;
        ">
            <h3>📜 Actividad</h3>

        <div>
  ${actividades.map(a => `
    <div style="
        margin-bottom:16px;
        padding:12px;
        background:#f8fafc;
        border:1px solid #e5e7eb;
        border-radius:12px;
    ">
        ${
  a.includes('Attachment:')
    ? '📷 Imagen agregada'
    : '📝 Nota de trabajo'
}
${
    a.includes('Attachment:')
        ? `
        <div style="
            margin-top:12px;
            color:#2563eb;
            font-weight:600;
        ">
            📷 Imagen adjunta detectada
        </div>
        `
        : ''
}

        <hr style="
            margin:8px 0;
            border:none;
            border-top:1px solid #e5e7eb;
        ">

        <div style="
            white-space:pre-wrap;
            line-height:1.6;
        ">
            ${a}
        </div>
    </div>
  `).join('')}
</div>


        </div>
        `
            );

        });

    fetch(
            `/api/ticket/${t.sys_id}/attachments`
        )
        .then(r => r.json())
        .then(data => {

            const archivos =
                data.result || [];

            const imagenes =
                archivos.filter(
                    a =>
                    String(
                        a.content_type || ''
                    ).startsWith('image/')
                );

            if (!imagenes.length)
                return;

            document.getElementById(
                'detailContent'
            ).insertAdjacentHTML(
                'beforeend',
                `
        <div style="
            margin-top:20px;
            border-top:1px solid #e5e7eb;
            padding-top:16px;
        ">

            <h3>📷 Evidencias</h3>

            ${imagenes.map(img => `

                <div style="
                    margin-bottom:20px;
                ">

                    <div style="
                        font-size:12px;
                        color:#64748b;
                        margin-bottom:8px;
                    ">
                        ${img.file_name}
                    </div>

                    <img
                        src="/api/attachment/${img.sys_id}"
                        style="
                            max-width:100%;
                            border-radius:12px;
                            border:1px solid #e5e7eb;
                        "
                    >

                </div>

            `).join('')}

        </div>
        `
            );

        })
        .catch(err => {
            console.error(
                'ERROR ATTACHMENTS',
                err
            );
        });

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