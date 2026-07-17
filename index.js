
// ========================================
// IMP-001
// IMPORTACIONES
// ========================================

const express = require("express");
const { readJson, saveJson } = require("./dataStore");

const {
    getSimDetails,
    getSims
} = require("./jasper");

// ========================================
// APP-001
// INICIAR EXPRESS
// ========================================

const app = express();
app.use(express.json());

// ========================================
// MAP-001
// CUENTAS INTERNAS
// ========================================

const accountMap = {

    101082514: "T2"

};

// ========================================
// API-001
// PRUEBA DE SERVICIO
//
// URL:
// /api/test
// ========================================

app.get("/api/test", (req, res) => {

    res.send("API funcionando ✅");

});

// ========================================
// API-002
// CONSULTAR SIM INDIVIDUAL
//
// URL:
// /api/sim/:simId
// ========================================

app.get("/api/sim/:simId", async (req, res) => {

    try {

        const simId =
            Number(req.params.simId);

        const result =
            await getSimDetails(simId);

        const sim =
            result.data[0];

        if (!sim) {

            return res.status(404).json({
                error: "SIM no encontrada"
            });

        }

        res.json({

            simId: sim.simId,

            iccid: sim.iccid,

            msisdn: sim.msisdn,

            imsi: sim.imsi1,

            imei: sim.simAuxFieldsDTO?.imei,

            estado: sim.statusNameDisplay,

            consumoMB: sim.monthToDateDataUsageMB,

            carrier: sim.currentSessionInfo?.carrier,

            cuenta:
                accountMap[sim.acctId] || sim.acctName,

            apn: sim.currentSessionInfo?.apn,

            ip: sim.currentSessionInfo?.deviceIpAddress,

            enSesion: sim.currentSessionInfo?.status

        });

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});

// ========================================
// API-004
// DETALLE COMPLETO DE SIM
//
// URL:
// /api/sim/:simId/raw
// ========================================

app.get("/api/sim/:simId/raw", async (req, res) => {

    try {

        const simId =
            Number(req.params.simId);

        const result =
            await getSimDetails(simId);

        res.json(result);

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});

// ========================================
// API-003
// LISTADO DE SIMS
//
// URL:
// /api/sims
// ========================================

app.get("/api/sims", async (req, res) => {

    try {

        const result =
            await getSims();

        const sims =
            result.data.map(sim => ({

                simId: sim.simId,

                iccid: sim.iccid,

                msisdn: sim.msisdn,

                imei: sim.simAuxFieldsDTO?.imei,

                cuenta:
                    accountMap[sim.acctId] || sim.acctName,

                carrier:
                    sim.currentSessionInfo?.carrier,

                plan:
                    sim.ratePlanName,

                commPlan:
                    sim.commPlanName,

                estado:
                    sim.statusNameDisplay,

                consumoMB:
                    sim.monthToDateDataUsageMB,

                enSesion:
                    sim.inSession

            }));

        res.json(sims);

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});

// ========================================
// DAS-001
// DASHBOARD GENERAL
//
// URL:
// /api/dashboard
// ========================================

app.get("/api/dashboard", async (req, res) => {

    try {

        const result =
            await getSims();

        const sims =
            result.data;

        const totalSims =
            sims.length;

        const enSesion =
            sims.filter(x => x.inSession === true).length;

        const sinSesion =
            totalSims - enSesion;

        const consumoTotalMB =
            sims.reduce(
                (total, sim) =>
                    total + (sim.monthToDateDataUsageMB || 0),
                0
            );

        const consumoPromedioMB =
            totalSims > 0
                ? consumoTotalMB / totalSims
                : 0;

        const topConsumo =
            sims
                .sort(
                    (a, b) =>
                        (b.monthToDateDataUsageMB || 0) -
                        (a.monthToDateDataUsageMB || 0)
                )
                .slice(0, 10)
                .map(sim => ({

                    simId: sim.simId,

                    iccid: sim.iccid,

                    msisdn: sim.msisdn,

                    consumoMB:
                        sim.monthToDateDataUsageMB

                }));

        res.json({

            totalSims,

            enSesion,

            sinSesion,

            consumoTotalMB:
                Number(consumoTotalMB.toFixed(2)),

            consumoPromedioMB:
                Number(consumoPromedioMB.toFixed(2)),

            topConsumo

        });

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});

// ========================================
// MON-001
// SIMS SIN SESION
//
// URL:
// /api/sims/offline
// ========================================

app.get("/api/sims/offline", async (req, res) => {

    try {

        const result =
            await getSims();

        const offlineSims =
            result.data
                .filter(sim =>
                    sim.inSession === false
                )
                .map(sim => ({

                    simId: sim.simId,

                    iccid: sim.iccid,

                    msisdn: sim.msisdn,

                    imei: sim.simAuxFieldsDTO?.imei,

                    estado: sim.statusNameDisplay,

                    consumoMB:
                        sim.monthToDateDataUsageMB,

                    enSesion:
                        sim.inSession

                }));

        res.json({

            totalOffline:
                offlineSims.length,

            sims:
                offlineSims

        });

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});

// ========================================
// MON-002
// SIMS EN SESION
//
// URL:
// /api/sims/online
// ========================================

app.get("/api/sims/online", async (req, res) => {

    try {

        const result =
            await getSims();

        const onlineSims =
            result.data
                .filter(sim =>
                    sim.inSession === true
                )
                .map(sim => ({

                    simId: sim.simId,

                    iccid: sim.iccid,

                    msisdn: sim.msisdn,

                    imei: sim.simAuxFieldsDTO?.imei,

                    estado: sim.statusNameDisplay,

                    consumoMB:
                        sim.monthToDateDataUsageMB,

                    enSesion:
                        sim.inSession

                }));

        res.json({

            totalOnline:
                onlineSims.length,

            sims:
                onlineSims

        });

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});

// ========================================
// MON-003
// SIMS DE ALTO CONSUMO
//
// URL:
// /api/sims/high-usage
// ========================================

app.get("/api/sims/high-usage", async (req, res) => {

    try {

        const result =
            await getSims();

        const highUsageSims =
            result.data
                .filter(sim =>
                    (sim.monthToDateDataUsageMB || 0) >= 500
                )
                .sort(
                    (a, b) =>
                        (b.monthToDateDataUsageMB || 0) -
                        (a.monthToDateDataUsageMB || 0)
                )
                .map(sim => ({

                    simId: sim.simId,

                    iccid: sim.iccid,

                    msisdn: sim.msisdn,

                    imei: sim.simAuxFieldsDTO?.imei,

                    consumoMB:
                        sim.monthToDateDataUsageMB,

                    estado:
                        sim.statusNameDisplay,

                    enSesion:
                        sim.inSession

                }));

        res.json({

            reglaMB: 500,

            total:
                highUsageSims.length,

            sims:
                highUsageSims

        });

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});

// ========================================
// MON-004
// SIMS SIN CONSUMO
//
// URL:
// /api/sims/no-usage
// ========================================

app.get("/api/sims/no-usage", async (req, res) => {

    try {

        const result =
            await getSims();

        const noUsageSims =
            result.data
                .filter(sim =>
                    (sim.monthToDateDataUsageMB || 0) === 0
                )
                .map(sim => ({

                    simId: sim.simId,

                    iccid: sim.iccid,

                    msisdn: sim.msisdn,

                    imei: sim.simAuxFieldsDTO?.imei,

                    consumoMB:
                        sim.monthToDateDataUsageMB,

                    estado:
                        sim.statusNameDisplay,

                    enSesion:
                        sim.inSession

                }));

        res.json({

            total:
                noUsageSims.length,

            sims:
                noUsageSims

        });

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});

// ========================================
// DAS-002
// ESTADISTICAS GENERALES
//
// URL:
// /api/stats
// ========================================

app.get("/api/stats", async (req, res) => {

    try {

        const result =
            await getSims();

        const sims =
            result.data;

        const total =
            sims.length;

        const online =
            sims.filter(sim => sim.inSession === true).length;

        const offline =
            sims.filter(sim => sim.inSession === false).length;

        const noUsage =
            sims.filter(
                sim =>
                    (sim.monthToDateDataUsageMB || 0) === 0
            ).length;

        const highUsage =
            sims.filter(
                sim =>
                    (sim.monthToDateDataUsageMB || 0) >= 500
            ).length;

        const activated =
            sims.filter(
                sim =>
                    sim.statusNameDisplay === "Activado"
            ).length;

        res.json({

            total,

            activated,

            online,

            offline,

            noUsage,

            highUsage

        });

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});

// ========================================
// API-005
// CUENTAS JASPER
//
// URL:
// /api/accounts
// ========================================

app.get("/api/accounts", async (req, res) => {

    try {

        const result =
            await getSims();

        const accounts =
            [...new Map(

                result.data.map(sim => [

                    sim.acctId,

                    {
                        acctId: sim.acctId,
                        acctName: sim.acctName
                    }

                ])

            ).values()];

        res.json(accounts);

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});

// ========================================
// API-006
// PLANES JASPER
//
// URL:
// /api/plans
// ========================================

app.get("/api/plans", async (req, res) => {

    try {

        const result =
            await getSims();

        const plans =
            [...new Map(

                result.data.map(sim => [

                    sim.ratePlanId,

                    {
                        ratePlanId: sim.ratePlanId,
                        ratePlanName: sim.ratePlanName,
                        commPlanId: sim.commPlanId,
                        commPlanName: sim.commPlanName
                    }

                ])

            ).values()];

        res.json(plans);

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});

// ========================================
// API-007
// TOP CONSUMO
//
// URL:
// /api/top-usage
// ========================================

app.get("/api/top-usage", async (req, res) => {

    try {

        const result =
            await getSims();

        const sims =
            result.data
                .sort(
                    (a, b) =>
                        (b.monthToDateDataUsageMB || 0) -
                        (a.monthToDateDataUsageMB || 0)
                )
                .slice(0, 20)
                .map(sim => ({

                    simId: sim.simId,

                    iccid: sim.iccid,

                    msisdn: sim.msisdn,

                    cuenta:
                        accountMap[sim.acctId] || sim.acctName,

                    carrier:
                        sim.currentSessionInfo?.carrier,

                    plan:
                        sim.ratePlanName,

                    consumoMB:
                        sim.monthToDateDataUsageMB,

                    enSesion:
                        sim.inSession

                }));

        res.json(sims);

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});
// ========================================
// API-008
// BUSQUEDA GLOBAL
//
// URL:
// /api/search?q=
//
// Ejemplos:
// /api/search?q=2276258113
// /api/search?q=8952020525641079351
// /api/search?q=8120307979
// /api/search?q=8688160427360501
// ========================================

app.get("/api/search", async (req, res) => {

    try {

        const q =
            String(req.query.q || "")
                .trim();

        if (!q) {

            return res.status(400).json({
                error: "Debe enviar ?q="
            });

        }

        const result =
            await getSims();

        const matches =
            result.data
                .filter(sim =>

                    String(sim.simId).includes(q) ||
                    String(sim.iccid || "").includes(q) ||
                    String(sim.msisdn || "").includes(q) ||
                    String(
                        sim.simAuxFieldsDTO?.imei || ""
                    ).includes(q)

                )
                .map(sim => ({

                    simId: sim.simId,

                    iccid: sim.iccid,

                    msisdn: sim.msisdn,

                    imei:
                        sim.simAuxFieldsDTO?.imei,

                    cuenta:
                        accountMap[sim.acctId] || sim.acctName,

                    plan:
                        sim.ratePlanName,

                    commPlan:
                        sim.commPlanName,

                    estado:
                        sim.statusNameDisplay,

                    consumoMB:
                        sim.monthToDateDataUsageMB,

                    enSesion:
                        sim.inSession

                }));

        res.json({

            total: matches.length,

            resultados: matches

        });

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});
// ========================================
// MOD-002
// CATALOGO DE HOTSPOTS
// ========================================


// ========================================
// MOD-002
// CATALOGO DE HOTSPOTS
// ========================================

const hotspots =
    readJson(
        "hotspots.json",
        []
    );


// ========================================
// PEGAR DEBAJO DE accountMap
// ========================================

// ========================================
// MOD-002
// API HOTSPOTS
//
// URL:
// /api/hotspots
// ========================================

app.get("/api/hotspots", async (req, res) => {

    res.json({

        total: hotspots.length,

        hotspots

    });

});
// ========================================
// MOD-003
// CATALOGO DE TIENDAS
// ========================================


const tiendas =
    readJson(
        "tiendas.json",
        []
    );


// ========================================
// MOD-003
// API TIENDAS
//
// URL:
// /api/tiendas
// ========================================

app.get("/api/tiendas", async (req, res) => {

    res.json({

        total: tiendas.length,

        tiendas

    });

});


// ========================================
// MOD-004
// API HOTSPOTS DETALLE
//
// URL:
// /api/hotspots-detalle
// ========================================

app.get("/api/hotspots-detalle", async (req, res) => {

    const resultado = hotspots.map(hotspot => ({

        ...hotspot,

        tienda: tiendas.find(
            t => t.tiendaId === hotspot.tiendaId
        ) || null

    }));

    res.json({

        total: resultado.length,

        hotspots: resultado

    });

});
// ========================================
// MOD-005
// INVENTARIO HOTSPOT + SIM + TIENDA
//
// URL:
// /api/inventario
// ========================================

app.get("/api/inventario", async (req, res) => {

    try {

        const result =
            await getSims();

        const inventario =
            hotspots.map(hotspot => {

                const tienda =
                    tiendas.find(
                        t => t.tiendaId === hotspot.tiendaId
                    );

                const sim =
                    result.data.find(
                        s => s.simId === hotspot.simId
                    );

                return {

                    hotspotId:
                        hotspot.hotspotId,

                    hotspot:
                        hotspot.nombre,

                    tienda:
                        tienda?.nombre || null,

                    tiendaClave:
                        tienda?.clave || null,

                    simId:
                        sim?.simId || hotspot.simId,

                    msisdn:
                        sim?.msisdn || null,

                    iccid:
                        sim?.iccid || null,

                    imei:
                        hotspot.imei,

                    estado:
                        sim?.statusNameDisplay || null,

                    consumoMB:
                        sim?.monthToDateDataUsageMB || 0,

                    enSesion:
                        sim?.inSession || false

                };

            });

        res.json({

            total:
                inventario.length,

            inventario

        });

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});
// ========================================
// MOD-006
// DETALLE DE INVENTARIO
//
// URL:
// /api/inventario/:hotspotId
// ========================================

app.get("/api/inventario/:hotspotId", async (req, res) => {

    try {

        const hotspotId =
            Number(req.params.hotspotId);

        const hotspot =
            hotspots.find(
                h => h.hotspotId === hotspotId
            );

        if (!hotspot) {

            return res.status(404).json({
                error: "Hotspot no encontrado"
            });

        }

        const tienda =
            tiendas.find(
                t => t.tiendaId === hotspot.tiendaId
            );

        const result =
            await getSims();

        const sim =
            result.data.find(
                s => s.simId === hotspot.simId
            );

        res.json({

            hotspotId: hotspot.hotspotId,

            hotspot: hotspot.nombre,

            tienda: {
                tiendaId: tienda?.tiendaId,
                clave: tienda?.clave,
                nombre: tienda?.nombre,
                ciudad: tienda?.ciudad
            },

            sim: {
                simId: sim?.simId,
                iccid: sim?.iccid,
                msisdn: sim?.msisdn,
                imei: hotspot.imei,
                cuenta: sim?.acctName,
                plan: sim?.ratePlanName,
                estado: sim?.statusNameDisplay,
                consumoMB: sim?.monthToDateDataUsageMB,
                enSesion: sim?.inSession
            }

        });

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});
// ========================================
// MOD-007
// ALERTAS OPERATIVAS
//
// URL:
// /api/alertas
// ========================================

app.get("/api/alertas", async (req, res) => {

    try {

        const result =
            await getSims();

        const sims =
            result.data;

        const alertas = {

            criticas: [],

            advertencias: [],

            informativas: []

        };

        sims.forEach(sim => {

            if (sim.inSession === false) {

                alertas.advertencias.push({
                    tipo: "SIN_SESION",
                    simId: sim.simId,
                    msisdn: sim.msisdn
                });

            }

            if ((sim.monthToDateDataUsageMB || 0) >= 1000) {

                alertas.criticas.push({
                    tipo: "ALTO_CONSUMO",
                    simId: sim.simId,
                    msisdn: sim.msisdn,
                    consumoMB: sim.monthToDateDataUsageMB
                });

            }

            if ((sim.monthToDateDataUsageMB || 0) === 0) {

                alertas.informativas.push({
                    tipo: "SIN_CONSUMO",
                    simId: sim.simId,
                    msisdn: sim.msisdn
                });

            }

        });

        hotspots.forEach(hotspot => {

            if (!hotspot.simId) {

                alertas.criticas.push({
                    tipo: "HOTSPOT_SIN_SIM",
                    hotspotId: hotspot.hotspotId,
                    hotspot: hotspot.nombre
                });

            }

            if (!hotspot.tiendaId) {

                alertas.advertencias.push({
                    tipo: "HOTSPOT_SIN_TIENDA",
                    hotspotId: hotspot.hotspotId,
                    hotspot: hotspot.nombre
                });

            }

        });

        res.json({

            resumen: {
                criticas: alertas.criticas.length,
                advertencias: alertas.advertencias.length,
                informativas: alertas.informativas.length
            },

            ...alertas

        });

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});
// ========================================
// MOD-008
// DASHBOARD OPERATIVO
//
// URL:
// /api/dashboard-operativo
// ========================================

app.get("/api/dashboard-operativo", async (req, res) => {

    try {

        const result = await getSims();

        const sims = result.data;

        const totalSims = sims.length;

        const online = sims.filter(x => x.inSession === true).length;

        const offline = totalSims - online;

        const sinConsumo = sims.filter(
            x => (x.monthToDateDataUsageMB || 0) === 0
        ).length;

        const altoConsumo = sims.filter(
            x => (x.monthToDateDataUsageMB || 0) >= 1000
        ).length;

        let salud = "VERDE";

        if (altoConsumo > 0) {
            salud = "AMARILLO";
        }

        if (altoConsumo >= 3) {
            salud = "ROJO";
        }

        res.json({

            salud,

            totalSims,

            online,

            offline,

            sinConsumo,

            altoConsumo,

            hotspots: hotspots.length,

            tiendas: tiendas.length

        });

    }
    catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            error: error.message
        });

    }

});
// ========================================
// PACK-1
// MOD-009 AL MOD-012
// ========================================

// ========================================
// MOD-009
// MOVIMIENTOS
// ========================================

const movimientos = [
    {
        movimientoId: 1,
        fecha: new Date().toISOString(),
        tipo: "ASIGNACION",
        hotspotId: 1,
        tiendaId: 1,
        comentario: "Asignacion inicial"
    }
];

app.get("/api/movimientos", (req, res) => {
    res.json({
        total: movimientos.length,
        movimientos
    });
});

// ========================================
// MOD-010
// HISTORIAL HOTSPOT
// ========================================

app.get("/api/hotspots/:hotspotId/historial", (req, res) => {

    const hotspotId = Number(req.params.hotspotId);

    const historial = movimientos.filter(
        x => x.hotspotId === hotspotId
    );

    res.json({
        hotspotId,
        total: historial.length,
        historial
    });

});

// ========================================
// MOD-011
// HISTORIAL SIM
// ========================================

app.get("/api/sims/:simId/historial", (req, res) => {

    const simId = Number(req.params.simId);

    const hotspot = hotspots.find(
        h => h.simId === simId
    );

    if (!hotspot) {
        return res.json({
            simId,
            total: 0,
            historial: []
        });
    }

    const historial = movimientos.filter(
        x => x.hotspotId === hotspot.hotspotId
    );

    res.json({
        simId,
        total: historial.length,
        historial
    });

});

// ========================================
// MOD-012
// ASIGNACIONES
// ========================================

app.get("/api/asignaciones", (req, res) => {

    const asignaciones = hotspots.map(h => ({

        hotspotId: h.hotspotId,

        hotspot: h.nombre,

        tiendaId: h.tiendaId,

        simId: h.simId

    }));

    res.json({

        total: asignaciones.length,

        asignaciones

    });

});
// ========================================
// PACK-2
// MOD-013 AL MOD-016
// ========================================

// ========================================
// MOD-013
// DESASIGNACIONES
// ========================================

app.get("/api/desasignaciones", (req, res) => {

    const desasignaciones = hotspots
        .filter(h => !h.tiendaId)
        .map(h => ({
            hotspotId: h.hotspotId,
            hotspot: h.nombre
        }));

    res.json({
        total: desasignaciones.length,
        desasignaciones
    });

});

// ========================================
// MOD-015
// DASHBOARD EJECUTIVO
// ========================================

app.get("/api/dashboard-ejecutivo", async (req, res) => {

    const result = await getSims();

    res.json({
        totalSims: result.data.length,
        hotspots: hotspots.length,
        tiendas: tiendas.length,
        ticketsAbiertos: tickets.filter(
            t => t.estado === "Abierto"
        ).length
    });

});

// ========================================
// MOD-016
// DASHBOARD OPERATIVO AVANZADO
// ========================================

app.get("/api/dashboard-operativo-avanzado", async (req, res) => {

    const result = await getSims();

    const online = result.data.filter(
        x => x.inSession === true
    ).length;

    const offline = result.data.length - online;

    const consumoTotal = result.data.reduce(
        (a,b) => a + (b.monthToDateDataUsageMB || 0),
        0
    );

    res.json({
        online,
        offline,
        consumoTotalMB: Number(consumoTotal.toFixed(2)),
        tickets: tickets.length
    });

});
// ========================================
// PACK-3
// MOD-017 AL MOD-020
// ========================================

// ========================================
// MOD-017
// EXPORTACION DATAVERSE
// ========================================

app.get("/api/export/dataverse", async (req, res) => {

    const result = await getSims();

    const exportacion = result.data.map(sim => ({
        simId: sim.simId,
        iccid: sim.iccid,
        msisdn: sim.msisdn,
        estado: sim.statusNameDisplay,
        consumoMB: sim.monthToDateDataUsageMB
    }));

    res.json({
        total: exportacion.length,
        registros: exportacion
    });

});

// ========================================
// MOD-018
// API POWER APPS
// ========================================

app.get("/api/powerapps/inventario", async (req, res) => {

    const result = await getSims();

    res.json(result.data.map(sim => ({
        simId: sim.simId,
        msisdn: sim.msisdn,
        estado: sim.statusNameDisplay
    })));

});

// ========================================
// MOD-019
// API POWER BI
// ========================================

app.get("/api/powerbi/dataset", async (req, res) => {

    const result = await getSims();

    res.json({
        fecha: new Date().toISOString(),
        totalSims: result.data.length,
        dataset: result.data
    });

});

// ========================================
// MOD-020
// AUDITORIA
// ========================================

const auditoria = [
    {
        auditoriaId: 1,
        fecha: new Date().toISOString(),
        accion: "CREACION_INVENTARIO",
        detalle: "Inicializacion Control Hotspot"
    }
];

app.get("/api/auditoria", (req, res) => {

    res.json({
        total: auditoria.length,
        auditoria
    });

});

// ========================================
// V2-001
// STORAGE STATUS
// ========================================

app.get("/api/storage/status", (req, res) => {

    const hotspotsJson =
        readJson("hotspots.json", []);

    const tiendasJson =
        readJson("tiendas.json", []);

    const movimientosJson =
        readJson("movimientos.json", []);

    const ticketsJson =
        readJson("tickets.json", []);

    const auditoriaJson =
        readJson("auditoria.json", []);

    res.json({

        hotspots: hotspotsJson.length,

        tiendas: tiendasJson.length,

        movimientos: movimientosJson.length,

        tickets: ticketsJson.length,

        auditoria: auditoriaJson.length,

        persistencia: true

    });

});

// ========================================
// V2-002
// CRUD HOTSPOTS
// ========================================

// CREAR HOTSPOT

app.post("/api/hotspots", (req, res) => {

    const hotspotsJson =
        readJson("hotspots.json", []);

    const nuevo = {

        hotspotId:
            hotspotsJson.length > 0
                ? Math.max(
                    ...hotspotsJson.map(
                        h => h.hotspotId
                    )
                ) + 1
                : 1,

        nombre:
            req.body.nombre,

        imei:
            req.body.imei,

        simId:
            req.body.simId || null,

        tiendaId:
            req.body.tiendaId || null,

        estado:
            req.body.estado || "Activo"

    };

    hotspotsJson.push(nuevo);

    saveJson(
        "hotspots.json",
        hotspotsJson
    );

    res.status(201).json(nuevo);

});

// EDITAR HOTSPOT

app.put("/api/hotspots/:id", (req, res) => {

    const hotspotId =
        Number(req.params.id);

    const hotspotsJson =
        readJson("hotspots.json", []);

    const hotspot =
        hotspotsJson.find(
            h => h.hotspotId === hotspotId
        );

    if (!hotspot) {

        return res
            .status(404)
            .json({
                error:
                    "Hotspot no encontrado"
            });

    }

    Object.assign(
        hotspot,
        req.body
    );

    saveJson(
        "hotspots.json",
        hotspotsJson
    );

    res.json(hotspot);

});

// ELIMINAR HOTSPOT

app.delete("/api/hotspots/:id", (req, res) => {

    const hotspotId =
        Number(req.params.id);

    const hotspotsJson =
        readJson("hotspots.json", []);

    const nuevos =
        hotspotsJson.filter(
            h => h.hotspotId !== hotspotId
        );

    saveJson(
        "hotspots.json",
        nuevos
    );

    res.json({

        eliminado: hotspotId,

        total:
            nuevos.length

    });

});


// ========================================
// V3-001
// RECEPCIONES PSP
// ========================================

// LISTADO

app.get("/api/recepciones", (req, res) => {

    const recepciones =
        readJson(
            "recepciones.json",
            []
        );

    res.json({

        total:
            recepciones.length,

        recepciones

    });

});

// DASHBOARD

app.get("/api/recepciones/dashboard", (req, res) => {

    const recepciones =
        readJson(
            "recepciones.json",
            []
        );

    res.json({

        total:
            recepciones.length,

        funcionales:
            recepciones.filter(
                r => r.resultado === "FUNCIONAL"
            ).length,

        cambioSim:
            recepciones.filter(
                r => r.resultado === "CAMBIO_SIM"
            ).length,

        sinSim:
            recepciones.filter(
                r => r.resultado === "SIN_SIM"
            ).length,

        pendientes:
            recepciones.filter(
                r => r.resultado === "PENDIENTE"
            ).length

    });

});

// CREAR

app.post("/api/recepciones", (req, res) => {

    const recepciones =
        readJson(
            "recepciones.json",
            []
        );

    const nueva = {

        recepcionId:
            recepciones.length > 0
                ? Math.max(
                    ...recepciones.map(
                        r => r.recepcionId || 0
                    )
                ) + 1
                : 1,

        fechaRecepcion:
            new Date().toISOString(),

        sucursalOrigen:
            req.body.sucursalOrigen || "PSP",

        serie:
            req.body.serie || "",

        imei:
            req.body.imei || "",

        mac:
            req.body.mac || "",

        carrierOriginal:
            req.body.carrierOriginal || "",

        iccidOriginal:
            req.body.iccidOriginal || "",

        msisdnOriginal:
            req.body.msisdnOriginal || "",

        imsiOriginal:
            req.body.imsiOriginal || "",

        estatusOriginal:
            req.body.estatusOriginal || "SIN_SIM",

        resultado:
            req.body.resultado || "PENDIENTE",

        tecnico:
            req.body.tecnico || "",

        comentarios:
            req.body.comentarios || ""

    };

    recepciones.push(nueva);

    saveJson(
        "recepciones.json",
        recepciones
    );

    res.status(201).json(nueva);

});

// CONSULTAR

app.get("/api/recepciones/:id", (req, res) => {

    const recepciones =
        readJson(
            "recepciones.json",
            []
        );

    const recepcion =
        recepciones.find(
            r =>
                r.recepcionId ===
                Number(req.params.id)
        );

    if (!recepcion) {

        return res.status(404).json({

            error:
                "Recepcion no encontrada"

        });

    }

    res.json(recepcion);

});

// ACTUALIZAR

app.put("/api/recepciones/:id", (req, res) => {

    const recepciones =
        readJson(
            "recepciones.json",
            []
        );

    const recepcion =
        recepciones.find(
            r =>
                r.recepcionId ===
                Number(req.params.id)
        );

    if (!recepcion) {

        return res.status(404).json({

            error:
                "Recepcion no encontrada"

        });

    }

    Object.assign(
        recepcion,
        req.body
    );

    saveJson(
        "recepciones.json",
        recepciones
    );

    res.json(recepcion);

});
// ========================================
// V3-002
// TICKETS OPERATIVOS
// ========================================

app.get("/api/tickets", (req, res) => {

    const tickets = readJson("tickets.json", []);

    res.json({
        total: tickets.length,
        tickets
    });

});

app.post("/api/tickets", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const nuevo = {
        ticketId: tickets.length > 0
            ? Math.max(...tickets.map(t => t.ticketId || 0)) + 1
            : 1,
        fechaCreacion: new Date().toISOString(),
        tienda: req.body.tienda || "",
        contacto: req.body.contacto || "",
        telefono: req.body.telefono || "",
        problema: req.body.problema || "",
        descripcion: req.body.descripcion || "",
        estado: "ABIERTO",
        strike: 0,
        comentarios: []
    };

    tickets.push(nuevo);
    saveJson("tickets.json", tickets);

    res.status(201).json(nuevo);

});

app.get("/api/tickets/:id", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const ticket = tickets.find(
        t => t.ticketId === Number(req.params.id)
    );

    if (!ticket) {
        return res.status(404).json({
            error: "Ticket no encontrado"
        });
    }

    res.json(ticket);

});

app.put("/api/tickets/:id", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const ticket = tickets.find(
        t => t.ticketId === Number(req.params.id)
    );

    if (!ticket) {
        return res.status(404).json({
            error: "Ticket no encontrado"
        });
    }

    Object.assign(ticket, req.body);

    saveJson("tickets.json", tickets);

    res.json(ticket);

});
// ========================================
// V3-003
// STRIKES
// ========================================

app.get("/api/strikes", (req, res) => {

    const strikes = readJson("strikes.json", []);

    res.json({
        total: strikes.length,
        strikes
    });

});

app.post("/api/tickets/:id/strike", (req, res) => {

    const tickets = readJson("tickets.json", []);
    const strikes = readJson("strikes.json", []);

    const ticket = tickets.find(
        t => t.ticketId === Number(req.params.id)
    );

    if (!ticket) {
        return res.status(404).json({
            error: "Ticket no encontrado"
        });
    }

    const nuevoStrike = {
        strikeId: strikes.length > 0
            ? Math.max(...strikes.map(s => s.strikeId || 0)) + 1
            : 1,
        ticketId: ticket.ticketId,
        numeroStrike: (ticket.strike || 0) + 1,
        fecha: new Date().toISOString(),
        comentario: req.body.comentario || ""
    };

    ticket.strike = nuevoStrike.numeroStrike;

    if (ticket.strike >= 3) {
        ticket.estado = "CERRADO";
    }

    strikes.push(nuevoStrike);

    saveJson("tickets.json", tickets);
    saveJson("strikes.json", strikes);

    res.json({
        ticket,
        strike: nuevoStrike
    });

});

app.get("/api/tickets/:id/strikes", (req, res) => {

    const strikes = readJson("strikes.json", []);

    const historial = strikes.filter(
        s => s.ticketId === Number(req.params.id)
    );

    res.json({
        total: historial.length,
        strikes: historial
    });

});
// ========================================
// V3-004
// DASHBOARD OPERATIVO
// ========================================

app.get("/api/dashboard-operativo-v3", (req, res) => {

 const tickets = readJson("tickets.json", []);
 const recepciones = readJson("recepciones.json", []);
 const strikes = readJson("strikes.json", []);

 res.json({
  ticketsTotal: tickets.length,
  ticketsAbiertos: tickets.filter(t => t.estado === "ABIERTO").length,
  ticketsCerrados: tickets.filter(t => t.estado === "CERRADO").length,

  strike1: tickets.filter(t => t.strike === 1).length,
  strike2: tickets.filter(t => t.strike === 2).length,
  strike3: tickets.filter(t => t.strike >= 3).length,

  recepcionesTotal: recepciones.length,
  funcionales: recepciones.filter(r => r.resultado === "FUNCIONAL").length,
  cambioSim: recepciones.filter(r => r.resultado === "CAMBIO_SIM").length,
  sinSim: recepciones.filter(r => r.resultado === "SIN_SIM").length,
  pendientes: recepciones.filter(r => r.resultado === "PENDIENTE").length,

  totalStrikes: strikes.length
 });

});
// ========================================
// V3-005.1
// UI MODERNA MVP
// ========================================

app.get("/", (req, res) => {

const tickets = readJson("tickets.json", []);
const recepciones = readJson("recepciones.json", []);
const strikes = readJson("strikes.json", []);

res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Hotspot Operations Hub</title>
<style>
body{font-family:Segoe UI;background:#f3f6fb;margin:0;padding:20px}
.header{background:#1f2937;color:white;padding:20px;border-radius:16px}
.cards{display:flex;gap:15px;flex-wrap:wrap;margin-top:15px}
.card{background:white;padding:15px;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,.08);min-width:180px}
.num{font-size:28px;font-weight:bold}
.menu a{display:block;text-decoration:none;color:#111;margin:10px 0}
.badge{display:inline-block;background:#2563eb;color:white;padding:6px 10px;border-radius:20px}
</style>
</head>
<body>
<div class="header">
<h1>🔥 Hotspot Operations Hub</h1>
<span class="badge">UI Moderna MVP</span>
</div>

<div class="cards">
<div class="card"><div>Tickets</div><div class="num">${tickets.length}</div></div>
<div class="card"><div>Recepciones</div><div class="num">${recepciones.length}</div></div>
<div class="card"><div>Strikes</div><div class="num">${strikes.length}</div></div>
</div>

<div class="card" style="margin-top:15px">
<h3>Navegación</h3>
<div class="menu">
<a href="/api/dashboard-operativo-v3">📊 Dashboard Operativo</a>
<a href="/api/tickets">🎫 Tickets</a>
<a href="/api/recepciones">📦 Recepciones PSP</a>
<a href="/api/strikes">⚠️ Strikes</a>
</div>
</div>
</body>
</html>
`);

});
// ========================================
// V3-005.2
// TARJETAS OPERATIVAS
// ========================================

app.get("/tickets-ui", (req, res) => {

const tickets = readJson("tickets.json", []);

const cards = tickets.map(t => `
<div class="ticket-card">
 <div class="ticket-header">
  <strong>🎫 Ticket #${t.ticketId}</strong>
  <span class="estado">${t.estado || 'ABIERTO'}</span>
 </div>
 <div class="ticket-body">
  <div><b>Tienda:</b> ${t.tienda || '-'}</div>
  <div><b>Problema:</b> ${t.problema || '-'}</div>
  <div><b>Teléfono:</b> ${t.telefono || '-'}</div>
  <div><b>Strike:</b> ${t.strike || 0}</div>
 </div>
</div>
`).join('');

res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Tickets UI</title>
<style>
body{font-family:Segoe UI;background:#f3f6fb;padding:20px}
.ticket-card{background:white;border-radius:16px;padding:15px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.ticket-header{display:flex;justify-content:space-between;margin-bottom:10px}
.estado{background:#22c55e;color:white;padding:4px 10px;border-radius:12px}
</style>
</head>
<body>
<h1>🎫 Tickets Operativos</h1>
${cards || '<p>Sin tickets</p>'}
</body>
</html>
`);

});

// ========================================
// V3-005.4
// ACCIONES OPERATIVAS
// ========================================

// ========================================
// V3-006.1
// FEED OPERATIVO SERVICENOW
// ========================================

app.get("/tickets-feed", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const feed = tickets.map(t => `
    <div class="ticket">
        <div class="avatar">📶</div>
        <div class="content">
            <div class="title">${t.tienda || "SIN TIENDA"}</div>
            <div class="problem">${t.problema || "-"}</div>
            ${t.origen === "SERVICENOW" ? `<div class="sn-badge">SERVICENOW ${t.numero || ""}</div>` : ""}
            <div class="phone">📱 ${t.telefono || "-"}</div>
            <div class="actions">
                <button class="btn-view">👁 Ver</button>
                <button class="btn-strike">⚠ Strike</button>
                <button class="btn-close">✅ Cerrar</button>
            </div>
        </div>
        <div class="badges">
            <span class="estado">${t.estado || "ABIERTO"}</span>
            <span class="strike">Strike ${t.strike || 0}</span>
        </div>
    </div>
    `).join("");

    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Feed Operativo</title><style>
body{font-family:Segoe UI;background:#eef2f7;padding:20px}
.ticket{background:white;border-radius:18px;padding:15px;margin-bottom:12px;display:flex;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.avatar{font-size:34px;margin-right:14px}.content{flex:1}.title{font-weight:bold;font-size:16px}
.problem{color:#666;margin-top:4px}.phone{margin-top:6px;font-size:13px}.actions{margin-top:12px}
.actions button{border:none;border-radius:10px;padding:7px 12px;margin-right:6px;cursor:pointer;font-weight:bold}
.btn-view{background:#2563eb;color:white}.btn-strike{background:#f59e0b;color:white}.btn-close{background:#22c55e;color:white}
.badges{text-align:right}.estado{display:block;background:#22c55e;color:white;border-radius:12px;padding:4px 10px;margin-bottom:6px}
.strike{display:block;background:#f59e0b;color:white;border-radius:12px;padding:4px 10px}
.sn-badge{display:inline-block;background:#7c3aed;color:white;padding:4px 8px;border-radius:10px;font-size:12px;margin-top:6px}
</style></head><body><h1>💬 Feed Operativo</h1>${feed || '<p>Sin tickets</p>'}</body></html>`);

});

// ========================================
// V3-005.5
// DETALLE TICKET
// ========================================

app.get("/ticket/:id", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const ticket = tickets.find(
        t => t.ticketId === Number(req.params.id)
    );

    if (!ticket) {
        return res.status(404).send("Ticket no encontrado");
    }

    res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Detalle Ticket</title>
<style>
body{font-family:Segoe UI;background:#eef2f7;padding:20px}
.card{background:white;border-radius:18px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.badge{display:inline-block;padding:6px 12px;border-radius:12px;color:white;background:#22c55e;margin-right:8px}
.strike{background:#f59e0b}
.row{margin:12px 0}
</style>
</head>
<body>
<div class="card">
<h1>🎫 Ticket #${ticket.ticketId}</h1>
<span class="badge">${ticket.estado}</span>
<span class="badge strike">Strike ${ticket.strike || 0}</span>
<div class="row"><b>Tienda:</b> ${ticket.tienda || '-'} </div>
<div class="row"><b>Contacto:</b> ${ticket.contacto || '-'} </div>
<div class="row"><b>Teléfono:</b> ${ticket.telefono || '-'} </div>
<div class="row"><b>Problema:</b> ${ticket.problema || '-'} </div>
<div class="row"><b>Descripción:</b> ${ticket.descripcion || '-'} </div>
</div>
</body>
</html>
`);

});
// ========================================
// V3-005.6
// NAVEGACION INTEGRADA
// ========================================

app.get("/hub", (req, res) => {

res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Hotspot Hub</title>
<style>
body{font-family:Segoe UI;background:#eef2f7;padding:20px}
.card{background:white;border-radius:18px;padding:15px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
a{display:block;padding:10px;text-decoration:none;font-weight:bold;color:#2563eb}
</style>
</head>
<body>
<h1>🏠 Hotspot Operations Hub</h1>
<div class="card">
<a href="/tickets-feed">💬 Feed Operativo</a>
<a href="/ticket/1">🎫 Detalle Ticket</a>
<a href="/api/dashboard-operativo-v3">📊 Dashboard</a>
<a href="/api/recepciones">📦 Recepciones</a>
<a href="/api/strikes">⚠️ Strikes</a>
</div>
</body>
</html>
`);

});
// ========================================
// V3-005.7
// MENU SUPERIOR
// ========================================

// CSS reutilizable para Hub, Feed y Detalle
// Agregar este bloque y reutilizar la clase .topnav

const TOPNAV = `
<div class="topnav">
 <a href="/hub">🏠 Hub</a>
 <a href="/tickets-feed">💬 Feed</a>
 <a href="/ticket/1">🎫 Ticket</a>
 <a href="/api/dashboard-operativo-v3">📊 Dashboard</a>
 <a href="/api/recepciones">📦 Recepciones</a>
 <a href="/api/strikes">⚠ Strikes</a>
</div>
`;

/*
Agregar este CSS en las vistas:

.topnav{
 background:#111827;
 padding:12px;
 border-radius:12px;
 margin-bottom:15px;
}

.topnav a{
 color:white;
 text-decoration:none;
 margin-right:14px;
 font-weight:bold;
}
*/

// ========================================
// V3-006
// SERVICENOW ENDPOINT
// ========================================

app.post("/api/servicenow/ticket", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const nuevo = {
        ticketId: tickets.length > 0
            ? Math.max(...tickets.map(t => t.ticketId || 0)) + 1
            : 1,
        fechaCreacion: new Date().toISOString(),
        origen: "SERVICENOW",
        numero: req.body.numero || "",
        sap: req.body.sap || "",
        tienda: req.body.tienda || "",
        contacto: req.body.contacto || "",
        telefono: req.body.telefono || "",
        problema: req.body.problema || "",
        descripcion: req.body.descripcion || "",
        estado: "ABIERTO",
        strike: 0,
        comentarios: []
    };

    tickets.push(nuevo);
    saveJson("tickets.json", tickets);

    res.status(201).json({
        mensaje: "Ticket recibido",
        ticket: nuevo
    });

});
// ========================================
// V3-005.4
// ACCIONES OPERATIVAS
// ========================================

app.get("/tickets-feed", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const feed = tickets.map(t => `
    <div class="ticket">
        <div class="avatar">📶</div>
        <div class="content">
            <div class="title">${t.tienda || "SIN TIENDA"}</div>
            <div class="problem">${t.problema || "-"}</div>
            <div class="phone">📱 ${t.telefono || "-"}</div>
            <div class="actions">
                <button class="btn-view">👁 Ver</button>
                <button class="btn-strike">⚠ Strike</button>
                <button class="btn-close">✅ Cerrar</button>
            </div>
        </div>
        <div class="badges">
            <span class="estado">${t.estado || "ABIERTO"}</span>
            <span class="strike">Strike ${t.strike || 0}</span>
        </div>
    </div>
    `).join("");

    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Feed Operativo</title><style>
body{font-family:Segoe UI;background:#eef2f7;padding:20px}
.ticket{background:white;border-radius:18px;padding:15px;margin-bottom:12px;display:flex;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.avatar{font-size:34px;margin-right:14px}
.content{flex:1}.title{font-weight:bold;font-size:16px}
.problem{color:#666;margin-top:4px}.phone{margin-top:6px;font-size:13px}
.actions{margin-top:12px}
.actions button{border:none;border-radius:10px;padding:7px 12px;margin-right:6px;cursor:pointer;font-weight:bold}
.btn-view{background:#2563eb;color:white}
.btn-strike{background:#f59e0b;color:white}
.btn-close{background:#22c55e;color:white}
.badges{text-align:right}
.estado{display:block;background:#22c55e;color:white;border-radius:12px;padding:4px 10px;margin-bottom:6px}
.strike{display:block;background:#f59e0b;color:white;border-radius:12px;padding:4px 10px}
</style></head><body><h1>💬 Feed Operativo</h1>${feed || '<p>Sin tickets</p>'}</body></html>`);

});
// ========================================
// V3-006.2
// DETECTOR DUPLICADOS SAP
// ========================================

app.get("/api/tickets/duplicados/:sap", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const duplicados = tickets.filter(
        t => (t.sap || "") === req.params.sap
    );

    res.json({
        sap: req.params.sap,
        total: duplicados.length,
        duplicados
    });

});
// ========================================
// V3-006.3
// VALIDAR DUPLICADO SAP
// ========================================

app.post("/api/servicenow/validar-sap", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const sap = req.body.sap || "";

    const duplicados = tickets.filter(
        t => (t.sap || "") === sap
    );

    res.json({
        sap,
        existe: duplicados.length > 0,
        total: duplicados.length,
        duplicados
    });

});
// ========================================
// V3-006.4
// BLOQUEO DUPLICADO SAP
// ========================================

app.post("/api/servicenow/ticket-seguro", (req, res) => {

    const tickets = readJson("tickets.json", []);
    const sap = req.body.sap || "";

    const existente = tickets.find(
        t => (t.sap || "") === sap
    );

    if (existente) {
        return res.status(409).json({
            mensaje: "SAP duplicado",
            ticket: existente
        });
    }

    const nuevo = {
        ticketId: tickets.length > 0 ? Math.max(...tickets.map(t => t.ticketId || 0)) + 1 : 1,
        fechaCreacion: new Date().toISOString(),
        origen: "SERVICENOW",
        numero: req.body.numero || "",
        sap: sap,
        tienda: req.body.tienda || "",
        contacto: req.body.contacto || "",
        telefono: req.body.telefono || "",
        problema: req.body.problema || "",
        descripcion: req.body.descripcion || "",
        estado: "ABIERTO",
        strike: 0,
        comentarios: []
    };

    tickets.push(nuevo);
    saveJson("tickets.json", tickets);

    res.status(201).json({
        mensaje: "Ticket recibido",
        ticket: nuevo
    });

});
// ========================================
// V3-006.5
// RESUMEN SAP
// ========================================

app.get("/api/tickets/sap/:sap", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const relacionados = tickets.filter(
        t => (t.sap || "") === req.params.sap
    );

    res.json({
        sap: req.params.sap,
        total: relacionados.length,
        tickets: relacionados
    });

});
// ========================================
// V3-006.6
// HISTORIAL SAP
// ========================================

app.get("/api/sap/:sap/historial", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const historial = tickets
        .filter(t => (t.sap || "") === req.params.sap)
        .map(t => ({
            ticketId: t.ticketId,
            numero: t.numero,
            tienda: t.tienda,
            estado: t.estado,
            fechaCreacion: t.fechaCreacion
        }));

    res.json({
        sap: req.params.sap,
        total: historial.length,
        historial
    });

});
// ========================================
// V3-006.7
// RESUMEN GENERAL SAP
// ========================================

app.get("/api/sap", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const resumen = {};

    tickets.forEach(t => {

        const sap = t.sap || "SIN_SAP";

        if (!resumen[sap]) {
            resumen[sap] = 0;
        }

        resumen[sap]++;

    });

    res.json({
        totalSap: Object.keys(resumen).length,
        resumen
    });

});
// ========================================
// V3-006.8
// TOP SAPS
// ========================================

app.get("/api/sap/top", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const contador = {};

    tickets.forEach(t => {
        const sap = t.sap || "SIN_SAP";
        contador[sap] = (contador[sap] || 0) + 1;
    });

    const top = Object.entries(contador)
        .map(([sap,total]) => ({ sap, total }))
        .sort((a,b) => b.total - a.total);

    res.json({
        totalSap: top.length,
        top
    });

});
// ========================================
// V3-006.9
// SAP SIN TICKETS DUPLICADOS
// ========================================

app.get("/api/sap/unicos", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const contador = {};

    tickets.forEach(t => {
        const sap = t.sap || "SIN_SAP";
        contador[sap] = (contador[sap] || 0) + 1;
    });

    const unicos = Object.entries(contador)
        .filter(([sap,total]) => total === 1)
        .map(([sap,total]) => ({ sap, total }));

    res.json({
        total: unicos.length,
        unicos
    });

});
// ========================================
// V3-007.0
// BUSCAR SAP
// ========================================

app.get("/api/sap/buscar/:sap", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const ticket = tickets.find(
        t => (t.sap || "") === req.params.sap
    );

    if (!ticket) {
        return res.status(404).json({
            mensaje: "SAP no encontrado"
        });
    }

    res.json(ticket);

});
// ========================================
// V3-007.1
// BUSCAR TIENDA
// ========================================

app.get("/api/tienda/buscar/:tienda", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const encontrados = tickets.filter(
        t => (t.tienda || "") === req.params.tienda
    );

    res.json({
        tienda: req.params.tienda,
        total: encontrados.length,
        tickets: encontrados
    });

});
// ========================================
// V3-007.2
// BUSCAR TELEFONO
// ========================================

app.get("/api/telefono/buscar/:telefono", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const encontrados = tickets.filter(
        t => (t.telefono || "") === req.params.telefono
    );

    res.json({
        telefono: req.params.telefono,
        total: encontrados.length,
        tickets: encontrados
    });

});
// ========================================
// V3-007.3
// BUSCAR CONTACTO
// ========================================

app.get("/api/contacto/buscar/:contacto", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const encontrados = tickets.filter(
        t => (t.contacto || "") === req.params.contacto
    );

    res.json({
        contacto: req.params.contacto,
        total: encontrados.length,
        tickets: encontrados
    });

});
// ========================================
// V3-007.4
// BUSCAR PROBLEMA
// ========================================

app.get("/api/problema/buscar/:problema", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const encontrados = tickets.filter(
        t => (t.problema || "") === req.params.problema
    );

    res.json({
        problema: req.params.problema,
        total: encontrados.length,
        tickets: encontrados
    });

});
// ========================================
// V3-007.5
// BUSCAR ESTADO
// ========================================

app.get("/api/estado/buscar/:estado", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const encontrados = tickets.filter(
        t => (t.estado || "") === req.params.estado
    );

    res.json({
        estado: req.params.estado,
        total: encontrados.length,
        tickets: encontrados
    });

});
// ========================================
// V3-007.6
// BUSCAR NUMERO TICKET
// ========================================

app.get("/api/numero/buscar/:numero", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const encontrados = tickets.filter(
        t => (t.numero || "") === req.params.numero
    );

    res.json({
        numero: req.params.numero,
        total: encontrados.length,
        tickets: encontrados
    });

});

// ========================================
// V3-007.7
// BUSCAR ORIGEN
// ========================================

app.get("/api/origen/buscar/:origen", (req, res) => {

    const tickets = readJson("tickets.json", []);

    const encontrados = tickets.filter(
        t => (t.origen || "") === req.params.origen
    );

    res.json({
        origen: req.params.origen,
        total: encontrados.length,
        tickets: encontrados
    });

});

// ========================================
// V3-007.8
// RESUMEN BUSQUEDAS
// ========================================

app.get("/api/busquedas/resumen", (req, res) => {

    const tickets = readJson("tickets.json", []);

    res.json({
        totalTickets: tickets.length,
        conSap: tickets.filter(t => t.sap).length,
        conNumero: tickets.filter(t => t.numero).length,
        abiertos: tickets.filter(t => t.estado === "ABIERTO").length,
        servicenow: tickets.filter(t => t.origen === "SERVICENOW").length
    });

});
// ========================================
// V3-008.0
// DASHBOARD SERVICENOW BASE
// ========================================

app.get("/dashboard-servicenow", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 const total=tickets.length;
 const servicenow=tickets.filter(t=>t.origen==="SERVICENOW").length;
 const abiertos=tickets.filter(t=>t.estado==="ABIERTO").length;
 const conSap=tickets.filter(t=>t.sap).length;
 res.send({total,servicenow,abiertos,conSap});
});

// ========================================
// V3-008.1 TOTAL TICKETS
// ========================================

app.get("/api/dashboard/total-tickets",(req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({total:tickets.length});
});

// ========================================
// V3-008.2 TOTAL SERVICENOW
// ========================================

app.get("/api/dashboard/servicenow",(req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({total:tickets.filter(t=>t.origen==="SERVICENOW").length});
});

// ========================================
// V3-008.3 TOTAL ABIERTOS
// ========================================

app.get("/api/dashboard/abiertos",(req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({total:tickets.filter(t=>t.estado==="ABIERTO").length});
});

// ========================================
// V3-008.4 TOTAL SAP
// ========================================

app.get("/api/dashboard/sap",(req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({total:tickets.filter(t=>t.sap).length});
});

// ========================================
// V3-008.5 RESUMEN VISUAL
// ========================================

app.get("/api/dashboard/resumen",(req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({
  totalTickets:tickets.length,
  totalServiceNow:tickets.filter(t=>t.origen==="SERVICENOW").length,
  totalAbiertos:tickets.filter(t=>t.estado==="ABIERTO").length,
  totalSap:tickets.filter(t=>t.sap).length
 });
});
// ========================================
// V3-009.0
// ALERTAS BASE
// ========================================

app.get("/api/alertas/base", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 const alertas=[];
 tickets.forEach(t=>{
  if(t.estado==="ABIERTO"){
   alertas.push({tipo:"TICKET_ABIERTO",ticketId:t.ticketId});
  }
 });
 res.json({total:alertas.length,alertas});
});

// ========================================
// V3-009.1 ALERTAS ABIERTOS
// ========================================
app.get("/api/alertas/abiertos",(req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json(tickets.filter(t=>t.estado==="ABIERTO"));
});

// ========================================
// V3-009.2 ALERTAS DUPLICADOS
// ========================================
app.get("/api/alertas/duplicados",(req,res)=>{
 const tickets=readJson("tickets.json",[]);
 const contador={};
 tickets.forEach(t=>{if(t.sap) contador[t.sap]=(contador[t.sap]||0)+1;});
 const dup=Object.entries(contador).filter(([k,v])=>v>1);
 res.json({total:dup.length,duplicados:dup});
});

// ========================================
// V3-009.3 ALERTAS SIN SAP
// ========================================
app.get("/api/alertas/sin-sap",(req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json(tickets.filter(t=>!t.sap));
});

// ========================================
// V3-009.4 RESUMEN ALERTAS
// ========================================
app.get("/api/alertas/resumen",(req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({
  abiertos:tickets.filter(t=>t.estado==='ABIERTO').length,
  sinSap:tickets.filter(t=>!t.sap).length
 });
});


app.get("/api/debug-version", (req, res) => {
    res.json({
        version: "DEBUG-07072026",
        archivo: "index.js"
    });
});
// ========================================
// V3-010.0
// DUPLICADOS AUTOMATICOS BASE
// ========================================

app.get("/api/duplicados", (req,res)=>{

 const tickets = readJson("tickets.json", []);
 const contador = {};

 tickets.forEach(t=>{
   if(t.sap){
      contador[t.sap]=(contador[t.sap]||0)+1;
   }
 });

 const duplicados = Object.entries(contador)
   .filter(([sap,total])=>total>1)
   .map(([sap,total])=>({sap,total}));

 res.json({
   total: duplicados.length,
   duplicados
 });

});

// ========================================
// V3-010.1
// DUPLICADOS SAP
// ========================================

app.get("/api/duplicados/sap",(req,res)=>{
 const tickets = readJson("tickets.json", []);
 const contador = {};
 tickets.forEach(t=>{
   if(t.sap){
     contador[t.sap]=(contador[t.sap]||0)+1;
   }
 });
 res.json(contador);
});

// ========================================
// V3-010.2
// DUPLICADOS TELEFONO
// ========================================

app.get("/api/duplicados/telefono",(req,res)=>{
 const tickets = readJson("tickets.json", []);
 const contador = {};
 tickets.forEach(t=>{
   if(t.telefono){
     contador[t.telefono]=(contador[t.telefono]||0)+1;
   }
 });
 res.json(contador);
});

// ========================================
// V3-010.3
// DUPLICADOS TIENDA
// ========================================

app.get("/api/duplicados/tienda",(req,res)=>{
 const tickets = readJson("tickets.json", []);
 const contador = {};
 tickets.forEach(t=>{
   if(t.tienda){
     contador[t.tienda]=(contador[t.tienda]||0)+1;
   }
 });
 res.json(contador);
});

// ========================================
// V3-010.4
// RESUMEN DUPLICADOS
// ========================================

app.get("/api/duplicados/resumen",(req,res)=>{
 const tickets = readJson("tickets.json", []);
 res.json({
   totalTickets: tickets.length,
   conSap: tickets.filter(t=>t.sap).length,
   sinSap: tickets.filter(t=>!t.sap).length
 });
});
// ========================================
// V3-011.0
// METRICAS BASE
// ========================================

app.get("/api/metricas", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({totalTickets:tickets.length});
});

// ========================================
// V3-011.1
// TICKETS POR ESTADO
// ========================================

app.get("/api/metricas/estado", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 const estados={};
 tickets.forEach(t=>{
   const e=t.estado||"SIN_ESTADO";
   estados[e]=(estados[e]||0)+1;
 });
 res.json(estados);
});

// ========================================
// V3-011.2
// TICKETS POR ORIGEN
// ========================================

app.get("/api/metricas/origen", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 const origenes={};
 tickets.forEach(t=>{
   const o=t.origen||"SIN_ORIGEN";
   origenes[o]=(origenes[o]||0)+1;
 });
 res.json(origenes);
});

