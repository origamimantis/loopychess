let b = document.getElementById('joincopy');

// https://jsfiddle.net/alvaroAV/a2pt16yq/
b.addEventListener('click', (e) =>
{
  e.preventDefault();

  // Create an auxiliary hidden input
  var aux = document.createElement("input");

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

});
