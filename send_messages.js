const axios = require("axios");
const { parse } = require("csv-parse/sync");

// Replace this with the URL of your published Google Sheets CSV file
// See the indications above to obtain the Google Sheets download URL to enter here
const googleSheetsCsvUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRqekI7I3lm9QcUa23j9LvGuGFetJX63jzV4GEdThWSwetDuNqz_V27dy8fuxEWwBKW8in8rg8v7Z3_/pub?gid=0&single=true&output=csv";

// Replace this with your WaliChat API token
// Get your API token here: https://app.wali.chat/apikeys
const token =
  "d242686589baf0735641aba0788b4ee1202e1bdfc31ced8e2e5a6fcc5145e927ebf7c430c886fce5";

// Optionally specify the target WhatsApp device ID connected to WaliChat
// you want to use for messages delivery (24 characters hexadecimal value)
const device = "643ff25980135f43f2dd05a7";

// Define the headers for the API request
const headers = {
  "Content-Type": "application/json",
  Authorization: `${token}`,
};

// Define the URL for the WaliChat API
const url = "https://api.wali.chat/v1/messages";

const normalizePhone = (phone) => {
  return `+${phone.replace(/\D/g, "")}`;
};

const sendMessage = async (phone, message) => {
  const body = {
    phone,
    message: message.trim(),
    device,
  };
  try {
    await axios.post(url, body, { headers });
    console.log(`==> Message created: ${phone}`);
  } catch (error) {
    console.error(
      "Failed to create message to ${phone}:",
      error.response ? error.response.data : error
    );
  }
};

const main = async () => {
  try {
    console.log("=> Downloading Google Sheets CSV file...");
    const { data } = await axios.get(googleSheetsCsvUrl);
    const records = parse(data, { columns: false, skip_empty_lines: true });

    console.log("=> Processing messages...");
    for (const [phone, message] of records) {
      if (!phone || !message) {
        continue;
      }

      const number = normalizePhone(phone);
      if (number && number.length >= 8 && message) {
        await sendMessage(number, message);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
};

main();
