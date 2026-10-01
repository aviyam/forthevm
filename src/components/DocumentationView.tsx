import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Terminal as TerminalIcon, Plus, Info, Terminal, Wrench, BookMarked } from 'lucide-react';
import { FORTH_DOCS, FORTH_CATEGORIES } from '../forth/docRegistry.ts';

interface DocumentationViewProps {
  onInsertExample: (snippet: string) => void;
  onExecuteExample: (snippet: string) => void;
  selectedWordName?: string | null;
}

type DocSection = 'dictionary' | 'about' | 'install' | 'usage';

export const DocumentationView: React.FC<DocumentationViewProps> = ({
  onInsertExample,
  onExecuteExample,
  selectedWordName,
}) => {
  const [activeSection, setActiveSection] = useState<DocSection>('dictionary');
  const [searchQuery, setSearchQuery] = useState(selectedWordName || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Update search and section if selectedWordName prop changes
  React.useEffect(() => {
    if (selectedWordName) {
      setActiveSection('dictionary');
      setSearchQuery(selectedWordName);
    }
  }, [selectedWordName]);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FORTH_DOCS.filter((doc) => {
      const matchCategory = selectedCategory === 'All' || doc.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchCategory) return false;

      if (!q) return true;
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.summary.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        doc.stackEffect.toLowerCase().includes(q) ||
        (doc.opcode && doc.opcode.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans text-slate-200 overflow-hidden">
      {/* Top Section Navigation */}
      <div className="px-3 pt-2.5 pb-2 bg-slate-900 border-b border-slate-800 space-y-2 select-none shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-xs text-slate-200">System Documentation</span>
          </div>

          <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSection('dictionary')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeSection === 'dictionary'
                  ? 'bg-slate-800 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Dictionary</span>
            </button>

            <button
              onClick={() => setActiveSection('about')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeSection === 'about'
                  ? 'bg-slate-800 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>About</span>
            </button>

            <button
              onClick={() => setActiveSection('install')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeSection === 'install'
                  ? 'bg-slate-800 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Install &amp; Run</span>
            </button>

            <button
              onClick={() => setActiveSection('usage')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeSection === 'usage'
                  ? 'bg-slate-800 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Usage Guide</span>
            </button>
          </div>
        </div>

        {/* Dictionary Sub-toolbar */}
        {activeSection === 'dictionary' && (
          <div className="space-y-2 pt-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keywords, stack effects, math ops (e.g. DUP, +, SWAP, IF)..."
                className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs">
              {FORTH_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-medium'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 text-xs leading-relaxed">
        {/* Section 1: Dictionary Reference */}
        {activeSection === 'dictionary' && (
          <div className="space-y-2">
            {filteredDocs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Info className="w-8 h-8 text-slate-700 mb-2" />
                <div className="text-sm font-medium text-slate-400 mb-1">No Matching Words Found</div>
                <p className="text-xs text-slate-500 max-w-xs">
                  Try searching for standard Forth primitives like DUP, SWAP, +, or select All.
                </p>
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <div
                  key={doc.name}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-mono text-base font-bold text-emerald-400 tracking-wide">
                        {doc.name}
                      </span>
                      <span className="font-mono text-xs text-amber-300/90 font-medium">
                        {doc.stackEffect}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 shrink-0">
                      {doc.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {doc.summary}
                  </p>

                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    {doc.description}
                  </p>

                  {doc.example && (
                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80 flex items-center justify-between gap-2">
                      <code className="font-mono text-xs text-slate-200 select-all overflow-x-auto whitespace-pre">
                        {doc.example}
                      </code>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onExecuteExample(doc.example)}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] transition-colors"
                          title="Run this example in the Terminal"
                        >
                          <TerminalIcon className="w-3 h-3" />
                          <span>Run</span>
                        </button>

                        <button
                          onClick={() => onInsertExample(doc.example)}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                          title="Insert into Forth editor"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Insert</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Section 2: About Document */}
        {activeSection === 'about' && (
          <div className="max-w-3xl space-y-4 text-slate-300">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1 font-sans">
                About ForthVM
              </h2>
              <p className="text-slate-400">
                ForthVM is an interactive interpreter, bytecode compiler, and virtual stack machine implementation of the Forth programming language for modern web environments.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                1. Architectural Principles
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li><strong className="text-white">Dual-Stack Execution Model:</strong> Separate Data (Parameter) Stack for arithmetic and parameters, and Return Stack for call frames and counted loop bounds.</li>
                <li><strong className="text-white">Linear Bytecode Pipeline:</strong> High-level Forth statements and colon definitions compile into dense opcode instructions with resolved jump targets.</li>
                <li><strong className="text-white">64 KB Memory Address Space:</strong> Typed linear byte memory supporting byte-level (8-bit) and cell-level (32-bit integer) reads and writes, user memory allocation (ALLOT), and pointer inspection (HERE, PAD).</li>
                <li><strong className="text-white">Extensible Dictionary:</strong> Primitives and user definitions coexist in a single unified dictionary namespace.</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                2. Real-Time Stack Visualizer
              </h3>
              <p className="text-slate-400">
                The visualizer monitors data stack mutations synchronously on every cycle. Stack cells present Top of Stack (TOS) and Next on Stack (NOS) indicators, decimal signed integers, 32-bit hexadecimal values, and printable ASCII decodes.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                3. Technical Specifications
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 block">Cell Size:</span>
                  <span className="text-slate-200">32-bit Signed Integer</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 block">Linear Memory:</span>
                  <span className="text-slate-200">65,536 Bytes (64 KB)</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 block">Execution Modes:</span>
                  <span className="text-slate-200">Step, Animated Timer, Instant Run</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 block">Language Target:</span>
                  <span className="text-slate-200">ANS Forth / Forth-83 Subset</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Install & Run Document */}
        {activeSection === 'install' && (
          <div className="max-w-3xl space-y-4 text-slate-300">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1 font-sans">
                Installation &amp; Execution Guide
              </h2>
              <p className="text-slate-400">
                Instructions for building, running, and deploying ForthVM in development, production, and containerized environments.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                1. Local Development
              </h3>
              <div className="space-y-1 font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200">
                <div className="text-slate-500"># Install project dependencies</div>
                <div>npm install</div>
                <div className="text-slate-500 pt-1"># Start local Vite development server on port 3000</div>
                <div>npm run dev</div>
                <div className="text-slate-500 pt-1"># Validate TypeScript types</div>
                <div>npm run lint</div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                2. Production Build
              </h3>
              <div className="space-y-1 font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200">
                <div className="text-slate-500"># Compile static assets to dist/ directory</div>
                <div>npm run build</div>
                <div className="text-slate-500 pt-1"># Preview production build locally</div>
                <div>npm run preview</div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                3. Docker Container Deployment
              </h3>
              <div className="space-y-1 font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200">
                <div className="text-slate-500"># Build multi-stage Alpine Nginx image</div>
                <div>docker build -t forth-vm:latest .</div>
                <div className="text-slate-500 pt-1"># Run container mapped to host port 8080</div>
                <div>docker run -d -p 8080:80 --name forth-vm forth-vm:latest</div>
                <div className="text-slate-500 pt-1"># Health verification</div>
                <div>curl -f http://localhost:8080/healthz</div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                4. Continuous Integration Pipeline
              </h3>
              <p className="text-slate-400">
                The repository includes a GitHub Actions configuration in <code className="font-mono text-emerald-400">.github/workflows/container-package.yml</code> that automates multi-platform image builds (linux/amd64, linux/arm64) and publication to GitHub Container Registry (ghcr.io).
              </p>
            </div>
          </div>
        )}

        {/* Section 4: Usage Guide Document */}
        {activeSection === 'usage' && (
          <div className="max-w-3xl space-y-4 text-slate-300">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1 font-sans">
                Forth Usage Guide
              </h2>
              <p className="text-slate-400">
                A structured reference manual covering syntax, stack mechanics, control structures, and developer tool features.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                1. Reverse Polish Notation (RPN)
              </h3>
              <p className="text-slate-300">
                In Forth, arguments precede their operation. To add 10 and 20, write:
              </p>
              <pre className="font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800 text-slate-200">
                10 20 + . \ Prints 30
              </pre>
            </div>

            <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                2. Defining Custom Words
              </h3>
              <p className="text-slate-300">
                Create new vocabulary words with the colon syntax <code className="font-mono text-emerald-400">: NAME ... ;</code>:
              </p>
              <pre className="font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800 text-slate-200">
{`: SQUARE ( n -- n^2 )
  DUP * ;

7 SQUARE . \\ Prints 49`}
              </pre>
            </div>

            <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                3. Control Flow Structures
              </h3>
              <div className="space-y-2 text-slate-300">
                <div>
                  <span className="font-bold text-white block mb-0.5">Conditional:</span>
                  <pre className="font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800 text-slate-200">
{`: TEST-ZERO ( n -- )
  0= IF ." Zero" ELSE ." Non-zero" THEN CR ;`}
                  </pre>
                </div>

                <div>
                  <span className="font-bold text-white block mb-0.5">Counted Loop (DO...LOOP):</span>
                  <pre className="font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800 text-slate-200">
{`: COUNT-FIVE ( -- )
  5 0 DO I . LOOP CR ; \\ Prints 0 1 2 3 4`}
                  </pre>
                </div>

                <div>
                  <span className="font-bold text-white block mb-0.5">While Loop:</span>
                  <pre className="font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800 text-slate-200">
{`: COUNTDOWN ( n -- )
  BEGIN DUP 0 > WHILE DUP . 1- REPEAT DROP CR ;`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                4. Variables &amp; Linear Memory
              </h3>
              <pre className="font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800 text-slate-200">
{`VARIABLE TOTAL
100 TOTAL !       \\ Store 100 at address
TOTAL @ .         \\ Fetch and print 100
25 TOTAL +!       \\ Add 25 in-place
TOTAL ?           \\ Fetch and display 125`}
              </pre>
            </div>

            <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                5. System Commands &amp; Shortcuts
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li><code className="font-mono text-emerald-400">Ctrl + Enter</code>: Compile and execute active editor buffer.</li>
                <li><code className="font-mono text-emerald-400">.S</code>: Non-destructively inspect stack contents.</li>
                <li><code className="font-mono text-emerald-400">WORDS</code>: List all compiled dictionary words.</li>
                <li><code className="font-mono text-emerald-400">SEE &lt;word&gt;</code>: Decompile a word and inspect its bytecode.</li>
                <li><code className="font-mono text-emerald-400">PAGE</code>: Clear the terminal console log.</li>
                <li><strong className="text-white">Save / Upload:</strong> Use the Save button to download <code className="font-mono text-slate-300">.fth</code> files, or Upload (and drag-and-drop) to open source files.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
