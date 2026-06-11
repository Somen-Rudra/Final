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
import axios from "axios"
import {API} from "../config/axios"

const json = {
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
        children: [{ type: "tab", name: "Problem", component: "ProblemDescription" }],
      },
      {
        type: "row",
        weight: 60,
        orientation: "column",
        children: [
          {
            type: "tabset",
            weight: 60,
            children: [{ type: "tab", name: "Editor", component: "CodeEditor" }],
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
  const [model] = useState(() => Model.fromJson(json));
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState({});

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [isErrorOutput, setIsErrorOutput] = useState(false);
  const [submitResults, setSubmitResults] = useState(null);

  const codeRef = useRef({ code: "", lang: "cpp" });

  const { slug } = useParams();

  useEffect(() => {
    async function loadProblem() {
      try {
        setLoading(true);
        const res = await API.get(`/problemSet/${slug}`);
        setProblem(res.data.data);
      } catch (error) {
        console.log(error.message);
      } finally {
        setLoading(false);
      }
    }
    loadProblem();
  }, [slug]);

  // Called by CodeEditor on Run
  async function handleRun(code, lang) {
    codeRef.current = { code, lang };
    setIsRunning(true);
    setTerminalOutput("");
    setIsErrorOutput(false);

    

    try {
      const res = await axios.post("http://localhost:3000/run", { language: lang, code });
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
      setTerminalOutput(
        err?.response?.data?.message || err.message || "An error occurred"
      );
    } finally {
      setIsRunning(false);
    }
  }

  // Called by TestCases on Submit
  async function handleSubmit() {
    const { code, lang } = codeRef.current;

    if (!problem?.visibleTestCases?.length) return;

    setIsSubmitting(true);
    setSubmitResults(null);

    const testCases = [
      ...(problem.visibleTestCases || []),
      ...(problem.hiddenTestCases || []),
    ].map((tc) => ({ input: tc.input, output: tc.output }));

    try {
      const res = await axios.post("http://localhost:3000/run-tests", {
        language: lang,
        code,
        testCases,
      });
      setSubmitResults(res.data.results || []);
    } catch (err) {
      setIsErrorOutput(true);
      setTerminalOutput(
        err?.response?.data?.message || err.message || "Submission failed"
      );
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
            onCodeChange={(code, lang) => {
              codeRef.current = { code, lang };
            }}
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
        return <ProblemDescription problem={problem} />;

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