// ========================================
// V3-011.3
// TICKETS CON SAP
// ========================================

app.get("/api/metricas/con-sap", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({total:tickets.filter(t=>t.sap).length});
});

// ========================================
// V3-011.4
// TICKETS SIN SAP
// ========================================

app.get("/api/metricas/sin-sap", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({total:tickets.filter(t=>!t.sap).length});
});

// ========================================
// V3-011.5
// RESUMEN OPERATIVO
// ========================================

app.get("/api/metricas/resumen", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({
   totalTickets:tickets.length,
   abiertos:tickets.filter(t=>t.estado==="ABIERTO").length,
   conSap:tickets.filter(t=>t.sap).length,
   sinSap:tickets.filter(t=>!t.sap).length,
   serviceNow:tickets.filter(t=>t.origen==="SERVICENOW").length
 });
});
// ========================================
// V3-012.0
// ESTADISTICAS BASE
// ========================================

app.get("/api/estadisticas", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({totalTickets:tickets.length});
});

// ========================================
// V3-012.1
// TOP TIENDAS
// ========================================

app.get("/api/estadisticas/top-tiendas", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 const data={};
 tickets.forEach(t=>{
  const k=t.tienda||"SIN_TIENDA";
  data[k]=(data[k]||0)+1;
 });
 res.json(data);
});

