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
    <>
      <span className="interview-timer">{duration}</span>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          padding: "3px 8px",
          borderRadius: "4px",
          background: isTabVisible ? "var(--success-bg)" : "var(--danger-bg)",
          color: isTabVisible ? "var(--success)" : "var(--danger)",
          letterSpacing: "0.02em",
        }}
      >
        {isTabVisible ? "Focused" : "Tab switched"}
      </span>
      {tabSwitchCount > 0 && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: "4px",
            background: "var(--danger-bg)",
            color: "var(--danger)",
          }}
        >
          {tabSwitchCount} switch{tabSwitchCount > 1 ? "es" : ""}
        </span>
      )}
    </>
  );
}
