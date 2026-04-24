import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display";

window.PIXI = PIXI;

interface AIAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  personaName: string;
  gender: "male" | "female";
}

const MODEL_PATH = "/live2d/assets/haru/haru_greeter_t05.model3.json";

export default function AIAvatar({
  isSpeaking,
  isListening,
  personaName,
}: AIAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<InstanceType<typeof Live2DModel> | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const mouthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const motionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    containerRef.current.appendChild(canvas);

    const pixiApp = new PIXI.Application({
      view: canvas,
      resizeTo: containerRef.current,
      backgroundAlpha: 0,
      antialias: true,
    });
    appRef.current = pixiApp;

    Live2DModel.from(MODEL_PATH)
      .then((m) => {
        modelRef.current = m;

        const containerW = containerRef.current?.clientWidth ?? 280;
        const containerH = containerRef.current?.clientHeight ?? 320;

        const scale = Math.min(containerW / m.width, containerH / m.height) * 1.8;
        m.scale.set(scale);
        m.anchor.set(0.5, 0.5);
        m.x = containerW / 2;
        m.y = containerH / 2 + 30;

        pixiApp.stage.addChild(m);
        setLoaded(true);

        // Play idle motion
        try {
          m.motion("", 0);
        } catch {
          // idle motion not available
        }
      })
      .catch((err) => {
        console.error("Live2D model load failed:", err);
        setError(true);
      });

    return () => {
      if (mouthIntervalRef.current) clearInterval(mouthIntervalRef.current);
      if (motionIntervalRef.current) clearInterval(motionIntervalRef.current);
      pixiApp.destroy(true, { children: true });
      appRef.current = null;
      modelRef.current = null;
    };
  }, []);

  // Lip-sync simulation when speaking
  useEffect(() => {
    const model = modelRef.current;
    if (!model) return;

    if (isSpeaking) {
      // Animate mouth open/close to simulate lip-sync
      mouthIntervalRef.current = setInterval(() => {
        const coreModel = (model as Record<string, unknown>).internalModel as
          | { coreModel: { setParameterValueById: (id: string, v: number) => void } }
          | undefined;
        if (coreModel?.coreModel) {
          const openValue = Math.random() * 0.7 + 0.3;
          try {
            coreModel.coreModel.setParameterValueById("ParamMouthOpenY", openValue);
          } catch {
            // parameter not available
          }
        }
      }, 100);

      // Trigger random motions while speaking
      motionIntervalRef.current = setInterval(() => {
        try {
          const motionIndex = Math.floor(Math.random() * 10) + 1;
          model.motion("", motionIndex);
        } catch {
          // motion not available
        }
      }, 4000);
    } else {
      // Close mouth
      if (mouthIntervalRef.current) {
        clearInterval(mouthIntervalRef.current);
        mouthIntervalRef.current = null;
      }
      if (motionIntervalRef.current) {
        clearInterval(motionIntervalRef.current);
        motionIntervalRef.current = null;
      }

      const coreModel = (model as Record<string, unknown>).internalModel as
        | { coreModel: { setParameterValueById: (id: string, v: number) => void } }
        | undefined;
      if (coreModel?.coreModel) {
        try {
          coreModel.coreModel.setParameterValueById("ParamMouthOpenY", 0);
        } catch {
          // parameter not available
        }
      }

      // Return to idle
      try {
        model.motion("", 0);
      } catch {
        // idle not available
      }
    }

    return () => {
      if (mouthIntervalRef.current) clearInterval(mouthIntervalRef.current);
      if (motionIntervalRef.current) clearInterval(motionIntervalRef.current);
    };
  }, [isSpeaking]);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden"
        style={{ width: 280, height: 320, background: "transparent" }}
      >
        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-sm text-slate-400 animate-pulse">
              Loading AI Avatar...
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-sm text-red-400">Avatar load failed</div>
          </div>
        )}

        {/* Listening ring overlay */}
        {isListening && loaded && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              className="rounded-full border-2 border-green-400 animate-ping"
              style={{ width: 200, height: 200, opacity: 0.3 }}
            />
          </div>
        )}

        {/* Speaking pulse rings */}
        {isSpeaking && loaded && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              className="rounded-full border-2 border-indigo-400 animate-ping"
              style={{
                width: 220,
                height: 220,
                opacity: 0.2,
                animationDuration: "1.5s",
              }}
            />
          </div>
        )}
      </div>

      {/* Name label */}
      <p className="mt-2 text-slate-400 font-bold text-sm">{personaName}</p>

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
