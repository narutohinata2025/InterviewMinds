interface ProctoringHUDProps {
  tabSwitchCount: number;
  isTabVisible: boolean;
  duration: string;
}

export default function ProctoringHUD({
  tabSwitchCount,
  isTabVisible,
  duration,
}: ProctoringHUDProps) {
  return (
    <div className="interview-controls">
      <div className="interview-timer">{duration}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          className="camera-badge"
          style={{
            background: isTabVisible ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${isTabVisible ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            color: isTabVisible ? "var(--accent-green)" : "var(--accent-red)",
          }}
        >
          {isTabVisible ? "Focused" : "Tab switched!"}
        </div>
        {tabSwitchCount > 0 && (
          <div
            className="camera-badge"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "var(--accent-red)",
            }}
          >
            {tabSwitchCount} switch{tabSwitchCount > 1 ? "es" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
