import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { uploadResume } from "../services/api";

export default function LandingPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }
    setFile(f);
    setError(null);
    setUploading(true);

    try {
      const result = await uploadResume(f);
      sessionStorage.setItem("resumeId", result.resumeId);
      sessionStorage.setItem("resumeFilename", result.filename);
      sessionStorage.setItem("resumePreview", result.preview);
      setUploading(false);
      navigate("/setup");
    } catch (err) {
      setError("Failed to upload resume. Please try again.");
      setUploading(false);
      setFile(null);
    }
  }, [navigate]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  return (
    <div className="landing-page">
      <div className="landing-bg" />

      <nav className="landing-nav">
        <div className="landing-logo">AI Interview Pro</div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn-secondary" onClick={() => window.open("https://github.com/narutohinata2025/InterviewMinds", "_blank")}>
            GitHub
          </button>
        </div>
      </nav>

      <div className="landing-hero">
        <h1>
          Master Your Next Interview with{" "}
          <span>AI-Powered Practice</span>
        </h1>
        <p>
          Experience realistic mock interviews with a Live2D AI avatar interviewer.
          Upload your resume, choose your interview style, and get comprehensive
          feedback with detailed analytics.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            Upload Resume & Start
          </button>
        </div>
      </div>

      <div
        className={`upload-area glass-panel ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="upload-icon">{file ? "📄" : "📤"}</div>
        <h3>
          {uploading
            ? "Parsing your resume..."
            : file
            ? file.name
            : "Drop your resume here or click to browse"}
        </h3>
        <p>{file ? "Resume uploaded successfully!" : "PDF files only, max 10MB"}</p>
        {error && <p style={{ color: "var(--accent-red)", marginTop: "8px" }}>{error}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      <div className="feature-grid">
        <div className="feature-card glass-panel">
          <div className="feature-card-icon">🤖</div>
          <h3>Live2D AI Avatar</h3>
          <p>
            Interview with Aria, an animated AI interviewer with real-time lip-sync
            and natural expressions powered by Live2D Cubism SDK.
          </p>
        </div>
        <div className="feature-card glass-panel">
          <div className="feature-card-icon">🎤</div>
          <h3>Voice-First Interview</h3>
          <p>
            No buttons to press — just speak naturally. Advanced Voice Activity Detection
            automatically captures your answers in real-time.
          </p>
        </div>
        <div className="feature-card glass-panel">
          <div className="feature-card-icon">💻</div>
          <h3>Live Code Editor</h3>
          <p>
            Solve coding challenges in a built-in Monaco editor with syntax highlighting
            and real-time code execution across 5+ languages.
          </p>
        </div>
        <div className="feature-card glass-panel">
          <div className="feature-card-icon">📊</div>
          <h3>Detailed Analytics</h3>
          <p>
            Get comprehensive scoring across 5 dimensions with radar charts,
            AI-generated strengths, improvements, and full transcript replay.
          </p>
        </div>
      </div>
    </div>
  );
}
