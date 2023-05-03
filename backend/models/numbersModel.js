const mongoose = require("mongoose");

//.....number schema
const numberSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
  },
});

module.exports = mongoose.model("Numbers", numberSchema);
