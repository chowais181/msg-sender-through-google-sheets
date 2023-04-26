import React, { useState, useEffect } from "react";
import axios from "axios";
import Papa from "papaparse";
import "./MessageSender.css";
const MessageSender = () => {
  const [googleSheetsCsvUrl, setGoogleSheetsCsvUrl] = useState(
    localStorage.getItem("googleSheetsCsvUrl")
  );
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [device, setDevice] = useState(localStorage.getItem("device"));
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    localStorage.setItem("googleSheetsCsvUrl", googleSheetsCsvUrl);
    localStorage.setItem("token", token);
    localStorage.setItem("device", device);
  }, [googleSheetsCsvUrl, token, device]);

  // Define the headers for the API request
  const headers = {
    "Content-Type": "application/json",
    Authorization: `${token}`,
  };

  // Define the URL for the WaliChat API
  const url = "https://api.wali.chat/v1/messages";

  const resetHandler = (event) => {
    event.preventDefault();
    setGoogleSheetsCsvUrl("");
    setToken("");
    setDevice("");
    setMsg("");
    setErr("");
    localStorage.removeItem("googleSheetsCsvUrl");
    localStorage.removeItem("token");
    localStorage.removeItem("device");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      console.log("=> Downloading Google Sheets CSV file...");
      setMsg("Downloading Google Sheets CSV file...");
      const { data } = await axios.get(googleSheetsCsvUrl);
      const records = Papa.parse(data, {
        header: true,
        columns: false,
        skip_empty_lines: true,
      });
      console.log("=> Processing messages...");
      setMsg("Processing messages...");
      records?.data.map((record) => {
        const phone = record["PHONE NUMBER"];
        const message = record["MESSAGE BODY"];
        if (!phone || !message) {
          return 1;
        }
        const number = normalizePhone(phone);
        if (number && number.length >= 8 && message) {
          sendMessage(number, message);
        }

        return 1;
      });
    } catch (err) {
      setErr(`Error : ${err}`);
      console.error("Error:", err);
    }
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
      setMsg(`Message created: ${phone}`);
    } catch (error) {
      setErr(
        `Failed to create message to ${phone}`,
        error.response ? error.response.data : error
      );
      console.error(
        `Failed to create message to ${phone}`,
        error.response ? error.response.data : error
      );
    }
  };

  return (
    <div>
      <br />
      <form onSubmit={handleSubmit}>
        <label htmlFor="googleSheetsCsvUrl">Google Sheets CSV URL</label>
        <input
          id="googleSheetsCsvUrl"
          type="text"
          value={googleSheetsCsvUrl}
          onChange={(event) => setGoogleSheetsCsvUrl(event.target.value)}
        />

        <label htmlFor="token">Token</label>
        <input
          id="token"
          type="text"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />

        <label htmlFor="device">Device</label>
        <input
          id="device"
          type="text"
          value={device}
          onChange={(event) => setDevice(event.target.value)}
        />
        <div className="btns">
          <div className="msg-btn">
            <button type="submit">Send Messages</button>
          </div>
          <div className="reset-btn">
            <button onClick={resetHandler}>Reset</button>
          </div>
        </div>
      </form>
      <h4>{err ? "" : msg}</h4>
      <h4>{err === "" ? "" : err}</h4>
    </div>
  );
};

export default MessageSender;
