// add element of a certain type w or w/o text w or w/o id or styling under a wrapElement
function addNewElement(type, text, id, className, wrapElement) {
  const element = document.createElement(type); // create new element of type
  if (text != '') element.innerHTML = text; // add text to element
  if (id != '') element.setAttribute('id', id); // add id tag to element
  if (className != '') element.setAttribute('class', className); // add styling to element
  wrapElement.appendChild(element); // put element under wrapElement
  return element;
}

// function to show error message (par: errorMessage) in a <p> w specific id (par: messageTag)
function showErrorMessage(errorMessage) {
  // remove button
  if (document.getElementById("checkPage")) document.getElementById("checkPage").remove();
  
  // show error
  const errorText = document.getElementById("errorMessage");
  errorText.setAttribute('class', 'errorMessage errorMoved');
  errorText.innerHTML = errorMessage;
}

// function to display crossword answer (par: answer) with its clue number (clueNumber) and text (clue) 
function showClueAnswer(clueNumber, clue, answer) {
  document.getElementById("checkPage").remove();
  outsideDiv = addNewElement('div', '', '', 'crosswordClueAndAnswer', document.body);
  addNewElement('p', clueNumber, '', 'clueNumber', outsideDiv);
  addNewElement('p', answer, '', 'crosswordAnswer', outsideDiv)
}

// function to display wordle answer (par: answer) 
function showWordleAnswer(answer) {
  document.getElementById("checkPage").remove();
  box = addNewElement('div', '', '', 'wordleAnswerBox', document.body);
  addNewElement('p', answer, '', 'wordleAnswer', box);
}

// function to display reveal buttons for connections
let outsideDiv;
let firstButton;
let secondButton;
let thirdButton;
let fourthButton;
function showConnectionsButtons() {
  document.getElementById("checkPage").remove();
  // header
  connectionsHeader = addNewElement('p', 'Click on a color to reveal its corresponding group', 'connectionsHeader', 'connectionsHeader', document.body);
  // buttons
  outsideDiv = addNewElement('div', '', 'connectionsDiv', 'connectionsDiv', document.body);
  firstButton = addNewElement('div', '', 'yellowBut', 'connectionsButton yellow-bg', outsideDiv);
  secondButton = addNewElement('div', '', 'greenBut', 'connectionsButton green-bg', outsideDiv);
  thirdButton = addNewElement('div', '', 'blueBut', 'connectionsButton blue-bg', outsideDiv);
  fourthButton = addNewElement('div', '', 'purpleBut', 'connectionsButton purple-bg', outsideDiv);
  firstButton.addEventListener("click", function() {revealConnections(0)});
  secondButton.addEventListener("click", function() {revealConnections(1)});
  thirdButton.addEventListener("click", function() {revealConnections(2)});
  fourthButton.addEventListener("click", function() {revealConnections(3)});
}

// function to reveal the answers to connections game
function showConnectionsAnswers(theme, group, level) {
  // remove header and buttons
  document.getElementById('connectionsHeader').innerText = '';
  firstButton.remove();
  secondButton.remove();
  thirdButton.remove();
  fourthButton.remove();

  // change background of div
  levelStyles = ['yellow-bg', 'green-bg', 'blue-bg', 'purple-bg'];
  outsideDiv.setAttribute('class', levelStyles[level] + ' connectionsAnswerDiv');

  // add answer
  addNewElement('p', theme, '', 'themeText', outsideDiv);
  addNewElement('p', group, '', 'connectionsAnswerText', outsideDiv);
}

// function to sort a list by descending length keeping the first index in place (spelling bee and letter boxed)
function sortLengthKeepFirst(listOfAnswers) {
  console.log(listOfAnswers);
  firstWord = listOfAnswers[0];
  sortedRest = listOfAnswers.slice(1, listOfAnswers.length).sort(function(a, b) {
    return (b.length - a.length);
  });
  sortedRest.unshift(firstWord);
  return sortedRest
}

// function to reveal answers to spelling bee and letter boxed game as lists
function showListAnswers(answers, game) {
  document.getElementById("checkPage").remove();
  listOfAnswers = addNewElement('ul', '', '', 'answerList', document.body); // add list <ul> in html
  sortedAnswers = sortLengthKeepFirst(answers);
  for (let i = 0; i < sortedAnswers.length; i++) {
    if (i == 0 && game == Game.Letter) addNewElement('li', sortedAnswers[i], '', 'answerElement salmon-bg', listOfAnswers);
    else if (i == 0 && game == Game.Spelling) addNewElement('li', sortedAnswers[i], '', 'answerElement spelling-bg', listOfAnswers);
    else addNewElement('li', sortedAnswers[i], '', 'answerElement', listOfAnswers); // add each answer <li> in the <ul> answer list
  }
}

