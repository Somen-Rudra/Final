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
      const res = await API.get("/problemSet", {
        params: {
          page: pagination.currentPage,
          limit: pagination.limit,
          difficulty: filters.difficulty,
          search: filters.search,
          sort: filters.sort,
        },
      });

      setProblems(res.data.data);

      setPagination((prev) => ({
        ...prev,
        ...res.data.pagination,
      }));
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
    setPagination((prev) => ({
      ...prev,
      currentPage: page,
    }));
  }

  function updateLimit(limit) {
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
      limit,
    }));
  }

  function updateFilter(name, value) {
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }));

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  if (loading && problems.length === 0) {
    return <Loader />;
  }

  return (
    <div className="problem-page">
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
