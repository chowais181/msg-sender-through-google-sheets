const { sendMessages } = require("../controllers/sendMsgController");
const express = require("express");
const router = express.Router();
router.route("/send-msg").post(sendMessages);

module.exports = router;
