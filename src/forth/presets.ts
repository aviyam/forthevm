/**
 * Pre-loaded Forth Example Programs
 */

export interface PresetProgram {
  id: string;
  title: string;
  category: string;
  description: string;
  code: string;
}

export const PRESET_PROGRAMS: PresetProgram[] = [
  {
    id: 'fibonacci',
    title: 'Fibonacci Sequence',
    category: 'Algorithms',
    description: 'Generates and prints the first 12 Fibonacci numbers using stack manipulation and a counted DO...LOOP.',
    code: `\\ Fibonacci Sequence in Forth
\\ Computes and prints the first 12 Fibonacci terms

: FIB ( n -- )
  ." Fibonacci Numbers:" CR
  0 1           \\ Initial two terms (a=0, b=1)
  ROT 0 DO
    OVER .      \\ Print current number
    TUCK +      \\ ( a b -- b a+b )
  LOOP
  2DROP CR
;

12 FIB
`,
  },
  {
    id: 'factorial',
    title: 'Factorial Calculator',
    category: 'Math',
    description: 'Computes n! (n factorial) iteratively using a loop and accumulator.',
    code: `\\ Factorial in Forth
\\ n! = n * (n-1) * ... * 1

: FACTORIAL ( n -- n! )
  DUP 1 <= IF
    DROP 1
  ELSE
    1 SWAP      \\ Accumulator on bottom: ( acc n )
    BEGIN
      DUP 1 >
    WHILE
      TUCK *    \\ acc = acc * n
      SWAP 1-   \\ n = n - 1
    REPEAT
    DROP        \\ Drop 0 counter
  THEN
;

." 5! = " 5 FACTORIAL . CR
." 7! = " 7 FACTORIAL . CR
." 10! = " 10 FACTORIAL . CR
`,
  },
  {
    id: 'gcd',
    title: 'Greatest Common Divisor (GCD)',
    category: 'Algorithms',
    description: 'Computes GCD of two numbers using the Euclidean algorithm and BEGIN...WHILE...REPEAT.',
    code: `\\ Euclidean Algorithm for Greatest Common Divisor
\\ ( a b -- gcd )

: GCD ( a b -- gcd )
  BEGIN
    DUP 0 <>
  WHILE
    TUCK MOD    \\ ( a b -- b a%b )
  REPEAT
  DROP          \\ Drop the 0 remainder
;

." GCD(48, 18) = " 48 18 GCD . CR
." GCD(105, 252) = " 105 252 GCD . CR
." GCD(17, 31) = " 17 31 GCD . CR
`,
  },
  {
    id: 'stack_gymnastics',
    title: 'Stack Operations Tutorial',
    category: 'Tutorial',
    description: 'Demonstrates core Forth stack operators (DUP, SWAP, OVER, ROT, TUCK, NIP) and inspects the stack using .S.',
    code: `\\ Interactive Stack Gymnastics
\\ Watch the real-time stack visualizer on the right!

PAGE
." Initial push: 10 20 30" CR
10 20 30
.S CR

." DUP (duplicates 30):" CR
DUP
.S CR

." SWAP (swaps top two):" CR
SWAP
.S CR

." OVER (copies 2nd item):" CR
OVER
.S CR

." ROT (rotates 3 items):" CR
ROT
.S CR

." CLEAR (empties stack):" CR
CLEAR
.S CR
`,
  },
  {
    id: 'collatz',
    title: 'Collatz Conjecture (3n + 1)',
    category: 'Math',
    description: 'Generates the Collatz hailstone trajectory for an input integer until reaching 1.',
    code: `\\ Collatz 3n + 1 Sequence
\\ Even: n / 2, Odd: 3n + 1

: COLLATZ-STEP ( n -- n' )
  DUP 2 MOD 0= IF
    2/
  ELSE
    3 * 1+
  THEN
;

: COLLATZ ( n -- )
  ." Hailstone path for " DUP . ." :" CR
  BEGIN
    DUP . SPACE
    DUP 1 >
  WHILE
    COLLATZ-STEP
  REPEAT
  CR ." Reached 1!" CR
;

19 COLLATZ
`,
  },
  {
    id: 'variables_memory',
    title: 'Memory & Variables',
    category: 'Memory',
    description: 'Demonstrates VARIABLE, CONSTANT, @ (fetch), ! (store), and +! (add store).',
    code: `\\ Forth Memory & Variables Demonstration

VARIABLE BALANCE
1000 BALANCE !   \\ Store 1000 in BALANCE

50 CONSTANT DEPOSIT-FEE

: DEPOSIT ( amount -- )
  DEPOSIT-FEE -
  BALANCE +!
  ." Balance updated. New balance: " BALANCE ? CR
;

." Initial balance: " BALANCE ? CR
250 DEPOSIT
500 DEPOSIT
`,
  },
  {
    id: 'patterns',
    title: 'ASCII Pyramid Art',
    category: 'Graphics',
    description: 'Generates an ASCII pyramid pattern using nested DO...LOOP and EMIT.',
    code: `\\ ASCII Pattern Generator
\\ Draws a centered pyramid

: STAR 42 EMIT ;   \\ ASCII 42 is '*'
: BLANK 32 EMIT ;  \\ ASCII 32 is ' '

: ROW ( row total -- )
  2DUP - 0 DO BLANK LOOP   \\ Leading spaces
  DROP
  0 DO STAR BLANK LOOP     \\ Star-space pairs
  CR
;

: PYRAMID ( height -- )
  DUP 1+ 1 DO
    I OVER ROW
  LOOP
  DROP
;

." Forth ASCII Art:" CR
7 PYRAMID
`,
  }
];
