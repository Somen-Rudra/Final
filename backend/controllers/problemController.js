import Problem from "../models/problemModel.js";

// ─── GET /problemSet/ ────────────────────────────────────────────────────

export const getProblems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "numberAsc",
    } = req.query;

    const currentPage = Math.max(parseInt(page, 10), 1);
    const pageLimit = Math.max(parseInt(limit, 10), 1);

    /* Sorting */
    let sortObj = {};

    switch (sort) {
      case "acceptanceAsc":
        sortObj = { "acceptanceRate.acceptedSubs": 1 };
        break;

      case "acceptanceDesc":
        sortObj = { "acceptanceRate.acceptedSubs": -1 };
        break;

      case "titleAsc":
        sortObj = { title: 1 };
        break;

      case "titleDesc":
        sortObj = { title: -1 };
        break;

      case "numberDesc":
        sortObj = { problemNumber: -1 };
        break;

      default:
        sortObj = { problemNumber: 1 };
    }

    const totalProblems = await Problem.countDocuments();

    const problems = await Problem.find()
      .select(`
        problemNumber
        title
        slug
        difficulty
        topics
        acceptanceRate
      `)
      .sort(sortObj)
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit)
      .lean();

    return res.status(200).json({
      success: true,
      data: problems,
      pagination: {
        currentPage,
        totalPages: Math.ceil(totalProblems / pageLimit),
        totalProblems,
        limit: pageLimit,
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
    if (!slug)
      return res
        .status(400)
        .json({ success: false, message: "Slug is required" });

    const problem = await Problem.findOne({ slug: slug.trim() })
      .select(
        `title problemNumber slug difficulty topics acceptanceRate
               examples constraints followUps hints companies
               similarQuestions description codeStub visibleTestCases`,
      )
      .lean();

    if (!problem)
      return res
        .status(404)
        .json({ success: false, message: "Problem not found" });

    return res.status(200).json({ success: true, data: problem });
  } catch (error) {
    console.error("getProblemBySlug error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
