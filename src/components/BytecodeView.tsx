import React, { useRef, useEffect } from 'react';
import { Cpu, ArrowRight, Code2, Download, Copy, Play } from 'lucide-react';
import { Instruction } from '../forth/types.ts';

interface BytecodeViewProps {
  instructions: Instruction[];
  currentIp: number;
  halted: boolean;
  cycles: number;
  maxStackDepth: number;
  executionTimeMs: number;
  onStep: () => void;
}

export const BytecodeView: React.FC<BytecodeViewProps> = ({
  instructions,
  currentIp,
  halted,
  cycles,
  maxStackDepth,
  executionTimeMs,
  onStep,
}) => {
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentIp]);

  return (
    <div className="flex flex-col h-full bg-slate-950 font-mono text-slate-200 overflow-hidden">
      {/* Top Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-xs text-slate-200">Custom Stack Machine Bytecode</span>
          <span className="px-1.5 py-0.5 rounded text-[11px] bg-slate-800 text-sky-400 border border-slate-700">
            {instructions.length} ops
          </span>
        </div>

        <button
          onClick={onStep}
          disabled={halted}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-sans font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 rounded transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          <span>Step Opcode</span>
        </button>
      </div>

      {/* VM Telemetry Bar */}
      <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 tabular-nums">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-500">IP:</span>{' '}
            <span className="text-emerald-400 font-bold">#{currentIp}</span>
          </div>
          <div>
            <span className="text-slate-500">Status:</span>{' '}
            <span className={halted ? 'text-slate-400' : 'text-emerald-400'}>
              {halted ? 'Halted' : 'Running'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Cycles:</span>{' '}
            <span className="text-slate-200">{cycles.toLocaleString()}</span>
          </div>
        </div>

        <div>
          <span className="text-slate-500">Time:</span>{' '}
          <span className="text-slate-200">{executionTimeMs.toFixed(2)} ms</span>
        </div>
      </div>

      {/* Bytecode Listing */}
      <div className="flex-1 overflow-y-auto p-2 text-xs">
        {instructions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 font-sans">
            <Cpu className="w-8 h-8 text-slate-700 mb-2" />
            <div className="text-sm font-medium text-slate-400 mb-1">No Bytecode Compiled</div>
            <p className="text-xs text-slate-500 max-w-xs">
              Write Forth code in the editor and click Run to compile into stack machine instructions.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {instructions.map((ins, idx) => {
              const isActive = idx === currentIp && !halted;
              const isPast = idx < currentIp;

              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  className={`flex items-center px-2 py-1 rounded transition-colors ${
                    isActive
                      ? 'bg-sky-500/20 text-white font-bold border border-sky-500/50 shadow-sm'
                      : isPast
                      ? 'text-slate-500 hover:bg-slate-900/60'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  {/* IP Indicator */}
                  <div className="w-6 shrink-0 flex items-center justify-center text-[10px]">
                    {isActive ? (
                      <ArrowRight className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                    ) : (
                      <span className="text-slate-700">{idx}</span>
                    )}
                  </div>

                  {/* Offset */}
                  <div className="w-12 text-slate-600 shrink-0 text-[11px] tabular-nums">
                    {idx.toString().padStart(4, '0')}
                  </div>

                  {/* Opcode */}
                  <div className="w-32 shrink-0 font-bold text-sky-300">
                    {ins.op}
                  </div>

                  {/* Operand Argument */}
                  <div className="w-24 shrink-0 text-amber-300 tabular-nums truncate">
                    {ins.arg !== undefined ? String(ins.arg) : ''}
                  </div>

                  {/* Source Word & Comment */}
                  <div className="flex-1 truncate text-slate-500 text-[11px]">
                    {ins.sourceWord && (
                      <span className="text-slate-400 mr-2">[{ins.sourceWord}]</span>
                    )}
                    {ins.comment && <span>; {ins.comment}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