// ========================================
// V3-012.2
// TOP PROBLEMAS
// ========================================

app.get("/api/estadisticas/top-problemas", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 const data={};
 tickets.forEach(t=>{
  const k=t.problema||"SIN_PROBLEMA";
  data[k]=(data[k]||0)+1;
 });
 res.json(data);
});

// ========================================
// V3-012.3
// TOP ORIGENES
// ========================================

app.get("/api/estadisticas/top-origenes", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 const data={};
 tickets.forEach(t=>{
  const k=t.origen||"SIN_ORIGEN";
  data[k]=(data[k]||0)+1;
 });
 res.json(data);
});

// ========================================
// V3-012.4
// TOP CONTACTOS
// ========================================

app.get("/api/estadisticas/top-contactos", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 const data={};
 tickets.forEach(t=>{
  const k=t.contacto||"SIN_CONTACTO";
  data[k]=(data[k]||0)+1;
 });
 res.json(data);
});

// ========================================
// V3-012.5
// RESUMEN ESTADISTICO
// ========================================

app.get("/api/estadisticas/resumen", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({
  totalTickets:tickets.length,
  totalTiendas:new Set(tickets.map(t=>t.tienda).filter(Boolean)).size,
  totalProblemas:new Set(tickets.map(t=>t.problema).filter(Boolean)).size,
  totalContactos:new Set(tickets.map(t=>t.contacto).filter(Boolean)).size
 });
});
// ========================================
// V3-013.0
// EXPORTACION BASE
// ========================================

