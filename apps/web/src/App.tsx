import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import SetupPage from "./pages/SetupPage";
import InterviewPage from "./pages/InterviewPage";
import FeedbackPage from "./pages/FeedbackPage";

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<SetupPage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/feedback/:id" element={<FeedbackPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
