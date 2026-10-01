/**
 * Forth Virtual Stack Machine
 */
import { Instruction, LoopFrame, Opcode, VariableInfo, VMState } from './types.ts';

export class ForthVM {
  public dataStack: number[] = [];
  public returnStack: (number | LoopFrame)[] = [];
  public memory: Uint8Array = new Uint8Array(65536); // 64KB linear address space
  public dataView: DataView;
  public here: number = 2048; // Heap allocation pointer
  public ip: number = 0; // Instruction pointer
  public instructions: Instruction[] = [];
  public halted: boolean = true;
  public paused: boolean = false;
  public cycles: number = 0;
  public maxStackDepth: number = 0;
  public output: string[] = [];
  public error: string | null = null;
  public executionTimeMs: number = 0;
  public lastChangedIndex: number | null = null;

  constructor() {
    this.dataView = new DataView(this.memory.buffer);
    this.reset();
  }

  public reset(preserveMemory: boolean = false) {
    this.dataStack = [];
    this.returnStack = [];
    this.ip = 0;
    this.halted = true;
    this.paused = false;
    this.cycles = 0;
    this.maxStackDepth = 0;
    this.output = [];
    this.error = null;
    this.executionTimeMs = 0;
    this.lastChangedIndex = null;

    if (!preserveMemory) {
      this.memory.fill(0);
      this.here = 2048;
    }
  }

  public loadProgram(instructions: Instruction[]) {
    this.instructions = instructions;
    this.ip = 0;
    this.halted = instructions.length === 0;
    this.paused = false;
    this.cycles = 0;
    this.maxStackDepth = this.dataStack.length;
    this.error = null;
    this.lastChangedIndex = null;
  }

  private push(val: number) {
    // 32-bit integer sign clamping
    const clamped = val | 0;
    this.dataStack.push(clamped);
    this.lastChangedIndex = this.dataStack.length - 1;
    if (this.dataStack.length > this.maxStackDepth) {
      this.maxStackDepth = this.dataStack.length;
    }
  }

  private pop(): number {
    if (this.dataStack.length === 0) {
      throw new Error(`Stack underflow at instruction ${this.ip}`);
    }
    const val = this.dataStack.pop()!;
    this.lastChangedIndex = this.dataStack.length;
    return val;
  }

  private peek(depthFromTop: number = 0): number {
    const idx = this.dataStack.length - 1 - depthFromTop;
    if (idx < 0) {
      throw new Error(`Stack underflow accessing depth ${depthFromTop}`);
    }
    return this.dataStack[idx];
  }

  /**
   * Execute one single instruction
   */
  public step(): boolean {
    if (this.halted || this.ip < 0 || this.ip >= this.instructions.length) {
      this.halted = true;
      return false;
    }

    const instr = this.instructions[this.ip];
    this.cycles++;

    try {
      this.executeInstruction(instr);
      return !this.halted;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.error = msg;
      this.output.push(`\n[ERROR: ${msg} in ${instr.sourceWord || instr.op} (IP: ${this.ip})]\n`);
      this.halted = true;
      return false;
    }
  }

