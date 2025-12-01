namespace CVP {
  const CODE_IN_PROGRESS = 0b00;
  const CODE_DRAW = 0b01;
  const CODE_X = 0b10;
  const CODE_O = 0b11;

  const WIN_SCORE = 10000;
  const LOSS_SCORE = -10000;

  const WIN_MASKS: number[] = [
    0b000000111,
    0b000111000,
    0b111000000,
    0b001001001,
    0b010010010,
    0b100100100,
    0b100010001,
    0b001010100,
  ];

  // Evaluation weights (tuneable)
  const EVAL = {
    macroTwoInRow: 200,
    macroCenterWin: 40,
    macroCornerWin: 20,
    microOpenTwoWeight: 3,
  } as const;

  type SmallGridState = {
    grid: string[][];
    gridStatus: CVP.GridStatus;
  };

  type GameState = {
    grids: SmallGridState[];
    validGrids: number[];
  };

  // Simple transposition table
  const TT: Map<string, { depth: number; score: number }> = new Map();

  function encodeFromState(state: GameState): number {
    let encoded = 0;
    for (let i = 0; i < 9; i++) {
      const status = state.grids[i].gridStatus;
      let code = CODE_IN_PROGRESS;
      if (status === CVP.GridStatus.DRAW) code = CODE_DRAW;
      else if (status === CVP.GridStatus.X_WON) code = CODE_X;
      else if (status === CVP.GridStatus.O_WON) code = CODE_O;
      encoded |= (code & 0b11) << (i * 2);
    }
    return encoded;
  }

  function bitboardsFromEncoded(encoded: number): { xBits: number; oBits: number } {
    let xBits = 0;
    let oBits = 0;
    for (let i = 0; i < 9; i++) {
      const twoBits = (encoded >> (i * 2)) & 0b11;
      if (twoBits === CODE_X) xBits |= 1 << i;
      else if (twoBits === CODE_O) oBits |= 1 << i;
    }
    return { xBits, oBits };
  }

  function countWins(encoded: number): { xWins: number; oWins: number } {
    let xWins = 0;
    let oWins = 0;
    for (let i = 0; i < 9; i++) {
      const twoBits = (encoded >> (i * 2)) & 0b11;
      if (twoBits === CODE_X) xWins++;
      else if (twoBits === CODE_O) oWins++;
    }
    return { xWins, oWins };
  }

  function allBigGridsEnded(encoded: number): boolean {
    for (let i = 0; i < 9; i++) {
      const twoBits = (encoded >> (i * 2)) & 0b11;
      if (twoBits === CODE_IN_PROGRESS) return false;
    }
    return true;
  }

  export function encodeBigGridStatus(): number {
    const state = currentStateFromCVP();
    return encodeFromState(state);
  }

  export function evaluateTerminalState(): number | null {
    const state = currentStateFromCVP();
    return evaluateTerminalStateFromState(state);
  }

  function evaluateTerminalStateFromState(state: GameState): number | null {
    const encoded = encodeFromState(state);
    const { xBits, oBits } = bitboardsFromEncoded(encoded);
    for (const mask of WIN_MASKS) {
      if ((oBits & mask) === mask) return WIN_SCORE;
      if ((xBits & mask) === mask) return LOSS_SCORE;
    }
    if (allBigGridsEnded(encoded)) {
      const { xWins, oWins } = countWins(encoded);
      if (oWins > xWins) return WIN_SCORE;
      if (xWins > oWins) return LOSS_SCORE;
      return 0;
    }
    return null;
  }

  function cloneGrid(g: string[][]): string[][] {
    return [g[0].slice(), g[1].slice(), g[2].slice()];
  }

  function currentStateFromCVP(): GameState {
    const grids: SmallGridState[] = new Array(9);
    for (let i = 0; i < 9; i++) {
      grids[i] = {
        grid: cloneGrid(CVP.grid[i].grid),
        gridStatus: CVP.grid[i].gridStatus,
      };
    }
    return { grids, validGrids: CVP.validGrids.slice() };
  }

  function checkWinLocal(g: string[][]): 'X' | 'O' | 'I' | 'D' {
    for (let i = 0; i < 3; i++) {
      if (g[i][0] === g[i][1] && g[i][1] === g[i][2] && g[i][0] !== '') return g[i][0] as 'X' | 'O';
      if (g[0][i] === g[1][i] && g[1][i] === g[2][i] && g[0][i] !== '') return g[0][i] as 'X' | 'O';
    }
    if (g[0][0] === g[1][1] && g[1][1] === g[2][2] && g[0][0] !== '') return g[0][0] as 'X' | 'O';
    if (g[0][2] === g[1][1] && g[1][1] === g[2][0] && g[0][2] !== '') return g[0][2] as 'X' | 'O';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (g[i][j] === '') return 'I';
      }
    }
    return 'D';
  }

  // Count open two-in-a-row patterns for a player in a small grid
  function countOpenTwoInRowPatterns(g: string[][], player: 'O' | 'X'): number {
    const opp = player === 'O' ? 'X' : 'O';
    let cnt = 0;
    // Rows and cols
    for (let i = 0; i < 3; i++) {
      // Row i
      const row = [g[i][0], g[i][1], g[i][2]];
      if (row.filter(v => v === player).length === 2 && row.includes('') && !row.includes(opp)) cnt++;
      // Col i
      const col = [g[0][i], g[1][i], g[2][i]];
      if (col.filter(v => v === player).length === 2 && col.includes('') && !col.includes(opp)) cnt++;
    }
    // Diagonals
    const d1 = [g[0][0], g[1][1], g[2][2]];
    if (d1.filter(v => v === player).length === 2 && d1.includes('') && !d1.includes(opp)) cnt++;
    const d2 = [g[0][2], g[1][1], g[2][0]];
    if (d2.filter(v => v === player).length === 2 && d2.includes('') && !d2.includes(opp)) cnt++;
    return cnt;
  }

  // Evaluate static position (non-terminal). Positive favors O, negative favors X.
  function evaluatePosition(state: GameState): number {
    let score = 0;
    // Macro threats and wins
    for (const mask of WIN_MASKS) {
      let oWon = 0;
      let xWon = 0;
      let draws = 0;
      let inprog = 0;
      for (let i = 0; i < 9; i++) {
        if (((mask >> i) & 1) === 0) continue;
        const st = state.grids[i].gridStatus;
        if (st === CVP.GridStatus.O_WON) oWon++;
        else if (st === CVP.GridStatus.X_WON) xWon++;
        else if (st === CVP.GridStatus.DRAW) draws++;
        else inprog++;
      }
      // Two-in-a-row potential (third must be in progress)
      if (oWon === 2 && inprog === 1) score += EVAL.macroTwoInRow;
      if (xWon === 2 && inprog === 1) score -= EVAL.macroTwoInRow;
    }
    // Macro center/corner wins
    const center = 4;
    const corners = [0, 2, 6, 8];
    if (state.grids[center].gridStatus === CVP.GridStatus.O_WON) score += EVAL.macroCenterWin;
    else if (state.grids[center].gridStatus === CVP.GridStatus.X_WON) score -= EVAL.macroCenterWin;
    for (const idx of corners) {
      if (state.grids[idx].gridStatus === CVP.GridStatus.O_WON) score += EVAL.macroCornerWin;
      else if (state.grids[idx].gridStatus === CVP.GridStatus.X_WON) score -= EVAL.macroCornerWin;
    }
    // Micro open two-in-a-row patterns for in-progress small grids
    for (let i = 0; i < 9; i++) {
      if (state.grids[i].gridStatus !== CVP.GridStatus.IN_PROGRESS) continue;
      const oOpen = countOpenTwoInRowPatterns(state.grids[i].grid, 'O');
      const xOpen = countOpenTwoInRowPatterns(state.grids[i].grid, 'X');
      score += (oOpen - xOpen) * EVAL.microOpenTwoWeight;
    }
    return score;
  }

  function nextValidGrids(state: GameState, lastR: number, lastC: number): number[] {
    const idx = lastR * 3 + lastC;
    if (state.grids[idx].gridStatus === CVP.GridStatus.IN_PROGRESS) return [idx];
    const res: number[] = [];
    for (let i = 0; i < 9; i++) if (state.grids[i].gridStatus === CVP.GridStatus.IN_PROGRESS) res.push(i);
    return res;
  }

  function applyMove(state: GameState, g: number, r: number, c: number, mark: 'O' | 'X') {
    state.grids[g].grid[r][c] = mark;
    const res = checkWinLocal(state.grids[g].grid);
    if (res === 'X') state.grids[g].gridStatus = CVP.GridStatus.X_WON;
    else if (res === 'O') state.grids[g].gridStatus = CVP.GridStatus.O_WON;
    else if (res === 'D') state.grids[g].gridStatus = CVP.GridStatus.DRAW;
    state.validGrids = nextValidGrids(state, r, c);
  }

  function cloneState(state: GameState): GameState {
    const grids: SmallGridState[] = new Array(9);
    for (let i = 0; i < 9; i++) {
      grids[i] = { grid: cloneGrid(state.grids[i].grid), gridStatus: state.grids[i].gridStatus };
    }
    return { grids, validGrids: state.validGrids.slice() };
  }

  function immediateHeuristicForMove(_stateBefore: GameState, stateAfter: GameState, g: number, r: number, c: number, mark: 'O' | 'X'): number {
    let score = 0;
    const targetIdx = r * 3 + c;
    const sendsToEnded = stateAfter.grids[targetIdx].gridStatus !== CVP.GridStatus.IN_PROGRESS;
    const statusAfter = stateAfter.grids[g].gridStatus;
    if (sendsToEnded) score += mark === 'O' ? -100 : 100;
    if (statusAfter === CVP.GridStatus.O_WON) score += mark === 'O' ? 50 : -50;
    else if (statusAfter === CVP.GridStatus.X_WON) score += mark === 'X' ? -50 : 50;
    else if (statusAfter === CVP.GridStatus.DRAW) score += 0;
    const isCenter = r === 1 && c === 1;
    const isCorner = (r === 0 || r === 2) && (c === 0 || c === 2);
    if (isCenter) score += mark === 'O' ? -10 : 10;
    else if (isCorner) score += mark === 'O' ? -5 : 5;
    return score;
  }

  function stateKey(state: GameState, isMax: boolean, depth: number): string {
    let s = isMax ? 'M' : 'm';
    s += ':' + depth + ':';
    for (let i = 0; i < 9; i++) {
      const st = state.grids[i].gridStatus;
      if (st === CVP.GridStatus.O_WON) s += 'O';
      else if (st === CVP.GridStatus.X_WON) s += 'X';
      else if (st === CVP.GridStatus.DRAW) s += 'D';
      else s += 'I';
    }
    s += ':' + state.validGrids.join('');
    // Include micro grids for in-progress ones
    for (let i = 0; i < 9; i++) {
      if (state.grids[i].gridStatus !== CVP.GridStatus.IN_PROGRESS) continue;
      const g = state.grids[i].grid;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) s += g[r][c] || '_';
    }
    return s;
  }

  function minimax(state: GameState, depth: number, isMaximizing: boolean, alpha: number, beta: number, extendBudget: number): number {
    const terminal = evaluateTerminalStateFromState(state);
    if (terminal !== null) return terminal;
    if (depth === 0) return evaluatePosition(state);
    if (state.validGrids.length === 0) return 0;
    const key = stateKey(state, isMaximizing, depth);
    const hit = TT.get(key);
    if (hit && hit.depth >= depth) return hit.score;
    if (isMaximizing) {
      let best = -Infinity;
      for (const g of state.validGrids) {
        const sg = state.grids[g];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (sg.grid[r][c] !== '') continue;
            const child = cloneState(state);
            applyMove(child, g, r, c, 'O');
            const tactical = countOpenTwoInRowPatterns(child.grids[g].grid, 'O') > 0 || countOpenTwoInRowPatterns(child.grids[g].grid, 'X') > 0;
            const nextDepth = depth - 1 + (tactical && extendBudget > 0 ? 1 : 0);
            const val = minimax(child, nextDepth, false, alpha, beta, tactical && extendBudget > 0 ? extendBudget - 1 : extendBudget);
            if (val > best) best = val;
            if (val > alpha) alpha = val;
            if (beta <= alpha) return best;
          }
        }
      }
      TT.set(key, { depth, score: best });
      return best;
    } else {
      let best = Infinity;
      for (const g of state.validGrids) {
        const sg = state.grids[g];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (sg.grid[r][c] !== '') continue;
            const child = cloneState(state);
            applyMove(child, g, r, c, 'X');
            const tactical = countOpenTwoInRowPatterns(child.grids[g].grid, 'O') > 0 || countOpenTwoInRowPatterns(child.grids[g].grid, 'X') > 0;
            const nextDepth = depth - 1 + (tactical && extendBudget > 0 ? 1 : 0);
            const val = minimax(child, nextDepth, true, alpha, beta, tactical && extendBudget > 0 ? extendBudget - 1 : extendBudget);
            if (val < best) best = val;
            if (val < beta) beta = val;
            if (beta <= alpha) return best;
          }
        }
      }
      TT.set(key, { depth, score: best });
      return best;
    }
  }

  function searchBestMove(state: GameState, depth: number): { g: number; r: number; c: number } | null {
    if (state.validGrids.length === 0) return null;
    // Generate moves with ordering by immediate heuristic (O's perspective)
    const moves: { g: number; r: number; c: number; orderScore: number }[] = [];
    for (const g of state.validGrids) {
      const sg = state.grids[g];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (sg.grid[r][c] !== '') continue;
          const child = cloneState(state);
          applyMove(child, g, r, c, 'O');
          const orderScore = immediateHeuristicForMove(state, child, g, r, c, 'O');
          moves.push({ g, r, c, orderScore });
        }
      }
    }
    moves.sort((a, b) => b.orderScore - a.orderScore);
    let bestVal = -Infinity;
    let bestMove: { g: number; r: number; c: number } | null = null;
    for (const m of moves) {
      const child = cloneState(state);
      applyMove(child, m.g, m.r, m.c, 'O');
      const val = minimax(child, depth - 1, false, -Infinity, Infinity, 1);
      if (val > bestVal) {
        bestVal = val;
        bestMove = { g: m.g, r: m.r, c: m.c };
      }
    }
    return bestMove;
  }

  export function getComputerMove(): { g: number; r: number; c: number } | null {
    const root = currentStateFromCVP();
    const maxDepth = 6;
    let best: { g: number; r: number; c: number } | null = null;
    for (let d = 2; d <= maxDepth; d++) {
      const cand = searchBestMove(root, d);
      if (cand) best = cand;
    }
    return best;
  }
}