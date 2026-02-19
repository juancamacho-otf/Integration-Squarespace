require("dotenv").config();
const mongoose = require("mongoose");
const ContactHistory = require("../models/ContactHistory");
const CompanyHistory = require("../models/CompanyHistory");
const RequestQueue = require("../models/RequestQueue");

const findContactInMongo = async (shopvox_contact_id) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const contact = await ContactHistory.findOne({
      shopvox_contact_id,
    });
    return contact;
  } catch (error) {
    console.error(
      `❌ Error finding contact with shopvox id ${shopvox_contact_id} in mongo:`,
      error.message
    );
    throw error;
  }
};

const findCompanyInMongo = async (shopvox_company_id) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const company = await CompanyHistory.findOne({
      shopvox_company_id,
    });
    return company;
  } catch (error) {
    console.error(
      `❌ Error finding company with shopvox id ${shopvox_company_id} in mongo:`,
      error.message
    );
    throw error;
  }
};

const createContactInMongo = async (shopvox_contact_id, hubspot_contact_id) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const payload = {
      shopvox_contact_id,
      hubspot_contact_id,
    };
    const contact = await ContactHistory.findOneAndUpdate(
      { shopvox_contact_id },
      { $set: payload },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );
    return contact;
  } catch (error) {
    console.error(
      `❌ Error creating contact with shopvox id ${shopvox_contact_id} and hubspot id ${hubspot_contact_id} in mongo:`,
      error.message
    );
    throw error;
  }
};

const createCompanyInMongo = async (shopvox_company_id, hubspot_company_id) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const payload = {
      shopvox_company_id,
      hubspot_company_id,
    };
    const company = await CompanyHistory.findOneAndUpdate(
      { shopvox_company_id },
      { $set: payload },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );
    return company;
  } catch (error) {
    console.error(
      `❌ Error creating company with shopvox id ${shopvox_company_id} and hubspot id ${hubspot_company_id} in mongo:`,
      error.message
    );
    throw error;
  }
};

const savaPayloadRequest = async (webhookBody) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    return await RequestQueue.create({ webhookBody });
  } catch (error) {
    console.error(
      `❌ Error saving queue request payload in mongo: `,
      error.message
    );
    throw error;
  }
};

const getAllPayloadRequest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const requestQueue = await RequestQueue.find({});
    return requestQueue;
  } catch (error) {
    console.error(
      `❌ Error getting all queue request payload in mongo: `,
      error.message
    );
    throw error;
  }
};

const getAllRequestQueueSortedByOldest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const results = await RequestQueue.find({}).sort({ createdAt: 1 });

    return results;
  } catch (error) {
    console.error(
      `❌ Error getting all queue request payload in mongo: `,
      error.message
    );
    throw error;
  }
};

const deleteOnePayloadRequest = async (id) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const resultado = await RequestQueue.findByIdAndDelete(id);
    if (resultado) {
      console.log("🗑️ Deleted:", resultado);
      return resultado;
    } else {
      console.log("⚠️ The record with that ID was not found in mongo.");
      return null;
    }
  } catch (error) {
    console.error(
      `❌ Error deleting queue request payload in mongo: `,
      error.message
    );
    throw error;
  }
};

module.exports = {
  findContactInMongo,
  findCompanyInMongo,
  createContactInMongo,
  createCompanyInMongo,
  savaPayloadRequest,
  getAllPayloadRequest,
  deleteOnePayloadRequest,
  getAllRequestQueueSortedByOldest,
};
