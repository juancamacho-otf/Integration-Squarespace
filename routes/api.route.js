const router = require("express").Router();
const fs = require("fs");
const path = require("path");

// --- IMPORTACIONES LIMPIAS ---
const logger = require("../services/logger-service");
const stateService = require("../services/state-service");
const { runInitialLoad } = require("../services/irunInitialLoad_service");

// ==========================================
//   CONTROL DE MIGRACIÓN (ENDPOINTS)
// ==========================================

/**
 * GET /api/v1/status/migration
 * Devuelve el estado actual (JSON) de la migración.
 */
router.get("/v1/status/migration", (req, res) => {
    try {
        const state = stateService.getMigrationState();
        res.json(state || { status: "IDLE", message: "No state found." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/v1/migration/start
 * Inicia la migración en segundo plano (Background).
 */
router.post("/v1/migration/start", (req, res) => {
    const state = stateService.getMigrationState();
    
    if (state && state.status === 'RUNNING') {
        return res.status(409).json({ 
            message: "⚠️ Warning: Migration is already running.", 
            current_status: state 
        });
    }

    // Ejecutar sin await para no bloquear la respuesta
    runInitialLoad(); 
    
    res.json({ 
        message: " Migration started in background.",
        note: "Check /api/v1/status/migration to monitor progress." 
    });
});

/**
 * POST /api/v1/migration/reset
 * Resetea forzosamente el estado a IDLE. Útil si se queda pegado en ERROR.
 */
router.post("/v1/migration/reset", (req, res) => {
    stateService.saveMigrationState({ status: 'IDLE', error_message: null, cursor: null });
    logger.info("[INFO] Migration state reset manually via API.");
    res.json({ message: "State reset successfully. Ready to retry." });
});

// ==========================================
//   MONITOREO Y LOGS
// ==========================================

/**
 * GET /api/v1/logs/view
 * Muestra las últimas 100 líneas del log en el navegador.
 */
router.get("/v1/logs/view", async (req, res) => {
    try {
        const logs = await logger.getRecentLogs(100);
        res.set('Content-Type', 'text/plain');
        res.send(logs);
    } catch (error) {
        res.status(500).send(`Error reading logs: ${error.message}`);
    }
});

/**
 * GET /api/v1/download-applog
 * Descarga el archivo de log completo.
 */
router.get("/v1/download-applog", (req, res) => {
    const logFilePath = path.join(__dirname, "../logs/app_logs.txt");
    
    if (fs.existsSync(logFilePath)) {
        res.download(logFilePath, "app-log.txt", (err) => {
            if (err) logger.error(`[ERROR] Downloading log file: ${err.message}`);
        });
    } else {
        res.status(404).send("Log file not found.");
    }
});

/**
 * GET /api
 * Health check simple.
 */
router.get("/", (req, res) => {
    res.send({ message: "Squarespace Integration API is Online & Healthy 🚀" });
});

module.exports = router;