  private executeInstruction(instr: Instruction) {
    let nextIp = this.ip + 1;

    switch (instr.op) {
      // --- Stack & Literals ---
      case Opcode.PUSH:
        this.push(Number(instr.arg));
        break;

      case Opcode.DUP: {
        const val = this.peek(0);
        this.push(val);
        break;
      }

      case Opcode.QDUP: {
        const val = this.peek(0);
        if (val !== 0) {
          this.push(val);
        }
        break;
      }

      case Opcode.DROP:
        this.pop();
        break;

      case Opcode.SWAP: {
        const b = this.pop();
        const a = this.pop();
        this.push(b);
        this.push(a);
        break;
      }

      case Opcode.OVER: {
        const val = this.peek(1);
        this.push(val);
        break;
      }

      case Opcode.ROT: {
        const c = this.pop();
        const b = this.pop();
        const a = this.pop();
        this.push(b);
        this.push(c);
        this.push(a);
        break;
      }

      case Opcode.MROT: {
        const c = this.pop();
        const b = this.pop();
        const a = this.pop();
        this.push(c);
        this.push(a);
        this.push(b);
        break;
      }

      case Opcode.TWODUP: {
        const b = this.peek(0);
        const a = this.peek(1);
        this.push(a);
        this.push(b);
        break;
      }

      case Opcode.TWODROP:
        this.pop();
        this.pop();
        break;

      case Opcode.TWOSWAP: {
        const d = this.pop();
        const c = this.pop();
        const b = this.pop();
        const a = this.pop();
        this.push(c);
        this.push(d);
        this.push(a);
        this.push(b);
        break;
      }

      case Opcode.NIP: {
        const b = this.pop();
        this.pop();
        this.push(b);
        break;
      }

      case Opcode.TUCK: {
        const b = this.pop();
        const a = this.pop();
        this.push(b);
        this.push(a);
        this.push(b);
        break;
      }

      case Opcode.DEPTH:
        this.push(this.dataStack.length);
        break;

      case Opcode.CLEAR:
        this.dataStack = [];
        this.lastChangedIndex = null;
        break;

      // --- Arithmetic & Math ---
      case Opcode.ADD: {
        const b = this.pop();
        const a = this.pop();
        this.push(a + b);
        break;
      }

      case Opcode.SUB: {
        const b = this.pop();
        const a = this.pop();
        this.push(a - b);
        break;
      }

      case Opcode.MUL: {
        const b = this.pop();
        const a = this.pop();
        this.push(Math.imul(a, b));
        break;
      }

      case Opcode.DIV: {
        const b = this.pop();
        const a = this.pop();
        if (b === 0) throw new Error('Division by zero');
        this.push(Math.trunc(a / b));
        break;
      }

      case Opcode.MOD: {
        const b = this.pop();
        const a = this.pop();
        if (b === 0) throw new Error('Division by zero');
        this.push(a % b);
        break;
      }

      case Opcode.DIVMOD: {
        const b = this.pop();
        const a = this.pop();
        if (b === 0) throw new Error('Division by zero');
        this.push(a % b);
        this.push(Math.trunc(a / b));
        break;
      }

      case Opcode.NEG:
        this.push(-this.pop());
        break;

      case Opcode.ABS:
        this.push(Math.abs(this.pop()));
        break;

      case Opcode.MIN: {
        const b = this.pop();
        const a = this.pop();
        this.push(Math.min(a, b));
        break;
      }

      case Opcode.MAX: {
        const b = this.pop();
        const a = this.pop();
        this.push(Math.max(a, b));
        break;
      }

      case Opcode.INC:
        this.push(this.pop() + 1);
        break;

      case Opcode.DEC:
        this.push(this.pop() - 1);
        break;

      case Opcode.TWOMUL:
        this.push(this.pop() << 1);
        break;

      case Opcode.TWODIV:
        this.push(this.pop() >> 1);
        break;

      case Opcode.SQRT: {
        const val = this.pop();
        this.push(Math.floor(Math.sqrt(Math.max(0, val))));
        break;
      }

      case Opcode.POW: {
        const exp = this.pop();
        const base = this.pop();
        this.push(Math.pow(base, exp) | 0);
        break;
      }

      // --- Logic & Comparison ---
      case Opcode.EQ: {
        const b = this.pop();
        const a = this.pop();
        this.push(a === b ? -1 : 0);
        break;
      }

      case Opcode.NEQ: {
        const b = this.pop();
        const a = this.pop();
        this.push(a !== b ? -1 : 0);
        break;
      }

      case Opcode.LT: {
        const b = this.pop();
        const a = this.pop();
        this.push(a < b ? -1 : 0);
        break;
      }

      case Opcode.GT: {
        const b = this.pop();
        const a = this.pop();
        this.push(a > b ? -1 : 0);
        break;
      }

      case Opcode.LTE: {
        const b = this.pop();
        const a = this.pop();
        this.push(a <= b ? -1 : 0);
        break;
      }

      case Opcode.GTE: {
        const b = this.pop();
        const a = this.pop();
        this.push(a >= b ? -1 : 0);
        break;
      }

      case Opcode.ZEQ:
        this.push(this.pop() === 0 ? -1 : 0);
        break;

      case Opcode.ZLT:
        this.push(this.pop() < 0 ? -1 : 0);
        break;

      case Opcode.ZGT:
        this.push(this.pop() > 0 ? -1 : 0);
        break;

      case Opcode.AND: {
        const b = this.pop();
        const a = this.pop();
        this.push(a & b);
        break;
      }

      case Opcode.OR: {
        const b = this.pop();
        const a = this.pop();
        this.push(a | b);
        break;
      }

      case Opcode.XOR: {
        const b = this.pop();
        const a = this.pop();
        this.push(a ^ b);
        break;
      }

      case Opcode.INVERT:
        this.push(~this.pop());
        break;

      case Opcode.TRUE:
        this.push(-1);
        break;

      case Opcode.FALSE:
        this.push(0);
        break;

      // --- Return Stack ---
      case Opcode.TO_R: {
        const val = this.pop();
        this.returnStack.push(val);
        break;
      }

      case Opcode.FROM_R: {
        if (this.returnStack.length === 0) throw new Error('Return stack underflow');
        const frame = this.returnStack.pop()!;
        if (typeof frame !== 'number') throw new Error('Invalid return stack item (loop frame)');
        this.push(frame);
        break;
      }

      case Opcode.FETCH_R: {
        if (this.returnStack.length === 0) throw new Error('Return stack underflow');
        const frame = this.returnStack[this.returnStack.length - 1];
        if (typeof frame !== 'number') throw new Error('Invalid return stack item (loop frame)');
        this.push(frame);
        break;
      }

      // --- Memory & Variables ---
      case Opcode.LOAD: {
        const addr = this.pop();
        if (addr < 0 || addr > 65532) throw new Error(`Memory access out of bounds: ${addr}`);
        this.push(this.dataView.getInt32(addr, true));
        break;
      }

      case Opcode.STORE: {
        const addr = this.pop();
        const val = this.pop();
        if (addr < 0 || addr > 65532) throw new Error(`Memory access out of bounds: ${addr}`);
        this.dataView.setInt32(addr, val, true);
        break;
      }

      case Opcode.ADD_STORE: {
        const addr = this.pop();
        const n = this.pop();
        if (addr < 0 || addr > 65532) throw new Error(`Memory access out of bounds: ${addr}`);
        const current = this.dataView.getInt32(addr, true);
        this.dataView.setInt32(addr, current + n, true);
        break;
      }

      case Opcode.FETCH_PRINT: {
        const addr = this.pop();
        if (addr < 0 || addr > 65532) throw new Error(`Memory access out of bounds: ${addr}`);
        const val = this.dataView.getInt32(addr, true);
        this.output.push(`${val} `);
        break;
      }

      case Opcode.C_LOAD: {
        const addr = this.pop();
        if (addr < 0 || addr >= 65536) throw new Error(`Memory access out of bounds: ${addr}`);
        this.push(this.memory[addr]);
        break;
      }

      case Opcode.C_STORE: {
        const addr = this.pop();
        const char = this.pop();
        if (addr < 0 || addr >= 65536) throw new Error(`Memory access out of bounds: ${addr}`);
        this.memory[addr] = char & 0xFF;
        break;
      }

      case Opcode.ALLOT: {
        const n = this.pop();
        this.here += n;
        break;
      }

      case Opcode.HERE:
        this.push(this.here);
        break;

      case Opcode.PAD:
        this.push(this.here + 1024);
        break;

      // --- Control Flow ---
      case Opcode.JUMP:
        nextIp = Number(instr.arg);
        break;

      case Opcode.JUMP_IF_ZERO: {
        const cond = this.pop();
        if (cond === 0) {
          nextIp = Number(instr.arg);
        }
        break;
      }

      case Opcode.JUMP_IF_NOT_ZERO: {
        const cond = this.pop();
        if (cond !== 0) {
          nextIp = Number(instr.arg);
        }
        break;
      }

      case Opcode.DO_INIT: {
        const start = this.pop();
        const limit = this.pop();
        this.returnStack.push({ limit, index: start });
        break;
      }

      case Opcode.LOOP: {
        if (this.returnStack.length === 0) throw new Error('Loop frame underflow');
        const frame = this.returnStack[this.returnStack.length - 1];
        if (typeof frame === 'number') throw new Error('Expected loop frame on return stack');

        frame.index++;
        if (frame.index < frame.limit) {
          nextIp = Number(instr.arg);
        } else {
          this.returnStack.pop();
        }
        break;
      }

      case Opcode.LOOP_PLUS: {
        if (this.returnStack.length === 0) throw new Error('Loop frame underflow');
        const frame = this.returnStack[this.returnStack.length - 1];
        if (typeof frame === 'number') throw new Error('Expected loop frame on return stack');

        const step = this.pop();
        const oldIndex = frame.index;
        frame.index += step;

        const terminated = step >= 0
          ? frame.index >= frame.limit
          : frame.index <= frame.limit;

        if (!terminated) {
          nextIp = Number(instr.arg);
        } else {
          this.returnStack.pop();
        }
        break;
      }

      case Opcode.I_INDEX: {
        // Look for innermost loop frame
        let found = false;
        for (let idx = this.returnStack.length - 1; idx >= 0; idx--) {
          const item = this.returnStack[idx];
          if (typeof item === 'object') {
            this.push(item.index);
            found = true;
            break;
          }
        }
        if (!found) throw new Error('I used outside of DO...LOOP');
        break;
      }

      case Opcode.J_INDEX: {
        // Look for second innermost loop frame
        let count = 0;
        let found = false;
        for (let idx = this.returnStack.length - 1; idx >= 0; idx--) {
          const item = this.returnStack[idx];
          if (typeof item === 'object') {
            count++;
            if (count === 2) {
              this.push(item.index);
              found = true;
              break;
            }
          }
        }
        if (!found) throw new Error('J used outside of nested DO...LOOP');
        break;
      }

      case Opcode.CALL: {
        // Push return address (current next instruction) to return stack
        this.returnStack.push(nextIp);
        nextIp = Number(instr.arg);
        break;
      }

      case Opcode.RET: {
        if (this.returnStack.length === 0) {
          // Finished main script
          this.halted = true;
          return;
        }
        const retAddr = this.returnStack.pop();
        if (typeof retAddr !== 'number') {
          throw new Error('Corrupted return stack on RET');
        }
        nextIp = retAddr;
        break;
      }

      case Opcode.HALT:
        this.halted = true;
        return;

      // --- I/O & System ---
      case Opcode.DOT: {
        const val = this.pop();
        this.output.push(`${val} `);
        break;
      }

      case Opcode.UDOT: {
        const val = this.pop() >>> 0;
        this.output.push(`${val} `);
        break;
      }

      case Opcode.DOT_S: {
        const depth = this.dataStack.length;
        const items = this.dataStack.join(' ');
        this.output.push(`<${depth}> ${items} `);
        break;
      }

      case Opcode.CR:
        this.output.push('\n');
        break;

      case Opcode.EMIT: {
        const code = this.pop();
        this.output.push(String.fromCharCode(code & 0xFF));
        break;
      }

      case Opcode.SPACE:
        this.output.push(' ');
        break;

      case Opcode.SPACES: {
        const n = this.pop();
        if (n > 0) {
          this.output.push(' '.repeat(Math.min(n, 1000)));
        }
        break;
      }

      case Opcode.PRINT_STR:
        this.output.push(String(instr.arg));
        break;

      case Opcode.TYPE: {
        const len = this.pop();
        const addr = this.pop();
        let str = '';
        for (let k = 0; k < len; k++) {
          str += String.fromCharCode(this.memory[addr + k]);
        }
        this.output.push(str);
        break;
      }

      case Opcode.PAGE:
        this.output = [];
        break;

      case Opcode.TICKS:
        this.push(Date.now() & 0x7FFFFFFF);
        break;

      default:
        throw new Error(`Unimplemented opcode: ${instr.op}`);
    }

    this.ip = nextIp;
    if (this.ip >= this.instructions.length) {
      this.halted = true;
    }
  }

