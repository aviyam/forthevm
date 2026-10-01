# ForthVM: Interactive Forth Interpreter & Virtual Stack Machine

ForthVM is a high-performance, browser-based interactive development environment (IDE) for the Forth programming language. It incorporates a custom stack machine virtual runtime, a real-time data and return stack visualizer, linear memory inspection, and an integrated documentation system.

---

## 1. About

### 1.1 Overview
Forth is an extensible, stack-based, procedural programming language developed by Charles H. Moore. ForthVM implements a compliant subset of the ANS Forth and Forth-83 standards, featuring both an interactive interpreter (read-eval-print loop) and a bytecode compiler that targets a custom virtual machine.

### 1.2 Architecture
The ForthVM execution pipeline comprises four primary subsystems:

1. **Lexical Analyzer & Tokenizer**:
   - Parses source text into tokens separated by whitespace.
   - Handles line comments (`\`), parenthetical block comments (`( ... )`), and string literals (`." ... "`).
   - Supports decimal integers, hexadecimal values (`$1A`, `0x1A`), and binary notation (`%1010`, `0b1010`).

2. **Bytecode Compiler**:
   - Translates high-level Forth words and colon definitions (`: NAME ... ;`) into linear stack machine instructions.
   - Resolves control-flow jump offsets for conditionals (`IF ... ELSE ... THEN`) and loops (`DO ... LOOP`, `+LOOP`, `BEGIN ... UNTIL`, `BEGIN ... WHILE ... REPEAT`) using a compile-time resolution stack.
   - Preserves user definitions in a dynamic dictionary symbol table.

3. **Virtual Stack Machine (VM)**:
   - **Data Stack (Parameter Stack)**: 32-bit signed integer stack operating under Last-In, First-Out (LIFO) discipline for all arithmetic, logical, and parameter operations.
   - **Return Stack**: Dedicated hardware-abstracted stack managing subroutine return addresses and loop frame state (index and limit counters).
   - **Linear Address Space (RAM)**: 64 KB typed byte buffer (`Uint8Array` / `DataView`) supporting cell-level (32-bit) and byte-level (8-bit) reads and writes, user memory allocation (`ALLOT`), and pointer inspection (`HERE`, `PAD`).
   - **Execution Engine**: Single-instruction stepper and synchronous runner with bounded cycle safeguards against runaway loops.

4. **Real-Time Stack Visualizer**:
   - Visual inspection of every cell currently residing on the data stack.
   - Explicit indicators for Top of Stack (TOS) and Next on Stack (NOS).
   - Multi-radix value representations: Decimal, 32-bit Hexadecimal, and ASCII printable character decode.
   - Change indicators highlighting recent stack modifications.
   - Dedicated return stack inspection displaying active loop parameters and call frames.

---

## 2. Install & Run

### 2.1 Prerequisites
- Node.js (version 18.0.0 or higher; version 20.x recommended)
- npm (version 9.0.0 or higher) or compatible package manager (bun, yarn, pnpm)
- Docker (optional, for containerized deployments)

### 2.2 Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/example/forth-vm.git
   cd forth-vm
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

4. Build for production:
   ```bash
   npm run build
   ```
   Compiled static production assets will be generated in the `dist/` directory.

5. Preview the production build locally:
   ```bash
   npm run preview
   ```

6. Run TypeScript validation:
   ```bash
   npm run lint
   ```

### 2.3 Container Deployment via Docker

A multi-stage `Dockerfile` is provided for containerized deployments using an Alpine Linux base with Nginx:

1. Build the Docker container image:
   ```bash
   docker build -t forth-vm:latest .
   ```

2. Run the container:
   ```bash
   docker run -d -p 8080:80 --name forth-vm forth-vm:latest
   ```
   The application is now accessible at `http://localhost:8080`.

3. Perform health check:
   ```bash
   curl -f http://localhost:8080/healthz
   ```

### 2.4 Continuous Integration & Delivery

A GitHub Actions workflow is pre-configured in `.github/workflows/container-package.yml`. It automatically:
- Builds multi-platform container images (`linux/amd64`, `linux/arm64`).
- Validates production compilation.
- Publishes tagged images to the GitHub Container Registry (`ghcr.io`).

---

## 3. Usage Guide

### 3.1 Reverse Polish Notation (RPN)
Forth utilizes postfix notation (Reverse Polish Notation). Operands are pushed onto the parameter stack first, followed by the operator:

```forth
\ Infix: 15 + 25
15 25 + .
\ Output: 40
```

The dot operator (`.`) pops the top value from the stack and prints it followed by a trailing space.

### 3.2 Stack Manipulation Primitives
Forth programs manage parameters directly on the stack rather than using local variables:

- `DUP` `( x -- x x )`: Duplicates the top stack item.
- `DROP` `( x -- )`: Discards the top stack item.
- `SWAP` `( x1 x2 -- x2 x1 )`: Exchanges the top two stack items.
- `OVER` `( x1 x2 -- x1 x2 x1 )`: Copies the second item to the top.
- `ROT` `( x1 x2 x3 -- x2 x3 x1 )`: Rotates the third item to the top.
- `-ROT` `( x1 x2 x3 -- x3 x1 x2 )`: Rotates the top item to the third position.
- `2DUP` `( x1 x2 -- x1 x2 x1 x2 )`: Duplicates the top pair.
- `NIP` `( x1 x2 -- x2 )`: Discards the second item.
- `TUCK` `( x1 x2 -- x2 x1 x2 )`: Copies the top item below the second item.
- `CLEAR`: Empties the entire parameter stack.
- `.S`: Displays stack contents non-destructively without popping values.

### 3.3 Defining Custom Words
New words are compiled into the dictionary using the colon definition syntax `: NAME ... ;`:

```forth
: SQUARE ( n -- n^2 )
  DUP *
;

7 SQUARE .
\ Output: 49
```

### 3.4 Control Flow Structures

#### Conditionals: IF ... ELSE ... THEN
Conditional execution tests the top stack item for zero (false) or non-zero (true):

```forth
: CHECK-SIGN ( n -- )
  0 > IF
    ." Positive"
  ELSE
    ." Non-positive"
  THEN
  CR
;

10 CHECK-SIGN
```

#### Counted Loops: DO ... LOOP
Loops through an index range (`limit start DO ... LOOP`). The current index is accessed using `I`:

```forth
: PRINT-SERIES ( -- )
  5 0 DO
    I .
  LOOP
  CR
;

PRINT-SERIES
\ Output: 0 1 2 3 4
```

Nested loops access the outer loop index via `J`. Increments of arbitrary step size are performed with `+LOOP`.

#### Indefinite Loops: BEGIN ... WHILE ... REPEAT
Pre-condition loops evaluate a condition flag before executing the loop body:

```forth
: GCD ( a b -- gcd )
  BEGIN
    DUP 0 <>
  WHILE
    TUCK MOD
  REPEAT
  DROP
;

48 18 GCD .
\ Output: 6
```

### 3.5 Memory and Variables
Variables allocate 32-bit storage cells in the linear RAM space:

```forth
VARIABLE COUNTER
10 COUNTER !       \ Store 10 at COUNTER address
COUNTER @ .        \ Fetch and print value (10)
5 COUNTER +!       \ Add 5 to value in memory
COUNTER ?          \ Fetch and display (15)
```

Byte-level access is provided through `C@` (fetch byte) and `C!` (store byte). Memory allocation pointers are managed through `ALLOT` and inspected with `HERE`.

### 3.6 Interactive Terminal and System Commands
- `> <command>`: Executes Forth statements immediately in the active VM context.
- `.S`: Non-destructively prints all values currently on the parameter stack.
- `WORDS`: Displays an alphabetical index of all words compiled in the dictionary.
- `SEE <word>`: Disassembles and decompiles the specified word, displaying its definition and underlying bytecode.
- `PAGE`: Clears the console output buffer.
- `Up / Down Arrows`: Navigates through previously executed command history.

### 3.7 File Management
- **Upload**: Click the **Upload** button in the header or editor sub-header (or drag-and-drop a file onto the editor) to open any `.fth`, `.fs`, `.4th`, or `.txt` Forth source file.
- **Save**: Click the **Save** button in the header or editor sub-header to download the current editor buffer to your local machine as a standard `.fth` file.

### 3.8 Keyboard Shortcuts
- `Ctrl + Enter` (or `Cmd + Enter`): Compile and run the current editor program.
- `Tab`: Indent by two spaces.
- `Enter` (in Terminal input): Execute command line.
- `Double-click Splitter`: Reset pane dimensions to default layout.
