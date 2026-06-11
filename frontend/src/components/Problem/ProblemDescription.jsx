import React, { useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaLightbulb,
  FaCopy,
  FaGoogle,
  FaAmazon,
  FaApple,
  FaFacebook,
  FaMicrosoft,
  FaBuilding,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import "../../styles/problem-description.css";

/* =========================================
   ACCORDION
========================================= */
const Accordion = ({
  title,
  sectionKey,
  openSections,
  toggleSection,
  children,
  icon,
}) => {
  return (
    <div className="accordion">
      <button
        className="accordion-header"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="accordion-left">
          {icon}
          <span>{title}</span>
        </div>

        {openSections[sectionKey] ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      {openSections[sectionKey] && (
        <div className="accordion-content">{children}</div>
      )}
    </div>
  );
};

/* =========================================
   VARIABLE HIGHLIGHTER
========================================= */
const renderHighlightedText = (text) => {
  const parts = text.split(/(\{\{.*?\}\})/g);

  return parts.map((part, index) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      const variable = part.replace(/\{\{|\}\}/g, "").trim();

      return (
        <span key={index} className="inline-variable">
          {variable}
        </span>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

/* =========================================
  NUMBER FORMATTING
========================================= */
const formatNumber = (num) => {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + "B";
  }

  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }

  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }

  return String(num);
};

const ParsedText = ({ text }) => {
  return <>{renderHighlightedText(text)}</>;
};

/* =========================================
   COPY FUNCTION
========================================= */
const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Copy failed", err);
  }
};

/* =========================================
   EXAMPLE CARD
========================================= */
const ExampleCard = ({ title, input, output, explanation }) => {
  return (
    <div className="example-card">
      <div className="example-top">
        <h3>{title}</h3>

        <button
          className="copy-btn"
          onClick={() =>
            copyText(
              `Input: ${input}\nOutput: ${output}\nExplanation: ${explanation}`,
            )
          }
        >
          <FaCopy />
        </button>
      </div>

      <p>
        <strong>Input:</strong> {input}
      </p>

      <p>
        <strong>Output:</strong> {output}
      </p>

      {explanation && (
        <p>
          <strong>Explanation:</strong> {explanation}
        </p>
      )}
    </div>
  );
};

/* =========================================
   COMPANY DATA
========================================= */
const companyIcons = {
  Google: <FaGoogle />,
  Amazon: <FaAmazon />,
  Apple: <FaApple />,
  Meta: <FaFacebook />,
  Microsoft: <FaMicrosoft />,
};

/* =========================================
   MAIN COMPONENT
========================================= */
const ProblemDescription = ({ problem }) => {
  const [openSections, setOpenSections] = useState({
    examples: true,
    constraints: true,
    followup: true,
    hints: false,
    companies: false,
    similar: false,
  });

  const acceptanceRate = (problem?.acceptanceRate.acceptedSubs/problem?.acceptanceRate.totalSubs * 100).toFixed(2);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="problem-container">
      {/* HEADER */}
      <div className="problem-header">
        <div className="title-row">
          <h1>
            {problem.problemNumber}.{problem.title}
          </h1>

          <div className={`difficulty ${problem.difficulty}`}>{problem.difficulty}</div>
        </div>

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-label">Acceptance</span>

            <span className="stat-value">{acceptanceRate}%</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Accepted</span>

            <span className="stat-value">
              {formatNumber(problem.acceptanceRate.acceptedSubs)}
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Submissions</span>

            <span className="stat-value">
              {formatNumber(problem.acceptanceRate.totalSubs)}
            </span>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="problem-section">
        {" "}
        {problem.description.split("\n").map((line, index) => (
          <p key={index}>{renderHighlightedText(line)}</p>
        ))}
      </div>

      {/* ACCORDIONS */}
      <div className="problem-section">
        {/* EXAMPLES */}
        <Accordion
          title="Examples"
          sectionKey="examples"
          openSections={openSections}
          toggleSection={toggleSection}
          icon={<FaLightbulb />}
        >
          {problem.examples?.length ? (
            problem.examples.map((example, index) => (
              <ExampleCard
                key={index}
                title={`Example ${index + 1}`}
                input={example.input}
                output={example.output}
                explanation={example.explanation}
              />
            ))
          ) : (
            <p>No examples available.</p>
          )}
        </Accordion>

        {/* CONSTRAINTS */}
        <Accordion
          title="Constraints"
          sectionKey="constraints"
          openSections={openSections}
          toggleSection={toggleSection}
          icon={<FaLightbulb />}
        >
          <ul className="bullet-list">
            {problem.constraints?.map((constraint, index) => (
              <li key={index}>
                <ParsedText text={constraint} />
              </li>
            ))}
          </ul>
        </Accordion>

        {/* FOLLOW UP */}
        <Accordion
          title="Follow-up"
          sectionKey="followup"
          openSections={openSections}
          toggleSection={toggleSection}
          icon={<FaLightbulb />}
        >
          <ul className="bullet-list">
            {problem.followUps?.map((followUp, index) => (
              <li key={index}>
                <ParsedText text={followUp} />
              </li>
            ))}
          </ul>
        </Accordion>

        {/* HINTS */}
        <Accordion
          title="Hints"
          sectionKey="hints"
          openSections={openSections}
          toggleSection={toggleSection}
          icon={<FaLightbulb />}
        >
          <div className="hint-stack">
            {problem.hints?.map((hint, index) => (
              <Accordion
                key={index}
                title={`Hint ${index + 1}`}
                sectionKey={`hint${index}`}
                openSections={openSections}
                toggleSection={toggleSection}
                icon={<FaLightbulb />}
              >
                <p className="hint-text">
                  <ParsedText text={hint} />
                </p>
              </Accordion>
            ))}
          </div>
        </Accordion>

        {/* COMPANIES */}
        <Accordion
          title="Companies"
          sectionKey="companies"
          openSections={openSections}
          toggleSection={toggleSection}
          icon={<FaLightbulb />}
        >
          <div className="companies-grid">
            {problem.companies?.map((company) => (
              <div key={company} className="company-card">
                <div className="company-fallback-icon">
                  {companyIcons[company] || <FaBuilding />}
                </div>
              </div>
            ))}
          </div>
        </Accordion>

        {/* SIMILAR */}
        {/* SIMILAR QUESTIONS */}
        <Accordion
          title="Similar Questions"
          sectionKey="similar"
          openSections={openSections}
          toggleSection={toggleSection}
          icon={<FaLightbulb />}
        >
          <ul className="bullet-list similar-list">
            {problem.similarQuestions?.map((question) => (
              <li key={question.slug}>
                <Link to={`/problemSet/${question.slug}`}>
                  <span>{question.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Accordion>
      </div>
    </div>
  );
};

export default ProblemDescription;
