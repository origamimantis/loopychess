const allowedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";


let realurl = window.location.href;

let [path, params] = realurl.split("?");
let searchParams = new URLSearchParams(params);

let a = realurl.split("/");
let rootdir = a.slice(3, -2).join("/")
if (rootdir != "")
  rootdir += "/"

if (searchParams.has("room") === false)
  window.location.replace("/" + rootdir);

let id = searchParams.get("room");


// https://stackoverflow.com/questions/4434076/best-way-to-alphanumeric-check-in-javascript
function isAlphaNumeric(str) {
  let code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (!(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)) { // lower alpha (a-z)
      return false;
    }
  }
  return true;
};


let form = document.getElementById('form');
let name = document.getElementById('name_input');
let error = document.getElementById('error');

document.getElementById('jointitle').textContent += id.toUpperCase();

form.addEventListener('submit', (e) =>
{
  e.preventDefault();
  
  if (name.value.length == 0)
  {
    error.textContent = "Please enter a name!";
    return;
  }
  if (isAlphaNumeric(name.value) == false)
  {
    error.textContent = "Your name can only have letters and numbers.";
    return
  }
  error.textContent = "";
  window.location.replace("/" + rootdir + "game?room="+id.toLowerCase()+"&name=" + name.value);
});
