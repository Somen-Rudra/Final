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

  // submitResults may include hidden test case results appended after visible ones.
  // We only display results for the visible cases (by index), but we use the full
  // array to compute the overall pass/fail summary.
  const visibleResults = submitResults ? submitResults.slice(0, cases.length) : null;
  const allPassed = submitResults?.every((r) => r.passed);
  const passCount = submitResults?.filter((r) => r.passed).length ?? 0;
  const totalCount = submitResults?.length ?? 0;

  return (
    <div className="tc-root">
      <div className="tc-header">
        <div className="tc-tabs">
          {cases.map((_, i) => {
            const res = visibleResults?.[i];
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

      {/* Overall result banner — shown only after submission */}
      {submitResults && (
        <div className={`tc-result-banner ${allPassed ? "banner-pass" : "banner-fail"}`}>
          <i
            className={`ti ${allPassed ? "ti-circle-check" : "ti-circle-x"}`}
            aria-hidden="true"
          />
          {allPassed
            ? `All ${totalCount} test cases passed`
            : `${passCount} / ${totalCount} test cases passed`}
        </div>
      )}

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
                <span className="tc-label">Expected output</span>
                <pre className="tc-pre">{cases[activeTab].output}</pre>
              </div>

              {/* Per-case actual output when a result exists */}
              {visibleResults?.[activeTab] && (
                <div className="tc-field">
                  <span className="tc-label">Your output</span>
                  <pre
                    className={`tc-pre ${
                      visibleResults[activeTab].passed ? "pre-pass" : "pre-fail"
                    }`}
                  >
                    {visibleResults[activeTab].stdout ?? visibleResults[activeTab].output ?? ""}
                  </pre>
                  {visibleResults[activeTab].stderr && (
                    <pre className="tc-pre pre-fail" style={{ marginTop: 4 }}>
                      {visibleResults[activeTab].stderr}
                    </pre>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}