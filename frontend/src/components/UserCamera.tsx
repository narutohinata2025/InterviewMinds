import { useEffect, useRef, useState } from "react";

interface UserCameraProps {
  onStreamReady?: (stream: MediaStream) => void;
}

export default function UserCamera({ onStreamReady }: UserCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360, facingMode: "user" },
          audio: false, // Audio handled by VAD separately
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          onStreamReady?.(stream);
        }
      } catch (err) {
        setError("Camera access denied");
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="user-camera-section">
      {error ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "var(--text-muted)",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      ) : (
        <video ref={videoRef} autoPlay playsInline muted />
      )}
      <div className="camera-overlay">
        <div className="camera-badge">
          <span className="rec-dot" />
          REC
        </div>
        {hasPermission && (
          <div className="camera-badge" style={{ color: "var(--accent-green)" }}>
            LIVE
          </div>
        )}
      </div>
    </div>
  );
}
