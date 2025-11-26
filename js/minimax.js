class MinimaxAI {
  constructor(depth = 8) {
    this.depth = depth;
    this.transpositionTable = new Map();
    this.nodesEvaluated = 0;
    this.cacheHits = 0;
  }

  getMove(board, currentPlayer) {
    this.transpositionTable.clear();
    this.nodesEvaluated = 0;
    this.cacheHits = 0;

    const immediateWin = this.findImmediateWin(board, currentPlayer);
    if (immediateWin !== -1) {
      console.log(`Minimax: Immediate win found at column ${immediateWin}`);
      return immediateWin;
    }

    const opponent = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;
    const blockMove = this.findImmediateWin(board, opponent);
    if (blockMove !== -1) {
      console.log(`Minimax: Blocking opponent win at column ${blockMove}`);
      return blockMove;
    }

    const doubleThreat = this.findDoubleThreatMove(board, currentPlayer);
    if (doubleThreat !== -1) {
      console.log(`Minimax: Double threat move at column ${doubleThreat}`);
      return doubleThreat;
    }

    let bestScore = -Infinity;
    let bestMove = -1;
    const validMoves = this.getOrderedMoves(board);

    for (let currentDepth = 1; currentDepth <= this.depth; currentDepth++) {
      let currentBestMove = -1;
      let currentBestScore = -Infinity;
      let alpha = -Infinity;
      let beta = Infinity;

      for (let col of validMoves) {
        const row = getAvailableRow(board, col);
        if (row === -1) continue;

        const newBoard = cloneBoard(board);
        newBoard[row][col] = currentPlayer;

        const score = this.minimaxWithAlphaBeta(
          newBoard,
          currentDepth - 1,
          alpha,
          beta,
          false,
          currentPlayer
        );

        if (score > currentBestScore) {
          currentBestScore = score;
          currentBestMove = col;
        }

        alpha = Math.max(alpha, currentBestScore);
      }

      if (currentBestMove !== -1) {
        bestMove = currentBestMove;
        bestScore = currentBestScore;

        if (bestScore > 9000) {
          console.log(
            `Minimax: Winning sequence found at depth ${currentDepth}`
          );
          break;
        }
      }

      console.log(
        `Minimax: Depth ${currentDepth}, Best Score: ${currentBestScore}, Best Move: ${currentBestMove}`
      );
    }

    console.log(
      `Minimax: Nodes evaluated: ${this.nodesEvaluated}, Cache hits: ${this.cacheHits}`
    );

    return bestMove !== -1 ? bestMove : this.getCenterPriorityMove(board);
  }

  findImmediateWin(board, player) {
    for (let col of this.getOrderedMoves(board)) {
      const row = getAvailableRow(board, col);
      if (row === -1) continue;

      board[row][col] = player;
      const winResult = checkWinInBoard(board, row, col);
      board[row][col] = EMPTY;

      if (winResult) return col;
    }
    return -1;
  }

  findDoubleThreatMove(board, player) {
    const threats = [];
    const validMoves = getValidColumns(board);

    for (let col of validMoves) {
      const row = getAvailableRow(board, col);
      if (row === -1) continue;

      const testBoard = cloneBoard(board);
      testBoard[row][col] = player;

      let threatCount = 0;
      for (let nextCol of getValidColumns(testBoard)) {
        const nextRow = getAvailableRow(testBoard, nextCol);
        if (nextRow === -1) continue;

        testBoard[nextRow][nextCol] = player;
        if (checkWinInBoard(testBoard, nextRow, nextCol)) {
          threatCount++;
        }
        testBoard[nextRow][nextCol] = EMPTY;
      }

      if (threatCount >= 2) {
        threats.push(col);
      }
    }

    return threats.length > 0 ? threats[0] : -1;
  }

  getCenterPriorityMove(board) {
    const centerOrder = [3, 2, 4, 1, 5, 0, 6];
    for (let col of centerOrder) {
      if (getAvailableRow(board, col) !== -1) {
        return col;
      }
    }
    return getValidColumns(board)[0];
  }

  minimaxWithAlphaBeta(
    board,
    depth,
    alpha,
    beta,
    maximizingPlayer,
    currentPlayer
  ) {
    this.nodesEvaluated++;

    const boardKey = this.getBoardKey(board);
    const cached = this.transpositionTable.get(boardKey);
    if (cached && cached.depth >= depth) {
      this.cacheHits++;
      return cached.score;
    }

    const terminalScore = this.evaluateTerminalState(
      board,
      depth,
      maximizingPlayer,
      currentPlayer
    );
    if (terminalScore !== null) {
      return terminalScore;
    }

    if (depth === 0) {
      return this.evaluateBoardAdvanced(board, currentPlayer);
    }

    const availableCols = this.getOrderedMoves(board);
    let bestScore = maximizingPlayer ? -Infinity : Infinity;
    let bestCol = availableCols[0];

    if (maximizingPlayer) {
      for (let col of availableCols) {
        const row = getAvailableRow(board, col);
        const newBoard = cloneBoard(board);
        newBoard[row][col] = currentPlayer;

        const score = this.minimaxWithAlphaBeta(
          newBoard,
          depth - 1,
          alpha,
          beta,
          false,
          currentPlayer
        );

        if (score > bestScore) {
          bestScore = score;
          bestCol = col;
        }

        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) break;
      }
    } else {
      const opponent = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;

      for (let col of availableCols) {
        const row = getAvailableRow(board, col);
        const newBoard = cloneBoard(board);
        newBoard[row][col] = opponent;

        const score = this.minimaxWithAlphaBeta(
          newBoard,
          depth - 1,
          alpha,
          beta,
          true,
          currentPlayer
        );

        if (score < bestScore) {
          bestScore = score;
          bestCol = col;
        }

        beta = Math.min(beta, bestScore);
        if (beta <= alpha) break;
      }
    }

    this.transpositionTable.set(boardKey, {
      depth: depth,
      score: bestScore,
    });

    return bestScore;
  }

  evaluateTerminalState(board, depth, maximizingPlayer, currentPlayer) {
    const playerToCheck = maximizingPlayer
      ? currentPlayer
      : currentPlayer === PLAYER1
      ? PLAYER2
      : PLAYER1;

    for (let col = 0; col < COLS; col++) {
      const row = getAvailableRow(board, col);
      if (row === -1) continue;

      board[row][col] = playerToCheck;
      if (checkWinInBoard(board, row, col)) {
        board[row][col] = EMPTY;
        const score = maximizingPlayer
          ? 10000 + depth * 10
          : -10000 - depth * 10;
        return score;
      }
      board[row][col] = EMPTY;
    }

    if (getValidColumns(board).length === 0) {
      return 0;
    }

    return null;
  }

  getOrderedMoves(board) {
    const validMoves = getValidColumns(board);

    const scoredMoves = validMoves.map((col) => {
      let score = 0;

      if (col === 3) score += 20;
      else if (col === 2 || col === 4) score += 10;
      else if (col === 1 || col === 5) score += 5;

      score += this.evaluateImmediateThreats(board, col) * 50;

      score += this.evaluatePositionalAdvantage(board, col);

      return { col, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves.map((move) => move.col);
  }

  evaluateImmediateThreats(board, col) {
    const row = getAvailableRow(board, col);
    if (row === -1) return 0;

    let threatScore = 0;
    const currentPlayer = PLAYER1;

    board[row][col] = currentPlayer;
    if (checkWinInBoard(board, row, col)) {
      board[row][col] = EMPTY;
      return 100;
    }
    board[row][col] = EMPTY;

    const opponent = PLAYER2;
    board[row][col] = opponent;
    if (checkWinInBoard(board, row, col)) {
      board[row][col] = EMPTY;
      return 80;
    }
    board[row][col] = EMPTY;

    return threatScore;
  }

  evaluatePositionalAdvantage(board, col) {
    const row = getAvailableRow(board, col);
    if (row === -1) return 0;

    let score = 0;

    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];

    for (let [dr, dc] of directions) {
      let connected = 0;

      for (let i = 1; i <= 3; i++) {
        const r = row + dr * i;
        const c = col + dc * i;

        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] !== EMPTY) {
          connected++;
        } else {
          break;
        }
      }

      for (let i = 1; i <= 3; i++) {
        const r = row - dr * i;
        const c = col - dc * i;

        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] !== EMPTY) {
          connected++;
        } else {
          break;
        }
      }

      score += connected * 5;
    }

    return score;
  }

  getBoardKey(board) {
    return board.flat().join("");
  }

  evaluateBoardAdvanced(board, currentPlayer) {
    let score = 0;
    const opponent = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;

    score += this.evaluateLines(board, currentPlayer, opponent);
    score += this.evaluateCenterControl(board, currentPlayer, opponent);
    score += this.evaluateMobility(board, currentPlayer, opponent);

    return score;
  }

  evaluateLines(board, player, opponent) {
    let score = 0;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (col <= COLS - 4) {
          score += this.evaluateWindow(
            [
              board[row][col],
              board[row][col + 1],
              board[row][col + 2],
              board[row][col + 3],
            ],
            player,
            opponent
          );
        }

        if (row <= ROWS - 4) {
          score += this.evaluateWindow(
            [
              board[row][col],
              board[row + 1][col],
              board[row + 2][col],
              board[row + 3][col],
            ],
            player,
            opponent
          );
        }

        if (row <= ROWS - 4 && col <= COLS - 4) {
          score += this.evaluateWindow(
            [
              board[row][col],
              board[row + 1][col + 1],
              board[row + 2][col + 2],
              board[row + 3][col + 3],
            ],
            player,
            opponent
          );
        }

        if (row <= ROWS - 4 && col >= 3) {
          score += this.evaluateWindow(
            [
              board[row][col],
              board[row + 1][col - 1],
              board[row + 2][col - 2],
              board[row + 3][col - 3],
            ],
            player,
            opponent
          );
        }
      }
    }

    return score;
  }

  evaluateWindow(window, player, opponent) {
    let score = 0;
    let playerCount = 0;
    let opponentCount = 0;
    let emptyCount = 0;

    for (let cell of window) {
      if (cell === player) playerCount++;
      else if (cell === opponent) opponentCount++;
      else emptyCount++;
    }

    if (playerCount === 4) score += 1000;
    else if (playerCount === 3 && emptyCount === 1) score += 50;
    else if (playerCount === 2 && emptyCount === 2) score += 10;

    if (opponentCount === 3 && emptyCount === 1) score -= 40;
    else if (opponentCount === 2 && emptyCount === 2) score -= 5;

    return score;
  }

  evaluateCenterControl(board, player, opponent) {
    let score = 0;
    const centerCols = [2, 3, 4];

    for (let col of centerCols) {
      for (let row = 0; row < ROWS; row++) {
        if (board[row][col] === player) {
          score += 3;
        } else if (board[row][col] === opponent) {
          score -= 3;
        }
      }
    }

    return score;
  }

  evaluateMobility(board, player, opponent) {
    const playerMoves = getValidColumns(board).length;

    let opponentMobility = 0;
    const opponentMoves = getValidColumns(board);

    for (let col of opponentMoves) {
      const row = getAvailableRow(board, col);
      const testBoard = cloneBoard(board);
      testBoard[row][col] = opponent;
      opponentMobility += getValidColumns(testBoard).length;
    }

    const avgOpponentMobility =
      opponentMobility / Math.max(opponentMoves.length, 1);

    return (playerMoves - avgOpponentMobility) * 2;
  }
}
