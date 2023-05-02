const { sendMessages } = require("../controllers/sendMsgController");
const { sendMessagesAll } = require("../controllers/sendMsgAllController");
const express = require("express");
const router = express.Router();
router.route("/send-msg").post(sendMessages);
router.route("/send-msg-all").post(sendMessagesAll);
module.exports = router;
