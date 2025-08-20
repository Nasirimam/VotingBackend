const mongoose = require("mongoose");

const electionSchema = mongoose.Schema({
  name: String,
  status: {
    type: String,
    enum: ["ongoing", "completed"],
    default: "ongoing",
  },
  candidates: [
    {
      _id: String,
      votes: {
        type: Number,
        default: 0,
      },
    },
  ],
  voters: [
    {
      _id: String,
    },
  ],
});

const electionModel = mongoose.model("election", electionSchema);

module.exports = {
  electionModel,
};