app.get("/api/exportacion", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({totalTickets:tickets.length,exportacion:true});
});

// ========================================
// V3-013.1
// EXPORTAR TICKETS
// ========================================

app.get("/api/exportacion/tickets", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json(tickets);
});

// ========================================
// V3-013.2
// EXPORTAR SAP
// ========================================

app.get("/api/exportacion/sap", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json(tickets.filter(t=>t.sap));
});

// ========================================
// V3-013.3
// EXPORTAR METRICAS
// ========================================

app.get("/api/exportacion/metricas", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({
  totalTickets:tickets.length,
  conSap:tickets.filter(t=>t.sap).length,
  sinSap:tickets.filter(t=>!t.sap).length
 });
});

// ========================================
// V3-013.4
// EXPORTAR ESTADISTICAS
// ========================================

app.get("/api/exportacion/estadisticas", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({
  totalTiendas:new Set(tickets.map(t=>t.tienda).filter(Boolean)).size,
  totalProblemas:new Set(tickets.map(t=>t.problema).filter(Boolean)).size,
  totalContactos:new Set(tickets.map(t=>t.contacto).filter(Boolean)).size
 });
});

// ========================================
// V3-013.5
// RESUMEN EXPORTACION
// ========================================

app.get("/api/exportacion/resumen", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({
  tickets:tickets.length,
  exportables:tickets.length,
  fecha:new Date().toISOString()
 });
});
// ========================================
// V3-014.0
// API CONSOLIDADA BASE
// ========================================

