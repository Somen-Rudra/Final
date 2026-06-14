import { useState } from "react";
import "../../styles/testcases.css";

// Renders one field row: label + textarea
function FieldRow({ label, value, onChange, readOnly }) {
  return (
    <div className="tc-field">
      <span className="tc-label">{label}</span>
      {readOnly ? (
        <pre className="tc-pre">{value}</pre>
      ) : (
        <textarea
          className="tc-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          spellCheck={false}
        />
      )}
    </div>
  );
}

// Parse structured fields → raw stdin string expected by the judge
// problem.inputFields = ["nums", "target"]  (optional, defined per-problem)
// If not defined, the single "input" field is sent as-is.
function buildStdin(fields, fieldValues) {
  if (!fields?.length) return fieldValues["__raw__"] ?? "";
  return fields.map((f) => fieldValues[f] ?? "").join("\n");
}

export default function TestCases({
  problem,
  onSubmit,
  submitResults,
  isSubmitting,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [customCases, setCustomCases] = useState([]);

  const visibleCases = problem?.visibleTestCases || [];
  const inputFields  = problem?.inputFields || null; // e.g. ["nums","target"]

  // Total tab list: DB cases first, then custom
  const totalCases = [
    ...visibleCases.map((tc) => ({ ...tc, _type: "db" })),
    ...customCases.map((cc) => ({ ...cc, _type: "custom" })),
  ];

  const allPassed    = submitResults?.every((r) => r.passed);
  const passCount    = submitResults?.filter((r) => r.passed).length ?? 0;
  const totalCount   = submitResults?.length ?? 0;
  const visibleCount = visibleCases.length;

  // Per-tab result: DB cases map 1:1 to submitResults[0..n-1]
  // Custom cases map to submitResults[visibleCount..] 
  function resultForTab(tabIndex) {
    return submitResults?.[tabIndex] ?? null;
  }

  function addCustomCase() {
    const blank = inputFields
      ? Object.fromEntries(inputFields.map((f) => [f, ""]))
      : { __raw__: "" };

    setCustomCases((prev) => [
      ...prev,
      { _fields: blank, output: "" },
    ]);
    setActiveTab(totalCases.length); // new tab index
  }

  function removeCustomCase(customIndex) {
    setCustomCases((prev) => prev.filter((_, i) => i !== customIndex));
    setActiveTab((t) => Math.max(0, t - 1));
  }

  function updateCustomField(customIndex, key, value) {
    setCustomCases((prev) =>
      prev.map((cc, i) =>
        i === customIndex ? { ...cc, _fields: { ...cc._fields, [key]: value } } : cc
      )
    );
  }

  function updateCustomExpected(customIndex, value) {
    setCustomCases((prev) =>
      prev.map((cc, i) => (i === customIndex ? { ...cc, output: value } : cc))
    );
  }

  // Called by parent's handleSubmit — expose custom cases as proper {input, output}
  // Workspace passes onSubmit; we intercept to attach custom cases
  function handleSubmitClick() {
    const builtCustom = customCases.map((cc) => ({
      input: buildStdin(inputFields, cc._fields),
      output: cc.output,
    }));
    onSubmit(builtCustom); // pass custom cases up
  }

  const active = totalCases[activeTab];
  const activeResult = resultForTab(activeTab);
  const isCustom = active?._type === "custom";
  const customIndex = isCustom ? activeTab - visibleCount : -1;

  return (
    <div className="tc-root">
      <div className="tc-header">
        <div className="tc-tabs">
          {totalCases.map((tc, i) => {
            const res = resultForTab(i);
            const statusClass = !res ? "" : res.passed ? "tab-pass" : "tab-fail";
            const isC = tc._type === "custom";
            return (
              <button
                key={i}
                className={`tc-tab ${activeTab === i ? "active" : ""} ${statusClass} ${isC ? "tc-tab-custom" : ""}`}
                onClick={() => setActiveTab(i)}
              >
                {isC ? `Custom ${i - visibleCount + 1}` : `Case ${i + 1}`}
                {res && <span className={`tc-dot ${res.passed ? "dot-pass" : "dot-fail"}`} />}
                {isC && (
                  <span
                    className="tc-tab-close"
                    role="button"
                    aria-label="Remove custom case"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomCase(i - visibleCount);
                    }}
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}

          <button className="tc-tab tc-tab-add" onClick={addCustomCase} title="Add custom test case">
            + Add
          </button>
        </div>

        <button
          className={`submit-btn ${isSubmitting ? "submitting" : ""}`}
          onClick={handleSubmitClick}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <><span className="spinner" /> Submitting…</>
          ) : (
            <><i className="ti ti-send" aria-hidden="true" /> Submit</>
          )}
        </button>
      </div>

      {submitResults && (
        <div className={`tc-result-banner ${allPassed ? "banner-pass" : "banner-fail"}`}>
          <i className={`ti ${allPassed ? "ti-circle-check" : "ti-circle-x"}`} aria-hidden="true" />
          {allPassed
            ? `All ${totalCount} test cases passed`
            : `${passCount} / ${totalCount} test cases passed`}
        </div>
      )}

      {totalCases.length === 0 ? (
        <div className="tc-empty">No test cases available.</div>
      ) : (
        <div className="tc-body">
          {active && (
            <>
              {/* ── Structured input fields (DB cases: read-only, Custom: editable) ── */}
              {inputFields ? (
                inputFields.map((field) => (
                  <FieldRow
                    key={field}
                    label={field}
                    value={
                      isCustom
                        ? customCases[customIndex]?._fields[field] ?? ""
                        : active.input  // for DB cases show raw (or parse if you prefer)
                    }
                    onChange={(v) => updateCustomField(customIndex, field, v)}
                    readOnly={!isCustom}
                  />
                ))
              ) : (
                <FieldRow
                  label="Input"
                  value={isCustom ? customCases[customIndex]?._fields.__raw__ ?? "" : active.input}
                  onChange={(v) => updateCustomField(customIndex, "__raw__", v)}
                  readOnly={!isCustom}
                />
              )}

              {/* ── Expected output ── */}
              <FieldRow
                label="Expected output"
                value={isCustom ? customCases[customIndex]?.output ?? "" : active.output}
                onChange={(v) => updateCustomExpected(customIndex, v)}
                readOnly={!isCustom}
              />

              {/* ── Actual output after submission ── */}
              {activeResult && (
                <div className="tc-field">
                  <span className="tc-label">Your output</span>
                  <pre className={`tc-pre ${activeResult.passed ? "pre-pass" : "pre-fail"}`}>
                    {activeResult.stdout ?? activeResult.actualOutput ?? ""}
                  </pre>
                  {activeResult.stderr && (
                    <pre className="tc-pre pre-fail" style={{ marginTop: 4 }}>
                      {activeResult.stderr}
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