class MCTSNode {
  constructor(boardState, parent, move, player, rootPlayer) {
    this.board = cloneBoard(boardState);
    this.parent = parent;
    this.move = move;
    this.player = player;
    this.rootPlayer = rootPlayer || player;
    this.children = [];
    this.visits = 0;
    this.wins = 0;
    this.untriedMoves = this.getOrderedMoves(this.board);
    this.heuristicScore = this.evaluateHeuristic(boardState, player);
  }

  getOrderedMoves(board) {
    const validMoves = getValidColumns(board);

    const scoredMoves = validMoves.map((col) => {
      let score = 0;

      if (col === 3) score += 50;
      else if (col === 2 || col === 4) score += 25;
      else if (col === 1 || col === 5) score += 12;
      else score += 5;

      score += this.evaluateImmediateThreats(board, col) * 100;
      score += this.evaluateDoubleThreatPotential(board, col) * 75;
      score += this.evaluatePositionalAdvantage(board, col) * 20;

      return { col, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves.map((move) => move.col);
  }

  evaluateHeuristic(board, player) {
    let score = 0;
    const opponent = player === PLAYER1 ? PLAYER2 : PLAYER1;

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
    let playerCount = 0;
    let opponentCount = 0;
    let emptyCount = 0;

    for (let cell of window) {
      if (cell === player) playerCount++;
      else if (cell === opponent) opponentCount++;
      else emptyCount++;
    }

    if (playerCount === 4) return 10000;
    if (playerCount === 3 && emptyCount === 1) return 100;
    if (playerCount === 2 && emptyCount === 2) return 10;
    if (opponentCount === 3 && emptyCount === 1) return -80;
    if (opponentCount === 2 && emptyCount === 2) return -5;

    return 0;
  }

  evaluateImmediateThreats(board, col) {
    const row = getAvailableRow(board, col);
    if (row === -1) return 0;

    let threatScore = 0;
    const currentPlayer = this.player;
    const opponent = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;

    board[row][col] = currentPlayer;
    if (checkWinInBoard(board, row, col)) {
      board[row][col] = EMPTY;
      return 200;
    }
    board[row][col] = EMPTY;

    board[row][col] = opponent;
    if (checkWinInBoard(board, row, col)) {
      board[row][col] = EMPTY;
      return 150;
    }
    board[row][col] = EMPTY;

    threatScore +=
      this.countPotentialThreats(board, col, currentPlayer, 3) * 15;
    threatScore -= this.countPotentialThreats(board, col, opponent, 3) * 12;

    return threatScore;
  }

  evaluateDoubleThreatPotential(board, col) {
    const row = getAvailableRow(board, col);
    if (row === -1) return 0;

    const currentPlayer = this.player;
    let doubleThreatCount = 0;

    const testBoard = cloneBoard(board);
    testBoard[row][col] = currentPlayer;

    for (let nextCol of getValidColumns(testBoard)) {
      const nextRow = getAvailableRow(testBoard, nextCol);
      if (nextRow === -1) continue;

      testBoard[nextRow][nextCol] = currentPlayer;
      if (checkWinInBoard(testBoard, nextRow, nextCol)) {
        doubleThreatCount++;
        if (doubleThreatCount >= 2) {
          testBoard[nextRow][nextCol] = EMPTY;
          return 2;
        }
      }
      testBoard[nextRow][nextCol] = EMPTY;
    }

    return doubleThreatCount >= 2 ? 2 : doubleThreatCount;
  }

  evaluatePositionalAdvantage(board, col) {
    const row = getAvailableRow(board, col);
    if (row === -1) return 0;

    let score = 0;
    const currentPlayer = this.player;
    const opponent = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;

    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];

    for (let [dr, dc] of directions) {
      let playerConnected = 0;
      let opponentConnected = 0;

      for (let i = 1; i <= 3; i++) {
        const r = row + dr * i;
        const c = col + dc * i;

        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
          if (board[r][c] === currentPlayer) playerConnected++;
          else if (board[r][c] === opponent) opponentConnected++;
        }

        const r2 = row - dr * i;
        const c2 = col - dc * i;
        if (r2 >= 0 && r2 < ROWS && c2 >= 0 && c2 < COLS) {
          if (board[r2][c2] === currentPlayer) playerConnected++;
          else if (board[r2][c2] === opponent) opponentConnected++;
        }
      }

      score += playerConnected * 8;
      score -= opponentConnected * 6;
    }

    return score;
  }

  countPotentialThreats(board, col, player, length) {
    const row = getAvailableRow(board, col);
    if (row === -1) return 0;

    let threatCount = 0;
    const testBoard = cloneBoard(board);
    testBoard[row][col] = player;

    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];

    for (let [dr, dc] of directions) {
      let consecutive = 1;

      for (let i = 1; i < 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (
          r >= 0 &&
          r < ROWS &&
          c >= 0 &&
          c < COLS &&
          testBoard[r][c] === player
        ) {
          consecutive++;
        } else {
          break;
        }
      }

      for (let i = 1; i < 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (
          r >= 0 &&
          r < ROWS &&
          c >= 0 &&
          c < COLS &&
          testBoard[r][c] === player
        ) {
          consecutive++;
        } else {
          break;
        }
      }

      if (consecutive >= length) {
        threatCount++;
      }
    }

    return threatCount;
  }

