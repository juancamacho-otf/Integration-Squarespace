const { makeRequestWithExponentialRetries } = require("./request_service");
const config = require("../config");

const getProfile = async (cursor = null) => {
    const params = new URLSearchParams();
    if (cursor) params.append("cursor", cursor);

    const url = `https://api.squarespace.com/1.0/profiles?${params.toString()}`;

    const response = await makeRequestWithExponentialRetries({ 
        type: "GET",
        url: url,
        headers: {
            "Authorization": `Bearer ${config.squarespace.apiKey}`,
            "User-Agent": "HubSpot-Integration/1.0" 
        }
    });
    return response;
};

const getOrdersByDateWindow = async (startDateIso, endDateIso, cursor = null) => {
    const baseUrl = "https://api.squarespace.com/1.0/commerce/orders";
    const params = new URLSearchParams();

    if (cursor) {
        params.append("cursor", cursor);
    } else {
        params.append("modifiedAfter", startDateIso);
        params.append("modifiedBefore", endDateIso);
    }

    const url = `${baseUrl}?${params.toString()}`;

    const response = await makeRequestWithExponentialRetries({ 
        type: "GET",
        url: url,
        headers: {
            "Authorization": `Bearer ${config.squarespace.apiKey}`,
        }
    });
    return response;
};

const getPaymenByDateWindow = async (startDateIso, endDateIso, cursor = null) => {
    const baseUrl = "https://api.squarespace.com/1.0/commerce/transactions";
    const params = new URLSearchParams();

    if (cursor) {
        params.append("cursor", cursor);
    } else {
        params.append("modifiedAfter", startDateIso);
        params.append("modifiedBefore", endDateIso);
    }

    const url = `${baseUrl}?${params.toString()}`;

    const response = await makeRequestWithExponentialRetries({ 
        type: "GET",
        url: url,
        headers: {
            "Authorization": `Bearer ${config.squarespace.apiKey}`,
        }
    });
    return response;
};
const getProfileByEmail = async (email) => {
    const params = new URLSearchParams();
    params.append("filter", `email,${encodeURIComponent(email)}`);
    // Squarespace siempre devuelve una lista en profiles, incluso si es uno solo
    const url = `https://api.squarespace.com/1.0/profiles?${params.toString()}`;

    return await makeRequestWithExponentialRetries({ 
        type: "GET",
        url: url,
        headers: {
            "Authorization": `Bearer ${config.squarespace.apiKey}`,
            "User-Agent": "HubSpot-Integration/1.0"
        }
    });
};
module.exports = {
    getProfile,
    getOrdersByDateWindow,
    getPaymenByDateWindow,
    getProfileByEmail
};