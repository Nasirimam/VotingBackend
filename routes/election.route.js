// election.routes.js
const express = require("express");
const { electionModel } = require("../models/election.model");
const { voterModel } = require("../models/voter.model");
const { verifyToken, isAdmin } = require("../middelware/authmiddleware");

const electionRouter = express.Router();

/**
 * Create a new election
 */

electionRouter.post("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const election = new electionModel({ name });
    await election.save();
    res.status(201).json({ message: "Election created", election });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

electionRouter.get("/:id", async (req, res) => {
  try {
    const voter = await electionModel.findById(req.params.id);
    if (!voter) return res.send("Election not found");
    res.json(voter);
  } catch (error) {
    console.error(error);
    res.send("Something went wrong");
  }
});

// Stop an election
electionRouter.patch("/:id/stop", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const updatedElection = await electionModel.findByIdAndUpdate(
      id,
      { status: "completed" },
      { new: true } // returns updated document
    );

    if (!updatedElection) {
      return res.status(404).json({ message: "Election not found" });
    }

    res.status(200).json({
      message: "Election stopped successfully",
      election: updatedElection,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /election/:id
electionRouter.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedElection = await electionModel.findByIdAndDelete(id);

    if (!deletedElection) {
      return res.status(404).json({ message: "Election not found" });
    }

    res.status(200).json({ message: "Election deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get all elections
 */
electionRouter.get("/", verifyToken, async (req, res) => {
  try {
    const elections = await electionModel
      .find()
      .populate("candidates")
      .populate("voters");
    res.json(elections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Add a candidate to an election
 * Body: { candidateId: "someId" }
 */
electionRouter.post("/:electionId/candidate", verifyToken, async (req, res) => {
  try {
    const { electionId } = req.params;
    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({ message: "Candidate ID is required" });
    }

    // Check if election exists
    const election = await electionModel.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    // Prevent duplicate candidate in same election
    const alreadyExists = election.candidates.some(
      (c) => c._id === candidateId
    );
    if (alreadyExists) {
      return res.status(400).json({ message: "Candidate already added" });
    }

    // Add candidate with default votes = 0
    election.candidates.push({ _id: candidateId, votes: 0 });
    await election.save();

    res.status(201).json({
      message: "Candidate added successfully",
      election,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all candidates for a specific election (IDs only)
electionRouter.get("/:electionId/candidates", verifyToken, async (req, res) => {
  try {
    const { electionId } = req.params;

    // Find the election without populating any additional fields
    const election = await electionModel.findById(electionId);

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    // Format the response with just IDs and votes
    const candidates = election.candidates.map((candidate) => ({
      id: candidate._id, // Just the candidate ID
      votes: candidate.votes,
    }));

    res.status(200).json({
      message: "Candidates retrieved successfully",
      candidates,
      totalCandidates: candidates.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Remove a candidate from election
 */
electionRouter.delete(
  "/:electionId/candidate/:candidateId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { electionId, candidateId } = req.params;

      // Find election by ID
      const election = await electionModel.findById(electionId);
      if (!election) {
        return res.status(404).json({ message: "Election not found" });
      }

      // Remove the candidate from the election.candidates array
      election.candidates = election.candidates.filter(
        (cand) => cand._id.toString() !== candidateId
      );

      await election.save();

      res.json({ message: "Candidate removed successfully", election });
    } catch (error) {
      console.error("Error removing candidate:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// CAST A VOTE
electionRouter.post(
  "/:electionId/vote/:candidateId/:voterId",
  verifyToken,
  async (req, res) => {
    try {
      const { electionId, candidateId, voterId } = req.params;

      // Find election
      const election = await electionModel.findById(electionId);
      if (!election) {
        return res.status(404).json({ message: "Election not found" });
      }

      // Check if voter already voted
      const alreadyVoted = election.voters.some(
        (voter) => voter._id.toString() === voterId
      );
      if (alreadyVoted) {
        return res
          .status(400)
          .json({ message: "Voter has already voted in this election" });
      }

      // Find candidate in election
      const candidate = election.candidates.find(
        (cand) => cand._id.toString() === candidateId
      );
      if (!candidate) {
        return res
          .status(404)
          .json({ message: "Candidate not found in this election" });
      }

      // Increment vote count
      candidate.votes += 1;

      // Save voter id to prevent multiple votes
      election.voters.push({ _id: voterId });

      await election.save();

      res.json({ message: "Vote cast successfully", election });
    } catch (error) {
      console.error("Error casting vote:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }
);

module.exports = electionRouter;
