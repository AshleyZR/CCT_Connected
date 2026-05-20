/* ************************************ */
/* Helper Functions                     */
/* ************************************ */
var getInstructFeedback = function() {
	return '<div class = centerbox><p class = center-block-text>' + feedback_instruct_text +
		'</p></div>'
}

function assessPerformance() {
	var experiment_data = jsPsych.data.getTrialsOfType('single-stim-button')
	var missed_count = 0
	var trial_count = 0
	var rt_array = []
	var rt = 0
	for (var i = 0; i < experiment_data.length; i++) {
		rt = experiment_data[i].rt
		trial_count += 1
		if (rt == -1) {
			missed_count += 1
		} else {
			rt_array.push(rt)
		}
	}
	//calculate average rt
	var avg_rt = -1
	if (rt_array.length !== 0) {
		avg_rt = math.median(rt_array)
	} 
	var missed_percent = missed_count/experiment_data.length
  	credit_var = (missed_percent < 0.4 && avg_rt > 200)
	jsPsych.data.addDataToLastTrial({"credit_var": credit_var,
									"performance_var": performance_var})
}

function deleteText(input, search_term) {
	index = input.indexOf(search_term)
	indexAfter = input.indexOf(search_term) + search_term.length
	return input.slice(0, index) + input.slice(indexAfter)
}


function appendTextAfter(input, search_term, new_text) {
	var index = input.indexOf(search_term) + search_term.length
	return input.slice(0, index) + new_text + input.slice(index)
}

function appendTextAfter2(input, search_term, new_text, deleted_text) {
	var index = input.indexOf(search_term) + search_term.length
	var indexAfter = index + deleted_text.length
	return input.slice(0, index) + new_text + input.slice(indexAfter)
}

var getBoard = function(board_type) {
	var board = ''
	if (board_type == 2) {
		board = "<div class = cardbox>"
		for (i = 1; i < 33; i++) {
			board += "<div class = square><input type='image' id = " + i +
				" class = 'card_image' src='images/beforeChosen.png' onclick = instructCard(this.id)></div>"
		}

	} else {
		board = "<div class = cardbox>"
		for (i = 1; i < 33; i++) {
			board += "<div class = square><input type='image' id = " + i +
				" class = 'card_image select-button' src='images/beforeChosen.png' onclick = chooseCard(this.id)></div>"
		}
	}
	board += "</div>"
	return board
}


var getText = function() {
	return '<div class = centerbox><p class = block-text>Overall, you earned ' + totalPoints + ' points. These are the points used for your bonus from three randomly picked trials:  ' +
		'<ul list-text><li>' + prize1 + '</li><li>' + prize2 + '</li><li>' + prize3 + '</li></ul>' +
		'</p><p class = block-text>Press <strong>enter</strong> to continue.</p></div>'
}

var appendPayoutData = function(){
	jsPsych.data.addDataToLastTrial({reward: [prize1, prize2, prize3]})
}

var appendTestData = function() {
	jsPsych.data.addDataToLastTrial({
		which_round: whichRound,
		num_click_in_round: whichClickInRound,
		num_loss_cards: numLossCards,
		gain_amount: gainAmt,
		loss_amount: lossAmt,
		round_points: roundPoints,
		clicked_on_loss_card: lossClicked,
		round_type: round_type
	})
}

// Functions for "top" buttons during test (no card, end round, collect)
var collect = function() {
	for (var i = 0; i < CCT_timeouts.length; i++) {
			clearTimeout(CCT_timeouts[i]);
		}
	currID = 'collectButton'
	whichClickInRound = whichClickInRound + 1
}

var noCard = function() {
	currID = 'noCardButton'
	roundOver=2
	whichClickInRound = whichClickInRound + 1
}

var endRound = function() {
	currID = 'endRoundButton'
	roundOver=2
	whichClickInRound = whichClickInRound + 1
}

// Clickable card function during test
var chooseCard = function(clicked_id) {
  currID = parseInt(clicked_id)
  whichClickInRound = whichClickInRound + 1

  // canonical: loss if and only if clicked card is in whichLossCards
  if (whichLossCards.indexOf(currID) != -1) {
    clickedLossCards.push(currID)
    index = unclickedCards.indexOf(currID, 0)
    unclickedCards.splice(index, 1)
    roundPoints = roundPoints - lossAmt
    lossClicked = true
    roundOver = 2
  } else { // gain card
    clickedGainCards.push(currID)
    index = unclickedCards.indexOf(currID, 0)
    unclickedCards.splice(index, 1)
    roundPoints = roundPoints + gainAmt
  }
}

