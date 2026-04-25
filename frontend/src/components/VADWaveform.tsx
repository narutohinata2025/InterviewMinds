interface VADWaveformProps {
  volume: number;
  isListening: boolean;
  isSpeaking: boolean;
  isAISpeaking: boolean;
}

export default function VADWaveform({ volume, isListening, isSpeaking, isAISpeaking }: VADWaveformProps) {
  const barCount = 20;
  const bars = Array.from({ length: barCount }, (_, i) => {
    if (isAISpeaking) {
      // Show pulsing pattern when AI is speaking
      const offset = Math.sin((Date.now() / 200) + i * 0.3) * 0.5 + 0.5;
      return offset * 28 + 4;
    }
    if (!isListening) return 4;
    const baseHeight = volume * 200;
    const variation = Math.sin(Date.now() / 100 + i * 0.5) * baseHeight * 0.3;
    return Math.max(4, Math.min(32, baseHeight + variation));
  });

  const statusText = isAISpeaking
    ? "Aria is speaking..."
    : isSpeaking
    ? "Listening to you..."
    : isListening
    ? "Ready — speak naturally"
    : "Microphone initializing...";

  const statusClass = isAISpeaking ? "speaking" : isListening ? "listening" : "";

  return (
    <div className="vad-section">
      <div className="vad-bars">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`vad-bar ${isSpeaking || isAISpeaking ? "active" : ""}`}
            style={{
              height: `${h}px`,
              background: isAISpeaking
                ? "var(--accent-purple)"
                : isSpeaking
                ? "var(--accent-green)"
                : "var(--text-muted)",
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
      <span className={`vad-status ${statusClass}`}>{statusText}</span>
    </div>
  );
}
