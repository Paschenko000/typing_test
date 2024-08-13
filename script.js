
async function getData() {
 const url = "https://random-word-api.herokuapp.com/word?number=10";

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
console.log(getData());

function newGame () {
 document.getElementById("words").innerHTML = getData();
}