var getRound = function() {

  function renderCard(i, state) {
    var src = 'images/beforeChosen.png';
    var cls = 'card_image';
    var click = '';

    if (state === 0) {
      cls += ' select-button';
      click = " onclick = chooseCard(this.id)";
    } else if (state === 1) {
      if (clickedGainCards.indexOf(i) !== -1) {
        src = 'images/chosen.png';
      } else {
        cls += ' select-button';
        click = " onclick = chooseCard(this.id)";
      }
    } else if (state === 2) {
      if (clickedGainCards.indexOf(i) !== -1) {
        src = 'images/chosen.png';
      } else if (clickedLossCards.indexOf(i) !== -1) {
        src = 'images/loss.png';
      }
    }

    return "<div class = square><input type='image' id = '" + i + "' class = '" + cls + "' src='" + src + "'" + click + "></div>";
  }

  function buildBoard(state) {
    var html = "<div class = cardbox>";
    for (var i = 1; i <= 32; i++) {
      html += renderCard(i, state);
    }
    html += "</div>";
    return html;
  }

  function buildScreen(state) {
    var noCardDisabled = '';
    var stopDisabled = '';
    var collectClass = 'CCT-btn';
    var collectDisabled = ' disabled';
    var collectClick = '';
    var noCardClick = " onclick = noCard()";
    var stopClick = " onclick = endRound()";

    if (state === 0) {
      stopDisabled = ' disabled';
    } else if (state === 1) {
      noCardDisabled = ' disabled';
      noCardClick = '';
    } else if (state === 2) {
      noCardDisabled = ' disabled';
      stopDisabled = ' disabled';
      noCardClick = '';
      stopClick = '';
      collectClass = 'CCT-btn select-button';
      collectClick = " onclick = collect()";
    }

    return (
      "<div class = cct-box>" +
        "<div class = titleBigBox>" +
          "<div class = titleboxLeft><div class = center-text id = game_round>Game Round: " + whichRound + "</div></div>" +
          "<div class = titleboxLeft1><div class = center-text id = loss_amount>Loss Amount: <strong style=\"color:red\">" + lossAmt + "</strong></div></div>" +
          "<div class = titleboxMiddle1><div class = center-text id = gain_amount>Gain Amount: <strong style=\"color:red\">" + gainAmt + "</strong></div></div>" +
          "<div class = titlebox><div class = center-text>How many cards do you want to take? </div></div>" +
          "<div class = titleboxRight1><div class = center-text id = num_loss_cards>Number of Loss Cards: <strong style=\"color:red\">" + numLossCards + "</strong></div></div>" +
          "<div class = titleboxRight><div class = center-text id = current_round>Current Round Points: " + roundPoints + "</div></div>" +
          "<div class = buttonbox>" +
            "<button type='button' id='NoCardButton' class='CCT-btn" + (state === 0 ? " select-button" : "") + "'" + noCardClick + noCardDisabled + ">No Card</button>" +
            "<button type='button' id='turnButton' class='CCT-btn" + (state === 1 ? " select-button" : "") + "'" + stopClick + stopDisabled + ">STOP/Turn Over</button>" +
            "<button type='button' id='collectButton' class='" + collectClass + "'" + collectClick + collectDisabled + ">Next Round</button>" +
          "</div>" +
        "</div>" +
        buildBoard(state) +
      "</div>"
    );
  }

  if (roundOver === 0) {
    whichClickInRound = 0;
    cardArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
    unclickedCards = cardArray.slice();
    clickedGainCards = [];
    clickedLossCards = [];

    roundParams = shuffledParamsArray.shift();
    numLossCards = roundParams[0];
    gainAmt = roundParams[1];
    lossAmt = roundParams[2];

    shuffledCardArray = jsPsych.randomization.shuffle(cardArray.slice());
    whichLossCards = [];
    for (var i = 0; i < numLossCards; i++) {
      whichLossCards.push(shuffledCardArray.pop());
    }

    roundOver = 1;
    return buildScreen(0);
  }

  if (roundOver === 1) {
    return buildScreen(1);
  }

  if (roundOver === 2) {
    

    clickedCards = clickedGainCards.concat(clickedLossCards);

    var notClicked = cardArray.filter(function(x) {
      return jQuery.inArray(x, clickedCards) === -1;
    });

    lossCardsToTurn = whichLossCards.filter(function(x) {
      return jQuery.inArray(x, clickedLossCards) === -1 && jQuery.inArray(x, notClicked) !== -1;
    });

    gainCardsToTurn = notClicked.filter(function(x) {
      return jQuery.inArray(x, lossCardsToTurn) === -1;
    });

    CCT_timeouts.push(setTimeout(function() {
      for (var k = 0; k < lossCardsToTurn.length; k++) {
        var lossEl = document.getElementById(String(lossCardsToTurn[k]));
        if (lossEl) lossEl.src = 'images/loss.png';
      }

      for (var j = 0; j < gainCardsToTurn.length; j++) {
        var gainEl = document.getElementById(String(gainCardsToTurn[j]));
        if (gainEl) gainEl.src = 'images/chosen.png';
      }

      $('#collectButton').prop('disabled', false);
    }, 1500));

    return buildScreen(2);
  }
return buildScreen(2);
}

