const express = require("express");
const { connection } = require("./db");
const cors = require("cors");
const { voterRouter } = require("./routes/voter.route");
const electionRouter = require("./routes/election.route");

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome");
});

app.use("/voter", voterRouter);
app.use("/election", electionRouter);

const PORT = process.env.PORT || 4500;

app.listen(PORT, async () => {
  try {
    connection;
    console.log("Connected To DB");
  } catch (error) {
    console.log("Error While Connection with DB");
    console.log(error);
  }
  console.log(`Server is running on port ${PORT}`);
});
