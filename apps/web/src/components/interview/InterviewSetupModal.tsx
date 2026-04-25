import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PERSONA_DETAILS } from "@/lib/interviewConstants";
import { Play, X, User, Gauge } from "lucide-react";

interface InterviewSetupModalProps {
  open: boolean;
  onStart: () => void;
  onCancel: () => void;
  persona: string;
  setPersona: (value: string) => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
}

export function InterviewSetupModal({
  open,
  onStart,
  onCancel,
  persona,
  setPersona,
  difficulty,
  setDifficulty,
}: InterviewSetupModalProps) {
  const personas = Object.entries(PERSONA_DETAILS);
  const difficulties = [
    { id: "easy", label: "Easy", desc: "Relaxed pace, helpful hints" },
    { id: "medium", label: "Medium", desc: "Standard interview difficulty" },
    { id: "hard", label: "Hard", desc: "Tough questions, strict evaluation" },
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-lg [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Interview Setup
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Configure your interview preferences before starting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Interviewer Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <User className="w-4 h-4 text-blue-400" />
              Choose Your Interviewer
            </label>
            <div className="grid grid-cols-3 gap-2">
              {personas.map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setPersona(key)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    persona === key
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                  }`}
                >
                  <div className="text-sm font-semibold text-white">
                    {p.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {p.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Gauge className="w-4 h-4 text-purple-400" />
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {difficulties.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    difficulty === d.id
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                  }`}
                >
                  <div className="text-sm font-semibold text-white">
                    {d.label}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300 mb-2">Tips:</p>
            <p>- Hold SPACEBAR to speak, release to send</p>
            <p>- Switch to Code Editor tab when asked to code</p>
            <p>- Click End Interview when done for your full report</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={onStart}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-bold"
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              Start Interview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