/*Functions below are for practice
*/
var turnCards = function(cards) {

  $('#collectButton').prop('disabled', false)
  $('#NoCardButton').prop('disabled', true)

  for (var i = 1; i <= 32; i++) {
    var el = document.getElementById(String(i));
    if (!el) continue;

    if (whichGainCards.indexOf(i) != -1) {
      el.src = 'images/chosen.png';
    } else if (whichLossCards.indexOf(i) != -1) {
      el.src = 'images/loss.png';
    }
  }
}

var turnOneCard = function(whichCard, win) {
	if (win === 'loss') {
		document.getElementById("" + whichCard + "").src =
			'images/loss.png';
	} else {
		document.getElementById("" + whichCard + "").src =
			'images/chosen.png';
	}
}

function doSetTimeout(card_i, delay, points, win) {
	CCT_timeouts.push(setTimeout(function() {
		turnOneCard(card_i, win);
		document.getElementById("current_round").innerHTML = 'Current Round Points: ' + points
	}, delay));
}

var getPractice1 = function() {
	unclickedCards = cardArray.slice()
	cardArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
		24, 25, 26, 27, 28, 29, 30, 31, 32
	]
	clickedGainCards = [] 
	clickedLossCards = [] 
	numLossCards = 1
	gainAmt = 30
	lossAmt = 250

	shuffledCardArray = jsPsych.randomization.shuffle(cardArray.slice())
	whichLossCards = [] //this determines which are loss cards at the beginning of each round
	for (i = 0; i < numLossCards; i++) {
		whichLossCards.push(shuffledCardArray.pop())
	}
	whichGainCards = shuffledCardArray
	gameState = practiceSetup
	return gameState
}

var getPractice2 = function() {
	unclickedCards = cardArray.slice()
	cardArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
		24, 25, 26, 27, 28, 29, 30, 31, 32
	]
	clickedGainCards = [] //num
	clickedLossCards = [] //num
	numLossCards = 3
	gainAmt = 10
	lossAmt = 750

	shuffledCardArray = jsPsych.randomization.shuffle(cardArray.slice())
	whichLossCards = [] //this determines which are loss cards at the beginning of each round
	for (i = 0; i < numLossCards; i++) {
		whichLossCards.push(shuffledCardArray.pop())
	}
	whichGainCards = shuffledCardArray
	gameState = practiceSetup2
	return gameState
}

/*Functions below are for instruction
*/
var instructCard = function(clicked_id) {
	currID = parseInt(clicked_id)
	document.getElementById("NoCardButton").disabled = true;
	document.getElementById("turnButton").disabled = false;
	appendTextAfter(gameState, 'turnButton', ' onclick = turnCards()')
	if (whichLossCards.indexOf(currID) == -1) {
		instructPoints = instructPoints + gainAmt
		document.getElementById('current_round').innerHTML = 'Current Round Points: ' + instructPoints;
		document.getElementById(clicked_id).disabled = true;

		document.getElementById(clicked_id).src =
			'images/chosen.png';
	} else if (whichLossCards.indexOf(currID) != -1) {
		instructPoints = instructPoints - lossAmt
		document.getElementById(clicked_id).disabled = true;
		document.getElementById('current_round').innerHTML = 'Current Round Points: ' + instructPoints;
		document.getElementById(clicked_id).src =
			'images/loss.png';
		 $("input.card_image").attr("disabled", true);
		CCT_timeouts.push(setTimeout(function() {turnCards()}, 2000))
	}
}

