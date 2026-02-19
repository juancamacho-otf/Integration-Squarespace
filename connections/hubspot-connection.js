const hubspotClientAPI = require("@hubspot/api-client");
const config = require("../config");
require("dotenv").config();

const hubspotClient = () => {
  return new hubspotClientAPI.Client({
    accessToken: config.hubspot.accessToken,
  });
};
const accessToken = config.hubspot.accessToken;

module.exports = {
  hubspotClient,
  accessToken,
};