  expand() {
    if (this.untriedMoves.length === 0) return null;

    const col = this.untriedMoves.pop();
    const row = getAvailableRow(this.board, col);

    if (row === -1) return this.expand();

    const newBoard = cloneBoard(this.board);
    newBoard[row][col] = this.player;

    const nextPlayer = this.player === PLAYER1 ? PLAYER2 : PLAYER1;
    const child = new MCTSNode(
      newBoard,
      this,
      col,
      nextPlayer,
      this.rootPlayer
    );
    this.children.push(child);

    return child;
  }

  selectChild() {
    if (this.children.length === 0) return null;

    const explorationConstant = 1.414;
    let bestChild = null;
    let bestValue = -Infinity;

    for (let child of this.children) {
      if (child.visits === 0) {
        return child;
      }

      const winRate = child.wins / child.visits;
      const exploration = Math.sqrt(Math.log(this.visits) / child.visits);

      const heuristicBias = child.heuristicScore * 0.001;
      const ucb = winRate + explorationConstant * exploration + heuristicBias;

      if (ucb > bestValue) {
        bestValue = ucb;
        bestChild = child;
      }
    }

    return bestChild;
  }

  simulate() {
    let tempBoard = cloneBoard(this.board);
    let currentPlayer = this.player;
    let moves = 0;
    const maxMoves = 20;

    while (moves < maxMoves) {
      const winningMove = this.findWinningMove(tempBoard, currentPlayer);
      if (winningMove !== -1) {
        return currentPlayer === this.rootPlayer ? 1 : -1;
      }

      const opponent = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;

      const blockMove = this.findWinningMove(tempBoard, opponent);
      if (blockMove !== -1) {
        const row = getAvailableRow(tempBoard, blockMove);
        tempBoard[row][blockMove] = currentPlayer;
        currentPlayer = opponent;
        moves++;
        continue;
      }

      const doubleThreat = this.findDoubleThreatMove(tempBoard, currentPlayer);
      const opponentDoubleThreat = this.findDoubleThreatMove(
        tempBoard,
        opponent
      );

      const validMoves = getValidColumns(tempBoard);
      if (validMoves.length === 0) return 0;

      let chosenCol;

      if (doubleThreat !== -1) {
        chosenCol = doubleThreat;
      } else if (opponentDoubleThreat !== -1) {
        chosenCol = opponentDoubleThreat;
      } else {
        chosenCol = this.getHeuristicMove(tempBoard, currentPlayer, validMoves);
      }

      const row = getAvailableRow(tempBoard, chosenCol);
      if (row === -1) {
        chosenCol = validMoves[Math.floor(Math.random() * validMoves.length)];
      }

      const finalRow = getAvailableRow(tempBoard, chosenCol);
      tempBoard[finalRow][chosenCol] = currentPlayer;

      if (checkWinInBoard(tempBoard, finalRow, chosenCol)) {
        return currentPlayer === this.rootPlayer ? 1 : -1;
      }

      currentPlayer = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;
      moves++;
    }

    const finalScore = this.evaluateHeuristic(tempBoard, this.rootPlayer);
    return Math.tanh(finalScore * 0.001);
  }

