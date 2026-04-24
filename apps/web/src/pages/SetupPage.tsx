import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  Briefcase,
  ArrowRight,
  Loader2,
  Brain,
  Code2,
  BarChart3,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function SetupPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }
    setFile(selectedFile);
    toast.success(`Selected: ${selectedFile.name}`);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please upload your resume");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("Please enter the job description");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);

      const res = await api.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.setItem("resumeId", res.data.id);
      localStorage.setItem("jobDescription", jobDescription);
      toast.success("Resume processed! Starting interview...");
      navigate("/interview");
    } catch (error) {
      console.error(error);
      toast.error("Failed to process resume. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const features = [
    {
      icon: Brain,
      title: "AI Interviewer",
      desc: "Personalized questions from your resume & JD",
    },
    {
      icon: Mic,
      title: "Voice Interview",
      desc: "Natural voice conversation with AI avatar",
    },
    {
      icon: Code2,
      title: "Live Coding",
      desc: "Built-in code editor with real-time execution",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      desc: "Detailed scoring and performance feedback",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        {/* Hero */}
        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            InterviewMinds
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            AI-powered mock interviews with voice interaction, live coding
            challenges, and detailed performance analytics.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          {features.map((f) => (
            <Card
              key={f.title}
              className="bg-slate-900/50 border-slate-800 hover:border-blue-500/30 transition-colors"
            >
              <CardContent className="p-4 text-center space-y-2">
                <f.icon className="w-8 h-8 mx-auto text-blue-400" />
                <h3 className="font-semibold text-white text-sm">{f.title}</h3>
                <p className="text-xs text-slate-400">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upload Section */}
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
          {/* Resume Upload */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-lg font-semibold text-white">
              <FileText className="w-5 h-5 text-blue-400" />
              Upload Your Resume (PDF)
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-blue-500 bg-blue-500/10"
                  : file
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-slate-700 hover:border-slate-500 bg-slate-900/30"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && handleFileChange(e.target.files[0])
                }
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-green-400" />
                  <div className="text-left">
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-sm text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB - Click to change
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-10 h-10 mx-auto text-slate-500" />
                  <p className="text-slate-400">
                    Drag & drop your resume here, or click to browse
                  </p>
                  <p className="text-xs text-slate-600">PDF only, max 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-lg font-semibold text-white">
              <Briefcase className="w-5 h-5 text-purple-400" />
              Paste the Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here... The AI will tailor interview questions to match the role requirements."
              className="w-full h-48 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-slate-500">
              {jobDescription.length} characters
            </p>
          </div>

          {/* Start Button */}
          <Button
            onClick={handleSubmit}
            disabled={isUploading || !file || !jobDescription.trim()}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Resume...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5 mr-2" />
                Start AI Interview
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
