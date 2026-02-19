const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '../states');
const MIGRATION_STATE_FILE = path.join(STATE_DIR, 'migration_state.json');
const TEMP_STATE_FILE = path.join(STATE_DIR, 'migration_state.tmp'); 

if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR);
}

const getMigrationState = () => {
    try {
        if (!fs.existsSync(MIGRATION_STATE_FILE)) {
            return {
                last_processed_timestamp: 0, 
                last_run_date: null
            };
        }
        return JSON.parse(fs.readFileSync(MIGRATION_STATE_FILE, 'utf8'));
    } catch (error) {
        console.error("Error reading state file:", error);
        return { last_processed_timestamp: 0 };
    }
};

const saveMigrationState = (newState) => {
    try {
        const currentState = getMigrationState();
        const mergedState = { ...currentState, ...newState, last_run_date: new Date().toISOString() };
        
        
        fs.writeFileSync(TEMP_STATE_FILE, JSON.stringify(mergedState, null, 2));
        
        
        fs.renameSync(TEMP_STATE_FILE, MIGRATION_STATE_FILE);
        
    } catch (error) {
        console.error("Error saving state file:", error);
    }
};

module.exports = { getMigrationState, saveMigrationState };