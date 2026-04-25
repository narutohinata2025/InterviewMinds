import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  onClose: () => void;
}

export default function CodeEditor({ onClose }: CodeEditorProps) {
  const [code, setCode] = useState<string>(
    '// Write your solution here\nfunction solution() {\n  \n}\n\nconsole.log(solution());'
  );
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [language, setLanguage] = useState("javascript");

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setOutput("");

    try {
      // Use Piston API for code execution
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: language,
          version: "*",
          files: [{ content: code }],
        }),
      });

      const data = await response.json();
      const out = data.run?.output || data.run?.stderr || "No output";
      setOutput(out);
    } catch (err) {
      setOutput("Error executing code. Please try again.");
    } finally {
      setIsRunning(false);
    }
  }, [code, language]);

  return (
    <div className="code-editor-panel">
      <div className="code-editor-header">
        <h3>Code Editor</h3>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              background: "var(--bg-glass)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-glass)",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "12px",
              fontFamily: "inherit",
            }}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <button className="btn-primary" onClick={runCode} disabled={isRunning} style={{ padding: "6px 14px", fontSize: "12px" }}>
            {isRunning ? "Running..." : "Run"}
          </button>
          <button className="btn-secondary" onClick={onClose} style={{ padding: "6px 14px", fontSize: "12px" }}>
            Close
          </button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(v) => setCode(v || "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12 },
          }}
        />
      </div>
      {output && <div className="code-output">{output}</div>}
    </div>
  );
}
