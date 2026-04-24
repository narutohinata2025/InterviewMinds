import { Terminal, AlertCircle } from "lucide-react";

interface OutputConsoleProps {
  output: string | null;
  error: string | null;
}

export function OutputConsole({ output, error }: OutputConsoleProps) {
  return (
    <div className="h-full bg-[#1e1e1e] p-4 font-mono text-sm">
      {!output && !error && (
        <div className="flex items-center gap-2 text-slate-600">
          <Terminal className="w-4 h-4" />
          <span>Run your code to see output here...</span>
        </div>
      )}

      {output && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-400 text-xs font-semibold uppercase mb-2">
            <Terminal className="w-3.5 h-3.5" />
            Output
          </div>
          <pre className="text-green-300 whitespace-pre-wrap break-words">
            {output}
          </pre>
        </div>
      )}

      {error && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-400 text-xs font-semibold uppercase mb-2">
            <AlertCircle className="w-3.5 h-3.5" />
            Error
          </div>
          <pre className="text-red-300 whitespace-pre-wrap break-words">
            {error}
          </pre>
        </div>
      )}
    </div>
  );
}
