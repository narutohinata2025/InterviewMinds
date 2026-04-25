import express from "express";
import axios from "axios";

const router = express.Router();

const LANGUAGE_MAP: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  c: 50,
  cpp: 54,
  go: 60,
  rust: 73,
};

router.post("/execute", async (req: express.Request, res: express.Response) => {
  const { language, code } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "Language and code are required" });
  }

  const languageId = LANGUAGE_MAP[language];
  if (!languageId) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  try {
    const response = await axios.post(
      "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: code,
        language_id: languageId,
      },
      { timeout: 30000 },
    );

    const data = response.data;
    const stdout = data.stdout || "";
    const stderr = data.stderr || data.compile_output || "";
    const exitCode = data.status?.id === 3 ? 0 : 1;

    res.json({
      run: {
        output: exitCode === 0 ? stdout : stderr || stdout,
        code: exitCode,
        stderr: stderr,
      },
    });
  } catch (error: unknown) {
    console.error("Compiler error:", (error as Error).message);
    res.status(500).json({
      error: "Failed to execute code",
      details: (error as Error).message,
    });
  }
});

export default router;
