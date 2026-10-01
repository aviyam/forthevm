import React, { useRef, useState } from 'react';
import { Copy, Check, Trash2, FileCode, Download, Upload } from 'lucide-react';

interface EditorProps {
  code: string;
  onChange: (newCode: string) => void;
  onRun: () => void;
  filename: string;
  onSaveFile: () => void;
  onUploadFile: (file: File) => void;
}

export const Editor: React.FC<EditorProps> = ({
  code,
  onChange,
  onRun,
  filename,
  onSaveFile,
  onUploadFile,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lines = code.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleClear = () => {
    onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key inserts 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
    // Ctrl+Enter or Cmd+Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-full bg-slate-950 border-r border-slate-800 text-slate-200 relative"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".fth,.fs,.4th,.forth,.txt"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Editor Sub-header */}
      <div className="h-9 px-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-slate-200 font-mono">{filename}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500 font-mono text-[11px]">{lines.length} lines</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors text-[11px]"
            title="Upload / Open Forth File"
          >
            <Upload className="w-3 h-3 text-sky-400" />
            <span>Upload</span>
          </button>

          <button
            onClick={onSaveFile}
            className="flex items-center gap-1 px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors text-[11px]"
            title="Save Source to .fth File"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>Save</span>
          </button>

          <div className="w-px h-3.5 bg-slate-800 mx-0.5" />

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Copy Forth Source"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleClear}
            className="p-1 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            title="Clear Editor"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden relative font-mono text-[13px] leading-6">
        {/* Drag & Drop Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-30 bg-emerald-950/80 backdrop-blur-xs border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center pointer-events-none">
            <Upload className="w-8 h-8 text-emerald-400 animate-bounce mb-2" />
            <p className="text-sm font-semibold text-emerald-300">Drop Forth file here (.fth, .fs, .txt)</p>
          </div>
        )}

        {/* Line Numbers */}
        <div className="w-11 bg-slate-950/80 border-r border-slate-800/80 text-slate-600 select-none py-2 text-right pr-2.5 font-mono text-xs">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder="\ Enter Forth code here... e.g.:
\ : SQUARE DUP * ;
\ 5 SQUARE ."
          className="flex-1 bg-transparent p-2 text-slate-100 resize-none focus:outline-none font-mono text-[13px] leading-6 selection:bg-emerald-500/20 selection:text-white overflow-auto whitespace-pre"
        />
      </div>

      {/* Footer shortcut helper */}
      <div className="px-3 py-1 bg-slate-950 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 select-none">
        <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Ctrl+Enter</kbd> to run</span>
        <span className="text-slate-600">RPN (Reverse Polish Notation)</span>
      </div>
    </div>
  );
};
