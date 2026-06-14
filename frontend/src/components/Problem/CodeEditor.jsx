// src/components/Problem/CodeEditor.jsx
import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { VscPlay } from "react-icons/vsc";
import "../../styles/editor.css";
import { defineCrimsonTheme } from "./problemConfig/editorTheme";
import { MONACO_OPTIONS, LANGUAGES } from "./problemConfig/editorConfig";

export default function CodeEditor({ problem, onRun, onCodeChange, isRunning }) {
  const [langKey, setLangKey] = useState("cpp");
  const [editorCodes, setEditorCodes] = useState({});

  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }

  // Filter to only languages this problem supports
  const availableLanguages = Object.entries(LANGUAGES).filter(
    ([, config]) => problem?.languages?.[config.dbKey],
  );

  // Set default lang to first available when problem loads
  useEffect(() => {
    if (!problem?.languages) return;
    const firstAvailable = Object.entries(LANGUAGES).find(
      ([, config]) => problem.languages[config.dbKey],
    );
    if (firstAvailable) {
      const key = firstAvailable[0];
      setLangKey(key);
      // Notify parent of the initial language
      if (onCodeChange) {
        const stub = problem.languages[firstAvailable[1].dbKey]?.codeStub || "";
        onCodeChange(stub, LANGUAGES[key].judgeKey);
      }
    }
  }, [problem]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate editor codes from problem.languages stubs
  useEffect(() => {
    if (!problem?.languages) return;

    setEditorCodes((prev) => {
      // Don't overwrite codes the user has already typed
      if (Object.keys(prev).length > 0) return prev;

      const codes = {};
      Object.entries(LANGUAGES).forEach(([lang, config]) => {
        const langData = problem.languages[config.dbKey];
        codes[lang] = langData?.codeStub || "";
      });
      return codes;
    });
  }, [problem]);

  // When the user switches language, sync codeRef in Workspace
  function handleLangChange(newKey) {
    setLangKey(newKey);
    if (onCodeChange) {
      onCodeChange(editorCodes[newKey] || "", LANGUAGES[newKey].judgeKey);
    }
  }

  // When the user edits code, sync codeRef in Workspace
  function handleCodeChange(value) {
    const newCode = value || "";
    setEditorCodes((prev) => ({ ...prev, [langKey]: newCode }));
    if (onCodeChange) {
      onCodeChange(newCode, LANGUAGES[langKey].judgeKey);
    }
  }

  function handleRun() {
    if (onRun) onRun(editorCodes[langKey] || "", LANGUAGES[langKey].judgeKey);
  }

  // Guard: don't render editor until we have codes and a valid langKey
  if (!problem?.languages || editorCodes[langKey] === undefined) {
    return (
      <div className="editor-page">
        <div className="editor-wrapper">
          <p style={{ color: "#888", padding: "1rem" }}>Loading editor…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page">
      <div className="editor-wrapper">
        <div className="editor-toolbar">
          <div className="dropdown-container">
            <label htmlFor="lang-select">Language: </label>
            <select
              id="lang-select"
              value={langKey}
              onChange={(e) => handleLangChange(e.target.value)}
              className="styled-select"
            >
              {availableLanguages.map(([key, lang]) => (
                <option key={key} value={key}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className={`run-button ${isRunning ? "running" : ""}`}
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Running…
              </>
            ) : (
              <>
                <VscPlay size={16} />
                Run
              </>
            )}
          </button>
        </div>

        <div className="monaco-container">
          <Editor
            height="100%"
            key={langKey}
            language={LANGUAGES[langKey]?.monacoLang}
            value={editorCodes[langKey] || ""}
            onChange={handleCodeChange}
            beforeMount={defineCrimsonTheme}
            onMount={handleEditorDidMount}
            theme="crimson"
            options={MONACO_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}