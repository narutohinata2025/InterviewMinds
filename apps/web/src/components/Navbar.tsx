import { useNavigate, useLocation } from "react-router-dom";
import { Brain, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isInterview = location.pathname === "/interview";

  return (
    <nav className="h-16 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <Brain className="w-7 h-7 text-blue-500" />
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          InterviewMinds
        </span>
      </div>

      {!isInterview && (
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => navigate("/")}
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      )}
    </nav>
  );
}
