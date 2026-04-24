import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import {
  CheckCircle2,
  AlertTriangle,
  Home,
  Loader2,
  Trophy,
  Target,
  RotateCcw,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface InterviewData {
  score: number;
  feedback: string;
  metrics: { subject: string; A: number; fullMark: number }[];
  messages: { role: string; text: string }[];
  strengths: string[];
  improvements: string[];
  createdAt: string;
}

export default function FeedbackPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await api.get(`/interview/${id}`);
        setData(res.data);
      } catch (error) {
        console.error("Error fetching feedback:", error);
        toast.error("Could not load feedback.");
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <span className="ml-3 text-white text-lg font-medium">
          Generating Analysis...
        </span>
      </div>
    );
  }

  if (!data)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        No Data Found
      </div>
    );

  const ratingOutOf10 = Math.round(data.score / 10);

  const chartData =
    data.metrics.length > 0
      ? data.metrics
      : [
          { subject: "Technical Knowledge", A: 0, fullMark: 100 },
          { subject: "Communication", A: 0, fullMark: 100 },
          { subject: "Problem Solving", A: 0, fullMark: 100 },
          { subject: "Code Quality", A: 0, fullMark: 100 },
          { subject: "Job Fit", A: 0, fullMark: 100 },
        ];

  const strengths =
    data.strengths?.length > 0
      ? data.strengths
      : data.metrics
          .filter((m) => m.A >= 70)
          .map((m) => `Strong in ${m.subject}`);

  const improvements =
    data.improvements?.length > 0
      ? data.improvements
      : data.metrics
          .filter((m) => m.A < 70)
          .map((m) => `Improve ${m.subject}`);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Average";
    if (score >= 40) return "Below Average";
    return "Needs Improvement";
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Performance Analysis
            </h1>
            <p className="text-slate-400 mt-2">
              Detailed breakdown of your AI interview performance
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                localStorage.removeItem("resumeId");
                navigate("/");
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-500 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> New Interview
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="secondary"
              className="gap-2"
            >
              <Home className="w-4 h-4" /> Home
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Score Circle */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-slate-200 text-lg uppercase tracking-wide">
                  Overall Score
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg
                    className="absolute inset-0"
                    viewBox="0 0 200 200"
                  >
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="12"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke={
                        data.score >= 80
                          ? "#22c55e"
                          : data.score >= 60
                            ? "#eab308"
                            : "#ef4444"
                      }
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(data.score / 100) * 534} 534`}
                      transform="rotate(-90 100 100)"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="text-center z-10">
                    <span
                      className={`text-5xl font-black ${getScoreColor(data.score)}`}
                    >
                      {ratingOutOf10}
                    </span>
                    <span className="text-xl text-slate-500">/10</span>
                    <p className="text-xs text-slate-400 mt-1">
                      {getScoreLabel(data.score)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Metrics */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {chartData.map((metric) => (
                  <div key={metric.subject} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">{metric.subject}</span>
                      <span className={getScoreColor(metric.A)}>
                        {metric.A}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          metric.A >= 80
                            ? "bg-green-500"
                            : metric.A >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${metric.A}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Radar Chart */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Skills Radar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={chartData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: "#64748b", fontSize: 10 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="A"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#e2e8f0",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-400">
                    <Trophy className="w-4 h-4" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {strengths.length > 0 ? (
                    strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-300">{s}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Complete more of the interview to see strengths
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-yellow-400">
                    <AlertTriangle className="w-4 h-4" />
                    Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {improvements.length > 0 ? (
                    improvements.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Target className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-300">{s}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Great job! Keep practicing to maintain your performance
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* AI Feedback */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Detailed Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {data.feedback}
                </p>
              </CardContent>
            </Card>

            {/* Interview Transcript */}
            {data.messages && data.messages.length > 0 && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-200 text-sm">
                    Interview Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {data.messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`text-sm p-3 rounded-lg ${
                            msg.role === "user"
                              ? "bg-blue-950/30 border border-blue-900/30"
                              : "bg-slate-800/50 border border-slate-700/30"
                          }`}
                        >
                          <Badge
                            variant="outline"
                            className={`text-[10px] mb-1 ${
                              msg.role === "user"
                                ? "border-blue-500/30 text-blue-400"
                                : "border-purple-500/30 text-purple-400"
                            }`}
                          >
                            {msg.role === "user" ? "You" : "Interviewer"}
                          </Badge>
                          <p className="text-slate-300 mt-1">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
