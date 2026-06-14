// src/routes/problemRouter.js
import express from "express";
import {
  getProblems,
  getProblemBySlug,
  getProblemEditor,
  getProblemByNumber,
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemMetadata,
  getFeaturedProblems,
  getRandomProblem,
  getProblemStats,
  togglePublishProblem,
} from "../controllers/problemController.js";

import {
  runCode,
  submitCode,
} from "../controllers/submissionController.js";

const problemRouter = express.Router();

/* =========================
   Public Routes
========================= */
problemRouter.get("/", getProblems);
problemRouter.get("/metadata", getProblemMetadata);
problemRouter.get("/featured", getFeaturedProblems);
problemRouter.get("/random", getRandomProblem);
problemRouter.get("/stats/overview", getProblemStats);
problemRouter.get("/number/:number", getProblemByNumber);
problemRouter.get("/:slug/editor", getProblemEditor);
problemRouter.get("/:slug", getProblemBySlug);

/* =========================
   Execution Routes
========================= */
problemRouter.post("/:slug/run", runCode);
problemRouter.post("/:slug/submit", submitCode);

/* =========================
   Admin Routes
========================= */
problemRouter.post("/", createProblem);
problemRouter.patch("/:slug/publish", togglePublishProblem);
problemRouter.patch("/:slug", updateProblem);
problemRouter.delete("/:slug", deleteProblem);

export default problemRouter;