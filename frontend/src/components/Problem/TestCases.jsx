import { useState } from "react";
import "../../styles/testcases.css";

export default function TestCases({
  problem,
  onSubmit,
  submitResults,
  isSubmitting,
}) {
  const [activeTab, setActiveTab] = useState(0);

  const cases = problem?.visibleTestCases || [];

  return (
    <div className="tc-root">
      <div className="tc-header">
        <div className="tc-tabs">
          {cases.map((_, i) => {
            const res = submitResults?.[i];
            const statusClass = !res
              ? ""
              : res.passed
                ? "tab-pass"
                : "tab-fail";
            return (
              <button
                key={i}
                className={`tc-tab ${activeTab === i ? "active" : ""} ${statusClass}`}
                onClick={() => setActiveTab(i)}
              >
                Case {i + 1}
                {res && (
                  <span
                    className={`tc-dot ${res.passed ? "dot-pass" : "dot-fail"}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          className={`submit-btn ${isSubmitting ? "submitting" : ""}`}
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner" />
              Submitting…
            </>
          ) : (
            <>
              <i className="ti ti-send" aria-hidden="true" />
              Submit
            </>
          )}
        </button>
      </div>

      {cases.length === 0 ? (
        <div className="tc-empty">No test cases available.</div>
      ) : (
        <div className="tc-body">
          {cases[activeTab] && (
            <>
              <div className="tc-field">
                <span className="tc-label">Input</span>
                <pre className="tc-pre">{cases[activeTab].input}</pre>
              </div>
              <div className="tc-field">
                <span className="tc-label">Expected Output</span>
                <pre className="tc-pre">{cases[activeTab].output}</pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
