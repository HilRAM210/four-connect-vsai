const WIN_SCORE = 100000;
const DOUBLE_THREAT_SCORE = 1000;
const CENTER_CONTROL_SCORE = 10;

const patternCache = new Map();

const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const PLAYER1 = 1;
const PLAYER2 = 2;

function getAvailableRow(board, col) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === EMPTY) {
      return row;
    }
  }
  return -1;
}

function getValidColumns(board) {
  const validCols = [];
  for (let col = 0; col < COLS; col++) {
    if (getAvailableRow(board, col) !== -1) {
      validCols.push(col);
    }
  }
  return validCols;
}

function checkWinInBoard(board, row, col) {
  const player = board[row][col];
  if (player === EMPTY) return null;

  const directions = [
    [
      [0, 1],
      [0, -1],
    ],
    [
      [1, 0],
      [-1, 0],
    ],
    [
      [1, 1],
      [-1, -1],
    ],
    [
      [1, -1],
      [-1, 1],
    ],
  ];

  for (let [dir1, dir2] of directions) {
    const winningCells = [[row, col]];

    for (let [dr, dc] of [dir1, dir2]) {
      let r = row + dr;
      let c = col + dc;

      while (
        r >= 0 &&
        r < ROWS &&
        c >= 0 &&
        c < COLS &&
        board[r][c] === player
      ) {
        winningCells.push([r, c]);
        r += dr;
        c += dc;
      }
    }

    if (winningCells.length >= 4) {
      return winningCells;
    }
  }

  return null;
}

function checkDraw(board) {
  for (let col = 0; col < COLS; col++) {
    if (board[0][col] === EMPTY) {
      return false;
    }
  }
  return true;
}

function createEmptyBoard() {
  return Array(ROWS)
    .fill()
    .map(() => Array(COLS).fill(EMPTY));
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}
