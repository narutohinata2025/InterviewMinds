import { api } from "@/lib/api";

interface ExecutionResult {
  run: {
    output: string;
    code: number;
    stderr: string;
  };
}

export async function executeCode(
  language: string,
  code: string,
): Promise<ExecutionResult> {
  const response = await api.post("/compiler/execute", { language, code });
  return response.data;
}
