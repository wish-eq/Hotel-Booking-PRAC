const mongoose = require("mongoose");

const HotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a hotel name"],
    unique: true,
    trim: true,
    maxlength: [50, "Hotel name cannot be more than 50 characters"],
  },
  address: {
    type: String,
    required: [true, "Please add an address"],
  },
  telephone: {
    type: String,
    required: [true, "Please add a telephone number"],
    maxlength: [20, "Telephone number cannot be longer than 20 digits"],
  },
  // Add any other relevant hotel information
});

module.exports = mongoose.model("Hotel", HotelSchema);