var instructFunction = function() {
	$('#instructButton').prop('disabled', true)
	$('#jspsych-instructions-next').click(function() {
		for (var i = 0; i < CCT_timeouts.length; i++) {
			clearTimeout(CCT_timeouts[i]);
		}
	})

	$('#jspsych-instructions-back').click(function() {
		for (var i = 0; i < CCT_timeouts.length; i++) {
			clearTimeout(CCT_timeouts[i]);
		}
	})

	var cards_to_turn = [1, 17, 18, 15, 27, 31, 8]
	var total_points = 0
	var points_per_card = 10
	var delay = 0
	for (var i = 0; i < cards_to_turn.length; i++) {
		var card_i = cards_to_turn[i]
		delay += 250
		total_points += points_per_card
		doSetTimeout(card_i, delay, total_points, 'win')
	}
	CCT_timeouts.push(setTimeout(function() {
		document.getElementById("instruct1").innerHTML =
		'<strong>Example 1.</strong> In this example, there are 32 face-down cards. The display tells you there is 1 loss card, each gain card is worth 10 points, and the loss card costs 750 points. Suppose you turn over 7 cards and then stop. <font color = "red">Luckily, none of the 7 cards you turned over was the loss card. You earned 10 points for each card, so your score for this round was 7 &times; 10 = 70 points. <span style="color:red; text-decoration:underline;">Please click Next.</span></font>'
		}, delay))
}

var instructFunction2 = function() {
	$('#instructButton').prop('disabled', true)
	var tempArray = [3, 5, 6, 7, 9, 10, 11, 12, 19, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 26,
		27, 28, 29, 31, 32
	]
	var instructTurnCards = function() {
		document.getElementById("8").src = 'images/loss.png';
		document.getElementById("2").src = 'images/loss.png';

		for (i = 0; i < tempArray.length; i++) {
			document.getElementById("" + tempArray[i] + "").src =
				'images/chosen.png';
		}
	}

	$('#jspsych-instructions-next').click(function() {
		for (var i = 0; i < CCT_timeouts.length; i++) {
			clearTimeout(CCT_timeouts[i]);
		}
	})

	$('#jspsych-instructions-back').click(function() {
		for (var i = 0; i < CCT_timeouts.length; i++) {
			clearTimeout(CCT_timeouts[i]);
		}
	})
	var cards_to_turn = [1, 4, 30]
	var total_points = 0
	var points_per_card = 30
	var delay = 0
	for (var i = 0; i < cards_to_turn.length; i++) {
		var card_i = cards_to_turn[i]
		delay += 250
		total_points += points_per_card
		doSetTimeout(card_i, delay, total_points, 'win')
	}
	delay += 250
	total_points -= 250
	doSetTimeout(13, delay, total_points, 'loss')
	CCT_timeouts.push(setTimeout(function() {
		document.getElementById("instruct2").innerHTML =
			'<strong>Example 2.</strong> In this example, there are 32 face-down cards. The display tells you there are 3 loss cards, each gain card is worth 30 points, and each loss card costs 250 points. <font color = "red">The fourth card was a loss card, so the round ended immediately. Before the loss card, you had turned over 3 gain cards: 3 &times; 30 = 90 points. Then the loss card subtracted 250 points: 90 &minus; 250 = &minus;160 points. Your score for this round was &minus;160 points. The remaining cards are shown for transparency. <span style="color:red; text-decoration:underline;">Please click Next.</span></font>'
	}, delay))
	CCT_timeouts.push(setTimeout(instructTurnCards, delay + 1000))
}

var instructButton = function(clicked_id) {
	currID = parseInt(clicked_id)
	document.getElementById(clicked_id).src =
		'images/chosen.png';
}

/* ************************************ */
/* Experimental Variables               */
/* ************************************ */
// generic task variables
var sumInstructTime = 0 //ms
var instructTimeThresh = 0 ///in seconds
var credit_var = true
var performance_var = 0

// task specific variables
var currID = ""
var numLossCards = ""
var gainAmt = ""
var lossAmt = ""
var CCT_timeouts = []
// var numWinRounds =  24
// var numLossRounds = 4
var numRounds = 24
// var lossRounds = jsPsych.randomization.shuffle([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,24,25,26,27,28]).slice(0,numLossRounds)
var lossRounds = []
// var riggedLossCards = []
var lossClicked = false
var whichClickInRound = 0
var whichRound = 1
// var round_type = lossRounds.indexOf(whichRound)==-1 ? 'rigged_win' : 'rigged_loss'
var round_type = 'canonical'
var roundPoints = 0
var totalPoints = 0
var roundOver = 0 //0 at beginning of round, 1 during round, 2 at end of round
var instructPoints = 0
var clickedGainCards = []
var clickedLossCards = []
var roundPointsArray = [] 
var whichGainCards = []
var whichLossCards = []
var prize1 = 0
var prize2 = 0
var prize3 = 0

