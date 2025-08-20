const mongoose = require("mongoose");

const voterSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  rollnumber: Number,
  department: String,
  year: Number,
  role: { type: String, default: "voter" },
  bio: String,
  image: {
    type: String,
    default:
      "https://media.istockphoto.com/id/1341046662/vector/picture-profile-icon-human-or-people-sign-and-symbol-for-template-design.jpg?s=612x612&w=0&k=20&c=A7z3OK0fElK3tFntKObma-3a7PyO8_2xxW0jtmjzT78=",
  },
});

const VoterModel = mongoose.model("voter", voterSchema);

module.exports = {
  VoterModel,
};
