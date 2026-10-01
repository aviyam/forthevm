/**
 * Forth Lexer & Bytecode Compiler
 */
import { Instruction, Opcode, Token, WordMetadata } from './types.ts';
import { FORTH_DOCS } from './docRegistry.ts';

export class ForthCompiler {
  private words: Map<string, WordMetadata> = new Map();
  private variables: Map<string, number> = new Map(); // name -> memory address
  private constants: Map<string, number> = new Map(); // name -> value
  private nextMemAddr: number = 1024; // User memory starts at 1024 (first 1KB reserved)

  constructor() {
    this.resetDictionary();
  }

  public resetDictionary() {
    this.words.clear();
    this.variables.clear();
    this.constants.clear();
    this.nextMemAddr = 1024;

    // Register primitive words from documentation
    for (const doc of FORTH_DOCS) {
      this.words.set(doc.name.toUpperCase(), { ...doc });
    }
  }

  public getDictionary(): Map<string, WordMetadata> {
    return this.words;
  }

  public getVariables(): Map<string, number> {
    return this.variables;
  }

  public getConstants(): Map<string, number> {
    return this.constants;
  }

  /**
   * Tokenize Forth source code respecting comments and strings
   */
  public tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    const lines = source.split('\n');

    let inParenComment = false;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      let col = 0;

