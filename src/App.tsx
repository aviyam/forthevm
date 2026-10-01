/**
 * ForthVM - Interactive Forth Interpreter, Compiler & Custom Stack Machine
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { Editor } from './components/Editor.tsx';
import { Terminal } from './components/Terminal.tsx';
import { StackVisualizer } from './components/StackVisualizer.tsx';
import { BytecodeView } from './components/BytecodeView.tsx';
import { DocumentationView } from './components/DocumentationView.tsx';
import { MemoryView } from './components/MemoryView.tsx';
import { ForthCompiler } from './forth/compiler.ts';
import { ForthVM } from './forth/vm.ts';
import { PRESET_PROGRAMS, PresetProgram } from './forth/presets.ts';
import { Instruction, VMState } from './forth/types.ts';

export default function App() {
  const compilerRef = useRef<ForthCompiler>(new ForthCompiler());
  const vmRef = useRef<ForthVM>(new ForthVM());

  const [code, setCode] = useState<string>(PRESET_PROGRAMS[0].code);
  const [currentFilename, setCurrentFilename] = useState<string>(`${PRESET_PROGRAMS[0].id}.fth`);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_PROGRAMS[0].id);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'bytecode' | 'memory' | 'docs'>('visualizer');
  const [stepSpeed, setStepSpeed] = useState<number>(0); // 0 = Instant, >0 = animated ms
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [selectedDocWord, setSelectedDocWord] = useState<string | null>(null);

  // Pane Resizing State
  const [leftPaneWidth, setLeftPaneWidth] = useState<number>(50); // percentage (20% to 80%)
  const [terminalHeight, setTerminalHeight] = useState<number>(240); // pixels
  const [isDraggingH, setIsDraggingH] = useState<boolean>(false);
  const [isDraggingV, setIsDraggingV] = useState<boolean>(false);

  const mainContainerRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);

  // Resize Left/Right Pane (Horizontal splitter)
  const handlePointerDownH = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingH(true);

    const onPointerMove = (ev: PointerEvent) => {
      if (!mainContainerRef.current) return;
      const rect = mainContainerRef.current.getBoundingClientRect();
      const mouseX = ev.clientX - rect.left;
      const newPercent = (mouseX / rect.width) * 100;
      setLeftPaneWidth(Math.min(80, Math.max(20, newPercent)));
    };

    const onPointerUp = () => {
      setIsDraggingH(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Resize Editor/Terminal Pane (Vertical splitter)
  const handlePointerDownV = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingV(true);

    const onPointerMove = (ev: PointerEvent) => {
      if (!leftColRef.current) return;
      const rect = leftColRef.current.getBoundingClientRect();
      const newHeight = rect.bottom - ev.clientY;
      const maxHeight = rect.height - 100;
      setTerminalHeight(Math.min(maxHeight, Math.max(90, newHeight)));
    };

    const onPointerUp = () => {
      setIsDraggingV(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // VM Snapshot State for UI reactivity
  const [vmState, setVmState] = useState<VMState>(() => vmRef.current.getSnapshot());
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'Welcome to ForthVM - Interactive Forth Interpreter & Stack Machine.',
    'Click "Run" to compile and execute Forth code, or type commands below.',
  ]);

  const stepTimerRef = useRef<number | null>(null);

  // Sync snapshot
  const updateSnapshot = useCallback(() => {
    const snap = vmRef.current.getSnapshot(compilerRef.current.getVariables());
    setVmState(snap);
  }, []);

  // Compile editor code into VM
  const compileCurrentCode = useCallback((): boolean => {
    compilerRef.current.resetDictionary();
    const res = compilerRef.current.compile(code);

    if (res.error) {
      setTerminalOutput((prev) => [...prev, `[COMPILATION ERROR: ${res.error}]`]);
      return false;
    }

    setInstructions(res.instructions);
    vmRef.current.reset(false);
    vmRef.current.loadProgram(res.instructions);
    updateSnapshot();
    return true;
  }, [code, updateSnapshot]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (stepTimerRef.current !== null) {
        clearInterval(stepTimerRef.current);
      }
    };
  }, []);

  // Stop running timer
  const stopExecution = useCallback(() => {
    if (stepTimerRef.current !== null) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  // Run action
  const handleRun = useCallback(() => {
    stopExecution();

    const ok = compileCurrentCode();
    if (!ok) return;

    if (stepSpeed === 0) {
      // Instant execution
      const res = vmRef.current.run(500000);
      updateSnapshot();

      const newOut = vmRef.current.output.join('');
      if (newOut) {
        setTerminalOutput((prev) => [...prev, newOut, 'ok']);
      } else {
        setTerminalOutput((prev) => [...prev, 'ok']);
      }
      setIsRunning(false);
    } else {
      // Step-by-step timer execution
      setIsRunning(true);
      setIsPaused(false);

      stepTimerRef.current = window.setInterval(() => {
        const stillRunning = vmRef.current.step();
        updateSnapshot();

        if (!stillRunning) {
          stopExecution();
          const newOut = vmRef.current.output.join('');
          if (newOut) {
            setTerminalOutput((prev) => [...prev, newOut, 'ok']);
          }
        }
      }, stepSpeed);
    }
  }, [compileCurrentCode, stepSpeed, stopExecution, updateSnapshot]);

  // Pause action
  const handlePause = useCallback(() => {
    if (stepTimerRef.current !== null) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(true);
  }, []);

  // Single step action
  const handleStep = useCallback(() => {
    if (instructions.length === 0 || vmRef.current.halted) {
      compileCurrentCode();
    }

    const stillRunning = vmRef.current.step();
    updateSnapshot();

    if (!stillRunning) {
      setIsRunning(false);
      setIsPaused(false);
    }
  }, [instructions.length, compileCurrentCode, updateSnapshot]);

  // Reset VM
  const handleReset = useCallback(() => {
    stopExecution();
    compilerRef.current.resetDictionary();
    vmRef.current.reset(false);
    setInstructions([]);
    updateSnapshot();
    setTerminalOutput((prev) => [...prev, '[Virtual Machine Reset - Stack & Memory Cleared]']);
  }, [stopExecution, updateSnapshot]);

  // Save / Download Forth Source File
  const handleSaveFile = useCallback(() => {
    const filename = currentFilename.endsWith('.fth') || currentFilename.endsWith('.fs')
      ? currentFilename
      : `${currentFilename}.fth`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setTerminalOutput((prev) => [...prev, `[Saved source file: "${filename}"]`]);
  }, [code, currentFilename]);

  // Upload / Open Forth Source File
  const handleUploadFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        stopExecution();
        setCode(text);
        setCurrentFilename(file.name);
        setSelectedPresetId(''); // clear preset selection since custom file is active
        compilerRef.current.resetDictionary();
        vmRef.current.reset(false);
        setInstructions([]);
        updateSnapshot();
        setTerminalOutput((prev) => [
          ...prev,
          `[Uploaded and loaded file: "${file.name}" (${file.size.toLocaleString()} bytes)]`,
          'Ready. Click "Run" or "Step" to execute.',
        ]);
      }
    };
    reader.onerror = () => {
      setTerminalOutput((prev) => [...prev, `[ERROR: Could not read file "${file.name}"]`]);
    };
    reader.readAsText(file);
  }, [stopExecution, updateSnapshot]);

  // Execute single command line in REPL
  const handleExecuteLine = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setTerminalOutput((prev) => [...prev, `> ${trimmed}`]);

    // Handle SEE <word> special command
    const upper = trimmed.toUpperCase();
    if (upper.startsWith('SEE ')) {
      const targetWord = upper.slice(4).trim();
      const dict = compilerRef.current.getDictionary();
      const entry = dict.get(targetWord);
      if (entry) {
        let msg = `${entry.name} ${entry.stackEffect}\nCategory: ${entry.category}\n${entry.description}`;
        if (entry.sourceCode) {
          msg += `\nDefinition: ${entry.sourceCode}`;
        }
        if (entry.opcode) {
          msg += `\nNative Opcode: ${entry.opcode}`;
        }
        setTerminalOutput((prev) => [...prev, msg, 'ok']);
        setSelectedDocWord(targetWord);
      } else {
        setTerminalOutput((prev) => [...prev, `Word "${targetWord}" not found in dictionary.`]);
      }
      return;
    }

    // Handle WORDS command
    if (upper === 'WORDS') {
      const dict = compilerRef.current.getDictionary();
      const names = Array.from(dict.keys()).sort();
      setTerminalOutput((prev) => [
        ...prev,
        `Dictionary (${names.length} words):\n${names.join('  ')}`,
        'ok',
      ]);
      return;
    }

    // Compile line with current compiler state (preserving defined variables/words)
    const res = compilerRef.current.compile(trimmed);
    if (res.error) {
      setTerminalOutput((prev) => [...prev, `[ERROR: ${res.error}]`]);
      return;
    }

    // Load and execute in VM preserving current stack and memory
    const vm = vmRef.current;
    const oldOutLen = vm.output.length;

    vm.loadProgram(res.instructions);
    vm.run(100000);
    updateSnapshot();

    const newOutputs = vm.output.slice(oldOutLen).join('');
    if (newOutputs) {
      setTerminalOutput((prev) => [...prev, `${newOutputs} ok`]);
    } else {
      setTerminalOutput((prev) => [...prev, 'ok']);
    }
  }, [updateSnapshot]);

  // Manual Push to Stack
  const handlePushValue = (val: number) => {
    vmRef.current.dataStack.push(val | 0);
    updateSnapshot();
    setTerminalOutput((prev) => [...prev, `> ${val} (pushed to stack)`]);
  };

  // Clear Stack
  const handleClearStack = () => {
    vmRef.current.dataStack = [];
    updateSnapshot();
    setTerminalOutput((prev) => [...prev, '> CLEAR ok']);
  };

  // Preset Selection
  const handleSelectPreset = (preset: PresetProgram) => {
    stopExecution();
    setSelectedPresetId(preset.id);
    setCurrentFilename(`${preset.id}.fth`);
    setCode(preset.code);
    compilerRef.current.resetDictionary();
    vmRef.current.reset(false);
    setInstructions([]);
    updateSnapshot();
    setTerminalOutput((prev) => [
      ...prev,
      `[Loaded Preset: ${preset.title}]`,
      preset.description,
    ]);
  };

  // Insert snippet from docs into editor
  const handleInsertExample = (snippet: string) => {
    setCode((prev) => `${prev.trimEnd()}\n\n\\ Example:\n${snippet}\n`);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top Header */}
      <Header
        onRun={handleRun}
        onStep={handleStep}
        onPause={handlePause}
        onReset={handleReset}
        isRunning={isRunning}
        isPaused={isPaused}
        canStep={!isRunning}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSaveFile={handleSaveFile}
        onUploadFile={handleUploadFile}
        stepSpeed={stepSpeed}
        setStepSpeed={setStepSpeed}
      />

      {/* Main Split View */}
      <div
        ref={mainContainerRef}
        className={`flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 ${
          isDraggingH || isDraggingV ? 'select-none' : ''
        }`}
      >
        {/* Left Side: Editor (Top) & Interactive Terminal (Bottom) */}
        <div
          ref={leftColRef}
          style={{ width: `${leftPaneWidth}%` }}
          className="w-full md:w-auto flex flex-col h-1/2 md:h-full min-h-0 shrink-0"
        >
          {/* Editor Container */}
          <div className="flex-1 min-h-0">
            <Editor
              code={code}
              onChange={setCode}
              onRun={handleRun}
              filename={currentFilename}
              onSaveFile={handleSaveFile}
              onUploadFile={handleUploadFile}
            />
          </div>

          {/* Vertical Resize Handle (between Editor and Terminal) */}
          <div
            onPointerDown={handlePointerDownV}
            onDoubleClick={() => setTerminalHeight(240)}
            title="Drag to resize Terminal height (double-click to reset)"
            className={`h-2 bg-slate-900 hover:bg-emerald-500/30 border-t border-b border-slate-800 transition-colors cursor-row-resize flex items-center justify-center shrink-0 group ${
              isDraggingV ? 'bg-emerald-500/40 border-emerald-500/60' : ''
            }`}
          >
            <div
              className={`w-8 h-1 rounded-full transition-colors ${
                isDraggingV ? 'bg-emerald-400' : 'bg-slate-700 group-hover:bg-slate-400'
              }`}
            />
          </div>

          {/* Terminal / REPL Container */}
          <div
            style={{ height: `${terminalHeight}px` }}
            className="shrink-0 min-h-0"
          >
            <Terminal
              output={terminalOutput}
              onExecuteLine={handleExecuteLine}
              onClearOutput={() => setTerminalOutput([])}
              stackDepth={vmState.dataStack.length}
            />
          </div>
        </div>

        {/* Horizontal Resize Handle (between Left and Right Panes) */}
        <div
          onPointerDown={handlePointerDownH}
          onDoubleClick={() => setLeftPaneWidth(50)}
          title="Drag to resize panels (double-click to reset)"
          className={`hidden md:flex w-2 bg-slate-900 hover:bg-emerald-500/30 border-l border-r border-slate-800 transition-colors cursor-col-resize flex-col items-center justify-center shrink-0 group z-10 ${
            isDraggingH ? 'bg-emerald-500/40 border-emerald-500/60' : ''
          }`}
        >
          <div
            className={`h-8 w-1 rounded-full transition-colors ${
              isDraggingH ? 'bg-emerald-400' : 'bg-slate-700 group-hover:bg-slate-400'
            }`}
          />
        </div>

        {/* Right Side: Tabbed Views (Stack Visualizer, Bytecode VM, Memory, Docs) */}
        <div
          style={{ width: `${100 - leftPaneWidth}%` }}
          className="w-full md:w-auto flex-1 flex flex-col h-1/2 md:h-full bg-slate-950 min-h-0"
        >
          {activeTab === 'visualizer' && (
            <StackVisualizer
              dataStack={vmState.dataStack}
              returnStack={vmState.returnStack}
              cycles={vmState.cycles}
              maxStackDepth={vmState.maxStackDepth}
              executionTimeMs={vmState.executionTimeMs}
              onPushValue={handlePushValue}
              onClearStack={handleClearStack}
              onExecuteWord={handleExecuteLine}
              lastChangedIndex={vmRef.current.lastChangedIndex}
            />
          )}

          {activeTab === 'bytecode' && (
            <BytecodeView
              instructions={instructions}
              currentIp={vmState.ip}
              halted={vmState.halted}
              cycles={vmState.cycles}
              maxStackDepth={vmState.maxStackDepth}
              executionTimeMs={vmState.executionTimeMs}
              onStep={handleStep}
            />
          )}

          {activeTab === 'memory' && (
            <MemoryView
              memory={vmState.memory}
              here={vmState.here}
              variables={vmState.variables}
              constants={compilerRef.current.getConstants()}
            />
          )}

          {activeTab === 'docs' && (
            <DocumentationView
              onInsertExample={handleInsertExample}
              onExecuteExample={handleExecuteLine}
              selectedWordName={selectedDocWord}
            />
          )}
        </div>
      </div>
    </div>
  );
}
