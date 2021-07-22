//adjacent 0-3
//corners ???
// edges: list [adj0, corner, adj1, corner, adj2, corner, corner, adj3, corner]

//bishop: take orientation by initially setting 2 adjacent tiles as "bounds",
//then take slice of array between the bounds repeatedly to get available moves.


class Tile
{
  constructor(name, edges)
  {
    this.name = name;
    this.edges = [];
  }
  add_edge(tile)
  {
    this.edges.push(tile)
  }

  get_edges()
  {
  }

  get_edge_names()
  {
  }

}


export class Board
{
  constructor(file)
  {
    let lines = text.split("\n")
    lines.pop()
    
    this.tiles = {}
    
    for (let i = 0; i < lines.length; ++ i )
    {
      name, ...edges = lines[i].split(" ");
      this.tiles[name] = [new Tile(name), edges];
    }

    
    for (let i = 0; i < lines.length; ++ i )
    {
      name, ...edges = lines[i].split(" ");
      tile, enames = this.tiles[name];
      for (let n of enames)
      {
	tile.add_edge(this.tiles[n]);
      }
    }
  }
}