      while (col < line.length) {
        // Skip leading whitespace
        while (col < line.length && /\s/.test(line[col])) {
          col++;
        }
        if (col >= line.length) break;

        // Check if inside multi-line paren comment
        if (inParenComment) {
          const closeParen = line.indexOf(')', col);
          if (closeParen !== -1) {
            inParenComment = false;
            col = closeParen + 1;
            continue;
          } else {
            // Whole line is comment
            break;
          }
        }

        // Line comment \
        if (line[col] === '\\' && (col + 1 >= line.length || /\s/.test(line[col + 1]))) {
          break; // Skip rest of line
        }

        // Paren comment (
        if (line[col] === '(' && (col + 1 >= line.length || /\s/.test(line[col + 1]))) {
          const closeParen = line.indexOf(')', col + 1);
          if (closeParen !== -1) {
            col = closeParen + 1;
            continue;
          } else {
            inParenComment = true;
            break;
          }
        }

        // String literal ." ... "
        if (line.slice(col, col + 2) === '."' && (col + 2 >= line.length || /\s/.test(line[col + 2]))) {
          const startCol = col;
          let strEnd = col + 2;
          while (strEnd < line.length && /\s/.test(line[strEnd])) {
            strEnd++;
          }
          const quotePos = line.indexOf('"', strEnd);
          if (quotePos !== -1) {
            const strContent = line.slice(strEnd, quotePos);
            tokens.push({
              text: '."',
              line: lineIdx + 1,
              col: startCol + 1,
            });
            tokens.push({
              text: strContent,
              line: lineIdx + 1,
              col: strEnd + 1,
              isString: true,
            });
            col = quotePos + 1;
            continue;
          }
        }

        // Standard token
        const startCol = col;
        while (col < line.length && !/\s/.test(line[col])) {
          col++;
        }
        const text = line.slice(startCol, col);
        tokens.push({
          text,
          line: lineIdx + 1,
          col: startCol + 1,
        });
      }
    }

    return tokens;
  }

  /**
   * Parse numeric literals (decimal, hex, binary)
   */
  private parseNumber(token: string): number | null {
    if (/^[+-]?\d+$/.test(token)) {
      return parseInt(token, 10);
    }
    // Hex: $1A or 0x1A
    if (/^\$[0-9a-fA-F]+$/.test(token)) {
      return parseInt(token.slice(1), 16);
    }
    if (/^0x[0-9a-fA-F]+$/i.test(token)) {
      return parseInt(token.slice(2), 16);
    }
    // Binary: %1010 or 0b1010
    if (/^%[01]+$/.test(token)) {
      return parseInt(token.slice(1), 2);
    }
    if (/^0b[01]+$/i.test(token)) {
      return parseInt(token.slice(2), 2);
    }
    return null;
  }

  /**
   * Compiles token stream into executable bytecode instructions
   */
  public compile(source: string): { instructions: Instruction[]; error?: string } {
    const tokens = this.tokenize(source);
    const instructions: Instruction[] = [];
    let instructionId = 0;

    const emit = (op: Opcode, arg?: number | string, sourceWord?: string, comment?: string): number => {
      const idx = instructions.length;
      instructions.push({
        id: instructionId++,
        op,
        arg,
        sourceWord,
        comment,
      });
      return idx;
    };

    // Control flow stacks for jump fixups
    interface ControlFrame {
      type: 'IF' | 'ELSE' | 'DO' | 'BEGIN' | 'WHILE';
      jumpAddr?: number;
      targetAddr?: number;
    }
    const controlStack: ControlFrame[] = [];

    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      const upper = token.text.toUpperCase();

      // String literal argument from ."
      if (token.isString) {
        emit(Opcode.PRINT_STR, token.text, '."', `"${token.text}"`);
        i++;
        continue;
      }

      // Check for Colon definition: `: NAME ... ;`
      if (upper === ':') {
        i++;
        if (i >= tokens.length) {
          return { instructions, error: 'Expected word name after :' };
        }
        const wordName = tokens[i].text.toUpperCase();
        i++;

        // Jump over the word definition so main execution doesn't fall through
        const skipJumpIdx = emit(Opcode.JUMP, 0, 'JUMP_OVER_DEF', `Skip definition of ${wordName}`);
        const wordEntryPoint = instructions.length;

        const wordTokens: Token[] = [];
        const localControlStack: ControlFrame[] = [];

        while (i < tokens.length && tokens[i].text !== ';') {
          const t = tokens[i];
          const wUpper = t.text.toUpperCase();

          if (t.isString) {
            emit(Opcode.PRINT_STR, t.text, '."', `"${t.text}"`);
            i++;
            continue;
          }

          if (wUpper === '."') {
            i++;
            if (i < tokens.length && tokens[i].isString) {
              emit(Opcode.PRINT_STR, tokens[i].text, '."', `"${tokens[i].text}"`);
            }
            i++;
            continue;
          }

          // Control flow inside word
          if (wUpper === 'IF') {
            const jumpIdx = emit(Opcode.JUMP_IF_ZERO, 0, 'IF', 'Jump to ELSE or THEN if false');
            localControlStack.push({ type: 'IF', jumpAddr: jumpIdx });
          } else if (wUpper === 'ELSE') {
            const ifFrame = localControlStack.pop();
            if (!ifFrame || ifFrame.type !== 'IF') {
              return { instructions, error: `Unmatched ELSE in ${wordName}` };
            }
            const elseJumpIdx = emit(Opcode.JUMP, 0, 'ELSE', 'Jump past THEN');
            // Resolve IF jump target to right after ELSE
            instructions[ifFrame.jumpAddr!].arg = instructions.length;
            localControlStack.push({ type: 'ELSE', jumpAddr: elseJumpIdx });
          } else if (wUpper === 'THEN') {
            const frame = localControlStack.pop();
            if (!frame || (frame.type !== 'IF' && frame.type !== 'ELSE')) {
              return { instructions, error: `Unmatched THEN in ${wordName}` };
            }
            instructions[frame.jumpAddr!].arg = instructions.length;
          } else if (wUpper === 'DO') {
            emit(Opcode.DO_INIT, undefined, 'DO', 'Push loop limit and index to RS');
            localControlStack.push({ type: 'DO', targetAddr: instructions.length });
          } else if (wUpper === 'LOOP') {
            const doFrame = localControlStack.pop();
            if (!doFrame || doFrame.type !== 'DO') {
              return { instructions, error: `Unmatched LOOP in ${wordName}` };
            }
            emit(Opcode.LOOP, doFrame.targetAddr, 'LOOP', `Loop back to instruction #${doFrame.targetAddr}`);
          } else if (wUpper === '+LOOP') {
            const doFrame = localControlStack.pop();
            if (!doFrame || doFrame.type !== 'DO') {
              return { instructions, error: `Unmatched +LOOP in ${wordName}` };
            }
            emit(Opcode.LOOP_PLUS, doFrame.targetAddr, '+LOOP', `Step loop back to #${doFrame.targetAddr}`);
          } else if (wUpper === 'BEGIN') {
            localControlStack.push({ type: 'BEGIN', targetAddr: instructions.length });
          } else if (wUpper === 'UNTIL') {
            const beginFrame = localControlStack.pop();
            if (!beginFrame || beginFrame.type !== 'BEGIN') {
              return { instructions, error: `Unmatched UNTIL in ${wordName}` };
            }
            emit(Opcode.JUMP_IF_ZERO, beginFrame.targetAddr, 'UNTIL', `Loop to #${beginFrame.targetAddr} if false`);
          } else if (wUpper === 'AGAIN') {
            const beginFrame = localControlStack.pop();
            if (!beginFrame || beginFrame.type !== 'BEGIN') {
              return { instructions, error: `Unmatched AGAIN in ${wordName}` };
            }
            emit(Opcode.JUMP, beginFrame.targetAddr, 'AGAIN', `Loop to #${beginFrame.targetAddr}`);
          } else if (wUpper === 'WHILE') {
            const jumpIdx = emit(Opcode.JUMP_IF_ZERO, 0, 'WHILE', 'Exit loop if false');
            localControlStack.push({ type: 'WHILE', jumpAddr: jumpIdx });
          } else if (wUpper === 'REPEAT') {
            const whileFrame = localControlStack.pop();
            const beginFrame = localControlStack.pop();
            if (!whileFrame || whileFrame.type !== 'WHILE' || !beginFrame || beginFrame.type !== 'BEGIN') {
              return { instructions, error: `Unmatched REPEAT in ${wordName}` };
            }
            emit(Opcode.JUMP, beginFrame.targetAddr, 'REPEAT', `Repeat back to #${beginFrame.targetAddr}`);
            instructions[whileFrame.jumpAddr!].arg = instructions.length;
          } else {
            // General word or number
            const num = this.parseNumber(t.text);
            if (num !== null) {
              emit(Opcode.PUSH, num, t.text);
            } else if (this.constants.has(wUpper)) {
              emit(Opcode.PUSH, this.constants.get(wUpper)!, wUpper, `Constant ${wUpper}`);
            } else if (this.variables.has(wUpper)) {
              emit(Opcode.PUSH, this.variables.get(wUpper)!, wUpper, `Variable address &${wUpper}`);
            } else if (this.words.has(wUpper)) {
              const def = this.words.get(wUpper)!;
              if (def.isPrimitive && def.opcode) {
                emit(def.opcode, undefined, wUpper);
              } else if (def.entryPoint !== undefined) {
                emit(Opcode.CALL, def.entryPoint, wUpper, `Call ${wUpper}`);
              }
            } else {
              return { instructions, error: `Unknown word "${t.text}" at line ${t.line}` };
            }
          }

          wordTokens.push(t);
          i++;
        }

        if (i >= tokens.length || tokens[i].text !== ';') {
          return { instructions, error: `Definition for ${wordName} missing closing semicolon (;)` };
        }

        // End of word definition
        emit(Opcode.RET, undefined, ';', `Return from ${wordName}`);
        instructions[skipJumpIdx].arg = instructions.length;

        // Register word in dictionary
        this.words.set(wordName, {
          name: wordName,
          isPrimitive: false,
          isImmediate: false,
          category: 'User Defined',
          summary: `User defined word: ${wordName}`,
          description: `User defined Forth word created with ': ${wordName} ... ;'`,
          stackEffect: '( ... -- ... )',
          example: `${wordName}`,
          entryPoint: wordEntryPoint,
          sourceCode: `: ${wordName} ${wordTokens.map((t) => t.text).join(' ')} ;`,
        });

        i++; // skip ';'
        continue;
      }

      // VARIABLE definition: `VARIABLE NAME`
      if (upper === 'VARIABLE') {
        i++;
        if (i >= tokens.length) {
          return { instructions, error: 'Expected name after VARIABLE' };
        }
        const varName = tokens[i].text.toUpperCase();
        const addr = this.nextMemAddr;
        this.nextMemAddr += 4; // 32-bit cell
        this.variables.set(varName, addr);

        this.words.set(varName, {
          name: varName,
          isPrimitive: false,
          isImmediate: false,
          category: 'Memory',
          summary: `Variable ${varName} at address ${addr}`,
          description: `Pushes address of variable ${varName} (${addr})`,
          stackEffect: `( -- addr )`,
          example: `${varName} @ .`,
        });

        i++;
        continue;
      }

      // CONSTANT definition: `VALUE CONSTANT NAME`
      if (upper === 'CONSTANT') {
        // Need to have parsed the value just before
        i++;
        if (i >= tokens.length) {
          return { instructions, error: 'Expected name after CONSTANT' };
        }
        const constName = tokens[i].text.toUpperCase();

        // Check if previous instruction was PUSH
        const prev = instructions[instructions.length - 1];
        if (prev && prev.op === Opcode.PUSH && typeof prev.arg === 'number') {
          const val = prev.arg;
          instructions.pop(); // Remove push instruction
          this.constants.set(constName, val);

          this.words.set(constName, {
            name: constName,
            isPrimitive: false,
            isImmediate: false,
            category: 'Memory',
            summary: `Constant ${constName} = ${val}`,
            description: `Pushes constant value ${val}`,
            stackEffect: `( -- val )`,
            example: `${constName} .`,
          });
        } else {
          return { instructions, error: `CONSTANT ${constName} requires a literal value before it` };
        }

        i++;
        continue;
      }

      // Check for standalone control structures in immediate mode
      if (upper === 'IF') {
        const jumpIdx = emit(Opcode.JUMP_IF_ZERO, 0, 'IF');
        controlStack.push({ type: 'IF', jumpAddr: jumpIdx });
      } else if (upper === 'ELSE') {
        const ifFrame = controlStack.pop();
        if (!ifFrame || ifFrame.type !== 'IF') {
          return { instructions, error: 'Unmatched ELSE' };
        }
        const elseJumpIdx = emit(Opcode.JUMP, 0, 'ELSE');
        instructions[ifFrame.jumpAddr!].arg = instructions.length;
        controlStack.push({ type: 'ELSE', jumpAddr: elseJumpIdx });
      } else if (upper === 'THEN') {
        const frame = controlStack.pop();
        if (!frame || (frame.type !== 'IF' && frame.type !== 'ELSE')) {
          return { instructions, error: 'Unmatched THEN' };
        }
        instructions[frame.jumpAddr!].arg = instructions.length;
      } else if (upper === 'DO') {
        emit(Opcode.DO_INIT, undefined, 'DO');
        controlStack.push({ type: 'DO', targetAddr: instructions.length });
      } else if (upper === 'LOOP') {
        const doFrame = controlStack.pop();
        if (!doFrame || doFrame.type !== 'DO') {
          return { instructions, error: 'Unmatched LOOP' };
        }
        emit(Opcode.LOOP, doFrame.targetAddr, 'LOOP');
      } else if (upper === '+LOOP') {
        const doFrame = controlStack.pop();
        if (!doFrame || doFrame.type !== 'DO') {
          return { instructions, error: 'Unmatched +LOOP' };
        }
        emit(Opcode.LOOP_PLUS, doFrame.targetAddr, '+LOOP');
      } else if (upper === 'BEGIN') {
        controlStack.push({ type: 'BEGIN', targetAddr: instructions.length });
      } else if (upper === 'UNTIL') {
        const beginFrame = controlStack.pop();
        if (!beginFrame || beginFrame.type !== 'BEGIN') {
          return { instructions, error: 'Unmatched UNTIL' };
        }
        emit(Opcode.JUMP_IF_ZERO, beginFrame.targetAddr, 'UNTIL');
      } else if (upper === 'AGAIN') {
        const beginFrame = controlStack.pop();
        if (!beginFrame || beginFrame.type !== 'BEGIN') {
          return { instructions, error: 'Unmatched AGAIN' };
        }
        emit(Opcode.JUMP, beginFrame.targetAddr, 'AGAIN');
      } else if (upper === 'WHILE') {
        const jumpIdx = emit(Opcode.JUMP_IF_ZERO, 0, 'WHILE');
        controlStack.push({ type: 'WHILE', jumpAddr: jumpIdx });
      } else if (upper === 'REPEAT') {
        const whileFrame = controlStack.pop();
        const beginFrame = controlStack.pop();
        if (!whileFrame || whileFrame.type !== 'WHILE' || !beginFrame || beginFrame.type !== 'BEGIN') {
          return { instructions, error: 'Unmatched REPEAT' };
        }
        emit(Opcode.JUMP, beginFrame.targetAddr, 'REPEAT');
        instructions[whileFrame.jumpAddr!].arg = instructions.length;
      } else if (upper === '."') {
        i++;
        if (i < tokens.length && tokens[i].isString) {
          emit(Opcode.PRINT_STR, tokens[i].text, '."', `"${tokens[i].text}"`);
        }
        i++;
        continue;
      } else {
        // Number or Word
        const num = this.parseNumber(token.text);
        if (num !== null) {
          emit(Opcode.PUSH, num, token.text);
        } else if (this.constants.has(upper)) {
          emit(Opcode.PUSH, this.constants.get(upper)!, upper, `Constant ${upper}`);
        } else if (this.variables.has(upper)) {
          emit(Opcode.PUSH, this.variables.get(upper)!, upper, `Variable address &${upper}`);
        } else if (this.words.has(upper)) {
          const def = this.words.get(upper)!;
          if (def.isPrimitive && def.opcode) {
            emit(def.opcode, undefined, upper);
          } else if (def.entryPoint !== undefined) {
            emit(Opcode.CALL, def.entryPoint, upper, `Call ${upper}`);
          }
        } else {
          return { instructions, error: `Unknown word "${token.text}" at line ${token.line}` };
        }
      }

      i++;
    }

    if (controlStack.length > 0) {
      const unclosed = controlStack[controlStack.length - 1].type;
      return { instructions, error: `Unclosed control structure: ${unclosed}` };
    }

    // Terminate program with HALT
    emit(Opcode.HALT, undefined, 'HALT', 'End of program');

    return { instructions };
  }
}
