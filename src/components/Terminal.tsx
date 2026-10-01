import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, CornerDownLeft, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface TerminalProps {
  output: string[];
  onExecuteLine: (cmd: string) => void;
  onClearOutput: () => void;
  stackDepth: number;
}

export const Terminal: React.FC<TerminalProps> = ({
  output,
  onExecuteLine,
  onClearOutput,
  stackDepth,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);
    onExecuteLine(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInput(history[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx < history.length) {
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-mono text-xs text-slate-200">
      {/* Console Top Bar */}
      <div className="h-8 px-3 bg-slate-900 border-b border-t border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-300">Terminal & REPL</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500 font-sans text-[11px]">
            Stack Depth: <span className="font-mono text-emerald-400 font-bold">{stackDepth}</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onExecuteLine('.S')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
            title="Non-destructive stack print (.S)"
          >
            .S
          </button>
          <button
            onClick={() => onExecuteLine('WORDS')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
            title="List all dictionary words"
          >
            WORDS
          </button>
          <button
            onClick={onClearOutput}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Clear Terminal Output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Output Log */}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="flex-1 p-3 overflow-y-auto font-mono text-[12px] leading-5 space-y-1 bg-slate-950 select-text"
      >
        <div className="text-slate-500 mb-2 border-b border-slate-900 pb-1">
          ForthVM Console v1.0. Ready. Type Forth words or math (e.g. <span className="text-emerald-400">15 25 + .</span>) and press Enter.
        </div>

        {output.map((line, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap break-all ${
              line.startsWith('>')
                ? 'text-sky-300 font-semibold'
                : line.includes('[ERROR')
                ? 'text-rose-400 font-bold'
                : line.includes('ok')
                ? 'text-emerald-400'
                : 'text-slate-200'
            }`}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Interactive Command Input */}
      <form onSubmit={handleSubmit} className="p-2 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
        <span className="text-emerald-400 font-bold select-none pl-1">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter Forth command... (e.g. 5 DUP * . or .S)"
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none font-mono text-xs"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-1 text-slate-400 hover:text-emerald-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
          title="Execute"
        >
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
