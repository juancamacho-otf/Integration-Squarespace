require("dotenv").config();

const config = {
    squarespace: {
        apiKey: process.env.SQUARESPACE_API_KEY,
    },

    hubspot: {
        accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
        pipelineId: process.env.HUBSPOT_PIPELINE_ID || "859687248",
        
        stages: {
            checkout_completed: process.env.HUBSPOT_STAGE_WON || "1283053947"
        }
    },

    throttling: process.env.THROTTLING_SERVICE === "true"
};

module.exports = config;