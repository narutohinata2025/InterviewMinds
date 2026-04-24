import express from "express";
import axios from "axios";

const router = express.Router();

const LANGUAGE_MAP: Record<string, string> = {
  javascript: "18.15.0",
  typescript: "5.0.3",
  python: "3.10.0",
  java: "15.0.2",
  c: "10.2.0",
  cpp: "10.2.0",
  go: "1.16.2",
  rust: "1.68.2",
};

router.post("/execute", async (req: express.Request, res: express.Response) => {
  const { language, code } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "Language and code are required" });
  }

  const version = LANGUAGE_MAP[language];
  if (!version) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  try {
    const response = await axios.post(
      "https://emkc.org/api/v2/piston/execute",
      {
        language,
        version,
        files: [{ content: code }],
      },
      { timeout: 15000 },
    );

    res.json(response.data);
  } catch (error: unknown) {
    console.error("Compiler error:", (error as Error).message);
    res.status(500).json({
      error: "Failed to execute code",
      details: (error as Error).message,
    });
  }
});

export default router;
