const axios = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse/sync");
const ErrorHander = require("../utils/errorHander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

let tokenId = "";
let device = "";
let googleSheetsCsvUrl = "";
const url = "https://api.wali.chat/v1/messages";

const sendMessages = catchAsyncErrors(async (req, res) => {
  try {
    const { googleSheetsCsvUrl, deviceId, token } = req.body;
    device = deviceId;
    tokenId = token;
    const messages = [];
    console.log("=> Downloading Google Sheets CSV file...");
    messages.push("Downloading Google Sheets CSV file...");
    const { data } = await axios.get(googleSheetsCsvUrl);
    console.log("csv", data?.length);
    if (!data?.length) {
      res.status(200).json({ messages });
      messages.push("Downloading Google Sheets CSV file...");
    }
    const records = parse(data, { columns: false, skip_empty_lines: true });
    const newPhoneNumbers = [];
    // Check each phone number against existing phone numbers in file
    const fileData = fs.readFileSync(__dirname + "/phoneNumbers.txt", "utf-8");
    const existingPhoneNumbers = fileData.split("\n");

    console.log("=> Processing messages...");
    messages.push("Processing messages...");
    for (const [phone, message] of records) {
      if (!phone || !message) {
        continue;
      }
      const number = normalizePhone(phone);
      if (
        number &&
        number.length >= 8 &&
        message &&
        !existingPhoneNumbers.includes(number)
      ) {
        newPhoneNumbers.push(number);
        // Add new phone number to file
        fs.appendFileSync(__dirname + "/phoneNumbers.txt", `${number}\n`);
      }

      // Send message to number here
      // Send message to new phone numbers only
      if (newPhoneNumbers.includes(phone)) {
        console.log("Send message to new phone numbers only");
        const body = {
          phone,
          message: message.trim(),
          device,
        };
        try {
          const headers = {
            "Content-Type": "application/json",
            Authorization: `${tokenId}`,
          };

          await axios.post(url, body, { headers });
          console.log(`==> Message created: +${phone}`);
          messages.push(`Message created: +${phone}`);
        } catch (error) {
          console.error(
            `Failed to create message to +${phone}:`,
            error.response ? error.response.data : error
          );
          messages.push(`Failed to create message to +${phone}`);
        }
      }
    }

    res.status(200).json({ messages });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Error sending messages" });
  }
});

const normalizePhone = (phone) => {
  return `+${phone.replace(/\D/g, "")}`;
};

module.exports = { sendMessages };