  /**
   * Run VM continuously up to maxCycles to prevent browser freeze
   */
  public run(maxCycles: number = 10000000): { finished: boolean; cycles: number; executionTimeMs: number } {
    const startTime = performance.now();
    let count = 0;

    while (!this.halted && count < maxCycles) {
      count++;
      const ok = this.step();
      if (!ok) break;
    }

    const elapsed = performance.now() - startTime;
    this.executionTimeMs += elapsed;

    if (count >= maxCycles && !this.halted) {
      this.error = `Execution exceeded cycle limit (${maxCycles.toLocaleString()} cycles). Check for infinite loop.`;
      this.output.push(`\n[WARNING: Execution reached ${maxCycles.toLocaleString()} cycle limit]\n`);
      this.halted = true;
    }

    return {
      finished: this.halted,
      cycles: this.cycles,
      executionTimeMs: this.executionTimeMs,
    };
  }

  public getSnapshot(variablesMap?: Map<string, number>): VMState {
    const varInfos = new Map<string, VariableInfo>();
    if (variablesMap) {
      for (const [name, addr] of variablesMap.entries()) {
        const val = addr <= 65532 ? this.dataView.getInt32(addr, true) : 0;
        varInfos.set(name, {
          name,
          address: addr,
          value: val,
          isConstant: false,
        });
      }
    }

    return {
      dataStack: [...this.dataStack],
      returnStack: [...this.returnStack],
      ip: this.ip,
      halted: this.halted,
      paused: this.paused,
      cycles: this.cycles,
      maxStackDepth: this.maxStackDepth,
      memory: this.memory,
      here: this.here,
      variables: varInfos,
      output: [...this.output],
      executionTimeMs: this.executionTimeMs,
      error: this.error || undefined,
    };
  }
}
