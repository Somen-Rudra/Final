import express from "express";
import { getProblemBySlug , getProblems } from "../controllers/problemController.js";

const problemRouter = express.Router();

problemRouter.get("/", getProblems); // GET /problemSet
problemRouter.get("/:slug", getProblemBySlug); // GET /problemSet/:slug

export default problemRouter;
