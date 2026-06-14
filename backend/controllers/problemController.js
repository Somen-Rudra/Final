import Problem from "../models/problemModel.js";

const PROBLEM_LIST_FIELDS = `
  problemNumber
  title
  slug
  difficulty
  topics
  acceptancePercentage
  isPremium
  isFeatured
`;

const FEATURED_FIELDS = `
  problemNumber
  title
  slug
  difficulty
  topics
  acceptancePercentage
  isPremium
  isFeatured
`;

// ─── GET /problemSet/ ────────────────────────────────────────────────────
export const getProblems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort,

      search,
      difficulty,
      topics,
      companies,

      premium,
      featured,

      published = "true",
    } = req.query;

    const currentPage = Math.max(parseInt(page, 10), 1);
    const pageLimit = Math.max(parseInt(limit, 10), 1);

    /* ---------------- Filters ---------------- */

    const filter = {};

    // Always enforce published filter; default to true
    filter.isPublished = published === "false" ? false : true;

    if (difficulty) {
      filter.difficulty = difficulty.toLowerCase();
    }

    if (premium !== undefined) {
      filter.isPremium = premium === "true";
    }

    if (featured !== undefined) {
      filter.isFeatured = featured === "true";
    }

    if (search) {
      filter.$text = { $search: search.trim() };
    }

    if (topics) {
      filter.topics = {
        $in: topics.split(",").map((t) => t.trim().toLowerCase()),
      };
    }

    if (companies) {
      filter.companies = {
        $in: companies.split(",").map((c) => c.trim()),
      };
    }

    /* ---------------- Sorting ---------------- */

    // If user searched without explicit sort, rank by relevance
    const isTextSearch = !!filter.$text;
    const hasExplicitSort = !!sort;

    let sortObj = {};

    if (isTextSearch && !hasExplicitSort) {
      sortObj = { score: { $meta: "textScore" } };
    } else {
      switch (sort) {
        case "acceptanceAsc":
          sortObj = { acceptancePercentage: 1 };
          break;
        case "acceptanceDesc":
          sortObj = { acceptancePercentage: -1 };
          break;
        case "titleAsc":
          sortObj = { title: 1 };
          break;
        case "titleDesc":
          sortObj = { title: -1 };
          break;
        case "difficultyAsc":
          sortObj = { difficulty: 1, problemNumber: 1 };
          break;
        case "difficultyDesc":
          sortObj = { difficulty: -1, problemNumber: 1 };
          break;
        case "numberDesc":
          sortObj = { problemNumber: -1 };
          break;
        default:
          sortObj = { problemNumber: 1 };
      }
    }

    /* ---------------- Query ---------------- */

    const totalProblems = await Problem.countDocuments(filter);

    // Build select object; include textScore metadata only when searching
    const selectFields = isTextSearch
      ? {
          problemNumber: 1,
          title: 1,
          slug: 1,
          difficulty: 1,
          topics: 1,
          acceptancePercentage: 1,
          isPremium: 1,
          isFeatured: 1,
          score: { $meta: "textScore" },
        }
      : PROBLEM_LIST_FIELDS;

    const problems = await Problem.find(filter)
      .select(selectFields)
      .sort(sortObj)
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit)
      .lean();

    const totalPages = Math.ceil(totalProblems / pageLimit);

    return res.status(200).json({
      success: true,
      data: problems,
      pagination: {
        currentPage,
        totalPages,
        totalProblems,
        limit: pageLimit,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("getProblems error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ─── GET /problemSet/:slug ────────────────────────────────────────────────────
export const getProblemBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    const problem = await Problem.findOne({
      slug: slug.trim(),
      isPublished: true,
    })
      .select(
        `
        title
        problemNumber
        slug
        difficulty
        topics
        acceptanceRate
        acceptancePercentage
        examples
        constraints
        followUps
        hints
        companies
        similarQuestions
        description
        languages
        visibleTestCases
        timeLimit
        memoryLimit
        isPremium
      `,
      )
      .populate("similarQuestions", "problemNumber title slug difficulty")
      .lean();

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: problem,
    });
  } catch (error) {
    console.error("getProblemBySlug error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ─── GET /problemSet/:slug/editor ────────────────────────────────────────────
export const getProblemEditor = async (req, res) => {
  try {
    const { slug } = req.params;

    const problem = await Problem.findOne({
      slug: slug.trim(),
      isPublished: true,
    })
      .select(`slug languages timeLimit memoryLimit`)
      .lean();

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: problem,
    });
  } catch (error) {
    console.error("getProblemEditor error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ─── GET /problemSet/number/:number ──────────────────────────────────────────
export const getProblemByNumber = async (req, res) => {
  try {
    const number = Number(req.params.number);

    if (isNaN(number)) {
      return res.status(400).json({
        success: false,
        message: "Invalid problem number",
      });
    }

    const problem = await Problem.findOne({
      problemNumber: number,
      isPublished: true, // Fix: was returning unpublished problems
    }).lean();

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: problem,
    });
  } catch (error) {
    console.error("getProblemByNumber error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ─── POST /problemSet/ ───────────────────────────────────────────────────────
export const createProblem = async (req, res) => {
  try {
    const problem = await Problem.create(req.body);

    return res.status(201).json({
      success: true,
      data: problem,
    });
  } catch (error) {
    console.error("createProblem error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── PATCH /problemSet/:slug ─────────────────────────────────────────────────
export const updateProblem = async (req, res) => {
  try {
    const { slug } = req.params;

    // Fix: fetch-then-save so all pre-save middleware runs correctly
    // (slug regeneration, deduplication, acceptancePercentage recalculation)
    const problem = await Problem.findOne({ slug });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const { slug: _ignoredSlug, ...safeBody } = req.body;
    
    Object.assign(problem, safeBody);
    await problem.save();

    return res.status(200).json({
      success: true,
      data: problem,
    });
  } catch (error) {
    console.error("updateProblem error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── DELETE /problemSet/:slug ─────────────────────────────────────────────────
export const deleteProblem = async (req, res) => {
  try {
    const { slug } = req.params;

    const deleted = await Problem.findOneAndDelete({ slug });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Problem deleted successfully",
    });
  } catch (error) {
    console.error("deleteProblem error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ─── GET /problemSet/metadata ────────────────────────────────────────────────
export const getProblemMetadata = async (req, res) => {
  try {
    const [topics, companies] = await Promise.all([
      Problem.distinct("topics"),
      Problem.distinct("companies"),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        topics: topics.sort(),
        companies: companies.sort(),
        difficulties: ["easy", "medium", "hard"],
      },
    });
  } catch (error) {
    console.error("getProblemMetadata error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ─── GET /problemSet/featured ────────────────────────────────────────────────
export const getFeaturedProblems = async (req, res) => {
  try {
    const problems = await Problem.find({
      isFeatured: true,
      isPublished: true,
    })
      .select(FEATURED_FIELDS) // Fix: was returning full documents
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      data: problems,
    });
  } catch (error) {
    console.error("getFeaturedProblems error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ─── GET /problemSet/random ──────────────────────────────────────────────────
export const getRandomProblem = async (req, res) => {
  try {
    const problems = await Problem.aggregate([
      { $match: { isPublished: true } },
      { $sample: { size: 1 } },
      {
        $project: {
          problemNumber: 1,
          title: 1,
          slug: 1,
          difficulty: 1,
          topics: 1,
          acceptancePercentage: 1,
          isPremium: 1,
          isFeatured: 1,
        },
      },
    ]);

    if (!problems.length) {
      return res.status(404).json({
        success: false,
        message: "No problems found",
      });
    }

    return res.status(200).json({
      success: true,
      data: problems[0],
    });
  } catch (error) {
    console.error("getRandomProblem error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ─── GET /problemSet/stats/overview ─────────────────────────────────────────
export const getProblemStats = async (req, res) => {
  try {
    const stats = await Problem.aggregate([
      { $group: { _id: "$difficulty", count: { $sum: 1 } } },
    ]);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("getProblemStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ─── PATCH /problemSet/:id/publish ───────────────────────────────────────────
export const togglePublishProblem = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    problem.isPublished = !problem.isPublished;
    await problem.save();

    return res.status(200).json({
      success: true,
      data: problem,
    });
  } catch (error) {
    console.error("togglePublishProblem error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