// define enum to store game
const Game = {
  Crossword: 0,
  Spelling: 1,
  Letter: 2,
  Wordle: 3,
  Connections: 4,
  Error: 5,
};
let game = Game.Error;
let url;
let tab;
// get which game is being played
async function getGame() {
  // get current tab url
  [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  url = tab.url;

  // identify which extension is being played
  if (url.includes("nytimes.com/crosswords/game")) {
    game = Game.Crossword;
  } else if (url.includes("nytimes.com/puzzles/spelling-bee")) {
    game = Game.Spelling;
  } else if (url.includes("nytimes.com/puzzles/letter-boxed")) {
    game = Game.Letter;
  } else if (url.includes("nytimes.com/games/wordle")) {
    game = Game.Wordle;
  } else if (url.includes("nytimes.com/games/connections")) {
    game = Game.Connections;
    showConnectionsButtons();
  } else {
    showErrorMessage("Navigate to a NYT puzzle page");
  }
}
// call above function onloaded 
window.onloaded = getGame();

// function to find index of next number in a string (par: rawHTML) after given index (par: index)
function indexOfNextNumber(rawHTML, index) {
  for (let i = index + 1; i < rawHTML.length; i++) {
    if (rawHTML[i] >= '0' && rawHTML[i] <= '9') {
      return i;
    }
  }
}

// function to find index of next space in a string (par: rawHTML) after given index (par: index)
function indexOfNextSpace(rawHTML, index) {
  for (let i = index + 1; i < rawHTML.length; i++) {
    if (rawHTML[i] = '\n') {
      return i + 1;
    }
  }
}

// function to extract clue from raw HTML (par: rawHTML) along with clue number/type
function extractCrosswordClue(rawHTML) {
  postTimerIndex = rawHTML.indexOf("Rebus"); // get the start of the header index after the timer
  indexOfClueLabel = indexOfNextNumber(rawHTML, postTimerIndex); // get the index of the highlighted clue label (first number)
  indexOfClueStart = indexOfNextSpace(rawHTML, indexOfClueLabel) + 1; // get the index of the clue text (after space after label)
  indexOfClueEnd = rawHTML.indexOf("\n1\n", indexOfClueStart); // get the index of the clue text end (space before the 1 clue)
  return [rawHTML.slice(indexOfClueLabel, indexOfClueStart).trim(), rawHTML.slice(indexOfClueStart, indexOfClueEnd)]; // slice the text
}

// function to extract formatted date from url
function extractFormattedDateFromURL(crosswordUrl, bonusType) {
  let dateRegex;
  if (!bonusType) {
    dateRegex = /\/(\d{4})\/(\d{1,2})\/(\d{1,2})/;
    const match = crosswordUrl.match(dateRegex);
  
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
  
      return `${year}-${month}-${day}`;
    } else {
      return null; // Handle cases where the URL doesn't match the expected pattern
    }  
  } else {    
    dateRegex = /\/(\d{4})\/(\d{1,2})/;
    const match = crosswordUrl.match(dateRegex);

    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = '01'
      return `${year}-${month}-${day}`;
    } else {
      return null; // Handle cases where the URL doesn't match the expected pattern
    }  
  }
}

// function to get current date in yyyy-mm-dd format
function getCurrentDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Adding 1 to the month because it's zero-based
  const day = now.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// function to get date on screen in yyyy-mm-dd format for mini
