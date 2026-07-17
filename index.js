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
// INICIALIZACION DE VARIABLES GLOBALES
// ========================================

let tickets = readJson("tickets.json", []);
let strikes = readJson("strikes.json", []);
const hotspots = readJson("hotspots.json", []);
const tiendas = readJson("tiendas.json", []);
const movimientos = readJson("movimientos.json", []);
const auditoria = readJson("auditoria.json", []);

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
        const simId = Number(req.params.simId);
        const result = await getSimDetails(simId);
        const sim = result.data[0];

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
            cuenta: accountMap[sim.acctId] || sim.acctName,
            apn: sim.currentSessionInfo?.apn,
            ip: sim.currentSessionInfo?.deviceIpAddress,
            enSesion: sim.currentSessionInfo?.status
        });

    } catch (error) {
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
        const simId = Number(req.params.simId);
        const result = await getSimDetails(simId);
        res.json(result);
    } catch (error) {
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
        const result = await getSims();
        const sims = result.data.map(sim => ({
            simId: sim.simId,
            iccid: sim.iccid,
            msisdn: sim.msisdn,
            imei: sim.simAuxFieldsDTO?.imei,
            cuenta: accountMap[sim.acctId] || sim.acctName,
            carrier: sim.currentSessionInfo?.carrier,
            plan: sim.ratePlanName,
            commPlan: sim.commPlanName,
            estado: sim.statusNameDisplay,
            consumoMB: sim.monthToDateDataUsageMB,
            enSesion: sim.inSession
        }));

        res.json(sims);
    } catch (error) {
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
        const result = await getSims();
        const sims = result.data;
        const totalSims = sims.length;
        const enSesion = sims.filter(x => x.inSession === true).length;
        const sinSesion = totalSims - enSesion;
        const consumoTotalMB = sims.reduce(
            (total, sim) => total + (sim.monthToDateDataUsageMB || 0),
            0
        );
        const consumoPromedioMB = totalSims > 0 ? consumoTotalMB / totalSims : 0;
        const topConsumo = sims
            .sort((a, b) => (b.monthToDateDataUsageMB || 0) - (a.monthToDateDataUsageMB || 0))
            .slice(0, 10)
            .map(sim => ({
                simId: sim.simId,
                iccid: sim.iccid,
                msisdn: sim.msisdn,
                consumoMB: sim.monthToDateDataUsageMB
            }));

        res.json({
            totalSims,
            enSesion,
            sinSesion,
            consumoTotalMB: Number(consumoTotalMB.toFixed(2)),
            consumoPromedioMB: Number(consumoPromedioMB.toFixed(2)),
            topConsumo
        });

    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

// ========================================
// MON-001 a MON-004
// SIMS OFFLINE, ONLINE, ALTO CONSUMO, SIN CONSUMO
// ========================================

app.get("/api/sims/offline", async (req, res) => {
    try {
        const result = await getSims();
        const offlineSims = result.data
            .filter(sim => sim.inSession === false)
            .map(sim => ({
                simId: sim.simId,
                iccid: sim.iccid,
                msisdn: sim.msisdn,
                imei: sim.simAuxFieldsDTO?.imei,
                estado: sim.statusNameDisplay,
                consumoMB: sim.monthToDateDataUsageMB,
                enSesion: sim.inSession
            }));

        res.json({
            totalOffline: offlineSims.length,
            sims: offlineSims
        });
    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/api/sims/online", async (req, res) => {
    try {
        const result = await getSims();
        const onlineSims = result.data
            .filter(sim => sim.inSession === true)
            .map(sim => ({
                simId: sim.simId,
                iccid: sim.iccid,
                msisdn: sim.msisdn,
                imei: sim.simAuxFieldsDTO?.imei,
                estado: sim.statusNameDisplay,
                consumoMB: sim.monthToDateDataUsageMB,
                enSesion: sim.inSession
            }));

        res.json({
            totalOnline: onlineSims.length,
            sims: onlineSims
        });
    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/api/sims/high-usage", async (req, res) => {
    try {
        const result = await getSims();
        const highUsageSims = result.data
            .filter(sim => (sim.monthToDateDataUsageMB || 0) >= 500)
            .sort((a, b) => (b.monthToDateDataUsageMB || 0) - (a.monthToDateDataUsageMB || 0))
            .map(sim => ({
                simId: sim.simId,
                iccid: sim.iccid,
                msisdn: sim.msisdn,
                imei: sim.simAuxFieldsDTO?.imei,
                consumoMB: sim.monthToDateDataUsageMB,
                estado: sim.statusNameDisplay,
                enSesion: sim.inSession
            }));

        res.json({
            reglaMB: 500,
            total: highUsageSims.length,
            sims: highUsageSims
        });
    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/api/sims/no-usage", async (req, res) => {
    try {
        const result = await getSims();
        const noUsageSims = result.data
            .filter(sim => (sim.monthToDateDataUsageMB || 0) === 0)
            .map(sim => ({
                simId: sim.simId,
                iccid: sim.iccid,
                msisdn: sim.msisdn,
                imei: sim.simAuxFieldsDTO?.imei,
                consumoMB: sim.monthToDateDataUsageMB,
                estado: sim.statusNameDisplay,
                enSesion: sim.inSession
            }));

        res.json({
            total: noUsageSims.length,
            sims: noUsageSims
        });
    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

// ========================================
// DAS-002
// ESTADISTICAS GENERALES
// ========================================

app.get("/api/stats", async (req, res) => {
    try {
        const result = await getSims();
        const sims = result.data;
        const total = sims.length;
        const online = sims.filter(sim => sim.inSession === true).length;
        const offline = sims.filter(sim => sim.inSession === false).length;
        const noUsage = sims.filter(sim => (sim.monthToDateDataUsageMB || 0) === 0).length;
        const highUsage = sims.filter(sim => (sim.monthToDateDataUsageMB || 0) >= 500).length;
        const activated = sims.filter(sim => sim.statusNameDisplay === "ACTIVADO").length;

        res.json({
            total,
            activated,
            online,
            offline,
            noUsage,
            highUsage
        });
    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

// ========================================
// API-005 a API-007
// CUENTAS, PLANES, TOP CONSUMO
// ========================================

app.get("/api/accounts", async (req, res) => {
    try {
        const result = await getSims();
        const accounts = [...new Map(
            result.data.map(sim => [
                sim.acctId,
                {
                    acctId: sim.acctId,
                    acctName: sim.acctName
                }
            ])
        ).values()];

        res.json(accounts);
    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/api/plans", async (req, res) => {
    try {
        const result = await getSims();
        const plans = [...new Map(
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
    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/api/top-usage", async (req, res) => {
    try {
        const result = await getSims();
        const sims = result.data
            .sort((a, b) => (b.monthToDateDataUsageMB || 0) - (a.monthToDateDataUsageMB || 0))
            .slice(0, 20)
            .map(sim => ({
                simId: sim.simId,
                iccid: sim.iccid,
                msisdn: sim.msisdn,
                cuenta: accountMap[sim.acctId] || sim.acctName,
                carrier: sim.currentSessionInfo?.carrier,
                plan: sim.ratePlanName,
                consumoMB: sim.monthToDateDataUsageMB,
                enSesion: sim.inSession
            }));

        res.json(sims);
    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

// ========================================
// API-008
// BUSQUEDA GLOBAL
// ========================================

app.get("/api/search", async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();

        if (!q) {
            return res.status(400).json({
                error: "Debe enviar ?q="
            });
        }

        const result = await getSims();
        const matches = result.data
            .filter(sim =>
                String(sim.simId).includes(q) ||
                String(sim.iccid || "").includes(q) ||
                String(sim.msisdn || "").includes(q) ||
                String(sim.simAuxFieldsDTO?.imei || "").includes(q)
            )
            .map(sim => ({
                simId: sim.simId,
                iccid: sim.iccid,
                msisdn: sim.msisdn,
                imei: sim.simAuxFieldsDTO?.imei,
                cuenta: accountMap[sim.acctId] || sim.acctName,
                plan: sim.ratePlanName,
                commPlan: sim.commPlanName,
                estado: sim.statusNameDisplay,
                consumoMB: sim.monthToDateDataUsageMB,
                enSesion: sim.inSession
            }));

        res.json({
            total: matches.length,
            resultados: matches
        });

    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

// ========================================
// MOD-002 a MOD-008
// HOTSPOTS, TIENDAS, INVENTARIO, ALERTAS
// ========================================

app.get("/api/hotspots", (req, res) => {
    res.json({
        total: hotspots.length,
        hotspots
    });
});

app.get("/api/tiendas", (req, res) => {
    res.json({
        total: tiendas.length,
        tiendas
    });
});

app.get("/api/hotspots-detalle", (req, res) => {
    const resultado = hotspots.map(hotspot => ({
        ...hotspot,
        tienda: tiendas.find(t => t.tiendaId === hotspot.tiendaId) || null
    }));

    res.json({
        total: resultado.length,
        hotspots: resultado
    });
});

app.get("/api/inventario", async (req, res) => {
    try {
        const result = await getSims();
        const inventario = hotspots.map(hotspot => {
            const tienda = tiendas.find(t => t.tiendaId === hotspot.tiendaId);
            const sim = result.data.find(s => s.simId === hotspot.simId);

            return {
                hotspotId: hotspot.hotspotId,
                hotspot: hotspot.nombre,
                tienda: tienda?.nombre || null,
                tiendaClave: tienda?.clave || null,
                simId: sim?.simId || hotspot.simId,
                msisdn: sim?.msisdn || null,
                iccid: sim?.iccid || null,
                imei: hotspot.imei,
                estado: sim?.statusNameDisplay || null,
                consumoMB: sim?.monthToDateDataUsageMB || 0,
                enSesion: sim?.inSession || false
            };
        });

        res.json({
            total: inventario.length,
            inventario
        });
    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/api/inventario/:hotspotId", async (req, res) => {
    try {
        const hotspotId = Number(req.params.hotspotId);
        const hotspot = hotspots.find(h => h.hotspotId === hotspotId);

        if (!hotspot) {
            return res.status(404).json({
                error: "Hotspot no encontrado"
            });
        }

        const tienda = tiendas.find(t => t.tiendaId === hotspot.tiendaId);
        const result = await getSims();
        const sim = result.data.find(s => s.simId === hotspot.simId);

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

    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/api/alertas", async (req, res) => {
    try {
        const result = await getSims();
        const sims = result.data;
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

    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/api/dashboard-operativo", async (req, res) => {
    try {
        const result = await getSims();
        const sims = result.data;
        const totalSims = sims.length;
        const online = sims.filter(x => x.inSession === true).length;
        const offline = totalSims - online;
        const sinConsumo = sims.filter(x => (x.monthToDateDataUsageMB || 0) === 0).length;
        const altoConsumo = sims.filter(x => (x.monthToDateDataUsageMB || 0) >= 1000).length;

        let salud = "VERDE";
        if (altoConsumo > 0) salud = "AMARILLO";
        if (altoConsumo >= 3) salud = "ROJO";

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

    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

// ========================================
// PACK-1 MOD-009 AL MOD-012
// ========================================

app.get("/api/movimientos", (req, res) => {
    res.json({
        total: movimientos.length,
        movimientos
    });
});

app.get("/api/hotspots/:hotspotId/historial", (req, res) => {
    const hotspotId = Number(req.params.hotspotId);
    const historial = movimientos.filter(x => x.hotspotId === hotspotId);

    res.json({
        hotspotId,
        total: historial.length,
        historial
    });
});

app.get("/api/sims/:simId/historial", (req, res) => {
    const simId = Number(req.params.simId);
    const hotspot = hotspots.find(h => h.simId === simId);

    if (!hotspot) {
        return res.json({
            simId,
            total: 0,
            historial: []
        });
    }

    const historial = movimientos.filter(x => x.hotspotId === hotspot.hotspotId);

    res.json({
        simId,
        total: historial.length,
        historial
    });
});

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
// MOD-015 y MOD-016
// DASHBOARDS EJECUTIVO Y OPERATIVO AVANZADO
// ========================================

app.get("/api/dashboard-ejecutivo", async (req, res) => {
    try {
        const result = await getSims();
        const ticketsData = readJson("tickets.json", []);

        res.json({
            totalSims: result.data.length,
            hotspots: hotspots.length,
            tiendas: tiendas.length,
            ticketsAbiertos: ticketsData.filter(t => t.estado === "ABIERTO").length
        });
    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/api/dashboard-operativo-avanzado", async (req, res) => {
    try {
        const result = await getSims();
        const ticketsData = readJson("tickets.json", []);
        const online = result.data.filter(x => x.inSession === true).length;
        const offline = result.data.length - online;
        const consumoTotal = result.data.reduce(
            (a, b) => a + (b.monthToDateDataUsageMB || 0),
            0
        );

        res.json({
            online,
            offline,
            consumoTotalMB: Number(consumoTotal.toFixed(2)),
            tickets: ticketsData.length
        });
    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

// ========================================
// PACK-3 MOD-017 AL MOD-020
// ========================================

app.get("/api/export/dataverse", async (req, res) => {
    try {
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
    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/api/powerapps/inventario", async (req, res) => {
    try {
        const result = await getSims();
        res.json(result.data.map(sim => ({
            simId: sim.simId,
            msisdn: sim.msisdn,
            estado: sim.statusNameDisplay
        })));
    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/api/powerbi/dataset", async (req, res) => {
    try {
        const result = await getSims();
        res.json({
            fecha: new Date().toISOString(),
            totalSims: result.data.length,
            dataset: result.data
        });
    } catch (error) {
        console.log(error.response?.data || error);
        res.status(500).json({
            error: error.message
        });
    }
});

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
    const hotspotsJson = readJson("hotspots.json", []);
    const tiendasJson = readJson("tiendas.json", []);
    const movimientosJson = readJson("movimientos.json", []);
    const ticketsJson = readJson("tickets.json", []);
    const auditoriaJson = readJson("auditoria.json", []);

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

app.post("/api/hotspots", (req, res) => {
    const hotspotsJson = readJson("hotspots.json", []);

    const nuevo = {
        hotspotId: hotspotsJson.length > 0
            ? Math.max(...hotspotsJson.map(h => h.hotspotId)) + 1
            : 1,
        nombre: req.body.nombre,
        imei: req.body.imei,
        simId: req.body.simId || null,
        tiendaId: req.body.tiendaId || null,
        estado: req.body.estado || "Activo"
    };

    hotspotsJson.push(nuevo);
    saveJson("hotspots.json", hotspotsJson);

    res.status(201).json(nuevo);
});

app.put("/api/hotspots/:id", (req, res) => {
    const hotspotId = Number(req.params.id);
    const hotspotsJson = readJson("hotspots.json", []);
    const hotspot = hotspotsJson.find(h => h.hotspotId === hotspotId);

    if (!hotspot) {
        return res.status(404).json({
            error: "Hotspot no encontrado"
        });
    }

    Object.assign(hotspot, req.body);
    saveJson("hotspots.json", hotspotsJson);

    res.json(hotspot);
});

app.delete("/api/hotspots/:id", (req, res) => {
    const hotspotId = Number(req.params.id);
    const hotspotsJson = readJson("hotspots.json", []);
    const nuevos = hotspotsJson.filter(h => h.hotspotId !== hotspotId);

    saveJson("hotspots.json", nuevos);

    res.json({
        eliminado: hotspotId,
        total: nuevos.length
    });
});

// ========================================
// V3-001
// RECEPCIONES PSP
// ========================================

app.get("/api/recepciones", (req, res) => {
    const recepciones = readJson("recepciones.json", []);

    res.json({
        total: recepciones.length,
        recepciones
    });
});

app.get("/api/recepciones/dashboard", (req, res) => {
    const recepciones = readJson("recepciones.json", []);

    res.json({
        total: recepciones.length,
        funcionales: recepciones.filter(r => r.resultado === "FUNCIONAL").length,
        cambioSim: recepciones.filter(r => r.resultado === "CAMBIO_SIM").length,
        sinSim: recepciones.filter(r => r.resultado === "SIN_SIM").length,
        pendientes: recepciones.filter(r => r.resultado === "PENDIENTE").length
    });
});

app.post("/api/recepciones", (req, res) => {
    const recepciones = readJson("recepciones.json", []);

    const nueva = {
        recepcionId: recepciones.length > 0
            ? Math.max(...recepciones.map(r => r.recepcionId || 0)) + 1
            : 1,
        fechaRecepcion: new Date().toISOString(),
        sucursalOrigen: req.body.sucursalOrigen || "PSP",
        serie: req.body.serie || "",
        imei: req.body.imei || "",
        mac: req.body.mac || "",
        carrierOriginal: req.body.carrierOriginal || "",
        iccidOriginal: req.body.iccidOriginal || "",
        msisdnOriginal: req.body.msisdnOriginal || "",
        imsiOriginal: req.body.imsiOriginal || "",
        estatusOriginal: req.body.estatusOriginal || "SIN_SIM",
        resultado: req.body.resultado || "PENDIENTE",
        tecnico: req.body.tecnico || "",
        comentarios: req.body.comentarios || ""
    };

    recepciones.push(nueva);
    saveJson("recepciones.json", recepciones);

    res.status(201).json(nueva);
});

app.get("/api/recepciones/:id", (req, res) => {
    const recepciones = readJson("recepciones.json", []);
    const recepcion = recepciones.find(r => r.recepcionId === Number(req.params.id));

    if (!recepcion) {
        return res.status(404).json({
            error: "Recepcion no encontrada"
        });
    }

    res.json(recepcion);
});

app.put("/api/recepciones/:id", (req, res) => {
    const recepciones = readJson("recepciones.json", []);
    const recepcion = recepciones.find(r => r.recepcionId === Number(req.params.id));

    if (!recepcion) {
        return res.status(404).json({
            error: "Recepcion no encontrada"
        });
    }

    Object.assign(recepcion, req.body);
    saveJson("recepciones.json", recepciones);

    res.json(recepcion);
});

// ========================================
// V3-002
// TICKETS OPERATIVOS
// ========================================

app.get("/api/tickets", (req, res) => {
    const ticketsData = readJson("tickets.json", []);

    res.json({
        total: ticketsData.length,
        tickets: ticketsData
    });
});

app.post("/api/tickets", (req, res) => {
    const ticketsData = readJson("tickets.json", []);

    const nuevo = {
        ticketId: ticketsData.length > 0
            ? Math.max(...ticketsData.map(t => t.ticketId || 0)) + 1
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

    ticketsData.push(nuevo);
    saveJson("tickets.json", ticketsData);

    res.status(201).json(nuevo);
});

app.get("/api/tickets/:id", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const ticket = ticketsData.find(t => t.ticketId === Number(req.params.id));

    if (!ticket) {
        return res.status(404).json({
            error: "Ticket no encontrado"
        });
    }

    res.json(ticket);
});

app.put("/api/tickets/:id", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const ticket = ticketsData.find(t => t.ticketId === Number(req.params.id));

    if (!ticket) {
        return res.status(404).json({
            error: "Ticket no encontrado"
        });
    }

    Object.assign(ticket, req.body);
    saveJson("tickets.json", ticketsData);

    res.json(ticket);
});

// ========================================
// V3-003
// STRIKES
// ========================================

app.get("/api/strikes", (req, res) => {
    const strikeData = readJson("strikes.json", []);

    res.json({
        total: strikeData.length,
        strikes: strikeData
    });
});

app.post("/api/tickets/:id/strike", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const strikeData = readJson("strikes.json", []);

    const ticket = ticketsData.find(t => t.ticketId === Number(req.params.id));

    if (!ticket) {
        return res.status(404).json({
            error: "Ticket no encontrado"
        });
    }

    const nuevoStrike = {
        strikeId: strikeData.length > 0
            ? Math.max(...strikeData.map(s => s.strikeId || 0)) + 1
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

    strikeData.push(nuevoStrike);

    saveJson("tickets.json", ticketsData);
    saveJson("strikes.json", strikeData);

    res.json({
        ticket,
        strike: nuevoStrike
    });
});

app.get("/api/tickets/:id/strikes", (req, res) => {
    const strikeData = readJson("strikes.json", []);
    const historial = strikeData.filter(s => s.ticketId === Number(req.params.id));

    res.json({
        total: historial.length,
        strikes: historial
    });
});

// ========================================
// V3-004
// DASHBOARD OPERATIVO V3
// ========================================

app.get("/api/dashboard-operativo-v3", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const recepciones = readJson("recepciones.json", []);
    const strikeData = readJson("strikes.json", []);

    res.json({
        ticketsTotal: ticketsData.length,
        ticketsAbiertos: ticketsData.filter(t => t.estado === "ABIERTO").length,
        ticketsCerrados: ticketsData.filter(t => t.estado === "CERRADO").length,
        strike1: ticketsData.filter(t => t.strike === 1).length,
        strike2: ticketsData.filter(t => t.strike === 2).length,
        strike3: ticketsData.filter(t => t.strike >= 3).length,
        recepcionesTotal: recepciones.length,
        funcionales: recepciones.filter(r => r.resultado === "FUNCIONAL").length,
        cambioSim: recepciones.filter(r => r.resultado === "CAMBIO_SIM").length,
        sinSim: recepciones.filter(r => r.resultado === "SIN_SIM").length,
        pendientes: recepciones.filter(r => r.resultado === "PENDIENTE").length,
        totalStrikes: strikeData.length
    });
});

// ========================================
// V3-005.1
// UI MODERNA MVP
// ========================================

app.get("/", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const recepciones = readJson("recepciones.json", []);
    const strikeData = readJson("strikes.json", []);

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
<div class="card"><div>Tickets</div><div class="num">${ticketsData.length}</div></div>
<div class="card"><div>Recepciones</div><div class="num">${recepciones.length}</div></div>
<div class="card"><div>Strikes</div><div class="num">${strikeData.length}</div></div>
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
// V3-005.2 y 005.4
// TARJETAS OPERATIVAS Y FEED
// ========================================

app.get("/tickets-ui", (req, res) => {
    const ticketsData = readJson("tickets.json", []);

    const cards = ticketsData.map(t => `
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

// UNICA RUTA /tickets-feed (SIN DUPLICADOS)
app.get("/tickets-feed", (req, res) => {
    const ticketsData = readJson("tickets.json", []);

    const feed = ticketsData.map(t => `
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
    const ticketsData = readJson("tickets.json", []);
    const ticket = ticketsData.find(t => t.ticketId === Number(req.params.id));

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
// V3-006
// SERVICENOW ENDPOINTS
// ========================================

app.post("/api/servicenow/ticket", (req, res) => {
    const ticketsData = readJson("tickets.json", []);

    const nuevo = {
        ticketId: ticketsData.length > 0
            ? Math.max(...ticketsData.map(t => t.ticketId || 0)) + 1
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

    ticketsData.push(nuevo);
    saveJson("tickets.json", ticketsData);

    res.status(201).json({
        mensaje: "Ticket recibido",
        ticket: nuevo
    });
});

app.get("/api/tickets/duplicados/:sap", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const duplicados = ticketsData.filter(t => (t.sap || "") === req.params.sap);

    res.json({
        sap: req.params.sap,
        total: duplicados.length,
        duplicados
    });
});

app.post("/api/servicenow/validar-sap", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const sap = req.body.sap || "";
    const duplicados = ticketsData.filter(t => (t.sap || "") === sap);

    res.json({
        sap,
        existe: duplicados.length > 0,
        total: duplicados.length,
        duplicados
    });
});

app.post("/api/servicenow/ticket-seguro", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const sap = req.body.sap || "";

    const existente = ticketsData.find(t => (t.sap || "") === sap);

    if (existente) {
        return res.status(409).json({
            mensaje: "SAP duplicado",
            ticket: existente
        });
    }

    const nuevo = {
        ticketId: ticketsData.length > 0 ? Math.max(...ticketsData.map(t => t.ticketId || 0)) + 1 : 1,
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

    ticketsData.push(nuevo);
    saveJson("tickets.json", ticketsData);

    res.status(201).json({
        mensaje: "Ticket recibido",
        ticket: nuevo
    });
});

// ========================================
// V3-006.5 a V3-007.8
// SAP ENDPOINTS Y BUSQUEDAS
// ========================================

app.get("/api/tickets/sap/:sap", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const relacionados = ticketsData.filter(t => (t.sap || "") === req.params.sap);

    res.json({
        sap: req.params.sap,
        total: relacionados.length,
        tickets: relacionados
    });
});

app.get("/api/sap/:sap/historial", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const historial = ticketsData
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

app.get("/api/sap", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const resumen = {};

    ticketsData.forEach(t => {
        const sap = t.sap || "SIN_SAP";
        resumen[sap] = (resumen[sap] || 0) + 1;
    });

    res.json({
        totalSap: Object.keys(resumen).length,
        resumen
    });
});

app.get("/api/sap/top", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const contador = {};

    ticketsData.forEach(t => {
        const sap = t.sap || "SIN_SAP";
        contador[sap] = (contador[sap] || 0) + 1;
    });

    const top = Object.entries(contador)
        .map(([sap, total]) => ({ sap, total }))
        .sort((a, b) => b.total - a.total);

    res.json({
        totalSap: top.length,
        top
    });
});

app.get("/api/sap/unicos", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const contador = {};

    ticketsData.forEach(t => {
        const sap = t.sap || "SIN_SAP";
        contador[sap] = (contador[sap] || 0) + 1;
    });

    const unicos = Object.entries(contador)
        .filter(([sap, total]) => total === 1)
        .map(([sap, total]) => ({ sap, total }));

    res.json({
        total: unicos.length,
        unicos
    });
});

app.get("/api/sap/buscar/:sap", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const ticket = ticketsData.find(t => (t.sap || "") === req.params.sap);

    if (!ticket) {
        return res.status(404).json({
            mensaje: "SAP no encontrado"
        });
    }

    res.json(ticket);
});

// Búsquedas generales
app.get("/api/tienda/buscar/:tienda", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const encontrados = ticketsData.filter(t => (t.tienda || "") === req.params.tienda);

    res.json({
        tienda: req.params.tienda,
        total: encontrados.length,
        tickets: encontrados
    });
});

app.get("/api/telefono/buscar/:telefono", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const encontrados = ticketsData.filter(t => (t.telefono || "") === req.params.telefono);

    res.json({
        telefono: req.params.telefono,
        total: encontrados.length,
        tickets: encontrados
    });
});

app.get("/api/contacto/buscar/:contacto", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const encontrados = ticketsData.filter(t => (t.contacto || "") === req.params.contacto);

    res.json({
        contacto: req.params.contacto,
        total: encontrados.length,
        tickets: encontrados
    });
});

app.get("/api/problema/buscar/:problema", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const encontrados = ticketsData.filter(t => (t.problema || "") === req.params.problema);

    res.json({
        problema: req.params.problema,
        total: encontrados.length,
        tickets: encontrados
    });
});

app.get("/api/estado/buscar/:estado", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const encontrados = ticketsData.filter(t => (t.estado || "") === req.params.estado);

    res.json({
        estado: req.params.estado,
        total: encontrados.length,
        tickets: encontrados
    });
});

app.get("/api/numero/buscar/:numero", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const encontrados = ticketsData.filter(t => (t.numero || "") === req.params.numero);

    res.json({
        numero: req.params.numero,
        total: encontrados.length,
        tickets: encontrados
    });
});

app.get("/api/origen/buscar/:origen", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const encontrados = ticketsData.filter(t => (t.origen || "") === req.params.origen);

    res.json({
        origen: req.params.origen,
        total: encontrados.length,
        tickets: encontrados
    });
});

app.get("/api/busquedas/resumen", (req, res) => {
    const ticketsData = readJson("tickets.json", []);

    res.json({
        totalTickets: ticketsData.length,
        conSap: ticketsData.filter(t => t.sap).length,
        conNumero: ticketsData.filter(t => t.numero).length,
        abiertos: ticketsData.filter(t => t.estado === "ABIERTO").length,
        servicenow: ticketsData.filter(t => t.origen === "SERVICENOW").length
    });
});

// ========================================
// V3-008 a V3-014
// DASHBOARDS, ALERTAS, METRICAS, ESTADISTICAS
// ========================================

app.get("/api/dashboard/total-tickets", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    res.json({ total: ticketsData.length });
});

app.get("/api/dashboard/servicenow", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    res.json({ total: ticketsData.filter(t => t.origen === "SERVICENOW").length });
});

app.get("/api/dashboard/abiertos", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    res.json({ total: ticketsData.filter(t => t.estado === "ABIERTO").length });
});

app.get("/api/dashboard/sap", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    res.json({ total: ticketsData.filter(t => t.sap).length });
});

app.get("/api/dashboard/resumen", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    res.json({
        totalTickets: ticketsData.length,
        totalServiceNow: ticketsData.filter(t => t.origen === "SERVICENOW").length,
        totalAbiertos: ticketsData.filter(t => t.estado === "ABIERTO").length,
        totalSap: ticketsData.filter(t => t.sap).length
    });
});

app.get("/api/alertas/base", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const alertas = [];

    ticketsData.forEach(t => {
        if (t.estado === "ABIERTO") {
            alertas.push({ tipo: "TICKET_ABIERTO", ticketId: t.ticketId });
        }
    });

    res.json({ total: alertas.length, alertas });
});

app.get("/api/alertas/abiertos", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    res.json(ticketsData.filter(t => t.estado === "ABIERTO"));
});

app.get("/api/alertas/duplicados", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const contador = {};

    ticketsData.forEach(t => {
        if (t.sap) contador[t.sap] = (contador[t.sap] || 0) + 1;
    });

    const dup = Object.entries(contador).filter(([k, v]) => v > 1);
    res.json({ total: dup.length, duplicados: dup });
});

app.get("/api/alertas/sin-sap", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    res.json(ticketsData.filter(t => !t.sap));
});

app.get("/api/alertas/resumen", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    res.json({
        abiertos: ticketsData.filter(t => t.estado === 'ABIERTO').length,
        sinSap: ticketsData.filter(t => !t.sap).length
    });
});

app.get("/api/debug-version", (req, res) => {
    res.json({
        version: "FIXED-07072026",
        archivo: "index.js",
        cambios: "Rutas duplicadas eliminadas, variables inicializadas"
    });
});

// ========================================
// V3-010 a V3-014
// DUPLICADOS, METRICAS, ESTADISTICAS, CONSOLIDADA
// ========================================

app.get("/api/duplicados", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const contador = {};

    ticketsData.forEach(t => {
        if (t.sap) {
            contador[t.sap] = (contador[t.sap] || 0) + 1;
        }
    });

    const duplicados = Object.entries(contador)
        .filter(([sap, total]) => total > 1)
        .map(([sap, total]) => ({ sap, total }));

    res.json({
        total: duplicados.length,
        duplicados
    });
});

app.get("/api/duplicados/sap", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const contador = {};

    ticketsData.forEach(t => {
        if (t.sap) {
            contador[t.sap] = (contador[t.sap] || 0) + 1;
        }
    });

    res.json(contador);
});

app.get("/api/metricas", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    res.json({ totalTickets: ticketsData.length });
});

app.get("/api/metricas/estado", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const estados = {};

    ticketsData.forEach(t => {
        const e = t.estado || "SIN_ESTADO";
        estados[e] = (estados[e] || 0) + 1;
    });

    res.json(estados);
});

app.get("/api/metricas/origen", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    const origenes = {};

    ticketsData.forEach(t => {
        const o = t.origen || "SIN_ORIGEN";
        origenes[o] = (origenes[o] || 0) + 1;
    });

    res.json(origenes);
});

app.get("/api/metricas/resumen", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    res.json({
        totalTickets: ticketsData.length,
        abiertos: ticketsData.filter(t => t.estado === "ABIERTO").length,
        conSap: ticketsData.filter(t => t.sap).length,
        sinSap: ticketsData.filter(t => !t.sap).length,
        serviceNow: ticketsData.filter(t => t.origen === "SERVICENOW").length
    });
});

app.get("/api/estadisticas", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    res.json({ totalTickets: ticketsData.length });
});

app.get("/api/estadisticas/resumen", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    res.json({
        totalTickets: ticketsData.length,
        totalTiendas: new Set(ticketsData.map(t => t.tienda).filter(Boolean)).size,
        totalProblemas: new Set(ticketsData.map(t => t.problema).filter(Boolean)).size,
        totalContactos: new Set(ticketsData.map(t => t.contacto).filter(Boolean)).size
    });
});

app.get("/api/consolidada/resumen", (req, res) => {
    const ticketsData = readJson("tickets.json", []);
    res.json({
        totalTickets: ticketsData.length,
        abiertos: ticketsData.filter(t => t.estado === "ABIERTO").length,
        conSap: ticketsData.filter(t => t.sap).length
    });
});

// ========================================
// V4-010 TIMELINE PERSISTENTE
// ========================================

app.get("/api/timeline-real", (req, res) => {
    const timeline = readJson("timeline.json", []);
    res.json({
        total: timeline.length,
        eventos: timeline
    });
});

app.get("/api/timeline-real/:ticketId/eventos", (req, res) => {
    const timeline = readJson("timeline.json", []);
    const eventos = timeline.filter(x => String(x.ticketId) === String(req.params.ticketId));

    res.json({
        ticketId: req.params.ticketId,
        total: eventos.length,
        eventos
    });
});

app.post("/api/timeline-real", (req, res) => {
    const timeline = readJson("timeline.json", []);

    const nuevo = {
        eventoId: timeline.length > 0
            ? Math.max(...timeline.map(x => x.eventoId || 0)) + 1
            : 1,
        ticketId: req.body.ticketId,
        tipo: req.body.tipo || "EVENTO",
        detalle: req.body.detalle || "",
        fecha: new Date().toISOString()
    };

    timeline.push(nuevo);
    saveJson("timeline.json", timeline);

    res.status(201).json(nuevo);
});

// ========================================
// SYS-001
// LEVANTAR SERVIDOR
// ========================================

app.listen(3000, () => {
    console.log("");
    console.log("========================================");
    console.log(" HOTSPOT OPERATIONS HUB");
    console.log("========================================");
    console.log(" API ONLINE ✅");
    console.log(" PUERTO: 3000");
    console.log(" RUTAS DISPONIBLES:");
    console.log(" GET  /api/test");
    console.log(" GET  /api/tickets");
    console.log(" POST /api/tickets");
    console.log(" GET  /api/hotspots");
    console.log(" GET  /api/dashboard-operativo-v3");
    console.log(" GET  /api/dashboard");
    console.log(" GET  /");
    console.log(" GET  /hub");
    console.log(" GET  /tickets-feed");
    console.log("========================================");
    console.log("");
});
