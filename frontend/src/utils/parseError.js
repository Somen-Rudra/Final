
export function parseAndApplyStderr(rawStderr, monaco, editor) {
  if (!rawStderr || !monaco || !editor) return;

  const model = editor.getModel();
  if (!model) return;

  const markers = [];

  // Matches:
  // file.cpp:10:5:
  // line 10:5
  // :10:5
  const cppRegex = /(?::|line )(\d+)(?::)(\d+)?/i;

  const lines = rawStderr.split("\n");

  lines.forEach((msg) => {
    if (!msg.trim()) return;

    const match = msg.match(cppRegex);

    let targetLine = 1;
    let targetColumn = 1;

    if (match) {
      if (match[1]) targetLine = parseInt(match[1], 10);
      if (match[2]) targetColumn = parseInt(match[2], 10);
    }

     
    if (
      msg.includes("^") ||
      /^[\s~^]+$/.test(msg)
    ) {
      return;
    }

    const lineCount = model.getLineCount();

    if (targetLine > lineCount) {
      targetLine = lineCount;
    }

    const lineLength =
      model.getLineContent(targetLine)?.length || 1;

    markers.push({
      startLineNumber: targetLine,
      startColumn: targetColumn,
      endLineNumber: targetLine,
      endColumn: lineLength + 1,
      message: msg.trim(),
      severity: monaco.MarkerSeverity.Error,
    });
  });

  monaco.editor.setModelMarkers(
    model,
    "compiler-backend",
    markers
  );
}