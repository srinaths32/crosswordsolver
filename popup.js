// function to empty all list elements from a <table> (par: elementList)
function clearList(elementList) {
  elementList.innerHTML = "";
}

// display function to show list of elements formatted [length, word, clue] (par: elements) in a <table> (par: elementList)
function display(elementList, elements) {
  // create header for table
  elements.unshift(["Length", "Word", "Clue"])

  let tr; // allocate table row element
  for (let i = 0; i < elements.length; i++) {
    tr = document.createElement("tr"); // create table row element
    let td;
    // alternate background color (ignoring table header row)
    if (i != 0) {
      if (i % 2 == 1) {
        tr.style.cssText = `background-color: var(--grayBackgroundColor);`;
      }
    }
  
    // add each of the three parts of an answer [length, word, clue] to the table row
    for (let j = 0; j < 3; j++) {
      if (i == 0) {
        td = document.createElement("th"); // table header
      } else {
        td = document.createElement("td"); // table data
      }
      td.appendChild(document.createTextNode(elements[i][j]));
      tr.appendChild(td);
    }
    elementList.appendChild(tr); // add table row to the table
  }
}

// function to show error message (par: errorMessage) in a <p> (par: messageTag)
function showErrorMessage(messageTag, errorMessage) {
  messageTag.innerHTML = errorMessage;
}

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

// function to extract clue from raw HTML (par: rawHTML)
function extractClue(rawHTML) {
  postTimerIndex = rawHTML.indexOf("Rebus"); // get the start of the header index after the timer
  indexOfClueLabel = indexOfNextNumber(rawHTML, postTimerIndex); // get the index of the highlighted clue label (first number)
  indexOfClueStart = indexOfNextSpace(rawHTML, indexOfClueLabel) + 1; // get the index of the clue text (after space after label)
  indexOfClueEnd = rawHTML.indexOf("\n1\n", indexOfClueStart); // get the index of the clue text end (space before the 1 clue)
  return rawHTML.slice(indexOfClueStart, indexOfClueEnd); // slice the text
}

// function to extract answers with strength, length, and other clue using multiple regexp
function extractAnswers(fullHTML) {
  answersTable = fullHTML.slice(fullHTML.indexOf("<tbody>") + 8, fullHTML.indexOf("</tbody>")); // get answer table text
  stripped = answersTable.replaceAll("\n", ""); // remove all \n
   
  let tableRowMatch;
  let rowElementMatch;
  let rowElements;
  let answers = [];
  tableRowRegex = /<tr[^>]*>(.*?)<\/tr>/g; // Regex to split table rows
  while ((tableRowMatch = tableRowRegex.exec(stripped)) !== null) { // find next row
    rowElements = [];
    rowElementRegex = /<td[^>]*>(.*?)<\/td>/g; // Regex to split row elements

    while ((rowElementMatch = rowElementRegex.exec(tableRowMatch[1])) !== null) { // find next element in row
      allHTMLRegex = /<.*?>|<\/.*>/g; // Regex to identify all html tags (anything between <>) to remove
      trimmed = rowElementMatch[1].replaceAll(allHTMLRegex, "").trim(); // remove tags from element and trim
      cleaned = trimmed.replaceAll("&quot;", "\"").replaceAll("&#39;", "'"); // convert quotes and apostrophes
      rowElements.push(cleaned);
    }
    if (rowElements.length == 4) {
      rowElements = rowElements.slice(1, 4); // cut the strength percentage off
      answers.push(rowElements); // add row of elements to 2D array answers
    }
  }
  // cut to only return top 15 answers
  if (answers.length > 15) {
    answers = answers.slice(0, 16)
  }
  return answers;
}

// find clue and populate answers in extension body
async function revealClue() {
  
  // get current tab
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  
  // allocate/define variables
  let result;
  let errorMessage;
  let errorTriggered = false;
  let clue;
  let answers;

  // check whether nytimes.com/crossword is in url
  if (! tab.url.includes("nytimes.com/crosswords")) {
    errorMessage = 'Navigate to crossword page';
    errorTriggered = true;
  } else {
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
  }
  
  // check whether the game is paused
  if (result != undefined) {
    if (result.includes("Your game is paused") && result.includes("Ready to play?") && result.includes("Continue")) {
      errorMessage = 'Unpause your game';
      errorTriggered = true;
    } else {
      // extract currently highlighted clue from html
      clue = extractClue(result);

      // fetch potential answers from crossword-solver.io
      var response = await fetch('https://crossword-solver.io/clue/' + clue + '/');
      switch (response.status) {
      // status "OK"
        case 200:
          var fullHTML = await response.text();
          answers = extractAnswers(fullHTML);
          break;
          // status "Not Found"
        case 404:
          errorMessage = 'Cannot find answer to clue right now';
          errorTriggered = true;
          break;
      }
    }
  }

  // display potential answers in extension body or errors if necessary
  if (errorTriggered) {
    // get the error message <p> in extension body
    const errorTag = document.getElementById("errorMessage");
    showErrorMessage(errorTag, errorMessage);
  } else {
    // get the answer list <ul> in extension body
    const answerlist = document.getElementById("answers");
    let listItems = answers

    // clear list in case there were items before and display answers
    clearList(answerlist);
    display(answerlist, listItems);
  }

  // remove button
  document.getElementById("checkPage").remove();
}

// call revealClue everytime reveal button is clicked
document.getElementById("checkPage").onclick = revealClue;