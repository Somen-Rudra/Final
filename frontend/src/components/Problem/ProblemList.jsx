import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Loader from "../Home/Loader";

export default function ProblemList({
  loading,
  problems,
  pagination,
  onPageChange,
  onLimitChange,
}) {
  const navigate = useNavigate();

  const {
    currentPage,
    totalPages,
    totalProblems,
    limit,
  } = pagination;

  function getPageNumbers() {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  }

  if (loading && problems.length === 0) {
    return <Loader />;
  }

  return (
    <div className="problem-list-container">
      <div className="problem-table-wrapper">
        <table className="problem-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Acceptance</th>
              <th>Topics</th>
            </tr>
          </thead>

          <tbody>
            {problems.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  No problems found.
                </td>
              </tr>
            ) : (
              problems.map((problem) => {
                const {
                  totalSubs = 0,
                  acceptedSubs = 0,
                } = problem.acceptanceRate || {};

                const acceptance =
                  totalSubs === 0
                    ? "0.0"
                    : (
                        (acceptedSubs / totalSubs) *
                        100
                      ).toFixed(1);

                return (
                  <tr
                    key={problem._id}
                    className="problem-row"
                    onClick={() =>
                      navigate(`/problemSet/${problem.slug}`)
                    }
                  >
                    <td>{problem.problemNumber}</td>

                    <td className="problem-title">
                      {problem.title}
                    </td>

                    <td>
                      <span
                        className={`difficulty-pill ${problem.difficulty}`}
                      >
                        {problem.difficulty}
                      </span>
                    </td>

                    <td>{acceptance}%</td>

                    <td>
                      <div className="topic-container">
                        {problem.topics?.length ? (
                          problem.topics.map((topic) => (
                            <span
                              key={topic}
                              className="topic-chip"
                            >
                              {topic}
                            </span>
                          ))
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <div className="rows-per-page">
          <span>Rows per page:</span>

          <select
            value={limit}
            onChange={(e) =>
              onLimitChange(Number(e.target.value))
            }
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="pagination-info">
          {totalProblems === 0
            ? "0"
            : `${(currentPage - 1) * limit + 1}-${Math.min(
                currentPage * limit,
                totalProblems
              )} of ${totalProblems}`}
        </div>

        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() =>
              onPageChange(currentPage - 1)
            }
          >
            <FaChevronLeft />
          </button>

          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="pagination-ellipsis"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                className={`pagination-btn ${
                  currentPage === page
                    ? "active"
                    : ""
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            )
          )}

          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() =>
              onPageChange(currentPage + 1)
            }
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}