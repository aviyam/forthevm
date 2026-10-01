import React, { useState } from 'react';
import { Database, Search, ArrowRight, Layers } from 'lucide-react';
import { VariableInfo } from '../forth/types.ts';

interface MemoryViewProps {
  memory: Uint8Array;
  here: number;
  variables: Map<string, VariableInfo>;
  constants: Map<string, number>;
  onInspectAddress?: (addr: number) => void;
}

export const MemoryView: React.FC<MemoryViewProps> = ({
  memory,
  here,
  variables,
  constants,
}) => {
  const [baseAddr, setBaseAddr] = useState<number>(1024);
  const rows = 16; // 16 rows * 16 bytes = 256 bytes per page

  const handlePrevPage = () => {
    setBaseAddr((prev) => Math.max(0, prev - 256));
  };

  const handleNextPage = () => {
    setBaseAddr((prev) => Math.min(65536 - 256, prev + 256));
  };

  const toHexByte = (b: number) => b.toString(16).toUpperCase().padStart(2, '0');
  const toHexWord = (w: number) => w.toString(16).toUpperCase().padStart(4, '0');

  const varList = Array.from(variables.values());
  const constList = Array.from(constants.entries());

  return (
    <div className="flex flex-col h-full bg-slate-950 font-mono text-slate-200 overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-xs text-slate-200 font-sans">Linear RAM & Variables</span>
          <span className="px-1.5 py-0.5 rounded text-[11px] bg-slate-800 text-emerald-400 border border-slate-700">
            64 KB Address Space
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div>
            <span className="text-slate-500">HERE:</span>{' '}
            <span className="text-amber-400 font-bold font-mono">0x{toHexWord(here)} ({here})</span>
          </div>
        </div>
      </div>

      {/* Variables and Constants Bar */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 space-y-2">
        <div className="text-xs font-semibold text-slate-300 font-sans flex items-center gap-1.5">
          <span>Active Variables & Constants</span>
          <span className="text-[11px] text-slate-500 font-normal">
            ({varList.length} vars, {constList.length} consts)
          </span>
        </div>

        {varList.length === 0 && constList.length === 0 ? (
          <div className="text-xs text-slate-500 font-sans py-1">
            No variables or constants declared yet. Use <span className="text-emerald-400 font-mono">VARIABLE NAME</span> or <span className="text-emerald-400 font-mono">VAL CONSTANT NAME</span>.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-28 overflow-y-auto">
            {varList.map((v) => (
              <div
                key={v.name}
                onClick={() => setBaseAddr(v.address & ~0xF)}
                className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs"
                title={`Click to jump memory view to address ${v.address}`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-emerald-400 font-bold">{v.name}</span>
                  <span className="text-slate-500 text-[10px]">(&amp;{v.address})</span>
                </div>
                <div className="text-slate-200 font-bold tabular-nums">
                  {v.value}
                </div>
              </div>
            ))}

            {constList.map(([name, val]) => (
              <div
                key={name}
                className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 font-bold">{name}</span>
                  <span className="text-slate-500 text-[10px]">(const)</span>
                </div>
                <div className="text-slate-200 font-bold tabular-nums">
                  {val}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hex Dump Controls */}
      <div className="px-3 py-2 bg-slate-950 flex items-center justify-between border-b border-slate-800/80 text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-sans">View Range:</span>
          <span className="text-emerald-400 font-bold">
            0x{toHexWord(baseAddr)} - 0x{toHexWord(baseAddr + 255)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setBaseAddr(0)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
          >
            0x0000
          </button>
          <button
            onClick={() => setBaseAddr(1024)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
          >
            0x0400 (Vars)
          </button>
          <button
            onClick={() => setBaseAddr(here & ~0xF)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
          >
            HERE
          </button>
          <button
            onClick={handlePrevPage}
            disabled={baseAddr <= 0}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-[11px]"
          >
            Prev
          </button>
          <button
            onClick={handleNextPage}
            disabled={baseAddr >= 65536 - 256}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-[11px]"
          >
            Next
          </button>
        </div>
      </div>

      {/* Hex Dump Table */}
      <div className="flex-1 overflow-auto p-3 text-[11px] leading-5 font-mono">
        <div className="min-w-[540px]">
          {/* Header Row */}
          <div className="flex items-center text-slate-500 border-b border-slate-900 pb-1 mb-1">
            <span className="w-16 shrink-0">Offset</span>
            <div className="flex gap-1.5 shrink-0 w-72">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className="w-4 text-center">
                  {i.toString(16).toUpperCase()}
                </span>
              ))}
            </div>
            <span className="pl-4 text-slate-500">ASCII</span>
          </div>

          {/* Dump rows */}
          {Array.from({ length: rows }).map((_, rowIdx) => {
            const rowAddr = baseAddr + rowIdx * 16;
            if (rowAddr >= 65536) return null;

            const bytes = Array.from(memory.slice(rowAddr, rowAddr + 16));
            const isNearHere = here >= rowAddr && here < rowAddr + 16;

            return (
              <div
                key={rowAddr}
                className={`flex items-center hover:bg-slate-900/60 rounded px-1 transition-colors ${
                  isNearHere ? 'bg-amber-950/20' : ''
                }`}
              >
                {/* Offset */}
                <span className="w-16 shrink-0 text-slate-500 tabular-nums">
                  0x{toHexWord(rowAddr)}
                </span>

                {/* Hex Bytes */}
                <div className="flex gap-1.5 shrink-0 w-72 tabular-nums">
                  {bytes.map((b, byteIdx) => {
                    const currentAddr = rowAddr + byteIdx;
                    const isHere = currentAddr === here;

                    return (
                      <span
                        key={byteIdx}
                        className={`w-4 text-center ${
                          isHere
                            ? 'text-amber-400 font-bold underline'
                            : b === 0
                            ? 'text-slate-700'
                            : 'text-slate-300'
                        }`}
                        title={`Address: 0x${toHexWord(currentAddr)} (${currentAddr}) = ${b}`}
                      >
                        {toHexByte(b)}
                      </span>
                    );
                  })}
                </div>

                {/* ASCII */}
                <span className="pl-4 text-slate-400 tracking-widest tabular-nums">
                  {bytes.map((b, idx) => {
                    const ch = b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
                    return <span key={idx}>{ch}</span>;
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
