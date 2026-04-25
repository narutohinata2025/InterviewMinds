interface VADWaveformProps {
  volume: number;
  isListening: boolean;
  isSpeaking: boolean;
  isAISpeaking: boolean;
}

export default function VADWaveform({ volume, isListening, isSpeaking, isAISpeaking }: VADWaveformProps) {
  const barCount = 16;
  const bars = Array.from({ length: barCount }, (_, i) => {
    if (isAISpeaking) {
      const offset = Math.sin((Date.now() / 200) + i * 0.3) * 0.5 + 0.5;
      return offset * 20 + 3;
    }
    if (!isListening) return 3;
    const baseHeight = volume * 160;
    const variation = Math.sin(Date.now() / 100 + i * 0.5) * baseHeight * 0.3;
    return Math.max(3, Math.min(24, baseHeight + variation));
  });

  return (
    <div className="vad-bars">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`vad-bar ${isSpeaking || isAISpeaking ? "active" : ""}`}
          style={{
            height: `${h}px`,
            background: isAISpeaking
              ? "var(--accent)"
              : isSpeaking
              ? "var(--success)"
              : "var(--text-tertiary)",
          }}
        />
      ))}
    </div>
  );
}
