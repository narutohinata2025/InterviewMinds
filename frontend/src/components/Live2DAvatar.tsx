import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";

// Register PIXI to window for pixi-live2d-display
(window as any).PIXI = PIXI;

export interface Live2DAvatarHandle {
  getModel: () => any;
}

interface Live2DAvatarProps {
  isSpeaking?: boolean;
}

const MODEL_PATH = "/live2d/assets/haru/haru_greeter_t05.model3.json";
const MOTION_COUNT = 26;

const Live2DAvatar = forwardRef<Live2DAvatarHandle, Live2DAvatarProps>(
  ({ isSpeaking = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const modelRef = useRef<any>(null);
    const motionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const mountedRef = useRef(true);

    useImperativeHandle(ref, () => ({
      getModel: () => modelRef.current,
    }));

    useEffect(() => {
      mountedRef.current = true;

      const init = async () => {
        if (!canvasRef.current || !mountedRef.current) return;

        const app = new PIXI.Application({
          view: canvasRef.current,
          autoStart: true,
          resizeTo: canvasRef.current.parentElement || undefined,
          backgroundAlpha: 0,
          antialias: true,
        });
        appRef.current = app;

        try {
          const model = await Live2DModel.from(MODEL_PATH, {
            autoInteract: false,
            autoUpdate: true,
          });

          if (!mountedRef.current) {
            model.destroy();
            return;
          }

          modelRef.current = model;

          // Scale model to fit canvas nicely
          const scale = Math.min(
            app.screen.width / model.width,
            app.screen.height / model.height
          ) * 1.8;

          model.scale.set(scale);
          model.anchor.set(0.5, 0.5);
          model.x = app.screen.width / 2;
          model.y = app.screen.height / 2 + 100;

          app.stage.addChild(model as any);

          // Start idle breathing and random motions
          motionIntervalRef.current = setInterval(() => {
            if (!modelRef.current || !mountedRef.current) return;
            const idx = Math.floor(Math.random() * MOTION_COUNT) + 1;
            const padded = idx.toString().padStart(2, "0");
            try {
              modelRef.current.motion(``, idx);
            } catch {}
          }, 4000 + Math.random() * 3000);
        } catch (error) {
          console.error("Failed to load Live2D model:", error);
        }
      };

      init();

      return () => {
        mountedRef.current = false;
        if (motionIntervalRef.current) {
          clearInterval(motionIntervalRef.current);
        }
        if (modelRef.current) {
          try { modelRef.current.destroy(); } catch {}
          modelRef.current = null;
        }
        if (appRef.current) {
          try { appRef.current.destroy(false); } catch {}
          appRef.current = null;
        }
      };
    }, []);

    // Handle window resize
    useEffect(() => {
      const handleResize = () => {
        if (!appRef.current || !modelRef.current) return;
        const app = appRef.current;
        app.renderer.resize(
          canvasRef.current?.parentElement?.clientWidth || 800,
          canvasRef.current?.parentElement?.clientHeight || 600
        );
        const scale = Math.min(
          app.screen.width / (modelRef.current.width / modelRef.current.scale.x),
          app.screen.height / (modelRef.current.height / modelRef.current.scale.y)
        ) * 1.8;
        modelRef.current.scale.set(scale);
        modelRef.current.x = app.screen.width / 2;
        modelRef.current.y = app.screen.height / 2 + 100;
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
      <div className="avatar-container">
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
        <div className={`avatar-glow ${isSpeaking ? "speaking" : ""}`} />
      </div>
    );
  }
);

Live2DAvatar.displayName = "Live2DAvatar";
export default Live2DAvatar;
