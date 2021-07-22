

export const CPType = {
  PAWN:0,
  KNIGHT:1,
  BISHOP:2,
  ROOK:3,
  QUEEN:4,
  KING:5
}

class ChessPieceBase
{
  constructor(type)
  {
    this._type = type;
    this._node = null;
  }

  move(node)
  {
    this._node = node;
  }

  getpotentialmovable()
  {
  }

  remove()
  {
    this._node = null;
  }
}

class Pawn
{
  constructor()
  {
    super(CPType.PAWN);
    this._moved = false;
  }
}
  
























