// app.js
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");

const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error(err));

// Joke Schema and Model
const jokeSchema = new mongoose.Schema({
  content: String,
  type: String,
  approve: String,
});

const jokeTypeSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
});

const JokeType = mongoose.model("JokeType", jokeTypeSchema, "jokes_types");

const Joke = mongoose.model("Joke", jokeSchema);

const app = express();
app.use(bodyParser.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const DEFAULT_USER = {
  email: "admin@admin.com",
  password: "admin123",
};

// Middleware for Authentication
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Routes
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === DEFAULT_USER.email && password === DEFAULT_USER.password) {
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
    return res.json({ token });
  }
  res.status(401).json({ message: "Invalid credentials" });
});

app.get("/jokes", authenticate, async (req, res) => {
  try {
    const response = await axios.get("http://submit-jokes:3001/jokes"); // Call Submit Jokes service
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching jokes" });
  }
});

app.put("/jokes/:id", async (req, res) => {
  const { id: _id } = req.params; // Extract the joke ID from the request parameters
  const { content, type } = req.body; // Extract content and type from the request body

  try {
    // Update the joke with the specified ID
    const joke = await Joke.findByIdAndUpdate(
      _id, // Match the joke by ID
      { content, type }, // Update the content and type
      { new: true } // Return the updated joke in the response
    );

    if (!joke) {
      return res.status(404).json({ message: "Joke not found" });
    }

    res.json(joke); // Send the updated joke as the response
  } catch (error) {
    console.error("Error updating joke:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/jokes/:id/approve", async (req, res) => {
  const { id } = req.params;

  try {
    // Use Mongoose to find and update the joke by ID
    const joke = await Joke.findByIdAndUpdate(
      id, // Match the joke by ID
      { approve: 1 }, // Set the approve field to 1
      { new: true } // Return the updated joke in the response
    );

    if (!joke) {
      return res.status(404).json({ message: "Joke not found" });
    }

    res.json({ message: "Joke approved and sent to Deliver Jokes", joke });
  } catch (error) {
    console.error("Error approving joke:", error);
    res
      .status(500)
      .json({ message: "Error approving joke", error: error.message });
  }
});

app.post("/joke-types", async (req, res) => {
  const { type } = req.body;

  try {
    // Create a new joke type instance
    const joke = new JokeType({ type });

    // Save the joke type to the database
    await joke.save();

    // Respond with a success message and the saved joke type
    res.status(201).json({
      message: "New joke type saved successfully",
      joke,
    });
  } catch (error) {
    console.error("Error saving joke type:", error);
    res.status(500).json({
      message: "Error saving joke type",
      error: error.message,
    });
  }
});

app.post("/jokes/:id/reject", async (req, res) => {
  const { id: _id } = req.params; // Extract the joke ID from the request parameters

  try {
    // Use Mongoose to find and delete the joke by ID
    const joke = await Joke.findByIdAndDelete(_id);

    if (!joke) {
      return res.status(404).json({ message: "Joke not found" });
    }

    res.json({ message: "Joke rejected and deleted successfully", joke });
  } catch (error) {
    console.error("Error rejecting joke:", error);
    res
      .status(500)
      .json({ message: "Error rejecting joke", error: error.message });
  }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () =>
  console.log(`Moderate Jokes Service running on port ${PORT}`)
);
