/**
 * Forth Virtual Machine & Stack Machine Types
 */

export enum Opcode {
  // Literals & Stack
  PUSH = 'PUSH',           // Push operand to data stack
  DUP = 'DUP',             // ( x -- x x )
  QDUP = 'QDUP',           // ?DUP ( x -- 0 | x x )
  DROP = 'DROP',           // ( x -- )
  SWAP = 'SWAP',           // ( x1 x2 -- x2 x1 )
  OVER = 'OVER',           // ( x1 x2 -- x1 x2 x1 )
  ROT = 'ROT',             // ( x1 x2 x3 -- x2 x3 x1 )
  MROT = 'MROT',           // -ROT ( x1 x2 x3 -- x3 x1 x2 )
  TWODUP = 'TWODUP',       // 2DUP ( x1 x2 -- x1 x2 x1 x2 )
  TWODROP = 'TWODROP',     // 2DROP ( x1 x2 -- )
  TWOSWAP = 'TWOSWAP',     // 2SWAP ( x1 x2 x3 x4 -- x3 x4 x1 x2 )
  NIP = 'NIP',             // ( x1 x2 -- x2 )
  TUCK = 'TUCK',           // ( x1 x2 -- x2 x1 x2 )
  DEPTH = 'DEPTH',         // ( -- n )
  CLEAR = 'CLEAR',         // Clear data stack

  // Arithmetic & Math
  ADD = 'ADD',             // ( n1 n2 -- n3 ) +
  SUB = 'SUB',             // ( n1 n2 -- n3 ) -
  MUL = 'MUL',             // ( n1 n2 -- n3 ) *
  DIV = 'DIV',             // ( n1 n2 -- n3 ) /
  MOD = 'MOD',             // ( n1 n2 -- rem ) MOD
  DIVMOD = 'DIVMOD',       // ( n1 n2 -- rem quot ) /MOD
  NEG = 'NEG',             // ( n -- -n ) NEGATE
  ABS = 'ABS',             // ( n -- |n| ) ABS
  MIN = 'MIN',             // ( n1 n2 -- min ) MIN
  MAX = 'MAX',             // ( n1 n2 -- max ) MAX
  INC = 'INC',             // ( n -- n+1 ) 1+
  DEC = 'DEC',             // ( n -- n-1 ) 1-
  TWOMUL = 'TWOMUL',       // ( n -- n*2 ) 2*
  TWODIV = 'TWODIV',       // ( n -- n/2 ) 2/
  SQRT = 'SQRT',           // ( n -- sqrt(n) )
  POW = 'POW',             // ( base exp -- res )

  // Comparison & Logic
  EQ = 'EQ',               // ( x1 x2 -- flag ) =
  NEQ = 'NEQ',             // ( x1 x2 -- flag ) <>
  LT = 'LT',               // ( n1 n2 -- flag ) <
  GT = 'GT',               // ( n1 n2 -- flag ) >
  LTE = 'LTE',             // ( n1 n2 -- flag ) <=
  GTE = 'GTE',             // ( n1 n2 -- flag ) >=
  ZEQ = 'ZEQ',             // ( x -- flag ) 0=
  ZLT = 'ZLT',             // ( n -- flag ) 0<
  ZGT = 'ZGT',             // ( n -- flag ) 0>
  AND = 'AND',             // ( x1 x2 -- x3 ) AND
  OR = 'OR',               // ( x1 x2 -- x3 ) OR
  XOR = 'XOR',             // ( x1 x2 -- x3 ) XOR
  INVERT = 'INVERT',       // ( x -- ~x ) INVERT
  TRUE = 'TRUE',           // ( -- -1 )
  FALSE = 'FALSE',         // ( -- 0 )

  // Return Stack
  TO_R = 'TO_R',           // >R ( x -- ) (R: -- x)
  FROM_R = 'FROM_R',       // R> ( -- x ) (R: x -- )
  FETCH_R = 'FETCH_R',     // R@ ( -- x ) (R: x -- x)

  // Memory & Variables
  LOAD = 'LOAD',           // @ ( a-addr -- x )
  STORE = 'STORE',         // ! ( x a-addr -- )
  ADD_STORE = 'ADD_STORE', // +! ( n a-addr -- )
  FETCH_PRINT = 'FETCH_PRINT', // ? ( a-addr -- )
  C_LOAD = 'C_LOAD',       // C@ ( c-addr -- char )
  C_STORE = 'C_STORE',     // C! ( char c-addr -- )
  ALLOT = 'ALLOT',         // ALLOT ( n -- )
  HERE = 'HERE',           // HERE ( -- addr )
  PAD = 'PAD',             // PAD ( -- addr )

  // Control Flow
  JUMP = 'JUMP',           // Unconditional jump to arg (instruction index)
  JUMP_IF_ZERO = 'JUMP_IF_ZERO', // Jump if TOS == 0 (pop TOS)
  JUMP_IF_NOT_ZERO = 'JUMP_IF_NOT_ZERO', // Jump if TOS != 0 (pop TOS)
  DO_INIT = 'DO_INIT',     // DO ( limit index -- ) (R: -- limit index)
  LOOP = 'LOOP',           // LOOP (R: limit index -- limit index+1 | )
  LOOP_PLUS = 'LOOP_PLUS', // +LOOP ( n -- ) (R: limit index -- limit index+n | )
  I_INDEX = 'I_INDEX',     // I ( -- index )
  J_INDEX = 'J_INDEX',     // J ( -- outer_index )
  CALL = 'CALL',           // Call word at instruction index
  RET = 'RET',             // Return from word
  HALT = 'HALT',           // Stop execution

  // I/O & System
  DOT = 'DOT',             // . ( n -- ) prints TOS with space
  UDOT = 'UDOT',           // U. ( u -- ) unsigned print
  DOT_S = 'DOT_S',         // .S ( -- ) non-destructive print stack
  CR = 'CR',               // CR ( -- ) carriage return
  EMIT = 'EMIT',           // EMIT ( char -- ) prints char
  SPACE = 'SPACE',         // SPACE ( -- ) prints single space
  SPACES = 'SPACES',       // SPACES ( n -- ) prints n spaces
  PRINT_STR = 'PRINT_STR', // ." string" (prints inline string)
  TYPE = 'TYPE',           // TYPE ( c-addr u -- ) prints string from memory
  PAGE = 'PAGE',           // PAGE (clear console)
  TICKS = 'TICKS',         // TICKS ( -- ms )
}

export interface Instruction {
  id: number;
  op: Opcode;
  arg?: number | string;
  sourceWord?: string;
  line?: number;
  col?: number;
  comment?: string;
}

export interface WordMetadata {
  name: string;
  isPrimitive: boolean;
  isImmediate: boolean;
  stackEffect: string;
  category: string;
  summary: string;
  description: string;
  example: string;
  opcode?: Opcode;
  entryPoint?: number;
  sourceCode?: string;
}

export interface VariableInfo {
  name: string;
  address: number;
  value: number;
  isConstant: boolean;
}

export interface LoopFrame {
  limit: number;
  index: number;
}

export interface VMState {
  dataStack: number[];
  returnStack: (number | LoopFrame)[];
  ip: number;
  halted: boolean;
  paused: boolean;
  cycles: number;
  maxStackDepth: number;
  memory: Uint8Array;
  here: number;
  variables: Map<string, VariableInfo>;
  output: string[];
  executionTimeMs: number;
  error?: string;
}

export interface Token {
  text: string;
  line: number;
  col: number;
  isString?: boolean;
}
