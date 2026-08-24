// ========================================
// HOTSPOT OPERATIONS HUB V5
// MODULO: DATASTORE
// CODIGO: DST
// VERSION: 5.0.0
// ========================================

const fs = require("fs");
const path = require("path");

// ========================================
// DST-001
// OBTENER RUTA DEL ARCHIVO
// ========================================
function getFilePath(fileName) {
    return path.join(__dirname, "..", "..", "data", fileName);
}

// ========================================
// DST-002
// LEER ARCHIVO JSON
// ========================================
function readJson(fileName, defaultData = []) {

    const filePath = getFilePath(fileName);

    if (!fs.existsSync(filePath)) {

        fs.writeFileSync(
            filePath,
            JSON.stringify(defaultData, null, 2)
        );

        console.log(`DST-002 Archivo creado: ${fileName}`);

        return defaultData;
    }

    try {

        return JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );

    } catch (error) {

        console.error(
            `DST-002 Error leyendo ${fileName}`,
            error.message
        );

        return defaultData;
    }
}

// ========================================
// DST-003
// GUARDAR ARCHIVO JSON
// ========================================
function saveJson(fileName, data) {

    const filePath = getFilePath(fileName);

    fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 2)
    );

    console.log(`DST-003 Archivo actualizado: ${fileName}`);
}

// ========================================
// DST-004
// GENERAR SIGUIENTE ID
// ========================================
function getNextId(collection, idField) {

    if (!Array.isArray(collection) || collection.length === 0) {
        return 1;
    }

    const maxId = Math.max(
        ...collection.map(item => Number(item[idField]) || 0)
    );

    return maxId + 1;
}

// ========================================
// DST-005
// VERIFICAR EXISTENCIA
// ========================================
function exists(collection, field, value) {

    return collection.some(
        item => item[field] === value
    );
}

// ========================================
// DST-006
// EXPORTAR FUNCIONES
// ========================================
module.exports = {
    getFilePath,
    readJson,
    saveJson,
    getNextId,
    exists
};
