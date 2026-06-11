import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { VscPlay } from "react-icons/vsc";
import "../../styles/editor.css";
import { defineCrimsonTheme } from "./problemConfig/editorTheme";
import { MONACO_OPTIONS, LANGUAGES } from "./problemConfig/editorConfig";

export default function CodeEditor({ problem, onRun, isRunning }) {
  const [langKey, setLangKey] = useState("cpp");
  const [editorCodes, setEditorCodes] = useState({});

  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }

  useEffect(() => {
    if (!problem?.codeStub) return;
    setEditorCodes((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const codes = {};
      Object.entries(LANGUAGES).forEach(([lang, config]) => {
        codes[lang] = problem.codeStub[config.dbKey] || "";
      });
      return codes;
    });
  }, [problem]);

  function handleRun() {
    if (onRun) onRun(editorCodes[langKey] || "", langKey);
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
              onChange={(e) => setLangKey(e.target.value)}
              className="styled-select"
            >
              {Object.entries(LANGUAGES).map(([key, lang]) => (
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
            language={LANGUAGES[langKey].monacoLang}
            value={editorCodes[langKey] || ""}
            onChange={(value) => {
              setEditorCodes((prev) => ({ ...prev, [langKey]: value || "" }));
            }}
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