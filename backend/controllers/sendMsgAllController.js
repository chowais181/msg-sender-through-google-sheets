const axios = require("axios");
const { parse } = require("csv-parse/sync");
const numbersModel = require("../models/numbersModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

let tokenId = "";
let device = "";
const url = "https://api.wali.chat/v1/messages";

const sendMessagesAll = catchAsyncErrors(async (req, res) => {
  // empty the collection
  numbersModel
    .deleteMany({})
    .then(() => {
      console.log("Collection emptied successfully");
    })
    .catch((err) => {
      console.error("Error emptying collection:", err);
    });

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

    console.log("=> Processing messages...");
    messages.push("Processing messages...");
    for (const [phone, message] of records) {
      if (!phone || !message) {
        continue;
      }
      const number = normalizePhone(phone);
      if (number && number.length >= 8 && message) {
        const body = {
          phone,
          message: message.trim(),
          device,
        };

        await numbersModel.create({ phoneNumber: number });

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

    res.status(200).json({ messages });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Error sending messages" });
  }
});

const normalizePhone = (phone) => {
  return `+${phone.replace(/\D/g, "")}`;
};

module.exports = { sendMessagesAll };
