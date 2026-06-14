// src/pages/Workspace.jsx
import { useEffect, useState, useRef } from "react";
import { Layout, Model } from "flexlayout-react";
import "flexlayout-react/style/dark.css";

import "../styles/editor.css";
import "../styles/tab.css";

import Loader from "../components/Home/Loader";
import CodeEditor from "../components/Problem/CodeEditor";
import Output from "../components/Problem/Output";
import ProblemDescription from "../components/Problem/ProblemDescription";
import TestCases from "../components/Problem/TestCases";
import { useParams } from "react-router-dom";
import { API } from "../config/axios";

// All judge calls now go through YOUR backend — no direct judge access from frontend.
// Backend stitches header + userCode + driver before forwarding to judge.

const layoutJson = {
  global: {
    tabEnableClose: false,
    tabEnableRename: false,
    tabEnableDrag: true,
  },
  borders: [],
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "tabset",
        weight: 40,
        children: [
          { type: "tab", name: "Problem", component: "ProblemDescription" },
        ],
      },
      {
        type: "row",
        weight: 60,
        orientation: "column",
        children: [
          {
            type: "tabset",
            weight: 60,
            children: [
              { type: "tab", name: "Editor", component: "CodeEditor" },
            ],
          },
          {
            type: "tabset",
            weight: 40,
            children: [
              { type: "tab", name: "Testcases", component: "TestCases" },
              { type: "tab", name: "Output", component: "Output" },
            ],
          },
        ],
      },
    ],
  },
};

export default function Workspace() {
  const [model] = useState(() => Model.fromJson(layoutJson));
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState(null);

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [isErrorOutput, setIsErrorOutput] = useState(false);
  const [submitResults, setSubmitResults] = useState(null);

  // { code, judgeKey } — judgeKey is judge-ready: "javascript", "python", "cpp" etc.
  const codeRef = useRef({ code: "", judgeKey: "cpp" });

  const { slug } = useParams();

  useEffect(() => {
    async function loadProblem() {
      try {
        setLoading(true);
        setProblem(null);
        setSubmitResults(null);
        setTerminalOutput("");
        setIsErrorOutput(false);
        const res = await API.get(`/problemSet/${slug}`);
        setProblem(res.data.data);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    loadProblem();
  }, [slug]);

  function handleCodeChange(code, judgeKey) {
    codeRef.current = { code, judgeKey };
  }

  // /run — free run, backend stitches code, returns stdout/stderr
  async function handleRun(code, judgeKey) {
    codeRef.current = { code, judgeKey };
    setIsRunning(true);
    setTerminalOutput("");
    setIsErrorOutput(false);

    try {
      const res = await API.post(`/problemSet/${slug}/run`, {
        language: judgeKey,
        code,
      });
      const data = res.data;

      if (data.timedOut) {
        setIsErrorOutput(true);
        setTerminalOutput("Time Limit Exceeded");
      } else if (data.stderr) {
        setIsErrorOutput(true);
        setTerminalOutput(data.stderr);
      } else {
        setIsErrorOutput(false);
        setTerminalOutput(data.stdout || "(no output)");
      }
    } catch (err) {
      setIsErrorOutput(true);
      // axios wraps the error body in err.response.data
      setTerminalOutput(err.response?.data?.error || err.message);
    } finally {
      setIsRunning(false);
    }
  }

  // /submit — backend fetches hidden cases, stitches code, runs all cases
  async function handleSubmit(customCases = []) {
    const { code, judgeKey } = codeRef.current;

    if (!code.trim()) {
      setIsErrorOutput(true);
      setTerminalOutput("Please write some code before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitResults(null);

    try {
      const res = await API.post(`/problemSet/${slug}/submit`, {
        language: judgeKey,
        code,
        customCases,
      });
      const data = res.data;

      console.log("[submit response]", data);
      setSubmitResults(data.results || []);
    } catch (err) {
      setIsErrorOutput(true);
      setTerminalOutput(err.response?.data?.error || err.message);
      console.error("[submit error]", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearOutput() {
    setTerminalOutput("");
    setIsErrorOutput(false);
  }

  const factory = (node) => {
    switch (node.getComponent()) {
      case "CodeEditor":
        return (
          <CodeEditor
            problem={problem}
            onRun={handleRun}
            isRunning={isRunning}
            onCodeChange={handleCodeChange}
          />
        );
      case "Output":
        return (
          <Output
            terminalOutput={terminalOutput}
            isErrorOutput={isErrorOutput}
            clearOutput={clearOutput}
          />
        );
      case "ProblemDescription":
        return <ProblemDescription key={slug} problem={problem} />;
      case "TestCases":
        return (
          <TestCases
            problem={problem}
            onSubmit={handleSubmit}
            submitResults={submitResults}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return <div className="placeholder">{node.getName()}</div>;
    }
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {loading ? <Loader /> : <Layout model={model} factory={factory} />}
    </div>
  );
}