// this params array is organized such that the 0 index = the number of loss cards in round, the 1 index = the gain amount of each happy card, and the 2nd index = the loss amount when you turn over a sad face
var paramsArray = [
	[1, 10, 250],
	[1, 10, 750],
	[1, 30, 250],
	[1, 30, 750],
	[3, 10, 250],
	[3, 10, 750],
	[3, 30, 250],
	[3, 30, 750]
]

var cardArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
	24, 25, 26, 27, 28, 29, 30, 31, 32]
var shuffledCardArray = jsPsych.randomization.shuffle(cardArray.slice())
var shuffledParamsArray = jsPsych.randomization.shuffle(
  jsPsych.randomization.repeat(paramsArray, Math.ceil(numRounds / paramsArray.length))
).slice(0, numRounds)
// var shuffledParamsArray = jsPsych.randomization.repeat(paramsArray, numWinRounds/8)
// for (var i = 0; i < numLossRounds; i++) {
// 	riggedLossCards.push(Math.floor(Math.random()*10)+2)
// 	var before = shuffledParamsArray.slice(0,lossRounds[i])
// 	var after = shuffledParamsArray.slice(lossRounds[i])
// 	var insert = [paramsArray[Math.floor(Math.random()*8)]]
// 	shuffledParamsArray = before.concat(insert,after)
// }

var gameSetup =
	"<div class = cct-box>"+
	"<div class = titleBigBox>   <div class = titleboxLeft><div class = center-text id = game_round>Game Round: </div></div>   <div class = titleboxLeft1><div class = center-text id = loss_amount>Loss Amount: </div></div>    <div class = titleboxMiddle1><div class = center-text id = gain_amount>Gain Amount: </div></div>    <div class = titlebox><div class = center-text>How many cards do you want to take? </div></div>     <div class = titleboxRight1><div class = center-text id = num_loss_cards>Number of Loss Cards: </div></div>   <div class = titleboxRight><div class = center-text id = current_round>Current Round Points: 0</div></div>"+
	"<div class = buttonbox><button type='button' id = NoCardButton class = 'CCT-btn select-button' onclick = noCard()>No Card</button><button type='button' id = turnButton class = 'CCT-btn select-button' onclick = endRound()>STOP/Turn Over</button><button type='button' id = collectButton class = 'CCT-btn' disabled>Next Round</button></div></div>"+
	getBoard()

var practiceSetup =
	"<div class = practiceText><div class = block-text2 id = instruct1><strong>Practice 1.</strong> This is a practice round. It looks like the real game. As you click cards, your Round Total will update in the upper right corner. You can click a card to turn it over, stop after any gain card by clicking <strong>STOP/Turn Over</strong>, or click <strong>No Card</strong> if you do not want to turn over any cards (your score for the round will be 0). Please turn over as many cards as you would like, based on the number of loss cards and the gain/loss points shown below.</div></div>"+
	"<div class = cct-box2>"+
	"<div class = titleBigBox>   <div class = titleboxLeft><div class = center-text id = game_round>Game Round: 1</div></div>   <div class = titleboxLeft1><div class = center-text id = loss_amount>Loss Amount: <strong style=\"color:red\">250</strong></div></div>    <div class = titleboxMiddle1><div class = center-text id = gain_amount>Gain Amount: <strong style=\"color:red\">30</strong></div></div>    <div class = titlebox><div class = center-text>How many cards do you want to take? </div></div>     <div class = titleboxRight1><div class = center-text id = num_loss_cards>Number of Loss Cards: <strong style=\"color:red\">1</strong></div></div>   <div class = titleboxRight><div class = center-text id = current_round>Current Round Points: 0</div></div>"+
	"<div class = buttonbox><button type='button' class = CCT-btn id = NoCardButton onclick = turnCards()>No Card</button><button type='button' class = CCT-btn id = turnButton onclick = turnCards() disabled>STOP/Turn Over</button><button type='button' class = 'CCT-btn select-button' id = collectButton  onclick = collect() disabled>Next Round</button></div></div>"+
	getBoard(2)

