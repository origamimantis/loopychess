
const PAWN = "pawn";
const KNIGHT = "knight";
const BISHOP = "bishop";
const ROOK = "rook";
const QUEEN = "queen";
const KING = "king";

const WHITE = 1;
const BLACK = -1;
const SPECTatinG = 0;

const number2letter = "_ABCDEFGH"
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
    this.turn = WHITE;
    this.initializeBoard();
    this.initializePieces();
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
  promote(piece, newtype)
  {
    let [i1,j1] = piece;
    this.grid[j1][i1].type = newtype;
  }
  makeMove(start, end)
  {
    let [i0,j0] = start;
    let [i1,j1] = end;

    if (this.grid[j0][i0].color != this.turn)
      console.log("not your turn");

    let captured = this.grid[j1][i1];
    this.grid[j1][i1] = this.grid[j0][i0];
    this.grid[j0][i0] = null;

    let p = this.grid[j1][i1]

    if (p.moved == false)
      p.moved = true;
    

    this.clearEnPassant()
    if (p.type == PAWN)
    {
      let dx = i1-i0;
      let dy = j1-j0;
      // 2-move => special move
      if (Math.abs(dy) == 2)
      {
	p.en_passant_capturable = true;
      }
      // enpassant capture
      else if (Math.abs(dy)+Math.abs(dx) == 2 && captured === null)
      {
	// original y, capture x = captured piece
	captured = this.grid[j0][i1];
	this.grid[j0][i1] = null;
      }
    }
    else if (p.type == KING)
    {
      let direction = i1-i0;
      // 2-move => castle
      if (Math.abs(direction) == 2)
      {
	// king-side
	if (direction > 0)
	{
	  this.grid[j1][5] = this.grid[j1][7];
	  this.grid[j1][7] = null;
	}
	// queen-side
	else if (direction < 0)
	{
	  this.grid[j1][3] = this.grid[j1][0];
	  this.grid[j1][0] = null;
	}
      }
    }



    this.turn = -this.turn;

  }
  // TODO maybe just track the pawn that moved up 2 spaces the previous turn
  clearEnPassant()
  {
    for (let i = 0; i < 8; ++i)
    {
      for (let j = 0; j < 8; ++j)
      {
	if (this.grid[j][i] !== null && this.grid[j][i].en_passant_capturable == true)
	  this.grid[j][i].en_passant_capturable = false;
      }
    }
  }
  addPiece(c1, c2, piece, color)
  {
    this.grid[c2-1][c1-1] = {
      type: piece,
      color:color,
      moved:false,
      en_passant_capturable : false,
    };
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
