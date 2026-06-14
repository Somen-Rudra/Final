import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { API } from "../config/axios";
import ProblemList from "../components/Problem/ProblemList";
import "../styles/problem-page.css";

export default function ProblemSetPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") || "";

  const difficultiesParam = searchParams.get("difficulty") || "";
  const topicsParam = searchParams.get("topics") || "";
  const companiesParam = searchParams.get("companies") || "";

  const sort = searchParams.get("sort") || "numberAsc";

  const featured = searchParams.get("featured") === "true";
  const premium = searchParams.get("premium") === "true";

  const acceptanceMin = searchParams.get("acceptanceMin") || "";
  const acceptanceMax = searchParams.get("acceptanceMax") || "";

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);

  const activeDifficulties = useMemo(
    () => difficultiesParam.split(",").filter(Boolean),
    [difficultiesParam]
  );

  const activeTopics = useMemo(
    () => topicsParam.split(",").filter(Boolean),
    [topicsParam]
  );

  const activeCompanies = useMemo(
    () => companiesParam.split(",").filter(Boolean),
    [companiesParam]
  );

  const [inputValue, setInputValue] = useState(search);

  const [loading, setLoading] = useState(false);

  const [problems, setProblems] = useState([]);

  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalProblems: 0,
  });

  const [meta, setMeta] = useState({
    topics: [],
    companies: [],
  });

  const [stats, setStats] = useState({
    totalCount: 0,
    premiumCount: 0,
    featuredCount: 0,
    byDifficulty: [],
  });

  const setParam = useCallback(
    (key, value, resetPage = true) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);

        if (
          value === "" ||
          value === undefined ||
          value === null
        ) {
          next.delete(key);
        } else {
          next.set(key, value);
        }

        if (resetPage) {
          next.set("page", "1");
        }

        return next;
      });
    },
    [setSearchParams]
  );

  /* Live Search */
  useEffect(() => {
    const timer = setTimeout(() => {
      setParam("q", inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  /* Metadata */
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await API.get("/problemSet/metadata");

        setMeta({
          topics: res.data.data.topics || [],
          companies: res.data.data.companies || [],
        });
      } catch (err) {
        console.error(err);
      }
    }

    loadMeta();
  }, []);

  /* Stats */
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await API.get("/problemSet/stats/overview");

        setStats(res.data.data);
      } catch (err) {
        console.error(err);
      }
    }

    loadStats();
  }, []);

  /* Problems */
  const loadProblems = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        page,
        limit,
        sort,
      };

      if (search) params.search = search;

      if (difficultiesParam)
        params.difficulty = difficultiesParam;

      if (topicsParam)
        params.topics = topicsParam;

      if (companiesParam)
        params.companies = companiesParam;

      if (featured)
        params.featured = true;

      if (premium)
        params.premium = true;

      if (acceptanceMin !== "")
        params.acceptanceMin = acceptanceMin;

      if (acceptanceMax !== "")
        params.acceptanceMax = acceptanceMax;

      const res = await API.get("/problemSet", {
        params,
      });

      setProblems(res.data.data || []);

      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    sort,
    search,
    difficultiesParam,
    topicsParam,
    companiesParam,
    featured,
    premium,
    acceptanceMin,
    acceptanceMax,
  ]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  const toggleDifficulty = (difficulty) => {
    const set = new Set(activeDifficulties);

    if (set.has(difficulty)) {
      set.delete(difficulty);
    } else {
      set.add(difficulty);
    }

    setParam(
      "difficulty",
      [...set].join(",")
    );
  };

  const toggleTopic = (topic) => {
    const set = new Set(activeTopics);

    if (set.has(topic)) {
      set.delete(topic);
    } else {
      set.add(topic);
    }

    setParam(
      "topics",
      [...set].join(",")
    );
  };

  const toggleCompany = (company) => {
    const set = new Set(activeCompanies);

    if (set.has(company)) {
      set.delete(company);
    } else {
      set.add(company);
    }

    setParam(
      "companies",
      [...set].join(",")
    );
  };

  const clearAll = () => {
    setInputValue("");
    setSearchParams({});
  };

  const buildPages = () => {
    const pages = [];

    for (
      let i = 1;
      i <= pagination.totalPages;
      i++
    ) {
      if (
        i === 1 ||
        i === pagination.totalPages ||
        Math.abs(i - page) <= 1
      ) {
        pages.push(i);
      } else if (
        pages[pages.length - 1] !== "..."
      ) {
        pages.push("...");
      }
    }

    return pages;
  };

  return (
    <div className="ps-page">

      <div className="ps-header">
        <h1>Problems</h1>

        <span>
          {pagination.totalProblems} total
        </span>
      </div>

      <div className="ps-stats">

        <div className="ps-stat-card">
          <h3>{stats.totalCount}</h3>
          <p>Total</p>
        </div>

        <div className="ps-stat-card">
          <h3>{stats.premiumCount}</h3>
          <p>Premium</p>
        </div>

        <div className="ps-stat-card">
          <h3>{stats.featuredCount}</h3>
          <p>Featured</p>
        </div>

        {stats.byDifficulty.map((item) => (
          <div
            key={item._id}
            className="ps-stat-card"
          >
            <h3>{item.count}</h3>

            <p>{item._id}</p>
          </div>
        ))}

      </div>

      <div className="ps-filters">

        <input
          className="ps-search"
          placeholder="Search..."
          value={inputValue}
          onChange={(e) =>
            setInputValue(e.target.value)
          }
        />

        <div className="ps-chip-container">
          {["easy", "medium", "hard"].map(
            (d) => (
              <button
                key={d}
                className={`ps-chip ${
                  activeDifficulties.includes(d)
                    ? "ps-chip--active"
                    : ""
                }`}
                onClick={() =>
                  toggleDifficulty(d)
                }
              >
                {d}
              </button>
            )
          )}
        </div>

        <select
          className="ps-select"
          value={sort}
          onChange={(e) =>
            setParam(
              "sort",
              e.target.value
            )
          }
        >
          <option value="numberAsc">
            Number ↑
          </option>

          <option value="numberDesc">
            Number ↓
          </option>

          <option value="titleAsc">
            Title A-Z
          </option>

          <option value="titleDesc">
            Title Z-A
          </option>

          <option value="acceptanceAsc">
            Acceptance ↑
          </option>

          <option value="acceptanceDesc">
            Acceptance ↓
          </option>
        </select>

        <div className="ps-range">

          <input
            type="number"
            placeholder="Min %"
            value={acceptanceMin}
            onChange={(e) =>
              setParam(
                "acceptanceMin",
                e.target.value
              )
            }
          />

          <input
            type="number"
            placeholder="Max %"
            value={acceptanceMax}
            onChange={(e) =>
              setParam(
                "acceptanceMax",
                e.target.value
              )
            }
          />

        </div>

        <div className="ps-chip-container">

          {meta.topics.map((topic) => (
            <button
              key={topic}
              className={`ps-chip ${
                activeTopics.includes(
                  topic
                )
                  ? "ps-chip--active"
                  : ""
              }`}
              onClick={() =>
                toggleTopic(topic)
              }
            >
              {topic}
            </button>
          ))}

        </div>

        <div className="ps-chip-container">

          {meta.companies.map(
            (company) => (
              <button
                key={company}
                className={`ps-chip ${
                  activeCompanies.includes(
                    company
                  )
                    ? "ps-chip--active"
                    : ""
                }`}
                onClick={() =>
                  toggleCompany(
                    company
                  )
                }
              >
                {company}
              </button>
            )
          )}

        </div>

        <div className="ps-filter-actions">

          <button
            className={`ps-btn ${
              featured
                ? "ps-btn--active"
                : ""
            }`}
            onClick={() =>
              setParam(
                "featured",
                featured
                  ? ""
                  : "true"
              )
            }
          >
            🔥 Featured
          </button>

          <button
            className={`ps-btn ${
              premium
                ? "ps-btn--active"
                : ""
            }`}
            onClick={() =>
              setParam(
                "premium",
                premium
                  ? ""
                  : "true"
              )
            }
          >
            ★ Premium
          </button>

          <button
            className="ps-clear"
            onClick={clearAll}
          >
            Clear All
          </button>

        </div>

      </div>

      <ProblemList
        problems={problems}
        loading={loading}
      />

      <div className="ps-pagination">

        <button
          className="ps-page-btn"
          disabled={page <= 1}
          onClick={() =>
            setParam(
              "page",
              page - 1,
              false
            )
          }
        >
          Prev
        </button>

        {buildPages().map((p, i) =>
          p === "..." ? (
            <span key={i}>...</span>
          ) : (
            <button
              key={p}
              className={`ps-page-btn ${
                p === page
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setParam(
                  "page",
                  p,
                  false
                )
              }
            >
              {p}
            </button>
          )
        )}

        <button
          className="ps-page-btn"
          disabled={
            page >=
            pagination.totalPages
          }
          onClick={() =>
            setParam(
              "page",
              page + 1,
              false
            )
          }
        >
          Next
        </button>

      </div>

    </div>
  );
}