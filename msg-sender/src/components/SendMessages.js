import React, { useState, useEffect } from "react";
import axios from "axios";
// import Papa from "papaparse";
import "./MessageSender.css";
const MessageSender = () => {
  // const apiUrl = process.env.REACT_APP_BASE_URL;
  const apiUrl = "http://localhost:5000/";

  const [googleSheetsCsvUrl, setGoogleSheetsCsvUrl] = useState(
    localStorage.getItem("googleSheetsCsvUrl") || ""
  );
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [deviceId, setDevice] = useState(localStorage.getItem("device") || "");
  const [msg, setMsg] = useState("");
  const [res, setRes] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    localStorage.setItem("googleSheetsCsvUrl", googleSheetsCsvUrl);
    localStorage.setItem("token", token);
    localStorage.setItem("device", deviceId);
  }, [googleSheetsCsvUrl, token, deviceId]);

  // Define the headers for the API request

  // Define the URL for the WaliChat API

  const resetHandler = (event) => {
    event.preventDefault();
    setGoogleSheetsCsvUrl("");
    setToken("");
    setDevice("");
    setMsg("");
    setErr("");
    localStorage.setItem("googleSheetsCsvUrl", "");
    localStorage.setItem("token", "");
    localStorage.setItem("device", "");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMsg("Please wait messages are sending ....");
    setErr("");
    setRes("");
    if (token === "" || deviceId === "" || googleSheetsCsvUrl === "") {
      setMsg("Please fill all the input fields");
    } else {
      try {
        // configure header's Content-Type as JSON
        const config = {
          headers: {
            "Content-Type": "application/json",
          },
        };
        const { data } = await axios.post(
          apiUrl + "api/v1/send-msg",
          { googleSheetsCsvUrl, token, deviceId },
          config
        );
        setRes(data?.messages);
        setMsg("");
      } catch (err) {
        console.log(err);
        setErr(err?.response?.data?.message);
        setMsg("");
        setRes("");
        console.error(err?.message);
      }
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
          value={deviceId}
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
      <h5>
        {res.length > 0 && res?.map((msg) => <p key={msg}>{`\n${msg}`}</p>)}
      </h5>
      <h4>{err === "" ? "" : err}</h4>
    </div>
  );
};

export default MessageSender;