app.get("/api/consolidada", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({totalTickets:tickets.length});
});

// ========================================
// V3-014.1
// RESUMEN GENERAL
// ========================================

app.get("/api/consolidada/resumen", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({
  totalTickets:tickets.length,
  abiertos:tickets.filter(t=>t.estado==="ABIERTO").length,
  conSap:tickets.filter(t=>t.sap).length
 });
});

// ========================================
// V3-014.2
// DASHBOARD CONSOLIDADO
// ========================================

app.get("/api/consolidada/dashboard", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({
  tickets:tickets.length,
  serviceNow:tickets.filter(t=>t.origen==="SERVICENOW").length,
  sinSap:tickets.filter(t=>!t.sap).length
 });
});

// ========================================
// V3-014.3
// ALERTAS CONSOLIDADAS
// ========================================

app.get("/api/consolidada/alertas", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({
  abiertos:tickets.filter(t=>t.estado==="ABIERTO").length,
  sinSap:tickets.filter(t=>!t.sap).length
 });
});

// ========================================
// V3-014.4
// METRICAS CONSOLIDADAS
// ========================================

app.get("/api/consolidada/metricas", (req,res)=>{
 const tickets=readJson("tickets.json",[]);
 res.json({
  total:tickets.length,
  tiendas:new Set(tickets.map(t=>t.tienda).filter(Boolean)).size,
  problemas:new Set(tickets.map(t=>t.problema).filter(Boolean)).size
 });
});

// ========================================
// V3-014.5
// ESTADO GENERAL SISTEMA
// ========================================

app.get("/api/consolidada/estado", (req,res)=>{
 res.json({
  sistema:"OK",
  version:"V3-014",
  modulo:"API_CONSOLIDADA"
 });
});
// =====================================================
// PACK FINAL V3-015 -> V3-020
// AUDITORIA, TIMELINE, SEGUIMIENTO,
// COMENTARIOS, FEED OPERATIVO, API FINAL
// =====================================================

// V3-015 AUDITORIA
app.get("/api/auditoria",(req,res)=>res.json({modulo:"AUDITORIA",version:"V3-015"}));
app.get("/api/auditoria/resumen",(req,res)=>res.json({ok:true}));
app.get("/api/auditoria/eventos",(req,res)=>res.json([]));
app.get("/api/auditoria/eventos/hoy",(req,res)=>res.json([]));
app.get("/api/auditoria/eventos/semana",(req,res)=>res.json([]));
app.get("/api/auditoria/ultimos",(req,res)=>res.json([]));
app.get("/api/auditoria/ticket/:id",(req,res)=>res.json({ticket:req.params.id,eventos:[]}));
app.get("/api/auditoria/usuario/:usuario",(req,res)=>res.json({usuario:req.params.usuario,eventos:[]}));

// V3-016 TIMELINE
app.get("/api/timeline",(req,res)=>res.json([]));
app.get("/api/timeline/resumen",(req,res)=>res.json({ok:true}));
app.get("/api/timeline/hoy",(req,res)=>res.json([]));
app.get("/api/timeline/semana",(req,res)=>res.json([]));
app.get("/api/timeline/ticket/:id",(req,res)=>res.json({ticket:req.params.id,timeline:[]}));
app.get("/api/timeline/ticket/:id/completo",(req,res)=>res.json({ticket:req.params.id,detalle:true}));

// V3-017 SEGUIMIENTO
app.get("/api/seguimiento",(req,res)=>res.json([]));
app.get("/api/seguimiento/resumen",(req,res)=>res.json({ok:true}));
app.get("/api/seguimiento/abiertos",(req,res)=>res.json([]));
app.get("/api/seguimiento/asignados",(req,res)=>res.json([]));
app.get("/api/seguimiento/pendientes",(req,res)=>res.json([]));
app.get("/api/seguimiento/criticos",(req,res)=>res.json([]));
app.get("/api/seguimiento/strike1",(req,res)=>res.json([]));
app.get("/api/seguimiento/strike2",(req,res)=>res.json([]));
app.get("/api/seguimiento/strike3",(req,res)=>res.json([]));

// V3-018 COMENTARIOS
app.get("/api/comentarios",(req,res)=>res.json([]));
app.get("/api/comentarios/resumen",(req,res)=>res.json({total:0}));
app.get("/api/comentarios/hoy",(req,res)=>res.json([]));
app.get("/api/comentarios/ultimos",(req,res)=>res.json([]));
app.get("/api/comentarios/ticket/:id",(req,res)=>res.json({ticket:req.params.id,comentarios:[]}));

// V3-019 FEED OPERATIVO
app.get("/api/feed",(req,res)=>res.json([]));
app.get("/api/feed/resumen",(req,res)=>res.json({ok:true}));
app.get("/api/feed/reciente",(req,res)=>res.json([]));
app.get("/api/feed/tickets",(req,res)=>res.json([]));
app.get("/api/feed/alertas",(req,res)=>res.json([]));
app.get("/api/feed/comentarios",(req,res)=>res.json([]));
app.get("/api/feed/servicenow",(req,res)=>res.json([]));

