const PAWN = "pawn";
const KNIGHT = "knight";
const BISHOP = "bishop";
const ROOK = "rook";
const QUEEN = "queen";
const KING = "king";

const WHITE = 1;
const BLACK = -1;

const A = 1;
const B = 2;
const C = 3;
const D = 4;
const E = 5;
const F = 6;
const G = 7;
const H = 8;




class Board
{
  constructor()
  {
    
    this.initializeBoard();
    this.initializePieces();
    this.addPiece(D, 3, PAWN, BLACK);
    this.addPiece(F, 4, BISHOP, WHITE);
    this.addPiece(F, 5, PAWN, WHITE);
    this.addPiece(D, 5, QUEEN, WHITE);
  }
  initializeBoard()
  {
    this.grid = []
    for (let i = 0; i < 8; ++i)
    {
      let row = []
      for (let j = 0; j < 8; ++j)
      {
	row.push(null);
      }
      this.grid.push(row);
    }
  }
  getPiece(c1, c2)
  {
    return this.grid[c2-1][c1-1];
  }
  addPiece(c1, c2, piece, color)
  {
    this.grid[c2-1][c1-1] = {type: piece, color:color};
  }
  initializePieces()
  {
    for (let i = A; i <= H; ++i)
    {
      this.addPiece(i, 2, PAWN, WHITE);
      this.addPiece(i, 7, PAWN, BLACK);
    }
    this.addPiece(A, 1, ROOK, WHITE);
    this.addPiece(A, 8, ROOK, BLACK);

    this.addPiece(B, 1, KNIGHT, WHITE);
    this.addPiece(B, 8, KNIGHT, BLACK);

    this.addPiece(C, 1, BISHOP, WHITE);
    this.addPiece(C, 8, BISHOP, BLACK);

    this.addPiece(D, 1, QUEEN, WHITE);
    this.addPiece(D, 8, QUEEN, BLACK);

    this.addPiece(E, 1, KING, WHITE);
    this.addPiece(E, 8, KING, BLACK);

    this.addPiece(F, 1, BISHOP, WHITE);
    this.addPiece(F, 8, BISHOP, BLACK);

    this.addPiece(G, 1, KNIGHT, WHITE);
    this.addPiece(G, 8, KNIGHT, BLACK);
    

    this.addPiece(H, 1, ROOK, WHITE);
    this.addPiece(H, 8, ROOK, BLACK);
  }

}

module.exports = {
  Board:Board
}
