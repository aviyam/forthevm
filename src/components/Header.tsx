import React, { useRef } from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  BookOpen,
  Layers,
  Cpu,
  Database,
  Download,
  Upload,
} from 'lucide-react';
import { PRESET_PROGRAMS, PresetProgram } from '../forth/presets.ts';

interface HeaderProps {
  onRun: () => void;
  onStep: () => void;
  onPause: () => void;
  onReset: () => void;
  isRunning: boolean;
  isPaused: boolean;
  canStep: boolean;
  selectedPresetId: string;
  onSelectPreset: (preset: PresetProgram) => void;
  activeTab: 'visualizer' | 'bytecode' | 'memory' | 'docs';
  setActiveTab: (tab: 'visualizer' | 'bytecode' | 'memory' | 'docs') => void;
  onSaveFile: () => void;
  onUploadFile: (file: File) => void;
  stepSpeed: number;
  setStepSpeed: (speed: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRun,
  onStep,
  onPause,
  onReset,
  isRunning,
  isPaused,
  canStep,
  selectedPresetId,
  onSelectPreset,
  activeTab,
  setActiveTab,
  onSaveFile,
  onUploadFile,
  stepSpeed,
  setStepSpeed,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none shrink-0 z-20">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-base font-bold tracking-wider text-emerald-400">
            FORTH<span className="text-slate-300">.VM</span>
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">Stack Machine IDE</span>
        </div>

        {/* Preset Selector */}
        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800">
          <span className="text-xs text-slate-400">Preset:</span>
          <select
            value={selectedPresetId}
            onChange={(e) => {
              const preset = PRESET_PROGRAMS.find((p) => p.id === e.target.value);
              if (preset) onSelectPreset(preset);
            }}
            className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 px-2.5 py-1 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            {PRESET_PROGRAMS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Zone 2: Navigation Tabs & Speed Control */}
      <div className="flex items-center gap-2">
        {/* Speed Selector */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded px-2 py-1 text-xs text-slate-400 mr-2">
          <span>Speed:</span>
          <select
            value={stepSpeed}
            onChange={(e) => setStepSpeed(Number(e.target.value))}
            className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value={0} className="bg-slate-900">Instant</option>
            <option value={80} className="bg-slate-900">Fast (80ms)</option>
            <option value={200} className="bg-slate-900">Medium (200ms)</option>
            <option value={500} className="bg-slate-900">Slow (500ms)</option>
          </select>
        </div>

        {/* Views */}
        <div className="flex items-center bg-slate-950/70 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'visualizer'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Stack Visualizer</span>
          </button>

          <button
            onClick={() => setActiveTab('bytecode')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'bytecode'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Bytecode VM</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'memory'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>RAM & Memory</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'docs'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Dictionary Docs</span>
          </button>
        </div>
      </div>

      {/* Zone 3: File & Execution Actions */}
      <div className="flex items-center gap-2">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".fth,.fs,.4th,.forth,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          title="Upload / Open Forth source file (.fth, .fs)"
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded border border-slate-700 transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        <button
          onClick={onSaveFile}
          title="Save / Download Forth source file (.fth)"
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded border border-slate-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Save</span>
        </button>

        <button
          onClick={onReset}
          title="Reset Virtual Machine"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors ml-1"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onStep}
          disabled={!canStep}
          title="Step one instruction"
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border transition-colors ${
            canStep
              ? 'text-slate-200 bg-slate-800 hover:bg-slate-700 border-slate-700'
              : 'text-slate-600 bg-slate-900 border-slate-800 cursor-not-allowed'
          }`}
        >
          <StepForward className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Step</span>
        </button>

        {isRunning && stepSpeed > 0 ? (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded transition-colors shadow-sm"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={onRun}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
          </button>
        )}
      </div>
    </header>
  );
};

