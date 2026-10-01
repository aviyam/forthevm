import React, { useState } from 'react';
import { Layers, Plus, ArrowDown, RotateCcw, Activity, ArrowUpRight } from 'lucide-react';
import { LoopFrame } from '../forth/types.ts';

interface StackVisualizerProps {
  dataStack: number[];
  returnStack: (number | LoopFrame)[];
  cycles: number;
  maxStackDepth: number;
  executionTimeMs: number;
  onPushValue: (val: number) => void;
  onClearStack: () => void;
  onExecuteWord: (word: string) => void;
  lastChangedIndex: number | null;
}

export const StackVisualizer: React.FC<StackVisualizerProps> = ({
  dataStack,
  returnStack,
  cycles,
  maxStackDepth,
  executionTimeMs,
  onPushValue,
  onClearStack,
  onExecuteWord,
  lastChangedIndex,
}) => {
  const [manualInput, setManualInput] = useState('');

  const handleManualPush = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(manualInput.trim(), 10);
    if (!isNaN(val)) {
      onPushValue(val);
      setManualInput('');
    }
  };

  // Convert number to 32-bit hex
  const toHex = (n: number) => {
    const unsigned = (n >>> 0).toString(16).toUpperCase().padStart(8, '0');
    return `0x${unsigned}`;
  };

  // Format printable ASCII
  const toAscii = (n: number) => {
    if (n >= 32 && n <= 126) {
      return `'${String.fromCharCode(n)}'`;
    }
    return null;
  };

  // Stack is displayed with TOS on top (reverse of array)
  const reversedStack = [...dataStack].map((val, originalIdx) => ({
    val,
    depthFromTop: dataStack.length - 1 - originalIdx,
    originalIdx,
  })).reverse();

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans text-slate-200 overflow-hidden">
      {/* Visualizer Top Bar & Telemetry Stats */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-xs text-slate-200">Data Stack</span>
          <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
            {dataStack.length} {dataStack.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono tabular-nums">
          <div title="Execution Cycles">
            <span className="text-slate-500">Cycles:</span>{' '}
            <span className="text-slate-200">{cycles.toLocaleString()}</span>
          </div>
          <div title="Peak Stack Depth">
            <span className="text-slate-500">Peak:</span>{' '}
            <span className="text-slate-200">{maxStackDepth}</span>
          </div>
          {dataStack.length > 0 && (
            <button
              onClick={onClearStack}
              className="text-slate-500 hover:text-rose-400 transition-colors ml-1"
              title="Clear Stack"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Stack Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {dataStack.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-600">
              <Layers className="w-6 h-6" />
            </div>
            <div className="text-sm font-medium text-slate-400 mb-1">Data Stack is Empty</div>
            <p className="text-xs max-w-xs text-slate-500 mb-4">
              Forth uses a Last-In, First-Out (LIFO) stack. Push values or run Forth words to see items appear here in real-time.
            </p>

            {/* Quick Starter Actions */}
            <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
              <button
                onClick={() => onPushValue(42)}
                className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded transition-colors"
              >
                Push 42
              </button>
              <button
                onClick={() => {
                  onPushValue(10);
                  onPushValue(20);
                }}
                className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded transition-colors"
              >
                Push 10 & 20
              </button>
              <button
                onClick={() => onExecuteWord('10 20 +')}
                className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-emerald-400 rounded transition-colors"
              >
                Run 10 20 +
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {reversedStack.map((item, i) => {
              const isTos = item.depthFromTop === 0;
              const isNos = item.depthFromTop === 1;
              const ascii = toAscii(item.val);
              const isRecent = item.originalIdx === lastChangedIndex;

              return (
                <div
                  key={item.originalIdx}
                  className={`relative p-2.5 rounded-lg border transition-all duration-200 ${
                    isTos
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-950/30'
                      : isNos
                      ? 'bg-slate-900/90 border-slate-700/80'
                      : 'bg-slate-900/50 border-slate-800/80'
                  } ${isRecent ? 'ring-1 ring-emerald-400/50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {isTos ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950 font-mono tracking-tight">
                          TOS (Top)
                        </span>
                      ) : isNos ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 font-mono">
                          NOS (Next)
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">
                          depth: {item.depthFromTop}
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-slate-600">
                        cell #{item.originalIdx}
                      </span>
                    </div>

                    {ascii && (
                      <span className="text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-800/50 px-1.5 py-0.2 rounded">
                        char {ascii}
                      </span>
                    )}
                  </div>

                  {/* Values */}
                  <div className="flex items-baseline justify-between">
                    {/* Decimal Large Value */}
                    <div className="font-mono text-lg font-bold tabular-nums text-slate-100 tracking-tight">
                      {item.val.toLocaleString()}
                    </div>

                    {/* Hex & Binary Representation */}
                    <div className="text-right font-mono text-[11px] text-slate-400 tabular-nums">
                      <div>{toHex(item.val)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stack Manipulations Bar */}
      {dataStack.length > 0 && (
        <div className="p-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-1 overflow-x-auto text-[11px] font-mono select-none">
          <span className="text-slate-500 font-sans text-[10px] shrink-0">Ops:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onExecuteWord('DUP')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Duplicate top item"
            >
              DUP
            </button>
            <button
              onClick={() => onExecuteWord('DROP')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Drop top item"
            >
              DROP
            </button>
            <button
              onClick={() => onExecuteWord('SWAP')}
              disabled={dataStack.length < 2}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition-colors"
              title="Swap top two items"
            >
              SWAP
            </button>
            <button
              onClick={() => onExecuteWord('OVER')}
              disabled={dataStack.length < 2}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition-colors"
              title="Copy second item to top"
            >
              OVER
            </button>
            <button
              onClick={() => onExecuteWord('+')}
              disabled={dataStack.length < 2}
              className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/60 text-emerald-300 transition-colors"
              title="Add top two"
            >
              +
            </button>
            <button
              onClick={() => onExecuteWord('*')}
              disabled={dataStack.length < 2}
              className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/60 text-emerald-300 transition-colors"
              title="Multiply top two"
            >
              *
            </button>
          </div>
        </div>
      )}

      {/* Manual Push Input */}
      <form onSubmit={handleManualPush} className="p-2 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5">
        <input
          type="number"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Push integer to stack..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={!manualInput.trim()}
          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Push</span>
        </button>
      </form>

      {/* Return Stack (RS) Frame Tray */}
      {returnStack.length > 0 && (
        <div className="border-t border-slate-800 bg-slate-950/90 p-2.5 max-h-36 overflow-y-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 font-mono">
              Return Stack (R-Stack)
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {returnStack.length} {returnStack.length === 1 ? 'frame' : 'frames'}
            </span>
          </div>

          <div className="space-y-1">
            {returnStack.map((frame, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800 font-mono text-xs"
              >
                {typeof frame === 'number' ? (
                  <>
                    <span className="text-slate-400">Return IP:</span>
                    <span className="text-sky-400 font-bold">#{frame}</span>
                  </>
                ) : (
                  <>
                    <span className="text-amber-400">DO...LOOP:</span>
                    <span className="text-slate-300">
                      idx: <span className="text-emerald-400 font-bold">{frame.index}</span> / lim: {frame.limit}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
