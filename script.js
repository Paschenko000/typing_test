const gameTimer = 60 * 1000;
window.timer = null;
window.gameStart = null;

function classAction (action, el, className) {
 /*
 * Function for handling adding or removing of the class
 * action: 'add' || 'remove'
 * */
 if (action === "add") {
  el.className += " " + className;
 } else if (action === "remove") {
  el.className = el.className.replace(className, "");
 }
}

function formatDate(date) {
 date = new Date(date);
 let hours = date.getHours();
 let minutes = date.getMinutes();

 minutes = minutes < 10 ? '0' + minutes : minutes;

 let day = date.getDate();

 const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
 let month = monthNames[date.getMonth()];

 return `${hours}:${minutes} ${day} ${month}`;
}

async function getWords() {
 // getWord fetches 100 random words from an api
 const url = "https://random-word-api.herokuapp.com/word?number=100";
 const urlIpsum = "https://api.api-ninjas.com/v1/loremipsum?paragraphs=2"

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
 const words = [...await getWords()];
 words.map((word) => {
   document.getElementById("words").innerHTML += formatWord(word);
  });
 classAction("add", document.querySelector('.word'), "current");
 classAction("add", document.querySelector('.letter'), "current");
 window.timer = null;
}

newGame().then();
displayAllScore();

function getTypingSpeed () {
 // Gets an array of all the words and finds last typed word in the list. After checks the words for mistakes
 // returns {wpm: number, accuracy: number}
 const words = [...document.querySelectorAll('.word')];
 const lastTypedWord = document.querySelector(".word.current");
 const lastTypedWordI = words.indexOf(lastTypedWord);
 const typedWords = words.slice(0, lastTypedWordI + 1);
 let typedLettersCount = 0;
 let incLettersCount = 0;


 typedWords.forEach((word, index) => {
  const letters = [...word.children];

  const typedLetters = index === typedWords.length - 1 ? letters.slice(0, letters.findIndex(({classList}) => classList.contains('current'))) : letters;

  for (const letter of typedLetters) {
   if (!letter.classList.contains('correct')) {
    incLettersCount++;
   }
  }
  typedLettersCount += typedLetters.length;
 })

 return {wpm: Math.round(typedLettersCount / 5), accuracy: Math.round(((typedLettersCount - incLettersCount) * 100 ) / typedLettersCount)}
}

function gameOver () {
 document.body.style.overflow = "auto";
 clearInterval(window.timer);
 classAction("add", document.getElementById('game'), 'over');
 const result = getTypingSpeed();

 document.getElementById("info").innerHTML = `${result.wpm} WPM`;
 addScore(result);
 displayAllScore();
 const cursor = document.getElementById('cursor');
 cursor.style.top = '265px';
 cursor.style.left = '129px';
}

function restartGame() {
 document.body.style.overflow = "auto";
 clearInterval(window.timer);
 classAction("add", document.getElementById('game'), 'over');
 const cursor = document.getElementById('cursor');
 cursor.style.top = '265px';
 cursor.style.left = '129px';
}

function getScore() {
 const scoreData = localStorage.getItem('score');

 if (!scoreData) {
  return [];
 }

 try {
  const score = JSON.parse(scoreData);
  if (!Array.isArray(score)) {
   return [];
  }
  return score;
 } catch (err) {
  return [];
 }

}

function addScore(result) {
 // Creates and updates localStorage with key score
  const storage = getScore();
  storage.push({wpm: result.wpm, accuracy: result.accuracy, date: new Date()});
  localStorage.setItem("score", JSON.stringify(storage));
}

function displayAllScore() {
 const score = getScore();

 if (!score.length) {
  return;
 } else {
  document.getElementById('score').innerHTML = score.reduce((acc, item) =>
   acc += `<div class="score dark"> <div class="result"> <span>${item.wpm} wpm</span><span>accuracy ${item.accuracy} %</span></div> <span>${formatDate(item.date)}</span></div>`
  , '');
  classAction("add", document.getElementById('no-score'), "display-message");
 }
}

document.getElementById('game').addEventListener('keyup', ev => {
 // Event listener that on trigger starts the game
 document.body.style.overflow = "hidden";
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
   incorrectLetter.className = 'letter incorrect extra';
   currentWord.appendChild(incorrectLetter);
  }

 } else if (isSpace) {
  if (expected !== " ") {
   const lettersToInvalidate = [...document.querySelectorAll(".word.current .letter:not(.correct)")];
   lettersToInvalidate.forEach(letter => {
    classAction("add", letter, 'incorrect');
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
   // make prev word current, last letter current

   classAction("remove", currentWord, 'current');
   classAction("add", currentWord.previousSibling, 'current');
   classAction("remove", currentLetter, 'current');
   classAction("add", currentWord.previousSibling.lastChild, 'current');
   const currentL = currentWord.previousSibling.lastChild;

   if (currentL.classList.contains("extra")) {
    currentL.remove();
   }
   classAction("remove", currentWord.previousSibling.lastChild, 'incorrect');
   classAction("remove", currentWord.previousSibling.lastChild, 'correct');


  } else if (currentLetter && !isFirstLetter) {
   // move back one letter, invalidate latter
   classAction("remove", currentLetter, 'current');
   classAction("add", currentLetter.previousSibling, 'current');
   classAction("remove", currentLetter.previousSibling, 'incorrect');
   classAction("remove", currentLetter.previousSibling, 'correct');

   const currentL = currentLetter.previousSibling;
   if (currentL.classList.contains("extra")) {
    currentL.remove();
   }

  } else if (!currentLetter) {
   // Handling backspace click when blank space is expected

   if (currentWord.lastChild.classList.contains("extra")) {
    currentWord.lastChild.remove();
   } else {
    classAction("add", currentWord.lastChild, 'current');
    classAction("remove", currentWord.lastChild, 'correct');
    classAction("remove", currentWord.lastChild, 'incorrect');
   }

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
 restartGame();
 newGame().then();
})
