/* ************************************ */
/* Helper Functions                     */
/* ************************************ */
// Position in the chained sequence; set by index.html. Standalone runs count as first.
var IS_FIRST_TASK = (typeof CHAIN_INDEX === 'undefined') || CHAIN_INDEX === 0

// State-dependent prompts, shared by the tutorial, practice and real rounds.
var PROMPT_INITIAL = 'Select a card to turn over, or choose TAKE NO CARD.'
var PROMPT_AFTER_GAIN = 'Select another card, or choose STOP.'
var PROMPT_COMPLETE = 'Round complete. Choose NEXT ROUND to continue.'

var setPrompt = function(text) {
	var el = document.getElementById('round_prompt')
	if (el) el.innerHTML = text
}

function assessPerformance() {
	var experiment_data = jsPsych.data.getTrialsOfType('single-stim-button').filter(function(d) {
		return d.exp_stage !== 'tutorial'
	})
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

/* ---------------------------------------------------------------- */
/* Shared responsive screen builder.                                  */
/* Every section is a block in normal flow, stacked by .game-layout,  */
/* so each one pushes the next down instead of overlaying it.         */
/* ---------------------------------------------------------------- */
var statusBox = function(id, label, value, highlight) {
	var body = (value === undefined || value === null || value === '')
		? label
		: label + ' <strong class = "status-value' + (highlight ? ' status-highlight' : '') + '">' + value + '</strong>'
	return '<div class = status-box><span id = "' + id + '">' + body + '</span></div>'
}

// Single place that renders the running total, so every updater writes the same markup.
var pointsMarkup = function(n) {
	return 'Current Round Points: <strong class = status-value>' + n + '</strong>'
}

var setPoints = function(n) {
	var el = document.getElementById('current_round')
	if (el) el.innerHTML = pointsMarkup(n)
}

var hotStatus = function(round, lossAmount, gainAmount, lossCards, points) {
	return statusBox('game_round', 'Game Round:', round) +
		statusBox('loss_amount', 'Loss Amount:', lossAmount, true) +
		statusBox('gain_amount', 'Gain Amount:', gainAmount, true) +
		statusBox('num_loss_cards', 'Number of Loss Cards:', lossCards, true) +
		statusBox('current_round', 'Current Round Points:', points)
}

var gameScreen = function(parts) {
	var html = '<div class = game-layout>'
	if (parts.heading) {
		html += '<h1 class = gl-heading>' + parts.heading + '</h1>'
	}
	if (parts.status) {
		html += '<div class = gl-status>' + parts.status + '</div>'
	}
	if (parts.lead !== undefined) {
		html += '<div class = gl-lead id = tutorial_text>' + parts.lead + '</div>'
	}
	if (parts.prompt !== undefined) {
		html += '<p class = gl-prompt id = round_prompt>' + parts.prompt + '</p>'
	}
	if (parts.subprompt !== undefined) {
		html += '<p class = gl-subprompt id = sub_prompt>' + parts.subprompt + '</p>'
	}
	// Feedback row: collapses to nothing while empty, pushes content down when filled.
	html += '<p class = gl-message id = card_click_msg></p>'
	if (parts.actions) {
		html += '<div class = gl-actions>' + parts.actions + '</div>'
	}
	if (parts.numbers) {
		html += '<div class = gl-numbers>' + parts.numbers + '</div>'
	}
	if (parts.cards) {
		html += '<div class = gl-cards>' + parts.cards + '</div>'
	}
	if (parts.footer) {
		html += '<div class = gl-footer>' + parts.footer + '</div>'
	}
	html += '</div>'
	return html
}

var getBoard = function(board_type) {
	// Returns card elements only; the caller wraps them in the .gl-cards grid.
	var cards = ''
	for (i = 1; i < 33; i++) {
		if (board_type == 2) {
			cards += "<input type='image' id = '" + i +
				"' class = 'card_image' src='images/beforeChosen.png' onclick = instructCard(this.id)>"
		} else {
			cards += "<input type='image' id = '" + i +
				"' class = 'card_image select-button' src='images/beforeChosen.png' onclick = chooseCard(this.id)>"
		}
	}
	return cards
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

    return "<input type='image' id = '" + i + "' class = '" + cls + "' src='" + src + "'" + click + ">";
  }

  function buildBoard(state) {
    var html = "";
    for (var i = 1; i <= 32; i++) {
      html += renderCard(i, state);
    }
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
    var promptText = PROMPT_INITIAL;

    if (state === 1) { promptText = PROMPT_AFTER_GAIN; }
    if (state === 2) { promptText = PROMPT_COMPLETE; }

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

    return gameScreen({
      status: hotStatus(whichRound, lossAmt, gainAmt, numLossCards, roundPoints),
      prompt: promptText,
      actions:
        "<button type='button' id='NoCardButton' class='CCT-btn" + (state === 0 ? " select-button" : "") + "'" + noCardClick + noCardDisabled + ">TAKE NO CARD</button>" +
        "<button type='button' id='turnButton' class='CCT-btn" + (state === 1 ? " select-button" : "") + "'" + stopClick + stopDisabled + ">STOP</button>" +
        "<button type='button' id='collectButton' class='" + collectClass + "'" + collectClick + collectDisabled + ">NEXT ROUND</button>",
      cards: buildBoard(state)
    });
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
  $('#turnButton').prop('disabled', true)
  setPrompt(PROMPT_COMPLETE)

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
		setPoints(points)
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
		setPoints(instructPoints)
		document.getElementById(clicked_id).disabled = true;

		document.getElementById(clicked_id).src =
			'images/chosen.png';
		setPrompt(PROMPT_AFTER_GAIN)
	} else if (whichLossCards.indexOf(currID) != -1) {
		instructPoints = instructPoints - lossAmt
		document.getElementById(clicked_id).disabled = true;
		setPoints(instructPoints)
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
var numRounds = 16
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


var practiceScreen = function(roundNo, lossAmount, gainAmount, lossCards) {
	return gameScreen({
		heading: 'Practice Round ' + roundNo + ' of 2',
		status: hotStatus(roundNo, lossAmount, gainAmount, lossCards, 0),
		prompt: PROMPT_INITIAL,
		actions:
			"<button type='button' class = CCT-btn id = NoCardButton onclick = turnCards()>TAKE NO CARD</button>" +
			"<button type='button' class = CCT-btn id = turnButton onclick = turnCards() disabled>STOP</button>" +
			"<button type='button' class = 'CCT-btn select-button' id = collectButton onclick = collect() disabled>NEXT ROUND</button>",
		cards: getBoard(2)
	})
}

var practiceSetup = practiceScreen(1, 250, 30, 1)

var practiceSetup2 = practiceScreen(2, 750, 10, 3)

/* ---------------------------------------------------------------- */
/* Hot tutorial ("Try It") - one gain card, then STOP                */
/* ---------------------------------------------------------------- */
var TUTORIAL_GAIN = 30
var tutorialPoints = 0

var tutorialCard = function(clicked_id) {
	var el = document.getElementById(clicked_id)
	if (!el || el.disabled) return
	// Every tutorial card is a gain card, so the first card clicked is always a gain.
	tutorialPoints = tutorialPoints + TUTORIAL_GAIN
	el.src = 'images/chosen.png'
	// Lock every card: turning more of them over would show a board of nothing but
	// gain cards, which misrepresents the game.
	$('input.tutorial-card').attr('disabled', true)
	setPoints(tutorialPoints)
	// Cards are no longer clickable here, so the prompt points only at STOP.
	setPrompt('Click STOP to end the round.')
	document.getElementById('tutorial_text').innerHTML =
		'This is a gain card. Its points have been added to your score.<br>' +
		'During the game, you may click another card or click <strong>STOP</strong>.<br>' +
		'<span style="color:red;">For this tutorial, click <strong>STOP</strong>.</span>'
	$('#turnButton').prop('disabled', false)
}

var tutorialStop = function() {
	$('#turnButton').prop('disabled', true)
	$('input.tutorial-card').attr('disabled', true)
	// The tutorial advances via CONTINUE, not NEXT ROUND, so point the prompt at it.
	setPrompt('Click CONTINUE to go on.')
	document.getElementById('tutorial_text').innerHTML = 'Correct. You may stop after any gain card.'
	$('#tutorialContinue').prop('disabled', false)
}

var getHotTutorial = function() {
	tutorialPoints = 0
	var cards = ''
	for (var i = 1; i <= 32; i++) {
		cards += "<input type='image' id = 't" + i +
			"' class = 'card_image tutorial-card' src='images/beforeChosen.png' onclick = tutorialCard(this.id)>"
	}

	return gameScreen({
		heading: '<span id = tutorial_heading>Try It</span>',
		status: hotStatus(1, 250, TUTORIAL_GAIN, 1, 0),
		lead: 'Below are cards like the ones you will see during the game.<br>Click any face-down card.',
		prompt: PROMPT_INITIAL,
		actions:
			"<button type='button' class = CCT-btn id = NoCardButton disabled>TAKE NO CARD</button>" +
			"<button type='button' class = CCT-btn id = turnButton onclick = tutorialStop() disabled>STOP</button>" +
			"<button type='button' class = CCT-btn id = collectButton disabled>NEXT ROUND</button>",
		cards: cards,
		footer: "<button type='button' id = tutorialContinue class = 'CCT-btn select-button' disabled>CONTINUE</button>"
	})
}


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
  stimulus: '<div class = fixation-block>+</div>',
  is_html: true,
  choices: [''],
  button_html: '<button style="display:none;"></button>',
  response_ends_trial: false,
  timing_response: 5000,
  // The fixation is the whole inter-round pause. Without this the plugin's
  // 1000ms default ITI would add a blank second after every cross.
  timing_post_trial: 0
};

// var round_delay = {
//   type: 'html-keyboard-response',
//   stimulus: '<div style="font-size:60px;">+</div>',
//   choices: jsPsych.NO_KEYS,
//   timing_response: 5000
// }

/* define static blocks */

/* ---------------------------------------------------------------- */
/* Instruction page helpers                                          */
/* ---------------------------------------------------------------- */
function instrPage(heading, body) {
	return '<div class = instr-page>' +
		'<div class = instr-heading>' + heading + '</div>' +
		'<div class = instr-body>' + body + '</div>' +
		'</div>'
}

function instrTrial(html, buttonLabel) {
	return instrBlock([html], buttonLabel)
}

// Contiguous instruction pages share one trial so the participant can page
// backwards through them with BACK.
function instrBlock(pages, lastButtonLabel) {
	return {
		type: 'poldrack-instructions',
		data: { trial_id: 'instruction' },
		pages: pages,
		allow_keys: false,
		allow_backward: true,
		show_clickable_nav: true,
		button_label_next: 'CONTINUE',
		button_label_back: 'BACK',
		button_label_last: lastButtonLabel,
		timing_post_trial: 500
	}
}

/* ---------------------------------------------------------------- */
/* Common pages A1-A4 (first game only)                              */
/* ---------------------------------------------------------------- */
var PAGE_A1 = instrPage('Two Card Games',
	'<p>You will complete two card games.</p>' +
	'<p>Before each game, you will read instructions and complete two practice rounds.</p>' +
	'<p>Please read each set of instructions carefully before beginning the game.</p>');

var PAGE_A2 = instrPage('Cards and Points',
	'<p>Each round has 32 face-down cards.</p>' +
	'<p>There are two types of cards:</p>' +
	'<div class = card-legend>' +
		'<div class = card-legend-item>' +
			'<img class = legend-card src="images/chosen.png">' +
			'<div class = card-legend-text><strong>Gain card</strong><br>A gain card adds points to your score.</div>' +
		'</div>' +
		'<div class = card-legend-item>' +
			'<img class = legend-card src="images/loss.png">' +
			'<div class = card-legend-text><strong>Loss card</strong><br>A loss card subtracts points from your score.</div>' +
		'</div>' +
	'</div>' +
	'<p>There are no neutral cards.</p>' +
	'<p>At the beginning of each round, the screen will show:</p>' +
	'<ul><li>the number of loss cards among the 32 cards: 1 or 3;</li>' +
	'<li>the points added by each gain card: 10 or 30 points;</li>' +
	'<li>the points subtracted by a loss card: 250 or 750 points.</li></ul>' +
	'<p>You will not know where the gain cards and loss cards are located.</p>' +
	'<p>Points are worth money.</p>');

var PAGE_A3 = instrPage('How a Round Is Scored',
	'<p>Cards are scored in order.</p>' +
	'<p>Each gain card that counts adds the gain amount shown for that round.</p>' +
	'<p>If a loss card occurs, the loss amount is subtracted and scoring for that round ' +
	'stops. Any cards after the first loss card do not affect the score.</p>' +
	'<p>For example:</p>' +
	'<div class = example-box>' +
		'<p>If 7 gain cards count and each gain card is worth 10 points:</p>' +
		'<p class = example-math>7 &times; 10 = 70 points</p>' +
	'</div>' +
	'<div class = example-box>' +
		'<p>If 3 gain cards count before a loss card, each gain card is worth 30 points, ' +
		'and the loss amount is 250 points:</p>' +
		'<p class = example-math>3 &times; 30 &minus; 250 = &minus;160 points</p>' +
	'</div>');

var PAGE_A4 = instrPage('Rounds and Payment',
	'<p>Each round begins at 0 points.</p>' +
	'<p>Each round is independent. Your result in one round does not change the cards or ' +
	'point values in another round.</p>' +
	'<p>You will play ' + numRounds + ' rounds in each game.</p>' +
	'<p>At the end, 3 rounds will be randomly selected, and your bonus payment will be ' +
	'based on your scores in those rounds.</p>' +
	'<p>Next, you will see how to play the first game.</p>');

/* ---------------------------------------------------------------- */
/* Transition page (second game only)                                */
/* ---------------------------------------------------------------- */
var PAGE_TRANSITION = instrPage('Second Card Game',
	'<p>You have finished the first card game.</p>' +
	'<p>In the next game, you will click face-down cards to turn them over.</p>' +
	'<p>After a gain card, you may turn over another card or use <strong>STOP</strong> ' +
	'to end the round.</p>' +
	'<p>Please read the following instructions carefully before beginning.</p>');

/* ---------------------------------------------------------------- */
/* Hot page H1 - How to Play                                         */
/* ---------------------------------------------------------------- */
var PAGE_H1 = instrPage('How to Play',
	'<p>Click a face-down card to turn it over.</p>' +
	'<p>If the card is a gain card, it will be revealed and its points will be added to ' +
	'your score.</p>' +
	'<p>You may then click another face-down card or click <strong>STOP</strong> to end ' +
	'the round.</p>' +
	'<p>If the card is a loss card, the loss amount will be subtracted from your score ' +
	'and the round will end.</p>' +
	'<p>To finish the round after one or more gain cards, click <strong>STOP</strong>.</p>' +
	'<p>To take no cards in a round, click <strong>TAKE NO CARD</strong>. Your score for ' +
	'that round will be 0.</p>');

/* ---------------------------------------------------------------- */
/* Hot tutorial H2 - Try It                                          */
/* ---------------------------------------------------------------- */
var hot_tutorial_block = {
	type: 'single-stim-button',
	button_class: 'select-button',
	stimulus: getHotTutorial,
	is_html: true,
	data: {
		trial_id: 'instruction',
		exp_stage: 'tutorial'
	},
	timing_post_trial: 500,
	response_ends_trial: true
};

/* ---------------------------------------------------------------- */
/* Hot page H3 - Practice Rounds                                     */
/* ---------------------------------------------------------------- */
var hot_page_H3 = instrTrial(instrPage('Practice Rounds',
	'<p>You will now complete two practice rounds.</p>' +
	'<p>These practice rounds work like the real game.</p>' +
	'<p>Before making your choices, pay attention to:</p>' +
	'<ul><li>the number of loss cards;</li>' +
	'<li>the gain amount;</li>' +
	'<li>the loss amount.</li></ul>'), 'START PRACTICE');





var end_block = {
	type: 'poldrack-text',
	data: {
		trial_id: 'end',
		exp_id: 'columbia_card_task_hot'
	},
	text: '<div class = centerbox><p class = center-block-text>Please wait.</p></div>',
	cont_key: [13],
	timing_response: 1200,
	timing_post_trial: 0,
  	on_finish: assessPerformance
};

// Hot page H4 - Ready to Begin
var start_test_block = instrTrial(instrPage('Ready to Begin',
	'<p>The practice rounds are complete.</p>' +
	'<p>You will now play ' + numRounds + ' rounds.</p>' +
	'<p>In each round, select a card to turn over, choose <strong>TAKE NO CARD</strong>, ' +
	'or use <strong>STOP</strong> after a gain card.</p>'), 'BEGIN GAME');
start_test_block.data = { trial_id: 'test_intro' };
start_test_block.timing_post_trial = 1000;
start_test_block.on_finish = function() {
	whichClickInRound = 0
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

// Common instructions are shown once, before the first game only. They share a
// single trial with the game-specific page so BACK can page through them.
var intro_pages = IS_FIRST_TASK
  ? [PAGE_A1, PAGE_A2, PAGE_A3, PAGE_A4, PAGE_H1]
  : [PAGE_TRANSITION, PAGE_H1];

columbia_card_task_hot_experiment.push(instrBlock(intro_pages, 'CONTINUE'));
columbia_card_task_hot_experiment.push(hot_tutorial_block);
columbia_card_task_hot_experiment.push(hot_page_H3);
columbia_card_task_hot_experiment.push(practice_block1);
columbia_card_task_hot_experiment.push(practice_block2);

columbia_card_task_hot_experiment.push(start_test_block);
for (i = 0; i < numRounds; i++) {
  columbia_card_task_hot_experiment.push(test_node);

  // 5s fixation only between rounds, not after the last round
  if (i < numRounds - 1) {
    columbia_card_task_hot_experiment.push(round_delay);
  }
}

columbia_card_task_hot_experiment.push(payoutTrial);
columbia_card_task_hot_experiment.push(end_block);
