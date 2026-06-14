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
problemRouter.get("/:slug/editor", getProblemEditor);  // ← before /:slug
problemRouter.get("/:slug", getProblemBySlug);

/* =========================
   Admin Routes
========================= */

problemRouter.post("/", createProblem);
problemRouter.patch("/:slug/publish", togglePublishProblem);  // ← before /:slug
problemRouter.patch("/:slug", updateProblem);
problemRouter.delete("/:slug", deleteProblem);

export default problemRouter;