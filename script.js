
async function getData() {
 const url = "https://random-word-api.herokuapp.com/word?number=100";

 try {
  const response = await fetch(url);
  if (!response.ok) {
   throw new Error(`Response status: ${response.status}`);

  }
  const json = await response.json();
  return (json);

 } catch (err) {
  console.error(err.message);
 }
}

function formatWord(word) {
 return(
     `<div class="">${word}</div>`
 );
}

async function newGame () {
 document.getElementById("words").innerHTML = '';
 const words = await getData();
  words.map((word) => (
    document.getElementById("words").innerHTML += formatWord(word)
  ));
}

newGame().then();
