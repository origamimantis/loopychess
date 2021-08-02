let b = document.getElementById('joincopy');

// https://jsfiddle.net/alvaroAV/a2pt16yq/
b.addEventListener('click', (e) =>
{
  e.preventDefault();

  // Create an auxiliary hidden input
  let aux = document.createElement("input");

  // Get the text from the element passed into the input
  aux.setAttribute("value", b.textContent);

  // Append the aux input to the body
  document.body.appendChild(aux);

  // Highlight the content
  aux.select();

  // Execute the copy command
  document.execCommand("copy");

  // Remove the input from the body
  document.body.removeChild(aux);

  aux.remove();
});

let c = document.getElementById('downloadmoves');

c.addEventListener('click', (e) =>
{
  e.preventDefault();

  let u = document.getElementById('userlist').textContent;
  u = u.split("\r\n");
  let white = u[1].split(" ")[0];
  let black = u[2].split(" ")[0];
  
  let headers = []
  let d = new Date();
  d = d.getFullYear().toString() + "." + (d.getMonth()+1).toString() + "." + d.getDate().toString();
  headers.push('[Site "foonkychess.herokuapp.com"]');
  headers.push('[Date "' + d + '"]');
  headers.push('[White "' + white + '"]');
  headers.push('[Black "' + black + '"]');

  let header = headers.join("\r\n");

  let rawMoves = document.getElementById("movehistory").textContent;
  rawMoves = rawMoves.split("\r\n");
  let rm2 = [];
  for (let rm of rawMoves)
  {
    let interm = rm.split(" ");
    for (let m of interm)
    {
      if (m.length > 0)
	rm2.push(m);
    }
  }

  let movedata = rm2.join(" ");
  let pgndata = header + "\r\n" + movedata;

  let dummy = document.createElement('a');

  // Get the text from the element passed into the input
  dummy.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent( pgndata ) );

  dummy.setAttribute('download', "foonkychess.pgn");

  dummy.click();
  dummy.remove();

});
