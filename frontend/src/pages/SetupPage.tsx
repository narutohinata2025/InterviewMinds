import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { getResumeText, initSession } from "../services/api";

const PERSONAS = [
  {
    id: "strict",
    name: "Strict Interviewer",
    icon: "👔",
    desc: "Senior Staff Engineer — direct, rigorous, high standards",
  },
  {
    id: "friendly",
    name: "Friendly Coach",
    icon: "😊",
    desc: "Engineering Manager — warm, supportive, encouraging",
  },
  {
    id: "panel",
    name: "Panel Interview",
    icon: "👥",
    desc: "3 interviewers: Tech Lead, PM, and HR Director",
  },
  {
    id: "behavioral",
    name: "Behavioral Focus",
    icon: "🧠",
    desc: "HR Director — STAR method, culture fit, soft skills",
  },
  {
    id: "technical",
    name: "Deep Technical",
    icon: "⚙️",
    desc: "Principal Engineer — system design, algorithms, architecture",
  },
];

const DIFFICULTIES = [
  { id: "junior", label: "Junior", desc: "0-2 years" },
  { id: "mid", label: "Mid-Level", desc: "2-5 years" },
  { id: "senior", label: "Senior", desc: "5+ years" },
];

export default function SetupPage() {
  const navigate = useNavigate();
  const [persona, setPersona] = useState("friendly");
  const [difficulty, setDifficulty] = useState("mid");
  const [jobDescription, setJobDescription] = useState("");
  const [hasMic, setHasMic] = useState(false);
  const [hasCam, setHasCam] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const resumeId = sessionStorage.getItem("resumeId");
  const resumeFilename = sessionStorage.getItem("resumeFilename");

  useEffect(() => {
    if (!resumeId) {
      navigate("/");
      return;
    }

    // Check permissions
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setHasMic(true);
        stream.getTracks().forEach((t) => t.stop());
      })
      .catch(() => setHasMic(false));

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        setHasCam(true);
        stream.getTracks().forEach((t) => t.stop());
      })
      .catch(() => setHasCam(false));
  }, [resumeId, navigate]);

  const handleStart = useCallback(async () => {
    if (!resumeId) return;

    setIsStarting(true);
    try {
      const resumeText = await getResumeText(resumeId);
      const sessionId = uuidv4();
      await initSession(sessionId, resumeText, jobDescription || "General software engineering position", persona, difficulty);
      navigate(`/interview?sessionId=${sessionId}`);
    } catch (error) {
      console.error("Failed to start interview:", error);
      setIsStarting(false);
    }
  }, [resumeId, jobDescription, persona, difficulty, navigate]);

  return (
    <div className="setup-page">
      <div className="setup-header">
        <h1>Interview Setup</h1>
        <p>
          Configure your mock interview experience • Resume: <strong>{resumeFilename || "uploaded"}</strong>
        </p>
      </div>

      <div className="setup-grid">
        {/* Left — Persona Selection */}
        <div className="setup-section glass-panel">
          <h2>🎭 Interviewer Persona</h2>
          <div className="persona-grid">
            {PERSONAS.map((p) => (
              <div
                key={p.id}
                className={`persona-card ${persona === p.id ? "selected" : ""}`}
                onClick={() => setPersona(p.id)}
              >
                <h3>
                  {p.icon} {p.name}
                </h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Settings */}
        <div className="setup-section glass-panel">
          <h2>⚡ Interview Settings</h2>

          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--text-secondary)" }}>
              Difficulty Level
            </h3>
            <div className="difficulty-options">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  className={`difficulty-btn ${difficulty === d.id ? "selected" : ""}`}
                  onClick={() => setDifficulty(d.id)}
                >
                  <div style={{ fontWeight: 600 }}>{d.label}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {d.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--text-secondary)" }}>
              Job Description (Optional)
            </h3>
            <textarea
              className="jd-textarea"
              placeholder="Paste the job description here for more targeted interview questions..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div>
            <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--text-secondary)" }}>
              Device Permissions
            </h3>
            <div className="permission-check">
              <div className="permission-item">
                <div className={`permission-status ${hasMic ? "granted" : "denied"}`} />
                <span>Microphone {hasMic ? "— Ready" : "— Please allow access"}</span>
              </div>
              <div className="permission-item">
                <div className={`permission-status ${hasCam ? "granted" : "denied"}`} />
                <span>Camera {hasCam ? "— Ready" : "— Please allow access"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="setup-actions">
          <button
            className="btn-primary"
            onClick={handleStart}
            disabled={isStarting || !hasMic}
            style={{ padding: "16px 48px", fontSize: "18px" }}
          >
            {isStarting ? "Preparing Interview Room..." : "Enter Interview Room"}
          </button>
          {!hasMic && (
            <p style={{ color: "var(--accent-red)", fontSize: "13px", marginTop: "12px" }}>
              Microphone access is required for the voice-based interview
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
