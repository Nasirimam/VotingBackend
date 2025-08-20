const express = require("express");
const voterRouter = express.Router();
const { VoterModel } = require("../models/voter.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { verifyToken, isAdmin } = require("../middelware/authmiddleware");
require("dotenv").config();

voterRouter.get("/", async (req, res) => {
  let query = req.query;
  try {
    const users = await VoterModel.find(query);
    res.send(users);
  } catch (error) {
    console.log(error);
    res.send("Somting Went Wrong");
  }
});

voterRouter.post("/add", async (req, res) => {
  try {
    const { email, password, ...rest } = req.body;

    // 1. Check if email already exists
    const existingUser = await VoterModel.findOne({ email });
    if (existingUser) {
      return res.send("User already registered with this email");
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save user
    const user = new VoterModel({
      ...rest,
      email,
      password: hashedPassword,
    });

    await user.save();
    console.log(user);
    res.send("User Added To DB");
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong");
  }
});

// LOGIN
voterRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const voter = await VoterModel.findOne({ email });
    if (!voter) return res.send("Voter not found");

    // Compare password
    const isMatch = await bcrypt.compare(password, voter.password);
    if (!isMatch) return res.send("Invalid credentials");

    // Create token
    const token = jwt.sign(
      { id: voter._id, role: voter.role },
      process.env.JWT_SECRET
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.send("Something went wrong");
  }
});

voterRouter.get("/profile", verifyToken, async (req, res) => {
  try {
    const voter = await VoterModel.findById(req.user.id);
    if (!voter) return res.send("Voter not found");
    res.json(voter);
  } catch (error) {
    console.error(error);
    res.send("Something went wrong");
  }
});

voterRouter.get("/:_id", async (req, res) => {
  try {
    const voter = await VoterModel.findById(req.params._id);
    if (!voter) return res.send("Voter not found");
    res.json(voter);
  } catch (error) {
    console.error(error);
    res.send("Something went wrong");
  }
});

voterRouter.delete("/delete-profile", verifyToken, async (req, res) => {
  try {
    const deletedVoter = await VoterModel.findByIdAndDelete(req.user.id);

    if (!deletedVoter) {
      return res.status(404).send("Voter not found");
    }
    res.send("Profile deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong");
  }
});

voterRouter.delete("/delete/:_id", verifyToken, isAdmin, async (req, res) => {
  const { _id } = req.params;
  try {
    const deletedVoter = await VoterModel.findByIdAndDelete(_id);
    if (!deletedVoter) {
      return res.send("Voter not found");
    }
    res.send("Voter deleted successfully");
  } catch (error) {
    console.error(error);
    res.send("Something went wrong");
  }
});

voterRouter.patch("/updateRole/:id", async (req, res) => {
  try {
    const voter = await VoterModel.findById(req.params.id);
    if (!voter) {
      return res.status(404).json({ error: "Voter not found" });
    }

    // Toggle role
    voter.role = voter.role === "voter" ? "admin" : "voter";

    await voter.save();

    res.json({ message: "Role updated successfully", voter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = {
  voterRouter,
};