var practiceSetup2 =
	"<div class = practiceText><div class = block-text2 id = instruct2><strong>Practice 2.</strong> This is the second practice round. Again, please turn over as many cards as you would like, based on the number of loss cards and the gain/loss points shown below. The computer will record your score for each round. After all " + numRounds + " real rounds, you will see your total score.</div></div>"+
	"<div class = cct-box2>"+
	"<div class = titleBigBox>   <div class = titleboxLeft><div class = center-text id = game_round>Game Round: 2</div></div>   <div class = titleboxLeft1><div class = center-text id = loss_amount>Loss Amount: <strong style=\"color:red\">750</strong></div></div>    <div class = titleboxMiddle1><div class = center-text id = gain_amount>Gain Amount: <strong style=\"color:red\">10</strong></div></div>    <div class = titlebox><div class = center-text>How many cards do you want to take? </div></div>     <div class = titleboxRight1><div class = center-text id = num_loss_cards>Number of Loss Cards: <strong style=\"color:red\">3</strong></div></div>   <div class = titleboxRight><div class = center-text id = current_round>Current Round Points: 0</div></div>"+
	"<div class = buttonbox><button type='button' class = CCT-btn id = NoCardButton onclick = turnCards()>No Card</button><button type='button' class = CCT-btn id = turnButton onclick = turnCards() disabled>STOP/Turn Over</button><button type='button' class = 'CCT-btn select-button' id = collectButton  onclick = collect() disabled>Next Round</button></div></div>"+
	getBoard(2)


/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */
//Set up post task questionnaire
var post_task_block = {
   type: 'survey-text',
   data: {
       trial_id: "post task questions"
   },
   questions: ['<p class = center-block-text style = "font-size: 20px">Please summarize what you were asked to do in this task.</p>',
              '<p class = center-block-text style = "font-size: 20px">Do you have any comments about this task?</p>'],
   rows: [15, 15],
   columns: [60,60]
};


var round_delay = {
  type: 'single-stim-button',
  stimulus: `
  <div style="
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 800px;
    height: 500px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="font-size: 48px; color: black;">+</div>
  </div>
`,
  is_html: true,
  choices: [''],
  button_html: '<button style="display:none;"></button>',
  response_ends_trial: false,
  timing_response: 6000
};

// var round_delay = {
//   type: 'html-keyboard-response',
//   stimulus: '<div style="font-size:60px;">+</div>',
//   choices: jsPsych.NO_KEYS,
//   timing_response: 5000
// }

/* define static blocks */

var feedback_instruct_text =
	"Welcome to the experiment. Press <strong>enter</strong> to begin."
