import mongoose from "mongoose";

/* =========================
   Test Case Schema
========================= */
const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: true,
    },

    output: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

/* =========================
   Problem Schema
========================= */
const problemSchema = new mongoose.Schema(
  {
    problemNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
      min: 1,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
      index: true,
    },

    topics: {
      type: [String],
      required: true,
      default: [],
      index: true,
    },

    acceptanceRate: {
      totalSubs: {
        type: Number,
        default: 0,
        min: 0,
      },

      acceptedSubs: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    examples: [
      {
        input: {
          type: String,
          required: true,
        },

        output: {
          type: String,
          required: true,
        },

        imageUrl: {
          type: String,
          default: null,
        },

        explanation: {
          type: String,
          required: true,
        },
      },
    ],

    constraints: {
      type: [String],
      required: true,
      default: [],
    },

    followUps: {
      type: [String],
      required: true,
      default: [],
    },

    hints: {
      type: [String],
      required: true,
      default: [],
    },

    companies: {
      type: [String],
      required: true,
      default: [],
      index: true,
    },

    similarQuestions: [
      {
        title: {
          type: String,
          required: true,
        },

        slug: {
          type: String,
          required: true,
        },
      },
    ],

    header: {
      c: {
        type: String,
        required: true,
      },

      cpp: {
        type: String,
        required: true,
      },
    },

    inputOutput: {
      c: {
        type: String,
        required: true,
      },

      cpp: {
        type: String,
        required: true,
      },

      js: {
        type: String,
        required: true,
      },

      py: {
        type: String,
        required: true,
      },
    },

    codeStub: {
      c: {
        type: String,
        required: true,
      },

      cpp: {
        type: String,
        required: true,
      },

      js: {
        type: String,
        required: true,
      },

      py: {
        type: String,
        required: true,
      },
    },

    driver: {
      c: {
        type: String,
        required: true,
      },

      cpp: {
        type: String,
        required: true,
      },

      js: {
        type: String,
        required: true,
      },

      py: {
        type: String,
        required: true,
      },
    },

    timeLimit: {
      type: Number,
      required: true,
      default: 1000,
      min: 100,
    },

    memoryLimit: {
      type: Number,
      required: true,
      default: 256,
      min: 16,
    },

    visibleTestCases: {
      type: [testCaseSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one visible test case is required",
      },
    },

    hiddenTestCases: {
      type: [testCaseSchema],
      required: true,
      select: false,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one hidden test case is required",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* =========================
   Slug Generator
========================= */
problemSchema.pre("save", async function (next) {
  if (!this.isModified("title")) return next();

  const baseSlug = this.title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  let slug = baseSlug;
  let counter = 1;

  while (
    await this.constructor.exists({
      slug,
      _id: { $ne: this._id },
    })
  ) {
    slug = `${baseSlug}-${counter++}`;
  }

  this.slug = slug;

  next();
});

/* =========================
   Model
========================= */
const Problem =
  mongoose.models.Problem || mongoose.model("Problem", problemSchema);

export default Problem;
