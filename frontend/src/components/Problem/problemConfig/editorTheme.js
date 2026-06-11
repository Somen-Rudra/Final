export function defineCrimsonTheme(monaco) {
  monaco.editor.defineTheme("crimson", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "#ff355e", fontStyle: "bold" },
      { token: "keyword.js", foreground: "#ff355e", fontStyle: "bold" },
      { token: "storage.js", foreground: "#ff355e", fontStyle: "bold" },
      { token: "storage.type.js", foreground: "#ff355e", fontStyle: "bold" },

      { token: "string", foreground: "#ff9e64" },
      { token: "string.js", foreground: "#ff9e64" },

      { token: "string.escape", foreground: "#ff5370" },
      { token: "number", foreground: "#ff5370" },
      { token: "regexp", foreground: "#ff9e64" },

      { token: "comment", foreground: "#6b7280", fontStyle: "italic" },
      { token: "comment.js", foreground: "#6b7280", fontStyle: "italic" },

      { token: "entity.name.function", foreground: "#ff6b81" },
      { token: "entity.name.function.js", foreground: "#ff6b81" },
      { token: "support.function", foreground: "#ff6b81" },

      { token: "variable.js", foreground: "#F3F4F6" },

      {
        token: "variable.predefined.js",
        foreground: "#ff6b81",
        fontStyle: "bold",
      },

      { token: "support.class.js", foreground: "#ff6b81" },
      { token: "identifier", foreground: "#F3F4F6" },
      { token: "type.identifier", foreground: "#ff6b81" },

      { token: "keyword.operator.js", foreground: "#ff355e" },
      { token: "delimiter", foreground: "#ff355e" },
      { token: "delimiter.bracket.js", foreground: "#ff355e" },
      { token: "delimiter.parenthesis.js", foreground: "#ff355e" },
    ],
    colors: {
      "editor.background": "#120406",
      "editor.foreground": "#F3F4F6",
      "editorCursor.foreground": "#FF355E",

      "editor.lineHighlightBackground": "#11111488",

      "editor.selectionBackground": "#7f1d1d88",
      "editor.inactiveSelectionBackground": "#450a0a66",

      "editorIndentGuide.background": "#1f1f23",
      "editorIndentGuide.activeBackground": "#ff355e55",

      "editorLineNumber.foreground": "#6B7280",
      "editorLineNumber.activeForeground": "#FF355E",

      "editorSuggestWidget.background": "#0f0f12",
      "editorSuggestWidget.border": "#2a2a30",
      "editorSuggestWidget.selectedBackground": "#2b0b14",

      "scrollbarSlider.background": "#ff355e22",
      "scrollbarSlider.hoverBackground": "#ff355e55",

      "editor.findMatchBackground": "#ff355e55",

      "editorBracketMatch.background": "#ff355e22",
      "editorBracketMatch.border": "#ff355e",

      "editorGutter.background": "#00000000",

      "minimap.background": "#00000000",
      "minimap.selectionHighlight": "#ff355e22",
      "minimap.findMatchHighlight": "#ff355e55",
      "minimap.errorHighlight": "#ff000044",
      "minimap.warningHighlight": "#ffaa0044",
    },
  });
}
