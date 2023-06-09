const axios = require("axios");
const numbersModel = require("../models/numbersModel");
const { parse } = require("csv-parse/sync");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

let tokenId = "";
let device = "";
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

    if (!data?.length) {
      res.status(200).json({ messages });
      messages.push("Downloading Google Sheets CSV file...");
    }
    const records = parse(data, { columns: false, skip_empty_lines: true });
    const newPhoneNumbers = [];

    console.log("=> Processing messages...");
    messages.push("Processing messages...");
    for (const [phone, message] of records) {
      if (!phone || !message) {
        continue;
      }
      const number = await normalizePhone(phone);
      // Check if the phone number already exists in the database
      const existingPhoneNumber = await numbersModel.findOne({
        phoneNumber: number,
      });

      if (number && number.length >= 8 && message && !existingPhoneNumber) {
        newPhoneNumbers.push(number);
        // Add new phone number to db
        await numbersModel.create({ phoneNumber: number });
      }
      console.log(newPhoneNumbers);
      // Send message to new phone numbers only
      if (newPhoneNumbers.includes(number)) {
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
          if (error?.response?.data?.status === 403) {
            messages.push("The API token provided is invalid");
            res.status(200).json({ messages });
            return;
          }
          if (error.response?.data?.errors[0]?.path === "device") {
            messages.push("Device id is not correct");
            res.status(200).json({ messages });
            return;
          }
          if (error.response?.data?.errorCode === "phone:invalid") {
            messages.push(
              `Phone number is not a valid international mobile number: ${number}`
            );
          } else {
            console.error(
              `Failed to create message to +${phone}:`,
              error.response ? error.response.data : error
            );
            messages.push(`Failed to create message to: +${phone}`);
          }
        }
      }
    }

    if (!newPhoneNumbers.length) {
      messages.push("No changes in file");
    }

    res.status(200).json({ messages });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Error sending messages" });
  }
});

const normalizePhone = async (phone) => {
  return Promise.resolve(`+${phone.replace(/\D/g, "")}`);
};

module.exports = { sendMessages };
