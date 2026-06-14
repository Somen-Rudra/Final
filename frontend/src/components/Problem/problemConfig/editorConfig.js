export const LANGUAGES = {
  cpp: {
    name: "C++",
    monacoLang: "cpp",
    dbKey: "cpp",
  },
  c: {
    name: "C",
    monacoLang: "c",
    dbKey: "c",
  },
  javascript: {
    name: "JavaScript",
    monacoLang: "javascript",
    dbKey: "js",
  },
  python: {
    name: "Python",
    monacoLang: "python",
    dbKey: "py",
  },
  java: {
    name: "Java",
    monacoLang: "java",
    dbKey: "java",
  },
  kotlin: {
    name: "Kotlin",
    monacoLang: "kotlin",
    dbKey: "kotlin",
  },
  swift: {
    name: "Swift",
    monacoLang: "swift",
    dbKey: "swift",
  },
};

export const MONACO_OPTIONS = {
  wordWrap: "on",
  fontSize: 15,
  fontFamily: "JetBrains Mono",

  quickSuggestions: {
    other: true,
    comments: false,
    strings: false,
  },

  suggestOnTriggerCharacters: true,
  wordBasedSuggestions: "allDocuments",

  parameterHints: {
    enabled: true,
  },

  minimap: {
    enabled: true,
    renderCharacters: true,
    scale: 2,
  },

  smoothScrolling: true,

  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",

  padding: {
    top: 20,
    bottom: 20,
  },

  roundedSelection: true,

  renderLineHighlight: "all",

  scrollbar: {
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
  },

  overviewRulerBorder: false,

  hover: {
    enabled: true,
    delay: 300,
  },
};
