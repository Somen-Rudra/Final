import { useEffect, useState } from "react";
import { API } from "../config/axios";
import Loader from "../components/Home/Loader";
import ProblemList from "../components/Problem/ProblemList";
import "../styles/problem-page.css";

export default function ProblemSetPage() {
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState([]);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProblems: 0,
    limit: 10,
  });

  const [filters, setFilters] = useState({
    search: "",
    difficulty: "all",
    sort: "numberAsc",
  });

  async function loadProblems() {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        sort: filters.sort,
      };

      // Only send search / difficulty when they carry a meaningful value
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.difficulty !== "all") params.difficulty = filters.difficulty;

      const res = await API.get("/problemSet", { params });

      setProblems(res.data.data);
      setPagination((prev) => ({ ...prev, ...res.data.pagination }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const { currentPage, limit } = pagination;

  useEffect(() => {
    loadProblems();
  }, [currentPage, limit, filters.search, filters.difficulty, filters.sort]);

  function updatePage(page) {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  }

  function updateLimit(newLimit) {
    setPagination((prev) => ({ ...prev, currentPage: 1, limit: newLimit }));
  }

  function updateFilter(name, value) {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  if (loading && problems.length === 0) {
    return <Loader />;
  }

  return (
    <div className="problem-page">
      {/* Filter bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="filter-search"
          placeholder="Search problems…"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />

        <select
          className="filter-select"
          value={filters.difficulty}
          onChange={(e) => updateFilter("difficulty", e.target.value)}
        >
          <option value="all">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select
          className="filter-select"
          value={filters.sort}
          onChange={(e) => updateFilter("sort", e.target.value)}
        >
          <option value="numberAsc">Number ↑</option>
          <option value="numberDesc">Number ↓</option>
          <option value="titleAsc">Title A–Z</option>
          <option value="titleDesc">Title Z–A</option>
          <option value="acceptanceAsc">Acceptance ↑</option>
          <option value="acceptanceDesc">Acceptance ↓</option>
          <option value="difficultyAsc">Difficulty ↑</option>
          <option value="difficultyDesc">Difficulty ↓</option>
        </select>
      </div>

      <ProblemList
        loading={loading}
        problems={problems}
        pagination={pagination}
        onPageChange={updatePage}
        onLimitChange={updateLimit}
      />
    </div>
  );
}