var feedback_instruct_block = {
	type: 'poldrack-text',
	cont_key: [13],
	data: {
		trial_id: 'instruction'
	},
	text: getInstructFeedback,
	timing_post_trial: 0,
	timing_response: 180000
};
/// This ensures that the subject does not read through the instructions too quickly.  If they do it too quickly, then we will go over the loop again.
var instructions_block = {
  type: 'poldrack-instructions',
  data: {trial_id: 'instruction'},
  pages: [
	'<div class = centerbox style="font-size: 26.1px; line-height: 130%;"><p class = block-text><strong>Introduction</strong></p>'+
	'<p>You will now play a card game. In this game, you can win or lose points. Points are worth money.</p>'+
	'<p>In each round, you will see 32 face-down cards. Each card is either:</p>'+
	'<ul><li>a gain card, which adds points to your score</li>'+
	'<li>a loss card, which subtracts points from your score and ends the round</li></ul>'+
	'<p>There are no neutral cards.</p>'+
	'<p>Before each round, you will be told:</p>'+
	'<ul><li>how many loss cards are in the deck</li>'+
	'<li>how many points you gain for each gain card</li>'+
	'<li>how many points you lose if you turn over a loss card</li></ul>'+
	'<p>You will not know which specific face-down cards are gain cards or loss cards.</p>'+
	'<p><strong>In each round, you decide one card at a time. After each gain card, you can either turn over another card or stop.</strong></p>'+
	'<p>If you turn over a gain card, points are added to your score for that round. If you turn over a loss card, points are subtracted from your score and the round ends immediately.</p>'+
	'<p>Each round starts at 0 points, so each round is independent.</p>'+
	'<p>You will play ' + numRounds + ' rounds. At the end, 3 rounds will be randomly selected, and your bonus payment will be based on your scores in those rounds.</p></div>',
	
    '<div class = centerbox style="text-align:center;"><p class = block-text style="text-align:center;"><strong>Unknown Cards</strong></p>'+
    '<p style="text-align:center;">This is what an unknown card looks like.</p>'+
    '<p style="text-align:center;">Click the card to turn it over.</p>'+
    "<p style=\"text-align:center;\"><input type='image' id = '133' src='images/beforeChosen.png' onclick = instructButton(this.id)>"+
	'</p></div>',
	
	'<div class = centerbox style="text-align:center;"><p class = block-text style="text-align:center;">'+
	'<p style="text-align:center;">There are two types of cards:</p>'+
	'<p style="text-align:center;"><strong>Gain cards:</strong></p>'+
	'<p style="text-align:center;">Each gain card increases your score by either 10 or 30 points, depending on the round.</p>'+
	"<p style=\"text-align:center;\"><input type='image' src='images/chosen.png'>"+
	'<p style="text-align:center;"><strong>Loss cards:</strong></p>'+
	"<p style=\"text-align:center;\"><input type='image' src='images/loss.png'></p>"+
	'<p style="text-align:center;">Each loss card decreases your score by either 250 or 750 points, depending on the round. If you turn over a loss card, the round ends immediately.</p>'+
	'<p style="text-align:center;">Each round will have either 1 or 3 loss cards among the 32 cards.</p>'+
	'<p style="text-align:center;">The number of loss cards, the gain amount, and the loss amount will always be shown on the screen during the round.</p>'+
	'</p></div>',
	
	"<div class = practiceText><div class = block-text2 id = instruct1><strong>Example 1.</strong> In this example, there are 32 face-down cards. The display tells you there is 1 loss card, each gain card is worth 10 points, and the loss card costs 750 points. Suppose you turn over 7 cards and then stop. <span style=\"color:red; text-decoration:underline;\">Click <strong>See Result</strong> to see what happens.</span></div></div>"+
	"<div class = cct-box2>"+
	"<div class = titleBigBox>   <div class = titleboxLeft><div class = center-text>Game Round: 1</div></div>   <div class = titleboxLeft1><div class = center-text>Loss Amount: <strong style=\"color:red\">750</strong></div></div>    <div class = titleboxMiddle1><div class = center-text>Gain Amount: <strong style=\"color:red\">10</strong></div></div>    <div class = titlebox><div class = center-text>How many cards do you want to take? </div></div>     <div class = titleboxRight1><div class = center-text>Number of Loss Cards: <strong style=\"color:red\">1</strong></div></div>   <div class = titleboxRight><div class = center-text id = current_round>Current Round Points: 0</div></div>"+
	"<div class = buttonbox><button type='button' class = 'CCT-btn select-button' id = NoCardButton disabled>No Card</button><button type='button' class = 'CCT-btn select-button' class = 'CCT-btn select-button' id = turnButton disabled>STOP/Turn Over</button><button type='button' class = 'CCT-btn select-button' id = collectButton  disabled>Next Round</button></div>"+
	"<div class = buttonbox2><button type='button' class = CCT-btn id = instructButton onclick= instructFunction()>See Result</button></div></div>"+
	getBoard(2),
	
	"<div class = practiceText><div class = block-text2 id = instruct2><strong>Example 2.</strong> In this example, there are 32 face-down cards. The display tells you there are 3 loss cards, each gain card is worth 30 points, and each loss card costs 250 points. Suppose you begin turning over cards and the fourth card is a loss card. <span style=\"color:red; text-decoration:underline;\">Click <strong>See Result</strong> to see what happens.</span></div></div>"+
	"<div class = cct-box2>"+
	"<div class = titleBigBox>   <div class = titleboxLeft><div class = center-text>Game Round: 1</div></div>   <div class = titleboxLeft1><div class = center-text>Loss Amount: <strong style=\"color:red\">250</strong></div></div>    <div class = titleboxMiddle1><div class = center-text>Gain Amount: <strong style=\"color:red\">30</strong></div></div>    <div class = titlebox><div class = center-text>How many cards do you want to take? </div></div>     <div class = titleboxRight1><div class = center-text>Number of Loss Cards: <strong style=\"color:red\">3</strong></div></div>   <div class = titleboxRight><div class = center-text id = current_round>Current Round Points: 0</div></div>"+
	"<div class = buttonbox><button type='button' class = 'CCT-btn select-button' id = NoCardButton disabled>No Card</button><button type='button' class = 'CCT-btn select-button' class = 'CCT-btn select-button' id = turnButton disabled>STOP/Turn Over</button><button type='button' class = 'CCT-btn select-button' id = collectButton  disabled>Next Round</button></div>"+
	"<div class = buttonbox2><button type='button' class = CCT-btn id = instructButton onclick= instructFunction2()>See Result</button></div></div>"+
	getBoard(2),
	"<div class = centerbox><p class = block-text>You will now complete two practice rounds before the real game begins.</p><p class = block-text>Please make sure you understand the examples before continuing.</p></div>"
  ],
  allow_keys: false,
  show_clickable_nav: true,
  timing_post_trial: 1000
};