// V3-020 API FINAL
app.get("/api/final",(req,res)=>res.json({version:"V3-020"}));
app.get("/api/final/dashboard",(req,res)=>res.json({ok:true}));
app.get("/api/final/tickets",(req,res)=>res.json([]));
app.get("/api/final/inventario",(req,res)=>res.json([]));
app.get("/api/final/operacion",(req,res)=>res.json({ok:true}));
app.get("/api/final/resumen",(req,res)=>res.json({ok:true}));
app.get("/api/final/health",(req,res)=>res.json({status:"UP"}));


// ========================================
// V4-001 FICHA DE TICKET OPERATIVA
// ========================================

// V4-001.1 TICKET
app.get("/api/ticket/:id",(req,res)=>{
 const tickets = readJson("tickets.json",[]);
 const ticket=tickets.find(t=>String(t.ticketId)===String(req.params.id));
 if(!ticket){
  return res.status(404).json({error:"Ticket no encontrado"});
 }
 res.json(ticket);
});

// V4-001.2 CONTACTO
app.get("/api/ticket/:id/contacto",(req,res)=>{
 const tickets=readJson("tickets.json",[]);
 const ticket=tickets.find(t=>String(t.ticketId)===String(req.params.id));
 if(!ticket){
  return res.status(404).json({error:"Ticket no encontrado"});
 }
 res.json({
  contacto:ticket.contacto,
  telefono:ticket.telefono
 });
});

// V4-001.3 HOTSPOT ACTUAL
app.get("/api/ticket/:id/hotspot",(req,res)=>{
 res.json({
  serie:null,
  imei:null,
  mac:null,
  carrier:null,
  iccid:null,
  numero:null,
  imsi:null
 });
});

// V4-001.4 LINEA
app.get("/api/ticket/:id/linea",(req,res)=>{
 res.json({
  estatus:"SIN_VALIDAR",
  fuente:"JASPER"
 });
});

// V4-001.5 DIAGNOSTICO
app.get("/api/ticket/:id/diagnostico",(req,res)=>{
 res.json({
  causa:null,
  solucion:null,
  comentarios:null
 });
});

// V4-001.6 RESUMEN OPERATIVO
app.get("/api/ticket/:id/resumen",(req,res)=>{
 const tickets=readJson("tickets.json",[]);
 const ticket=tickets.find(t=>String(t.ticketId)===String(req.params.id));
 if(!ticket){
  return res.status(404).json({error:"Ticket no encontrado"});
 }
 res.json({
  ticketId:ticket.ticketId,
  tienda:ticket.tienda,
  sap:ticket.sap,
  contacto:ticket.contacto,
  telefono:ticket.telefono,
  problema:ticket.problema,
  estado:ticket.estado
 });
});
// ========================================
// V4-002 CRUCE IMEI -> ICCID
// ========================================

// V4-002.1 BUSCAR IMEI
app.get("/api/cruce/imei/:imei",(req,res)=>{
 res.json({
  imei:req.params.imei,
  iccid:null,
  numero:null,
  imsi:null,
  carrier:null
 });
});

// V4-002.2 BUSCAR ICCID
app.get("/api/cruce/iccid/:iccid",(req,res)=>{
 res.json({
  iccid:req.params.iccid,
  imei:null,
  numero:null,
  imsi:null,
  carrier:null
 });
});

// V4-002.3 BUSCAR NUMERO
app.get("/api/cruce/numero/:numero",(req,res)=>{
 res.json({
  numero:req.params.numero,
  iccid:null,
  imei:null,
  imsi:null,
  carrier:null
 });
});

// V4-002.4 BUSCAR IMSI
app.get("/api/cruce/imsi/:imsi",(req,res)=>{
 res.json({
  imsi:req.params.imsi,
  iccid:null,
  imei:null,
  numero:null,
  carrier:null
 });
});

// V4-002.5 RESUMEN CRUCE
app.get("/api/cruce/resumen",(req,res)=>{
 res.json({
  modulo:"CRUCE_IMEI_ICCID",
  estado:"OPERATIVO"
 });
});
// ========================================
// V4-003 JASPER PACK
// ========================================

// V4-003.1 CONSULTA ESTADO LINEA
app.get("/api/jasper/iccid/:iccid",(req,res)=>{
 res.json({
  iccid:req.params.iccid,
  estado:"SIN_VALIDAR",
  sesion:"DESCONOCIDA"
 });
});

// V4-003.2 VALIDAR LINEA
app.get("/api/jasper/validar/:iccid",(req,res)=>{
 res.json({
  iccid:req.params.iccid,
  valida:true,
  mensaje:"PENDIENTE_JASPER_REAL"
 });
});

// V4-003.3 COMPARAR CRUCE VS JASPER
app.get("/api/jasper/comparar/:iccid",(req,res)=>{
 res.json({
  iccid:req.params.iccid,
  cruce:"NO_VALIDADO",
  jasper:"NO_VALIDADO",
  coincide:false
 });
});

// V4-003.4 ESTATUS OPERATIVOS
app.get("/api/jasper/estatus",(req,res)=>{
 res.json([
  "ACTIVA",
  "SUSPENDIDA",
  "CANCELADA",
  "SIN_SESION"
 ]);
});

// V4-003.5 RESUMEN JASPER
app.get("/api/jasper/resumen",(req,res)=>{
 res.json({
  modulo:"JASPER",
  estado:"OPERATIVO",
  integracion:"PENDIENTE"
 });
});
// ========================================
// V4-004 WHATSAPP OPERATIVO PACK
// ========================================

// V4-004.1 OBTENER WHATSAPP TICKET
app.get("/api/whatsapp/ticket/:id",(req,res)=>{
 const tickets=readJson("tickets.json",[]);
 const ticket=tickets.find(t=>String(t.ticketId)===String(req.params.id));
 if(!ticket){
  return res.status(404).json({error:"Ticket no encontrado"});
 }
 res.json({
  ticketId:ticket.ticketId,
  contacto:ticket.contacto,
  telefono:ticket.telefono
 });
});

// V4-004.2 LINK DIRECTO WHATSAPP
app.get("/api/whatsapp/link/:telefono",(req,res)=>{
 res.json({
  telefono:req.params.telefono,
  link:`https://wa.me/52${req.params.telefono}`
 });
});

// V4-004.3 PLANTILLA PRIMER CONTACTO
app.get("/api/whatsapp/plantilla/primer-contacto",(req,res)=>{
 res.json({
  tipo:"PRIMER_CONTACTO",
  mensaje:"Buen dia, habla Soporte Hotspot. Se genero un ticket de conectividad. Comparta fotos del modem y numeros de serie por favor."
 });
});

// V4-004.4 PLANTILLA STRIKE
app.get("/api/whatsapp/plantilla/strike/:nivel",(req,res)=>{
 res.json({
  strike:req.params.nivel,
  mensaje:`STRIKE ${req.params.nivel}: Seguimos sin respuesta del contacto para continuar con la validacion.`
 });
});

// V4-004.5 RESUMEN WHATSAPP
app.get("/api/whatsapp/resumen",(req,res)=>{
 res.json({
  modulo:"WHATSAPP_OPERATIVO",
  estado:"OPERATIVO"
 });
});
// ========================================
// V4-005 REEMPLAZOS PACK
// ========================================

// V4-005.1 EQUIPO ACTUAL
app.get("/api/reemplazos/actual/:ticketId",(req,res)=>{
 res.json({
  ticketId:req.params.ticketId,
  serie:null,
  imei:null,
  iccid:null,
  carrier:null
 });
});

// V4-005.2 EQUIPO NUEVO
app.get("/api/reemplazos/nuevo/:ticketId",(req,res)=>{
 res.json({
  ticketId:req.params.ticketId,
  serie:null,
  imei:null,
  iccid:null,
  carrier:null
 });
});

// V4-005.3 COMPARAR REEMPLAZO
app.get("/api/reemplazos/comparar/:ticketId",(req,res)=>{
 res.json({
  ticketId:req.params.ticketId,
  reemplazo:false,
  actual:null,
  nuevo:null
 });
});

// V4-005.4 HISTORIAL REEMPLAZOS
app.get("/api/reemplazos/historial",(req,res)=>{
 res.json([]);
});

// V4-005.5 RESUMEN REEMPLAZOS
app.get("/api/reemplazos/resumen",(req,res)=>{
 res.json({
  modulo:"REEMPLAZOS",
  estado:"OPERATIVO"
 });
});
// ========================================
// V4-006 TIMELINE REAL PACK (HOTFIX)
// IMPORTANTE: RUTAS ESPECIFICAS PRIMERO
// ========================================

// V4-006.4 RESUMEN TIMELINE
app.get("/api/timeline-real/resumen",(req,res)=>{
 res.json({
  modulo:"TIMELINE_REAL",
  estado:"OPERATIVO"
 });
});

// V4-006.5 EVENTOS OPERATIVOS
app.get("/api/timeline-real/catalogo",(req,res)=>{
 res.json([
  "TICKET_CREADO",
  "ASIGNADO",
  "WHATSAPP_ENVIADO",
  "FOTO_RECIBIDA",
  "IMEI_VALIDADO",
  "JASPER_CONSULTADO",
  "STRIKE_1",
  "STRIKE_2",
  "STRIKE_3",
  "REEMPLAZO",
  "TICKET_CERRADO"
 ]);
});

// V4-006.2 EVENTOS TICKET
app.get("/api/timeline-real/:ticketId/eventos",(req,res)=>{
 res.json([]);
});

// V4-006.3 ULTIMA ACTIVIDAD
app.get("/api/timeline-real/:ticketId/ultima",(req,res)=>{
 res.json({
  ticketId:req.params.ticketId,
  actividad:null
 });
});

// V4-006.1 TIMELINE GENERAL
// DEBE IR AL FINAL
app.get("/api/timeline-real/:ticketId",(req,res)=>{
 res.json({
  ticketId:req.params.ticketId,
  eventos:[]
 });
});
// ========================================
// V4-007 FEED OPERATIVO PACK
// ========================================

// V4-007.1 FEED GENERAL
app.get("/api/feed-operativo",(req,res)=>{
 res.json([]);
});

// V4-007.2 FEED POR TICKET
app.get("/api/feed-operativo/ticket/:ticketId",(req,res)=>{
 res.json({
  ticketId:req.params.ticketId,
  eventos:[]
 });
});

// V4-007.3 EVENTOS RECIENTES
app.get("/api/feed-operativo/recientes",(req,res)=>{
 res.json([]);
});

// V4-007.4 ALERTAS OPERATIVAS
app.get("/api/feed-operativo/alertas",(req,res)=>{
 res.json([]);
});

// V4-007.5 RESUMEN FEED
app.get("/api/feed-operativo/resumen",(req,res)=>{
 res.json({
  modulo:"FEED_OPERATIVO",
  estado:"OPERATIVO"
 });
});

// V4-007.6 CATALOGO EVENTOS
app.get("/api/feed-operativo/catalogo",(req,res)=>{
 res.json([
  "TICKET_CREADO",
  "WHATSAPP_ENVIADO",
  "FOTO_RECIBIDA",
  "IMEI_VALIDADO",
  "JASPER_CONSULTADO",
  "STRIKE_1",
  "STRIKE_2",
  "STRIKE_3",
  "REEMPLAZO",
  "TICKET_CERRADO"
 ]);
});
// ========================================
// V4-009 DIAGNOSTICO PACK
// ========================================

// V4-009.1 DIAGNOSTICO POR TICKET
app.get("/api/diagnostico/ticket/:ticketId",(req,res)=>{
 res.json({
  ticketId:req.params.ticketId,
  causa:null,
  solucion:null,
  comentarios:null
 });
});

// V4-009.2 CAUSAS COMUNES
app.get("/api/diagnostico/causas",(req,res)=>{
 res.json([
  "SIN_SESION",
  "SIM_SUSPENDIDA",
  "SIM_CANCELADA",
  "FALLA_MODEM",
  "FALLA_COBERTURA",
  "CONFIGURACION"
 ]);
});

// V4-009.3 SOLUCIONES COMUNES
app.get("/api/diagnostico/soluciones",(req,res)=>{
 res.json([
  "REINICIO",
  "CAMBIO_SIM",
  "REEMPLAZO_MODEM",
  "VALIDACION_JASPER",
  "VALIDACION_COBERTURA"
 ]);
});

// V4-009.4 DIAGNOSTICOS RECIENTES
app.get("/api/diagnostico/recientes",(req,res)=>{
 res.json([]);
});

// V4-009.5 RESUMEN DIAGNOSTICO
app.get("/api/diagnostico/resumen",(req,res)=>{
 res.json({
  modulo:"DIAGNOSTICO",
  estado:"OPERATIVO"
 });
});
// ========================================
// V4-010 TIMELINE PERSISTENTE PACK
// ========================================

// V4-010.1 TIMELINE STORAGE
function getTimeline() {
    return readJson("timeline.json", []);
}

function saveTimeline(data) {
    saveJson("timeline.json", data);
}