function getMiniDate(fullText) {
  adjusted = fullText.slice("The Mini Crossword".length);
  regex = /\b([A-Z][a-z]+day, [A-Z][a-z]+ \d{1,2}, \d{4})\b/g; // regex to get date from html
  dateString = adjusted.match(regex); // find first match
  console.log(dateString);
  now = new Date(dateString); // turn string into a date object
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Adding 1 to the month because it's zero-based
  const day = now.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// function to get difference between today and another day
function dateDiffInDays(firstDate) {
  // adjust given date to reflect same time in this timezone
  firstDate.setTime(firstDate.getTime() + firstDate.getTimezoneOffset() * 60 * 1000);

  const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds
  const secondDate = new Date();
  console.log(secondDate);
  const diffInMilliseconds = Math.abs(firstDate - secondDate);
  const diffInDays = Math.trunc(diffInMilliseconds / oneDay);
  return diffInDays;
}

// function to extract answer to current clue from url
function extractAnswer(fullDict, clueNumber) {
  cells = fullDict.body[0].cells; // array [{answer: "A", ...}, ...]
  clues = fullDict.body[0].clues; // array [{cells: [1, 2, ...], direction: 'Down', label: '1', ...}, ...]
  
  // split clue of type 20A into 20 and A
  l = clueNumber.length;
  clueNum = clueNumber.slice(0, l - 1);
  typeAbbr = clueNumber.slice(l - 1, l);
  typeDict = {'A': 'Across', 'D': 'Down'};
  clueType = typeDict[typeAbbr];

  // find relevant cell numbers
  let cellsNecessary;
  for (let i = 0; i < clues.length; i++) {
    if (clues[i].direction == clueType && clues[i].label == clueNum) {
      cellsNecessary = clues[i].cells;
    }
  }

  // construct answer from cells values
  let answer = '';
  for (let i = 0; i < cellsNecessary.length; i++) {
    answer += cells[cellsNecessary[i]].answer;
  }
  return answer;
}

// find clue and show answer in extension body
async function revealClue() {  
  // allocate/define variables
  let result;
  let errorMessage;
  let errorTriggered = false;
  let fullClue;
  let clueNumber;
  let clue;
  let answer;

  // get all html code and save it in result
  try {
      [{result}] = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: () => document.documentElement.innerText,
      });
  } catch (e) {
      errorMessage = 'Cannot access page'; // display error message if on the right page but cannot access html
      errorTriggered = true;
      return;
  }
  
  // check whether the game is paused
  if (result != undefined) {
    if ((result.includes("Your game is paused") && result.includes("Ready to play?") && result.includes("Continue")) || (result.includes("Ready to start solving?") && result.includes("Play"))) {
      errorMessage = 'Unpause your game';
      errorTriggered = true;
    } else {
      // extract currently highlighted clue from html
      fullClue = extractCrosswordClue(result);
      clueNumber = fullClue[0];
      clue = fullClue[1];

      // get daily, mini, or bonus crossword api corresponding to this day
      let apiUrl = 'https://www.nytimes.com/svc/crosswords/v6/puzzle/';
      if (url.includes("daily")) {
        apiUrl += 'daily/';
        apiUrl += extractFormattedDateFromURL(url, false) + '.json';
      } else if (url.includes("mini")) {
        apiUrl += 'mini/';
        datePart = extractFormattedDateFromURL(url, false);
        if (datePart != null) apiUrl += datePart + '.json';
        else apiUrl += getMiniDate(result) + '.json'; // adjustment if getting today's mini
      } else {
        apiUrl += 'bonus/';
        apiUrl += extractFormattedDateFromURL(url, true) + '.json';
      }

      // fetch answers from nyt api
      var response = await fetch(apiUrl);
      switch (response.status) {
        // status "OK"
        case 200:
          var fullDict = await response.json();
          answer = extractAnswer(fullDict, clueNumber); // extract specific clue answer from full table
          break;
        // status "Not Found"
        case 404:
          errorMessage = 'Cannot find answer to clue right now';
          errorTriggered = true;
          break;
      }
    }
  }

  // display answer in extension body or errors if necessary
  if (errorTriggered) {
    // display error in the error message <p> in extension body
    showErrorMessage(errorMessage);
  } else {
    // display answer to clue
    showClueAnswer(clueNumber, clue, answer);
  }
}

// find wordle answer
async function revealWordle() {
  // GET wordle api
  let apiUrl = 'https://www.nytimes.com/svc/wordle/v2/' + getCurrentDate() + '.json';
  var response = await fetch(apiUrl);
  
  let errorTriggered;
  let errorMessage;
  let answer;

  switch (response.status) {
    // status "OK"
    case 200:
      var fullDict = await response.json();
      answer = fullDict.solution;
      break;
    // status "Not Found"
    case 404:
      errorMessage = 'Cannot find answer right now';
      errorTriggered = true;
      break;
  }

  // display answer or errors if necessary
  if (errorTriggered) {
    // display error in the error message <p> in extension body
    showErrorMessage(errorMessage);
  } else {
    // display wordle answer
    showWordleAnswer(answer);
  }
}