var instruction_node = {
	timeline: [feedback_instruct_block, instructions_block],
	/* This function defines stopping criteria */
	loop_function: function(data) {
		for (i = 0; i < data.length; i++) {
			if ((data[i].trial_type == 'poldrack-instructions') && (data[i].rt != -1)) {
				rt = data[i].rt
				sumInstructTime = sumInstructTime + rt
			}
		}
		if (sumInstructTime <= instructTimeThresh * 1000) {
			feedback_instruct_text =
				'Read through instructions too quickly.  Please take your time and make sure you understand the instructions.  Press <strong>enter</strong> to continue.'
			return true
		} else if (sumInstructTime > instructTimeThresh * 1000) {
			feedback_instruct_text = 'Done with instructions. Press <strong>enter</strong> to continue.'
			return false
		}
	}
}





var end_block = {
	type: 'poldrack-text',
	data: {
		trial_id: 'end',
		exp_id: 'columbia_card_task_hot'
	},
	text: '<div class = centerbox><p class = center-block-text>Finished with this task.</p><p class = center-block-text>Press <strong>enter</strong> to continue.</p></div>',
	cont_key: [13],
	timing_post_trial: 0,
  	on_finish: assessPerformance
};

var start_test_block = {
	type: 'poldrack-text',
	data: {
		trial_id: 'test_intro'
	},
	text: '<div class = centerbox><p class = center-block-text>We will now start the test. Press <strong>enter</strong> to begin.</p></div>',
	cont_key: [13],
	timing_post_trial: 1000,
on_finish: function(){
  whichClickInRound = 0
}
};


var practice_block1 = {
	type: 'single-stim-button',
	button_class: 'select-button',
	stimulus: getPractice1,
	is_html: true,
	data: {
		trial_id: 'stim',
		exp_stage: 'practice'
	},
	timing_post_trial: 0,
	response_ends_trial: true,
	on_finish: function() {
		jsPsych.data.addDataToLastTrial({
			num_loss_cards: numLossCards,
			gain_amount: gainAmt,
			loss_amount: lossAmt,
			instruct_points: instructPoints,
		})
		instructPoints = 0
	}
};

var practice_block2 = {
	type: 'single-stim-button',
	button_class: 'select-button',
	stimulus: getPractice2,
	is_html: true,
	data: {
		trial_id: 'stim',
		exp_stage: 'practice'
	},
	timing_post_trial: 0,
	response_ends_trial: true,
	on_finish: function() {
		jsPsych.data.addDataToLastTrial({
			num_loss_cards: numLossCards,
			gain_amount: gainAmt,
			loss_amount: lossAmt,
			instruct_points: instructPoints,
		})
		instructPoints = 0
	}
};

var test_block = {
	type: 'single-stim-button',
	button_class: 'select-button',
	stimulus: getRound,
	is_html: true,
	data: {
		trial_id: 'stim',
		exp_stage: 'test'
	},
	timing_post_trial: 0,
	on_finish: appendTestData,
	response_ends_trial: true,
};

var test_node = {
	timeline: [test_block],
	loop_function: function(data) {
		if (currID == 'collectButton') {
			roundPointsArray.push(roundPoints)
			roundOver = 0
			roundPoints = 0
			whichClickInRound = 0
			whichRound = whichRound + 1
			round_type = 'canonical'
			lossClicked = false
			currID = ""
			return false
		} else {
			return true
		}
	}
}


var payout_text = {
	type: 'poldrack-text',
	text: getText,
	data: {
		trial_id: 'reward'
	},
	cont_key: [13],
	timing_post_trial: 1000,
	on_finish: appendPayoutData,
};

var payoutTrial = {
	type: 'call-function',
	data: {
		trial_id: 'calculate reward'
	},
	func: function() {
		totalPoints = math.sum(roundPointsArray)
		randomRoundPointsArray = jsPsych.randomization.shuffle(roundPointsArray.slice())
		prize1 = randomRoundPointsArray.pop()
		prize2 = randomRoundPointsArray.pop()
		prize3 = randomRoundPointsArray.pop()
		performance_var = prize1 + prize2 + prize3
	}
};

/* create experiment definition array */
var columbia_card_task_hot_experiment = [];

columbia_card_task_hot_experiment.push(instruction_node);
columbia_card_task_hot_experiment.push(practice_block1);
columbia_card_task_hot_experiment.push(practice_block2);

// columbia_card_task_hot_experiment.push(start_test_block);
// for (i = 0; i < numRounds; i++) {
//   columbia_card_task_hot_experiment.push(test_node);}

columbia_card_task_hot_experiment.push(start_test_block);
for (i = 0; i < numRounds; i++) {
  columbia_card_task_hot_experiment.push(test_node);

  // 6s fixation only between rounds, not after the last round
  if (i < numRounds - 1) {
    columbia_card_task_hot_experiment.push(round_delay);
  }
}

columbia_card_task_hot_experiment.push(payoutTrial);
columbia_card_task_hot_experiment.push(end_block);