// V4-010.2 CREAR EVENTO TIMELINE
function agregarEventoTimeline(
    ticketId,
    tipo,
    detalle
) {
    const timeline = getTimeline();

    timeline.push({
        eventoId:
            timeline.length > 0
                ? Math.max(
                    ...timeline.map(
                        x => x.eventoId || 0
                    )
                ) + 1
                : 1,
        ticketId,
        tipo,
        detalle,
        fecha: new Date().toISOString()
    });

    saveTimeline(timeline);
}

// V4-010.3 LISTAR TIMELINE
app.get(
    "/api/timeline-real",
    (req, res) => {
        const timeline =
            getTimeline();

        res.json({
            total: timeline.length,
            eventos: timeline
        });
    }
);

// V4-010.4 TIMELINE POR TICKET
app.get(
    "/api/timeline-real/:ticketId",
    (req, res) => {

        const timeline =
            getTimeline();

        const eventos =
            timeline.filter(
                x =>
                    String(
                        x.ticketId
                    ) ===
                    String(
                        req.params.ticketId
                    )
            );

        res.json({
            ticketId:
                req.params.ticketId,
            total:
                eventos.length,
            eventos
        });
    }
);

// V4-010.5 CREAR EVENTO MANUAL
app.post(
    "/api/timeline-real",
    (req, res) => {

        const timeline =
            getTimeline();

        const nuevo = {
            eventoId:
                timeline.length > 0
                    ? Math.max(
                        ...timeline.map(
                            x =>
                                x.eventoId || 0
                        )
                    ) + 1
                    : 1,
            ticketId:
                req.body.ticketId,
            tipo:
                req.body.tipo ||
                "EVENTO",
            detalle:
                req.body.detalle ||
                "",
            fecha:
                new Date()
                    .toISOString()
        };

        timeline.push(nuevo);

        saveTimeline(timeline);

        res.status(201).json(nuevo);
    }
);

// V4-010.6 RESUMEN TIMELINE
app.get(
    "/api/timeline-real/resumen",
    (req, res) => {

        const timeline =
            getTimeline();

        res.json({
            modulo:
                "TIMELINE_PERSISTENTE",
            estado:
                "OPERATIVO",
            eventos:
                timeline.length
        });
    }
);
// ========================================
// HOTFIX V4-010.1
// EVITAR CONFLICTO CON V4-006
// ========================================

// AGREGAR DEBAJO DEL PACK V4-010

// ========================================
// V4-010.1A
// TIMELINE PERSISTENTE V2
// ========================================

app.get(
    "/api/timeline-store",
    (req, res) => {
        const timeline = readJson(
            "timeline.json",
            []
        );

        res.json({
            total: timeline.length,
            eventos: timeline
        });
    }
);

app.get(
    "/api/timeline-store/:ticketId",
    (req, res) => {
        const timeline = readJson(
            "timeline.json",
            []
        );

        const eventos = timeline.filter(
            x => String(x.ticketId) === String(req.params.ticketId)
        );

        res.json({
            ticketId: req.params.ticketId,
            total: eventos.length,
            eventos
        });
    }
);

app.post(
    "/api/timeline-store",
    (req, res) => {
        const timeline = readJson(
            "timeline.json",
            []
        );

        const nuevo = {
            eventoId:
                timeline.length > 0
                    ? Math.max(
                        ...timeline.map(
                            x => x.eventoId || 0
                        )
                    ) + 1
                    : 1,
            ticketId: req.body.ticketId,
            tipo: req.body.tipo || "EVENTO",
            detalle: req.body.detalle || "",
            fecha: new Date().toISOString()
        };

        timeline.push(nuevo);

        saveJson(
            "timeline.json",
            timeline
        );

        res.status(201).json(nuevo);
    }
);

app.get(
    "/api/timeline-store/resumen",
    (req, res) => {
        const timeline = readJson(
            "timeline.json",
            []
        );

        res.json({
            modulo: "TIMELINE_STORE",
            estado: "OPERATIVO",
            eventos: timeline.length
        });
    }
);
// ========================================
// V4-011 SEGUIMIENTO OPERATIVO REAL
// ========================================

app.get("/api/seguimiento-real", (req, res) => {

    const seguimiento =
        readJson("seguimiento.json", []);

    res.json({
        total: seguimiento.length,
        seguimiento
    });

});

app.get(
    "/api/seguimiento-real/:ticketId",
    (req, res) => {

        const seguimiento =
            readJson("seguimiento.json", []);

        const historial =
            seguimiento.filter(
                x =>
                    String(x.ticketId) ===
                    String(req.params.ticketId)
            );

        res.json({
            ticketId: req.params.ticketId,
            total: historial.length,
            seguimiento: historial
        });

    }
);

app.post(
    "/api/seguimiento-real",
    (req, res) => {

        const seguimiento =
            readJson("seguimiento.json", []);

        const nuevo = {

            seguimientoId:
                seguimiento.length > 0
                    ? Math.max(
                        ...seguimiento.map(
                            x => x.seguimientoId || 0
                        )
                    ) + 1
                    : 1,

            ticketId:
                req.body.ticketId,

            tipo:
                req.body.tipo ||
                "SEGUIMIENTO",

            comentario:
                req.body.comentario ||
                "",

            fecha:
                new Date().toISOString()

        };

        seguimiento.push(nuevo);

        saveJson(
            "seguimiento.json",
            seguimiento
        );

        res.status(201).json(nuevo);

    }
);

app.get(
    "/api/seguimiento-real-resumen",
    (req, res) => {

        const seguimiento =
            readJson("seguimiento.json", []);

        res.json({
            modulo: "SEGUIMIENTO_REAL",
            estado: "OPERATIVO",
            registros: seguimiento.length
        });

    }
);
// ========================================
// V4-012 COMENTARIOS OPERATIVOS REALES
// ========================================

app.get("/api/comentarios-real", (req, res) => {

    const comentarios =
        readJson("comentarios.json", []);

    res.json({
        total: comentarios.length,
        comentarios
    });

});

app.get(
    "/api/comentarios-real/ticket/:ticketId",
    (req, res) => {

        const comentarios =
            readJson("comentarios.json", []);

        const historial = comentarios.filter(
            x => String(x.ticketId) ===
                 String(req.params.ticketId)
        );

        res.json({
            ticketId: req.params.ticketId,
            total: historial.length,
            comentarios: historial
        });

    }
);

app.post(
    "/api/comentarios-real",
    (req, res) => {

        const comentarios =
            readJson("comentarios.json", []);

        const nuevo = {

            comentarioId:
                comentarios.length > 0
                ? Math.max(
                    ...comentarios.map(
                        x => x.comentarioId || 0
                    )
                ) + 1
                : 1,

            ticketId:
                req.body.ticketId,

            comentario:
                req.body.comentario || "",

            autor:
                req.body.autor || "OPERADOR",

            fecha:
                new Date().toISOString()

        };

        comentarios.push(nuevo);

        saveJson(
            "comentarios.json",
            comentarios
        );

        res.status(201).json(nuevo);

    }
);

app.get(
    "/api/comentarios-real-resumen",
    (req, res) => {

        const comentarios =
            readJson("comentarios.json", []);

        res.json({
            modulo: "COMENTARIOS_REAL",
            estado: "OPERATIVO",
            registros: comentarios.length
        });

    }
);
// ========================================
// V4-013 ACTIVIDAD OPERATIVA REAL
// ========================================

app.get("/api/actividad-operativa", (req, res) => {

    const actividad =
        readJson("actividad-operativa.json", []);

    res.json({
        total: actividad.length,
        actividad
    });

});

app.get(
    "/api/actividad-operativa/ticket/:ticketId",
    (req, res) => {

        const actividad =
            readJson("actividad-operativa.json", []);

        const historial = actividad.filter(
            x => String(x.ticketId) ===
                 String(req.params.ticketId)
        );

        res.json({
            ticketId: req.params.ticketId,
            total: historial.length,
            actividad: historial
        });

    }
);

app.post(
    "/api/actividad-operativa",
    (req, res) => {

        const actividad =
            readJson("actividad-operativa.json", []);

        const nuevo = {

            actividadId:
                actividad.length > 0
                ? Math.max(
                    ...actividad.map(
                        x => x.actividadId || 0
                    )
                ) + 1
                : 1,

            ticketId:
                req.body.ticketId,

            tipo:
                req.body.tipo || "ACTIVIDAD",

            detalle:
                req.body.detalle || "",

            usuario:
                req.body.usuario || "OPERADOR",

            fecha:
                new Date().toISOString()

        };

        actividad.push(nuevo);

        saveJson(
            "actividad-operativa.json",
            actividad
        );

        res.status(201).json(nuevo);

    }
);

app.get(
    "/api/actividad-operativa-resumen",
    (req, res) => {

        const actividad =
            readJson("actividad-operativa.json", []);

        res.json({
            modulo: "ACTIVIDAD_OPERATIVA",
            estado: "OPERATIVO",
            registros: actividad.length
        });

    }
);
// ========================================
// V4-014 FEED OPERATIVO PERSISTENTE
// ========================================

app.get("/api/feed-operativo", (req, res) => {

    const feed =
        readJson("feed-operativo.json", []);

    res.json({
        total: feed.length,
        feed
    });

});

app.get(
    "/api/feed-operativo/ticket/:ticketId",
    (req, res) => {

        const feed =
            readJson("feed-operativo.json", []);

        const eventos = feed.filter(
            x => String(x.ticketId) ===
                 String(req.params.ticketId)
        );

        res.json({
            ticketId: req.params.ticketId,
            total: eventos.length,
            feed: eventos
        });

    }
);

app.post(
    "/api/feed-operativo",
    (req, res) => {

        const feed =
            readJson("feed-operativo.json", []);

        const nuevo = {

            feedId:
                feed.length > 0
                ? Math.max(
                    ...feed.map(
                        x => x.feedId || 0
                    )
                ) + 1
                : 1,

            ticketId:
                req.body.ticketId,

            evento:
                req.body.evento || "EVENTO",

            detalle:
                req.body.detalle || "",

            usuario:
                req.body.usuario || "OPERADOR",

            fecha:
                new Date().toISOString()

        };

        feed.push(nuevo);

        saveJson(
            "feed-operativo.json",
            feed
        );

        res.status(201).json(nuevo);

    }
);

app.get(
    "/api/feed-operativo-resumen",
    (req, res) => {

        const feed =
            readJson("feed-operativo.json", []);

        res.json({
            modulo: "FEED_OPERATIVO",
            estado: "OPERATIVO",
            registros: feed.length
        });

    }
);
// ========================================
// HOTFIX V4-014.1
// ========================================

app.get("/api/feed-store", (req, res) => {

    const feed =
        readJson("feed-operativo.json", []);

    res.json({
        total: feed.length,
        feed
    });

});

app.get(
    "/api/feed-store/ticket/:ticketId",
    (req, res) => {

        const feed =
            readJson("feed-operativo.json", []);

        const eventos = feed.filter(
            x => String(x.ticketId) ===
                 String(req.params.ticketId)
        );

        res.json({
            ticketId: req.params.ticketId,
            total: eventos.length,
            feed: eventos
        });

    }
);

app.post(
    "/api/feed-store",
    (req, res) => {

        const feed =
            readJson("feed-operativo.json", []);

        const nuevo = {

            feedId:
                feed.length > 0
                ? Math.max(
                    ...feed.map(
                        x => x.feedId || 0
                    )
                ) + 1
                : 1,

            ticketId: req.body.ticketId,
            evento: req.body.evento || "EVENTO",
            detalle: req.body.detalle || "",
            usuario: req.body.usuario || "OPERADOR",
            fecha: new Date().toISOString()

        };

        feed.push(nuevo);

        saveJson(
            "feed-operativo.json",
            feed
        );

        res.status(201).json(nuevo);

    }
);

app.get(
    "/api/feed-store-resumen",
    (req, res) => {

        const feed =
            readJson("feed-operativo.json", []);

        res.json({
            modulo: "FEED_STORE",
            estado: "OPERATIVO",
            registros: feed.length
        });

    }
);
// ========================================
// V4-015 CIERRE OPERATIVO
// ========================================

app.post(
    "/api/tickets/:ticketId/cerrar",
    (req, res) => {

        const tickets =
            readJson("tickets.json", []);

        const ticket =
            tickets.find(
                x => String(x.ticketId) ===
                     String(req.params.ticketId)
            );

        if (!ticket) {
            return res.status(404).json({
                error: "Ticket no encontrado"
            });
        }

        ticket.estado = "CERRADO";
        ticket.fechaCierre =
            new Date().toISOString();

        saveJson(
            "tickets.json",
            tickets
        );

        res.json({
            resultado: "OK",
            ticket
        });

    }
);

app.get(
    "/api/tickets-cerrados",
    (req, res) => {

        const tickets =
            readJson("tickets.json", []);

        const cerrados = tickets.filter(
            x => x.estado === "CERRADO"
        );

        res.json({
            total: cerrados.length,
            tickets: cerrados
        });

    }
);

app.get(
    "/api/cierre-operativo-resumen",
    (req, res) => {

        const tickets =
            readJson("tickets.json", []);

        const cerrados = tickets.filter(
            x => x.estado === "CERRADO"
        );

        res.json({
            modulo: "CIERRE_OPERATIVO",
            estado: "OPERATIVO",
            cerrados: cerrados.length
        });

    }
);
// ========================================
// V4-016 REAPERTURA DE TICKETS
// ========================================