// find connections answer
async function revealConnections(level) {
  // GET connections api
  let apiUrl = 'https://www.nytimes.com/games-assets/connections/game-data-by-day.json';
  var response = await fetch(apiUrl);
  
  let errorTriggered;
  let errorMessage;
  let answerTheme;
  let answerGroup;

  switch (response.status) {
    // status "OK"
    case 200:
      var fullDict = await response.json(); // get api response
      groups = fullDict[dateDiffInDays(new Date('2023-06-12'))].groups; // get today's answers
      
      // get specific answer corresponding to level parameter
      for (const [theme, valueDict] of Object.entries(groups)) {
        if (level == valueDict.level) {
          answerTheme = theme;
          answerGroup = valueDict.members;
        }
      }      
      break;
    // status "Not Found"
    case 404:
      errorMessage = 'Cannot find answer right now';
      errorTriggered = true;
      break;
  }

  // display answer or errors if necessary
  if (errorTriggered) {
    // display error in the error message <p> in extension body
    showErrorMessage(errorMessage);
  } else {
    // display connections answer
    groupText = '';
    for (let i = 0; i < 4; i++) {
      groupText += answerGroup[i] + ', '
    }
    showConnectionsAnswers(answerTheme, groupText.slice(0, groupText.length - 2), level);
  }
}

// find spelling bee answers
async function revealSpelling() {
  // get page html
  try {
    [{result}] = await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    // get DOM of spelling bee page as a string 
    func: () => {
      var html = '',
          node = document.firstChild;
      while (node) {
          switch (node.nodeType) {
          case Node.ELEMENT_NODE:
              html += node.outerHTML;
              break;
          case Node.TEXT_NODE:
              html += node.nodeValue;
              break;
          case Node.CDATA_SECTION_NODE:
              html += '<![CDATA[' + node.nodeValue + ']]>';
              break;
          case Node.COMMENT_NODE:
              html += '<!--' + node.nodeValue + '-->';
              break;
          case Node.DOCUMENT_TYPE_NODE:
              html += "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>\n';
              break;
          }
          node = node.nextSibling;
      }
      return html;
    }
    });
  } catch (e) {
      errorMessage = 'Cannot access page'; // display error message if on the right page but cannot access html
      errorTriggered = true;
      return;
  }

  // get answer list from page
  if (result != undefined) {
    const start = result.indexOf('"answers":');
    const end = result.indexOf(',"id":');
    const answer_dict = JSON.parse(
      "{" + result.slice(start, end) + "}"
    );

    answers = answer_dict.answers;
    showListAnswers(answers, game);
  }
}

// find letter boxed answers
async function revealLetter() {
  // get page html
  try {
    [{result}] = await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    // get DOM of spelling bee page as a string 
    func: () => {
      var html = '',
          node = document.firstChild;
      while (node) {
          switch (node.nodeType) {
          case Node.ELEMENT_NODE:
              html += node.outerHTML;
              break;
          case Node.TEXT_NODE:
              html += node.nodeValue;
              break;
          case Node.CDATA_SECTION_NODE:
              html += '<![CDATA[' + node.nodeValue + ']]>';
              break;
          case Node.COMMENT_NODE:
              html += '<!--' + node.nodeValue + '-->';
              break;
          case Node.DOCUMENT_TYPE_NODE:
              html += "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>\n';
              break;
          }
          node = node.nextSibling;
      }
      return html;
    }
    });
  } catch (e) {
      errorMessage = 'Cannot access page'; // display error message if on the right page but cannot access html
      errorTriggered = true;
      return;
  }

  // get answer list from page
  if (result != undefined) {
    const start = result.indexOf("window.gameData = ") + 18;
    const end = result.indexOf("</script>", start);
    var dict = result.slice(start, end);
    dict = dict.slice(0, dict.lastIndexOf(',"')) + "}";
  
    const answer_dict = JSON.parse(dict);
    answers = answer_dict.dictionary;
  
    answers.unshift(answer_dict.ourSolution[0] + " - " + answer_dict.ourSolution[1]);
    showListAnswers(answers, game);
  }  
}

// multipurpose reveal function for all puzzles except connections
async function reveal() {
  if (game == Game.Crossword) {
    await revealClue();
  } else if (game == Game.Spelling) {
    await revealSpelling();
  } else if (game == Game.Wordle) {
    await revealWordle();
  } else if (game == Game.Letter) {
    await revealLetter();
  }
}

// call reveal() everytime reveal button is clicked
document.getElementById("checkPage").onclick = reveal;