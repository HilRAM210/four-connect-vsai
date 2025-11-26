class ConnectFourGame {
  constructor() {
    this.board = createEmptyBoard();
    this.currentPlayer = PLAYER1;
    this.gameOver = false;
    this.aiThinking = false;
    this.winningCells = [];
    this.isRunning = false;

    this.humanPlayer = PLAYER1;
    this.aiPlayer = PLAYER2;
    this.currentAI = "minimax";

    this.minimaxAI = new MinimaxAI(8);
    this.mctsAI = new MCTSAI(5000, 8000);

    this.initializeElements();
    this.attachEventListeners();
    this.initGame();

    this.moveCount = 0;
    this.moveHistory = [];
  }

  initializeElements() {
    this.boardElement = document.getElementById("board");
    this.statusElement = document.getElementById("status");
    this.resetButton = document.getElementById("reset-btn");
    this.startButton = document.getElementById("start-btn");
    this.swapButton = document.getElementById("swap-btn");
    this.toggleAIButton = document.getElementById("toggle-ai-btn");
    this.player1Card = document.getElementById("player1-card");
    this.player2Card = document.getElementById("player2-card");
    this.player1Name = this.player1Card.querySelector(".player-name");
    this.player2Name = this.player2Card.querySelector(".player-name");
  }

  attachEventListeners() {
    this.resetButton.addEventListener("click", () => this.initGame());
    this.startButton.addEventListener("click", () => this.startGame());
    this.swapButton.addEventListener("click", () => this.swapTurnOrder());
    this.toggleAIButton.addEventListener("click", () => this.toggleAI());

    this.boardElement.addEventListener("click", (e) => this.handleCellClick(e));
  }

  initGame() {
    this.board = createEmptyBoard();
    this.currentPlayer = PLAYER1;
    this.gameOver = false;
    this.aiThinking = false;
    this.winningCells = [];
    this.moveCount = 0;
    this.moveHistory = [];
    this.isRunning = false;

    this.updateBoard();
    this.updatePlayerCards();
    this.updatePlayerRolesUI();
    this.updateControlButtons();

    if (this.currentPlayer === this.humanPlayer) {
      this.statusElement.textContent =
        "Giliran Anda! Klik kolom untuk memulai.";
    } else {
      this.statusElement.textContent =
        "Klik 'Mulai Pertarungan' untuk memulai!";
    }
  }

  handleCellClick(event) {
    if (this.gameOver || this.currentPlayer !== this.humanPlayer) return;

    if (!this.isRunning && this.currentPlayer === this.humanPlayer) {
      this.isRunning = true;
      this.updateControlButtons();
    }

    const cell = event.target;
    if (cell.classList.contains("cell")) {
      const col = parseInt(cell.dataset.col);
      const row = getAvailableRow(this.board, col);

      if (row !== -1) {
        this.makeMove(row, col);
      }
    }
  }

  updateBoard() {
    this.boardElement.innerHTML = "";

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = row;
        cell.dataset.col = col;

        const moveInfo = this.moveHistory.find(
          (move) => move.row === row && move.col === col
        );

        if (this.board[row][col] === PLAYER1) {
          cell.classList.add("player1");
        } else if (this.board[row][col] === PLAYER2) {
          cell.classList.add("player2");
        }

        if (this.winningCells.some((wc) => wc[0] === row && wc[1] === col)) {
          cell.classList.add("winning");
        }

        if (moveInfo) {
          const moveNumber = document.createElement("div");
          moveNumber.className = "move-number";
          moveNumber.textContent = moveInfo.number;
          cell.appendChild(moveNumber);
        }

        this.boardElement.appendChild(cell);
      }
    }
  }

  updatePlayerCards() {
    this.player1Card.classList.toggle("active", this.currentPlayer === PLAYER1);
    this.player2Card.classList.toggle("active", this.currentPlayer === PLAYER2);
  }

  updatePlayerRolesUI() {
    if (this.humanPlayer === PLAYER1) {
      this.player1Name.textContent = "👤 Player";
      this.player2Name.textContent =
        this.currentAI === "minimax" ? "🧠 Minimax AI" : "🎲 MCTS AI";
    } else {
      this.player1Name.textContent =
        this.currentAI === "minimax" ? "🧠 Minimax AI" : "🎲 MCTS AI";
      this.player2Name.textContent = "👤 Player";
    }
  }

  updateControlButtons() {
    this.startButton.disabled = this.currentPlayer !== this.aiPlayer;

    if (this.currentPlayer === this.aiPlayer) {
      this.startButton.innerHTML = "<span>▶️ Mulai Pertarungan</span>";
    } else {
      this.startButton.innerHTML = "<span>▶️ Giliran Pemain</span>";
    }

    this.toggleAIButton.innerHTML =
      this.currentAI === "minimax"
        ? "<span>🤖 Ganti ke MCTS</span>"
        : "<span>🤖 Ganti ke Minimax</span>";
  }

  updateStatus(message) {
    if (message) {
      this.statusElement.textContent = message;
      return;
    }

    if (this.gameOver) return;

    if (this.currentPlayer === this.humanPlayer) {
      this.statusElement.textContent =
        "Giliran Anda! Klik kolom untuk bermain.";
    } else {
      const aiName = this.currentAI === "minimax" ? "Minimax" : "MCTS";
      this.statusElement.textContent = `🤖 AI ${aiName} sedang berpikir...`;
    }
  }

  makeMove(row, col) {
    if (this.gameOver) return;

    this.board[row][col] = this.currentPlayer;

    this.moveCount++;
    const moveInfo = {
      number: this.moveCount,
      player: this.currentPlayer,
      row: row,
      col: col,
      playerType:
        this.currentPlayer === this.humanPlayer ? "Human" : this.currentAI,
    };
    this.moveHistory.push(moveInfo);

    this.updateBoard();

    const winResult = checkWinInBoard(this.board, row, col);
    if (winResult) {
      this.gameOver = true;
      this.winningCells = winResult;
      this.updateBoard();
      const winnerName =
        this.currentPlayer === this.humanPlayer
          ? "Player"
          : this.currentAI === "minimax"
          ? "Minimax AI"
          : "MCTS AI";
      this.statusElement.textContent = `${winnerName} Menang! 🏆`;
      this.isRunning = false;
      this.updateControlButtons();
      return;
    }

    if (checkDraw(this.board)) {
      this.gameOver = true;
      this.statusElement.textContent = "Permainan Seri! 🤝";
      this.isRunning = false;
      this.updateControlButtons();
      return;
    }

    this.currentPlayer = this.currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;
    this.updatePlayerCards();
    this.updateStatus();

    if (
      this.currentPlayer === this.aiPlayer &&
      !this.gameOver &&
      this.isRunning
    ) {
      this.checkForAIMove();
    }
  }

  checkForAIMove() {
    if (this.gameOver || this.aiThinking || !this.isRunning) return;

    this.aiThinking = true;
    this.updateStatus();

    setTimeout(() => {
      this.makeAIMove();
    }, 1000);
  }

  makeAIMove() {
    if (this.gameOver) return;

    let col;

    try {
      if (this.currentAI === "minimax") {
        col = this.minimaxAI.getMove(this.board, this.currentPlayer);
      } else {
        col = this.mctsAI.getMove(this.board, this.currentPlayer);
      }

      const row = getAvailableRow(this.board, col);
      if (row !== -1) {
        this.aiThinking = false;
        this.makeMove(row, col);
      } else {
        console.warn(`AI chose invalid column (${col}), making random move`);
        this.makeRandomMove();
      }
    } catch (error) {
      console.error("AI Error:", error);
      this.makeRandomMove();
    }
  }

  makeRandomMove() {
    const validCols = getValidColumns(this.board);
    if (validCols.length > 0) {
      const col = validCols[Math.floor(Math.random() * validCols.length)];
      const row = getAvailableRow(this.board, col);
      if (row !== -1) {
        this.aiThinking = false;
        this.makeMove(row, col);
      }
    }
  }

  startGame() {
    this.isRunning = true;
    this.updateControlButtons();
    this.updateStatus();

    if (this.currentPlayer === this.aiPlayer) {
      this.checkForAIMove();
    }
  }

  swapTurnOrder() {
    if (!this.isRunning && !this.gameOver) {
      this.humanPlayer = this.humanPlayer === PLAYER1 ? PLAYER2 : PLAYER1;
      this.aiPlayer = this.aiPlayer === PLAYER1 ? PLAYER2 : PLAYER1;

      this.currentPlayer = PLAYER1;

      this.initGame();
    }
  }

  toggleAI() {
    if (!this.isRunning && !this.gameOver) {
      this.currentAI = this.currentAI === "minimax" ? "mcts" : "minimax";
      this.initGame();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ConnectFourGame();
});
