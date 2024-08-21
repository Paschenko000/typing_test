const gameTimer = 60 * 1000;
window.timer = null;
window.gameStart = null;

function classAction (action, el, className) {
 /*
 * Function for handling adding or removing of the class
 * Expected args:
 * action: 'add' || 'remove'
 * element
 * class
 * */
 if (action === "add") {
  el.className += " " + className;
 } else if (action === "remove") {
  el.className = el.className.replace(className, "");
 }
}

async function getWords() {
 // getWord fetches 100 random words from an api
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
 // formatWord gets a single word and splits its letters into separate spans
 return(
     `<div class="word"><span class="letter">${word.split('').join('</span><span class="letter">')}</span></div>`
 );
}

async function newGame () {
 // newGame creates a game, calls getWords function and displays words on the screen
 classAction("remove", document.getElementById('game'), 'over');
 document.getElementById("info").innerHTML = 60;
     document.getElementById("words").innerHTML = '';
 const words = await getWords();
  words.map((word) => {
   document.getElementById("words").innerHTML += formatWord(word);
  });
 classAction("add", document.querySelector('.word'), "current");
 classAction("add", document.querySelector('.letter'), "current");
 window.timer = null;
}

newGame().then();

function getWpm () {
 // Gets an array of all the words and finds last typed word in the list. After checks the words for mistakes
 const words = [...document.querySelectorAll('.word')];
 const lastTypedWord = document.querySelector(".word.current");
 const lastTypedWordI = words.indexOf(lastTypedWord);
 const typedWords = words.slice(0, lastTypedWordI);

 const correctWords = typedWords.filter(word => {
  const letters = [...word.children];

  const incLetters = letters.filter(letter => letter.className.includes('incorrect') || letter.className.includes('underline') || letter.className.includes('extra'));
  const corLetters = letters.filter(letter => letter.className.includes('correct'));

  return incLetters.length === 0 && corLetters.length === letters.length
 });

 return correctWords.length;
}

function gameOver () {
 clearInterval(window.timer);
 classAction("add", document.getElementById('game'), 'over');
 document.getElementById("info").innerHTML = `${getWpm()} WPM`
}

document.getElementById('game').addEventListener('keyup', ev => {
 // Event listener that on trigger starts the game
 const key = ev.key;
 const currentWord = document.querySelector('.word.current');
 const currentLetter = document.querySelector('.letter.current');
 const expected = currentLetter?.innerHTML || " ";
 const isLetter = key.length === 1 && key !== " ";
 const isSpace = key === " ";
 const isBackspace = key ===  'Backspace';
 const isFirstLetter = currentLetter === currentWord.firstChild;

 if (document.querySelector("#game.over")) {
  return;
 }

 if (!window.timer && isLetter) {
  window.timer = setInterval(
   () => {
    if (!window.gameStart) {
     window.gameStart = (new Date()).getTime();
    }

    const currentTime = (new Date()).getTime();
    const msPassed = currentTime - window.gameStart;
    const sPassed = Math.round(msPassed /1000);
    const sLeft = (gameTimer / 1000) - sPassed;

    if (sLeft <= 0) {
     gameOver();
     return;
    }
    document.getElementById("info").innerHTML = sLeft + " ";
   }, 1000
  );

 }

 if (isLetter) {
  if (currentLetter) {
   classAction("add", currentLetter, key === expected ? "correct" : "incorrect");
   classAction("remove", currentLetter, "current");
   if (currentLetter.nextSibling) {
    classAction("add", currentLetter.nextSibling, "current");
   }
  } else {
   const incorrectLetter = document.createElement('span');
   incorrectLetter.innerHTML = key;
   incorrectLetter.className = 'letter extra';
   currentWord.appendChild(incorrectLetter);
  }

 } else if (isSpace) {
  if (expected !== " ") {
   // TODO: fix the bug with underline so it would underline only skipped words or add underline to all incorrect typed words
   const lettersToInvalidate = [...document.querySelectorAll(".word.current .letter:not(.correct)")];
   lettersToInvalidate.forEach(letter => {
    classAction("add", letter, 'underline');
   });
  }

  classAction('remove', currentWord, 'current');
  classAction('add', currentWord.nextSibling, 'current');

  if (currentLetter) {
   classAction("remove", currentLetter, 'current')
  }

  classAction("add", currentWord.nextSibling.firstChild, 'current');
 }

 if (isBackspace) {

  if (currentLetter && isFirstLetter) {
   console.log('currentletter and isfirstletter')
   // make prev word current, last letter current
   classAction("remove", currentWord, 'current');
   classAction("add", currentWord.previousSibling, 'current');
   classAction("remove", currentLetter, 'current');
   classAction("add", currentWord.previousSibling.lastChild, 'current');
   classAction("remove", currentWord.previousSibling.lastChild, 'incorrect');
   classAction("remove", currentWord.previousSibling.lastChild, 'correct');

  } else if (currentLetter && !isFirstLetter) {
   // move back one letter, invalidate latter
   classAction("remove", currentLetter, 'current');
   classAction("add", currentLetter.previousSibling, 'current');
   classAction("remove", currentLetter.previousSibling, 'incorrect');
   classAction("remove", currentLetter.previousSibling, 'correct');

  } else if (!currentLetter) {
   // Handling backspace click when blank space is expected
   classAction("add", currentWord.lastChild, 'current');
   classAction("remove", currentWord.lastChild, 'correct');
   classAction("remove", currentWord.lastChild, 'incorrect');

  }
 }

 // Moving lines with words
 if (currentWord.getBoundingClientRect().top > 350) {
  const words = document.getElementById('words');
  const  margin = parseInt(words.style.marginTop || '0px');
  words.style.marginTop = (margin - 60) + 'px';
 }

 // Moving cursor
 const nextLetter = document.querySelector('.letter.current');
 const cursor = document.getElementById('cursor');
 const nextWord = document.querySelector('.word.current');

 cursor.style.top = (nextLetter || nextWord).getBoundingClientRect().top + 2  + 'px';

 cursor.style.left = (nextLetter || nextWord).getBoundingClientRect()[nextLetter ? 'left' : 'right']  + 'px';

});

document.getElementById('restart').addEventListener('click', () => {
 gameOver();
 newGame().then();
})