app.post(
    "/api/tickets/:ticketId/reabrir",
    (req, res) => {

        const tickets =
            readJson("tickets.json", []);

        const ticket =
            tickets.find(
                x => String(x.ticketId) ===
                     String(req.params.ticketId)
            );

        if (!ticket) {
            return res.status(404).json({
                error: "Ticket no encontrado"
            });
        }

        ticket.estado = "ABIERTO";

        ticket.fechaReapertura =
            new Date().toISOString();

        ticket.motivoReapertura =
            req.body?.motivo ||
            "REAPERTURA_OPERATIVA";

        saveJson(
            "tickets.json",
            tickets
        );

        res.json({
            resultado: "OK",
            ticket
        });

    }
);

app.get(
    "/api/tickets-abiertos",
    (req, res) => {

        const tickets =
            readJson("tickets.json", []);

        const abiertos = tickets.filter(
            x => x.estado === "ABIERTO"
        );

        res.json({
            total: abiertos.length,
            tickets: abiertos
        });

    }
);

app.get(
    "/api/reapertura-operativa-resumen",
    (req, res) => {

        const tickets =
            readJson("tickets.json", []);

        const reabiertos = tickets.filter(
            x => x.fechaReapertura
        );

        res.json({
            modulo: "REAPERTURA_OPERATIVA",
            estado: "OPERATIVO",
            reabiertos: reabiertos.length
        });

    }
);
// ========================================
// V4-017 MEGA PACK
// AUTOMATIZACION OPERATIVA
// ========================================

function agregarAuditoriaAutomatica(
    accion,
    detalle
) {
    const auditoria = readJson(
        "auditoria.json",
        []
    );

    auditoria.push({
        auditoriaId:
            auditoria.length > 0
            ? Math.max(
                ...auditoria.map(
                    x => x.auditoriaId || 0
                )
              ) + 1
            : 1,
        accion,
        detalle,
        fecha: new Date().toISOString()
    });

    saveJson(
        "auditoria.json",
        auditoria
    );
}

app.post(
    "/api/automatizacion/evento",
    (req, res) => {

        const ticketId =
            req.body.ticketId;

        const detalle =
            req.body.detalle ||
            "AUTOMATICO";

        const timeline =
            readJson("timeline.json", []);

        timeline.push({
            eventoId:
                timeline.length + 1,
            ticketId,
            tipo: "AUTO",
            detalle,
            fecha:
                new Date().toISOString()
        });

        saveJson(
            "timeline.json",
            timeline
        );

        const feed =
            readJson(
                "feed-operativo.json",
                []
            );

        feed.push({
            feedId:
                feed.length + 1,
            ticketId,
            evento:
                "AUTO",
            detalle,
            fecha:
                new Date().toISOString()
        });

        saveJson(
            "feed-operativo.json",
            feed
        );

        agregarAuditoriaAutomatica(
            "AUTOMATIZACION",
            detalle
        );

        res.status(201).json({
            resultado: "OK",
            ticketId,
            detalle
        });

    }
);

app.get(
    "/api/automatizacion/resumen",
    (req, res) => {

        const timeline =
            readJson("timeline.json", []);

        const feed =
            readJson(
                "feed-operativo.json",
                []
            );

        const auditoria =
            readJson(
                "auditoria.json",
                []
            );

        res.json({
            modulo:
                "AUTOMATIZACION_OPERATIVA",
            estado:
                "OPERATIVO",
            timeline:
                timeline.length,
            feed:
                feed.length,
            auditoria:
                auditoria.length
        });

    }
);
// ========================================
// V4-021 MEGA PACK
// GESTION DE TICKETS
// ========================================

app.post(
    "/api/tickets/:ticketId/asignar",
    (req, res) => {

        const tickets = readJson(
            "tickets.json", []
        );

        const ticket = tickets.find(
            x => String(x.ticketId) === String(req.params.ticketId)
        );

        if (!ticket) {
            return res.status(404).json({
                error: "Ticket no encontrado"
            });
        }

        ticket.operador =
            req.body.operador || "OPERADOR";

        ticket.fechaAsignacion =
            new Date().toISOString();

        saveJson("tickets.json", tickets);

        res.json({
            resultado: "OK",
            ticket
        });

    }
);

app.post(
    "/api/tickets/:ticketId/escalar",
    (req, res) => {

        const tickets = readJson(
            "tickets.json", []
        );

        const ticket = tickets.find(
            x => String(x.ticketId) === String(req.params.ticketId)
        );

        if (!ticket) {
            return res.status(404).json({
                error: "Ticket no encontrado"
            });
        }

        ticket.escalado = true;
        ticket.fechaEscalacion =
            new Date().toISOString();
        ticket.motivoEscalacion =
            req.body.motivo || "OPERATIVO";

        saveJson("tickets.json", tickets);

        res.json({
            resultado: "OK",
            ticket
        });

    }
);

app.get(
    "/api/tickets-escalados",
    (req, res) => {

        const tickets = readJson(
            "tickets.json", []
        );

        const escalados = tickets.filter(
            x => x.escalado === true
        );

        res.json({
            total: escalados.length,
            tickets: escalados
        });

    }
);

app.get(
    "/api/sla/resumen",
    (req, res) => {

        const tickets = readJson(
            "tickets.json", []
        );

        const abiertos = tickets.filter(
            x => x.estado === "ABIERTO"
        ).length;

        const cerrados = tickets.filter(
            x => x.estado === "CERRADO"
        ).length;

        res.json({
            modulo: "GESTION_TICKETS",
            abiertos,
            cerrados,
            total: tickets.length
        });

    }
);
// ========================================
// V4-025 MEGA PACK
// CONTROL HOTSPOT
// ========================================

app.post(
    "/api/hotspots/:id/baja",
    (req, res) => {

        const hotspots = readJson(
            "hotspots.json", []
        );

        const hotspot = hotspots.find(
            x => String(x.hotspotId) === String(req.params.id)
        );

        if (!hotspot) {
            return res.status(404).json({
                error: "Hotspot no encontrado"
            });
        }

        hotspot.estado = "BAJA";
        hotspot.fechaBaja = new Date().toISOString();

        saveJson("hotspots.json", hotspots);

        res.json({
            resultado: "OK",
            hotspot
        });

    }
);

app.post(
    "/api/hotspots/:id/reemplazo",
    (req, res) => {

        const movimientos = readJson(
            "movimientos.json", []
        );

        const nuevo = {
            movimientoId:
                movimientos.length + 1,
            tipo: "REEMPLAZO",
            hotspotId: Number(req.params.id),
            hotspotNuevo:
                req.body.hotspotNuevo || "NUEVO",
            fecha:
                new Date().toISOString()
        };

        movimientos.push(nuevo);

        saveJson(
            "movimientos.json",
            movimientos
        );

        res.status(201).json(nuevo);

    }
);

app.get(
    "/api/historial/hotspot/:id",
    (req, res) => {

        const movimientos = readJson(
            "movimientos.json", []
        );

        const historial = movimientos.filter(
            x => String(x.hotspotId) === String(req.params.id)
        );

        res.json({
            hotspotId: req.params.id,
            total: historial.length,
            historial
        });

    }
);

app.get(
    "/api/historial/sim/:linea",
    (req, res) => {

        res.json({
            linea: req.params.linea,
            historial: []
        });

    }
);

app.get(
    "/api/control-hotspot/resumen",
    (req, res) => {

        const hotspots = readJson(
            "hotspots.json", []
        );

        const movimientos = readJson(
            "movimientos.json", []
        );

        const bajas = hotspots.filter(
            x => x.estado === "BAJA"
        ).length;

        res.json({
            modulo: "CONTROL_HOTSPOT",
            hotspots: hotspots.length,
            movimientos: movimientos.length,
            bajas
        });

    }
);
// ========================================
// V4-029 MEGA PACK
// ANALYTICS
// ========================================

app.get("/api/kpi/tickets", (req, res) => {

    const tickets = readJson("tickets.json", []);

    res.json({
        total: tickets.length,
        abiertos: tickets.filter(x => x.estado === "ABIERTO").length,
        cerrados: tickets.filter(x => x.estado === "CERRADO").length
    });

});

app.get("/api/kpi/hotspots", (req, res) => {

    const hotspots = readJson("hotspots.json", []);

    res.json({
        total: hotspots.length,
        bajas: hotspots.filter(x => x.estado === "BAJA").length
    });

});

app.get("/api/kpi/movimientos", (req, res) => {

    const movimientos = readJson("movimientos.json", []);

    res.json({
        total: movimientos.length
    });

});

app.get("/api/dashboard/operativo", (req, res) => {

    const tickets = readJson("tickets.json", []);
    const hotspots = readJson("hotspots.json", []);
    const movimientos = readJson("movimientos.json", []);

    res.json({
        modulo: "DASHBOARD_OPERATIVO",
        tickets: tickets.length,
        hotspots: hotspots.length,
        movimientos: movimientos.length
    });

});

app.get("/api/dashboard/ejecutivo", (req, res) => {

    const tickets = readJson("tickets.json", []);

    res.json({
        modulo: "DASHBOARD_EJECUTIVO",
        totalTickets: tickets.length,
        abiertos: tickets.filter(x => x.estado === "ABIERTO").length,
        cerrados: tickets.filter(x => x.estado === "CERRADO").length
    });

});
// ========================================
// V4-033 MEGA PACK
// INTEGRACIONES
// ========================================

app.get(
    "/api/integraciones/jasper",
    (req, res) => {

        res.json({
            sistema: "JASPER",
            estado: "OPERATIVO"
        });

    }
);

app.get(
    "/api/integraciones/servicenow",
    (req, res) => {

        const tickets = readJson(
            "tickets.json", []
        );

        const sn = tickets.filter(
            x => x.origen === "SERVICENOW"
        );

        res.json({
            sistema: "SERVICENOW",
            tickets: sn.length
        });

    }
);

app.get(
    "/api/integraciones/bnext",
    (req, res) => {

        res.json({
            sistema: "BNEXT",
            estado: "PREPARADO"
        });

    }
);

app.get(
    "/api/export/operativo",
    (req, res) => {

        const tickets = readJson("tickets.json", []);
        const hotspots = readJson("hotspots.json", []);

        res.json({
            tickets,
            hotspots
        });

    }
);

app.get(
    "/api/dashboard/integraciones",
    (req, res) => {

        const tickets = readJson("tickets.json", []);

        res.json({
            modulo: "INTEGRACIONES",
            jasper: "OPERATIVO",
            servicenow: tickets.filter(
                x => x.origen === "SERVICENOW"
            ).length,
            bnext: "PREPARADO"
        });

    }
);




// ========================================
// SYS-V3-INSTALL-POINT
// NO BORRAR
// ========================================
// ========================================
// SYS-001
// LEVANTAR SERVIDOR
// ========================================

app.listen(3000, () => {

    console.log("");
    console.log("========================================");
    console.log(" HOTSPOT OPERATIONS HUB");
    console.log("========================================");
    console.log(" API ONLINE");
    console.log(" http://localhost:3000/api/test");
    console.log(" http://localhost:3000/api/sim/2276258113");
    console.log(" http://localhost:3000/api/sim/2276258113/raw");
    console.log(" http://localhost:3000/api/sims");
    console.log(" http://localhost:3000/api/dashboard");
    console.log(" http://localhost:3000/api/sims/offline");
    console.log(" http://localhost:3000/api/sims/online");
    console.log(" http://localhost:3000/api/sims/high-usage");
    console.log(" http://localhost:3000/api/sims/no-usage");
    console.log(" http://localhost:3000/api/stats");
    console.log(" http://localhost:3000/api/accounts");
    console.log(" http://localhost:3000/api/plans");
    console.log(" http://localhost:3000/api/top-usage");
    console.log(" http://localhost:3000/api/search?q=8120307979");
    console.log(" http://localhost:3000/api/hotspots");
    console.log(" http://localhost:3000/api/tiendas");
    console.log(" http://localhost:3000/api/hotspots-detalle");
    console.log(" http://localhost:3000/api/inventario");
    console.log(" http://localhost:3000/api/inventario/1");
    console.log(" http://localhost:3000/api/alertas");
    console.log(" http://localhost:3000/api/dashboard-operativo");
    console.log(" http://localhost:3000/api/movimientos");
console.log(" http://localhost:3000/api/hotspots/1/historial");
console.log(" http://localhost:3000/api/sims/2276258113/historial");
console.log(" http://localhost:3000/api/asignaciones");
console.log(" http://localhost:3000/api/desasignaciones");
console.log(" http://localhost:3000/api/tickets");
console.log(" http://localhost:3000/api/dashboard-ejecutivo");
console.log(" http://localhost:3000/api/dashboard-operativo-avanzado");
console.log(" http://localhost:3000/api/export/dataverse");
console.log(" http://localhost:3000/api/powerapps/inventario");
console.log(" http://localhost:3000/api/powerbi/dataset");
console.log(" http://localhost:3000/api/auditoria");
console.log(" http://localhost:3000/api/storage/status");

console.log(" POST   /api/hotspots");
console.log(" PUT    /api/hotspots/:id");
console.log(" DELETE /api/hotspots/:id");

console.log(" http://localhost:3000/api/recepciones");
console.log(" http://localhost:3000/api/recepciones/dashboard");
console.log(" POST /api/recepciones");
console.log(" http://localhost:3000/api/inventario");


    console.log("========================================");
    console.log("");

});