  findWinningMove(board, player) {
    for (let col of getValidColumns(board)) {
      const row = getAvailableRow(board, col);
      if (row === -1) continue;

      board[row][col] = player;
      const isWin = checkWinInBoard(board, row, col);
      board[row][col] = EMPTY;
      if (isWin) return col;
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
          if (threatCount >= 2) {
            threats.push(col);
            break;
          }
        }
        testBoard[nextRow][nextCol] = EMPTY;
      }
    }

    return threats.length > 0 ? threats[0] : -1;
  }

  getHeuristicMove(board, player, validMoves) {
    const scoredMoves = validMoves.map((col) => {
      let score = 0;
      const row = getAvailableRow(board, col);

      if (row === -1) return { col, score: -Infinity };

      if (col === 3) score += 30;
      else if (col === 2 || col === 4) score += 15;
      else if (col === 1 || col === 5) score += 8;

      board[row][col] = player;
      score += this.countPotentialThreats(board, col, player, 2) * 10;
      score += this.countPotentialThreats(board, col, player, 3) * 25;
      board[row][col] = EMPTY;

      return { col, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].col;
  }

  backpropagate(result) {
    let node = this;
    while (node !== null) {
      node.visits++;
      node.wins += result;
      node = node.parent;
    }
  }

  isTerminal() {
    return getValidColumns(this.board).length === 0 || this.checkAnyWin();
  }

  checkAnyWin() {
    for (let col = 0; col < COLS; col++) {
      const row = getAvailableRow(this.board, col);
      if (row === -1) continue;

      for (let player of [PLAYER1, PLAYER2]) {
        this.board[row][col] = player;
        if (checkWinInBoard(this.board, row, col)) {
          this.board[row][col] = EMPTY;
          return true;
        }
        this.board[row][col] = EMPTY;
      }
    }
    return false;
  }

  getBestMove() {
    if (this.children.length === 0) {
      const moves = getValidColumns(this.board);
      return moves.length > 0 ? moves[0] : 0;
    }

    let bestChild = this.children[0];
    let bestScore = -Infinity;

    for (let child of this.children) {
      if (child.visits < 5) continue;

      const score = child.wins / child.visits;
      if (score > bestScore) {
        bestScore = score;
        bestChild = child;
      }
    }

    if (bestScore === -Infinity) {
      bestChild = this.children.reduce((best, child) =>
        child.visits > best.visits ? child : best
      );
    }

    return bestChild.move;
  }
}

class MCTSAI {
  constructor(iterations = 5000, timeLimit = 8000) {
    this.iterations = iterations;
    this.timeLimit = timeLimit;
  }

  getMove(board, currentPlayer) {
    const immediateWin = this.findImmediateWin(board, currentPlayer);
    if (immediateWin !== -1) {
      console.log(`MCTS: Immediate win at column ${immediateWin}`);
      return immediateWin;
    }

    const opponent = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;
    const blockMove = this.findImmediateWin(board, opponent);
    if (blockMove !== -1) {
      console.log(`MCTS: Blocking opponent at column ${blockMove}`);
      return blockMove;
    }

    const root = new MCTSNode(board, null, null, currentPlayer, currentPlayer);
    const startTime = Date.now();
    let iterations = 0;

    while (
      iterations < this.iterations &&
      Date.now() - startTime < this.timeLimit
    ) {
      let node = root;

      while (node.children.length > 0 && node.untriedMoves.length === 0) {
        const selected = node.selectChild();
        if (selected) {
          node = selected;
        } else {
          break;
        }
      }

      if (node.untriedMoves.length > 0 && !node.isTerminal()) {
        const expandedNode = node.expand();
        if (expandedNode) {
          node = expandedNode;
        }
      }

      const result = node.simulate();

      node.backpropagate(result);
      iterations++;
    }

    console.log(
      `MCTS completed ${iterations} iterations in ${Date.now() - startTime}ms`
    );

    const bestMove = root.getBestMove();
    console.log(`MCTS selected move: ${bestMove}`);

    return bestMove;
  }

  findImmediateWin(board, player) {
    for (let col of getValidColumns(board)) {
      const row = getAvailableRow(board, col);
      if (row === -1) continue;

      board[row][col] = player;
      const winResult = checkWinInBoard(board, row, col);
      board[row][col] = EMPTY;

      if (winResult) return col;
    }
    return -1;
  }
}
