const axios = require("axios");
require("dotenv").config();
const { parse } = require("csv-parse/sync");
const ErrorHander = require("../utils/errorHander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const token = process.env.TOKEN;
const device = process.env.DEVICE;
const googleSheetsCsvUrl = process.env.GOOGLE_SHEETS_CSV_URL;
const url = "https://api.wali.chat/v1/messages";

const headers = {
  "Content-Type": "application/json",
  Authorization: `${token}`,
};

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
    // res.status(200).json({ msg: `==> Message created: ${phone}` });
  } catch (error) {
    console.error(
      `Failed to create message to ${phone}:`,
      error.response ? error.response.data : error
    );
    // res.status(500).json({
    //   error: `Failed to create message to ${phone}:${
    //     error.response ? error.response.data : error
    //   }`,
    // });
  }
};

const sendMessages = catchAsyncErrors(async (req, res) => {
  try {
    const { url, device, token } = req.body;

    // Replace the environment variables with the values provided in the request body
    process.env.GOOGLE_SHEETS_CSV_URL = url;
    process.env.DEVICE = device;
    process.env.TOKEN = token;

    console.log("=> Downloading Google Sheets CSV file...");
    const { data } = await axios.get(googleSheetsCsvUrl);
    const records = parse(data, { columns: false, skip_empty_lines: true });
    console.log(records);
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

    res.status(200).json({ message: "Messages sent successfully" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Error sending messages" });
  }
});

module.exports = { sendMessages };
