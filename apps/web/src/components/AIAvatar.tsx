import { useEffect, useRef } from "react";

interface AIAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  personaName: string;
  gender: "male" | "female";
}

export default function AIAvatar({
  isSpeaking,
  isListening,
  personaName,
  gender,
}: AIAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 280 * dpr;
    canvas.height = 280 * dpr;
    ctx.scale(dpr, dpr);

    const skinColor = gender === "female" ? "#f5c6a0" : "#e8b88a";
    const hairColor = gender === "female" ? "#2c1810" : "#1a1a2e";
    const shirtColor = gender === "female" ? "#6366f1" : "#3b82f6";

    const draw = () => {
      timeRef.current += 0.03;
      const t = timeRef.current;
      ctx.clearRect(0, 0, 280, 280);

      const cx = 140;
      const cy = 130;

      // Subtle idle bob
      const bobY = Math.sin(t * 1.5) * 2;

      // Background glow
      const glowRadius = isSpeaking ? 120 + Math.sin(t * 4) * 15 : 100;
      const glow = ctx.createRadialGradient(cx, cy + bobY, 0, cx, cy + bobY, glowRadius);
      glow.addColorStop(0, isSpeaking ? "rgba(99,102,241,0.15)" : "rgba(59,130,246,0.08)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 280, 280);

      // Body / Shirt
      ctx.fillStyle = shirtColor;
      ctx.beginPath();
      ctx.ellipse(cx, 230 + bobY, 55, 35, 0, Math.PI, 0, true);
      ctx.fill();

      // Neck
      ctx.fillStyle = skinColor;
      ctx.fillRect(cx - 12, 175 + bobY, 24, 25);

      // Head
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy + bobY, 52, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = hairColor;
      if (gender === "female") {
        ctx.beginPath();
        ctx.ellipse(cx, cy - 15 + bobY, 55, 50, 0, Math.PI, 0, true);
        ctx.fill();
        // Side hair
        ctx.beginPath();
        ctx.ellipse(cx - 50, cy + 20 + bobY, 12, 45, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 50, cy + 20 + bobY, 12, 45, -0.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(cx, cy - 20 + bobY, 54, 42, 0, Math.PI, 0, true);
        ctx.fill();
      }

      // Eyes
      const blinkCycle = Math.sin(t * 0.5);
      const eyeHeight = blinkCycle > 0.95 ? 1 : 6;

      // Left eye
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.ellipse(cx - 18, cy - 5 + bobY, 9, eyeHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      if (eyeHeight > 1) {
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(cx - 18, cy - 4 + bobY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(cx - 16, cy - 6 + bobY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Right eye
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.ellipse(cx + 18, cy - 5 + bobY, 9, eyeHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      if (eyeHeight > 1) {
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(cx + 18, cy - 4 + bobY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(cx + 20, cy - 6 + bobY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Eyebrows
      ctx.strokeStyle = hairColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 26, cy - 16 + bobY);
      ctx.quadraticCurveTo(cx - 18, cy - 20 + bobY, cx - 10, cy - 15 + bobY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 10, cy - 15 + bobY);
      ctx.quadraticCurveTo(cx + 18, cy - 20 + bobY, cx + 26, cy - 16 + bobY);
      ctx.stroke();

      // Nose
      ctx.strokeStyle = "#d4a574";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 2 + bobY);
      ctx.quadraticCurveTo(cx + 5, cy + 12 + bobY, cx, cy + 14 + bobY);
      ctx.stroke();

      // Mouth
      if (isSpeaking) {
        const mouthOpen = Math.abs(Math.sin(t * 8)) * 8 + 2;
        ctx.fillStyle = "#c0392b";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 26 + bobY, 10, mouthOpen, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 22 + bobY, 8, 2, 0, 0, Math.PI);
        ctx.fill();
      } else {
        ctx.strokeStyle = "#c0392b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy + 25 + bobY);
        ctx.quadraticCurveTo(cx, cy + 32 + bobY, cx + 12, cy + 25 + bobY);
        ctx.stroke();
      }

      // Listening indicator ring
      if (isListening) {
        ctx.strokeStyle = `rgba(34, 197, 94, ${0.5 + Math.sin(t * 3) * 0.3})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy + bobY, 70 + Math.sin(t * 3) * 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Speaking pulse rings
      if (isSpeaking) {
        for (let i = 0; i < 3; i++) {
          const phase = (t * 2 + i * 2) % 6;
          const radius = 65 + phase * 10;
          const alpha = Math.max(0, 1 - phase / 6) * 0.3;
          ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy + bobY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Name label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(personaName, cx, 268);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isSpeaking, isListening, personaName, gender]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        style={{ width: 280, height: 280 }}
        className="rounded-2xl"
      />
      <div className="mt-1 flex items-center gap-2">
        {isSpeaking && (
          <span className="text-xs text-indigo-400 animate-pulse">
            Speaking...
          </span>
        )}
        {isListening && (
          <span className="text-xs text-green-400 animate-pulse">
            Listening...
          </span>
        )}
      </div>
    </div>
  );
}
