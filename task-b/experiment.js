/* ************************************ */
/* Define helper functions */
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

var appendTestData = function() {
	jsPsych.data.addDataToLastTrial({
		num_cards_chosen: currID,
		num_loss_cards: numLossCards,
		gain_amount: gainAmt,
		loss_amount: lossAmt,
		round_points: roundPointsArray[roundPointsArray.length - 1],
		which_round: whichRound
	})
}

var getButtons = function(buttonType) {
	var buttons = ""
	var containerClass = (buttonType == 'game') ? 'allbuttons-game' : 'allbuttons'
	buttons = "<div class = " + containerClass + ">"
	for (i = 0; i < 33; i++) {
		buttons += "<button type = 'button' class = 'CCT-btn chooseButton' id = " + i +
			" onclick = chooseButton(this.id)>" + i + "</button>"
	}
	return buttons
}

var getBoard = function(board_type) {
	var board = ''
	if (board_type == 2) {
		board = "<div class = cardbox>"
		for (i = 1; i < 33; i++) {
		board += "<div class = square><input type='image' class = card_image id = c" + i +
			" src='images/beforeChosen.png'></div>"
		}
		
	} else {
		board = "<div class = cardbox2>"
		for (i = 1; i < 33; i++) {
		board += "<div class = square><input class = card_image type='image' id = c" + i +
			" src='images/beforeChosen.png'></div>"
		}
	}
	board += "</div>"
	return board
}

var turnOneCard = function(whichCard, win) {
	if (win === 'loss') {
		document.getElementById("c" + whichCard + "").src =
			'images/loss.png';
	} else {
		document.getElementById("c" + whichCard + "").src =
			'images/chosen.png';
	}
}

function doSetTimeout(card_i, delay, points, win) {
	CCT_timeouts.push(setTimeout(function() {
		turnOneCard(card_i, win);
		document.getElementById("current_round").innerHTML = 'Current Round Points: ' + points
	}, delay));
}

function clearTimers() {
	for (var i = 0; i < CCT_timeouts.length; i++) {
		clearTimeout(CCT_timeouts[i]);
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
		'<strong>Example 1.</strong> In this example, there are 32 face-down cards. The display tells you there is 1 loss card, each gain card is worth 10 points, and the loss card costs 750 points. Suppose you choose to turn over 7 cards. <font color = "red">Luckily, none of the 7 cards selected by the computer was the loss card. You earned 10 points for each card, so your score for this round was 7 &times; 10 = 70 points. <span style="color:red; text-decoration:underline;">Please click Next.</span></font>'
		}, delay))
}

var instructFunction2 = function() {
	$('#instructButton').prop('disabled', true)
	// The remaining 6 of the 10 cards the computer selected, revealed after the
	// loss card ended the round. They are shown for transparency only.
	var remainingSelected = [3, 5, 6, 7, 9, 10]
	var instructTurnCards = function() {
		for (var i = 0; i < remainingSelected.length; i++) {
			turnOneCard(remainingSelected[i], 'win')
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
			'<strong>Example 2.</strong> In this example, there are 32 face-down cards. The display tells you there are 3 loss cards, each gain card is worth 30 points, and each loss card costs 250 points. Suppose you choose to turn over 10 cards. <font color = "red">One of the cards selected by the computer was a loss card. The round ended as soon as the loss card appeared. Before the loss card appeared, 3 gain cards had been revealed: 3 &times; 30 = 90 points. Then the loss card subtracted 250 points: 90 &minus; 250 = &minus;160 points. Your score for this round was &minus;160 points. The remaining selected cards are shown for transparency, but they do not affect your score. <span style="color:red; text-decoration:underline;">Please click Next.</span></font>'
	}, delay))
	CCT_timeouts.push(setTimeout(instructTurnCards, delay + 1000))
}



var getPractice1 = function() {
	whichLossCards = [17]
	gainAmt = 30
	lossAmt = 250
	return practiceSetup1
}

var getPractice2 = function() {
	whichLossCards = [2,6,31]
	gainAmt = 10
	lossAmt = 750
	return practiceSetup2
}

var chooseButton = function(clicked_id) {
	$('#nextButton').prop('disabled', false)
	$('.chooseButton').prop('disabled', true)
	currID = parseInt(clicked_id)
	var roundPoints = 0
	var cards_to_turn = jsPsych.randomization.repeat(cardArray, 1).slice(0, currID)
	for (var i = 0; i < cards_to_turn.length; i++) {
		var card_i = cards_to_turn[i]
		if (whichLossCards.indexOf(card_i) == -1) {
			roundPoints += gainAmt
		} else {
			roundPoints -= lossAmt
			break
		}
	}
	roundPointsArray.push(roundPoints)
	if ($('#feedback').length) {
		document.getElementById("feedback").innerHTML = ''
	}
}

var instructButton = function(clicked_id) {
	currID = parseInt(clicked_id)
	document.getElementById(clicked_id).src =
		'images/chosen.png';
}

// appends text to be presented in the game
function appendTextAfter(input, search_term, new_text) {
	var index = input.indexOf(search_term) + search_term.length
	return input.slice(0, index) + new_text + input.slice(index)
}



// this function sets up the round params (loss amount, gain amount, which ones are loss cards, initializes the array for cards to be clicked, )
var getRound = function() {
	var currID = 0
	cardArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
		24, 25, 26, 27, 28, 29, 30, 31, 32
	]
	shuffledCardArray = jsPsych.randomization.repeat(cardArray, 1)
	whichRound = whichRound + 1
	randomChosenCards = []
	roundParams = shuffledParamsArray.pop()
	numLossCards = roundParams[0]
	gainAmt = roundParams[1]
	lossAmt = roundParams[2]
	whichLossCards = []
	for (i = 0; i < numLossCards; i++) {
		whichLossCards.push(shuffledCardArray.pop())
	}
	gameState = gameSetup
	gameState = appendTextAfter(gameState, 'Game Round: ', whichRound)
	gameState = appendTextAfter(gameState, 'Loss Amount: ', '<strong style=\"color:red\">' + lossAmt + '</strong>')
	gameState = appendTextAfter(gameState, 'Number of Loss Cards: ', '<strong style=\"color:red\">' + numLossCards + '</strong>')
	gameState = appendTextAfter(gameState, 'Gain Amount: ', '<strong style=\"color:red\">' + gainAmt + '</strong>')
	return gameState
}




/* ************************************ */
/* Define experimental variables */
/* ************************************ */
// generic task variables
var sumInstructTime = 0 //ms
var instructTimeThresh = 0 ///in seconds
var credit_var = true
var performance_var = 0

// task specific variables
var currID = 0
var numLossCards = 1
var gainAmt = ""
var lossAmt = ""
var points = []
var whichLossCards = [17]
var CCT_timeouts = []
var numRounds = 16
var whichRound = 0
var totalPoints = 0
var roundOver = 0
var roundPointsArray = []
var prize1 = 0
var prize2 = 0
var prize3 = 0

var practiceSetup1 =
	"<div class = practiceText><div class = block-text2 id = instruct1><strong>Practice 1.</strong> This is a practice round. It looks like the real game. Please choose how many cards you want to turn over, from 0 to 32, based on the number of loss cards and the gain/loss points shown below. You will choose only the number of cards; the computer will randomly select which cards are revealed. If turning over cards seems too risky, you can choose 0 cards, and your score for the round will be 0.</div></div>" +
	"<div class = cct-box2>"+
	"<div class = titleBigBox>   <div class = titleboxLeft><div class = center-text id = game_round>Game Round: 1</div></div>   <div class = titleboxLeft1><div class = center-text id = loss_amount>Loss Amount: <strong style=\"color:red\">250</strong></div></div>    <div class = titleboxMiddle1><div class = center-text id = gain_amount>Gain Amount: <strong style=\"color:red\">30</strong></div></div>    <div class = titlebox><div class = center-text>How many cards do you want to take? </div></div>     <div class = titleboxRight1><div class = center-text id = num_loss_cards>Number of Loss Cards: <strong style=\"color:red\">1</strong></div></div>"+
	"<div class = buttonbox><button type='button' id = nextButton class = 'CCT-btn select-button' onclick = clearTimers() disabled>Next Round</button></div>"+
	getButtons()+
	"</div>"+
	getBoard()



var practiceSetup2 =
 	"<div class = practiceText><div class = block-text2 id = instruct2><strong>Practice 2.</strong> This is the second practice round. Again, please choose how many cards you want to turn over, from 0 to 32, based on the number of loss cards and the gain/loss points shown below. You will choose only the number of cards; the computer will randomly select which cards are revealed. The computer will record your score for each round. After all " + numRounds + " real rounds, you will see your total score.</div></div>"+
	"<div class = cct-box2>"+
	"<div class = titleBigBox>   <div class = titleboxLeft><div class = center-text id = game_round>Game Round: 2</div></div>   <div class = titleboxLeft1><div class = center-text id = loss_amount>Loss Amount: <strong style=\"color:red\">750</strong></div></div>    <div class = titleboxMiddle1><div class = center-text id = gain_amount>Gain Amount: <strong style=\"color:red\">10</strong></div></div>    <div class = titlebox><div class = center-text>How many cards do you want to take? </div></div>     <div class = titleboxRight1><div class = center-text id = num_loss_cards>Number of Loss Cards: <strong style=\"color:red\">3</strong></div></div>"+
	"<div class = buttonbox><button type='button' id = nextButton class = 'CCT-btn select-button' onclick = clearTimers() disabled>Next Round</button></div>"+
	getButtons()+
	"</div>"+
	getBoard()	
	
	
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
	24, 25, 26, 27, 28, 29, 30, 31, 32
]

var shuffledCardArray = jsPsych.randomization.repeat(cardArray, 1)
var shuffledParamsArray = jsPsych.randomization.repeat(paramsArray, numRounds / paramsArray.length)


var gameSetup =
	"<div class = cct-box-game>"+
	"<div class = titleBigBox>   <div class = titleboxLeft><div class = center-text id = game_round>Game Round: </div></div>   <div class = titleboxLeft1><div class = center-text id = loss_amount>Loss Amount: </div></div>    <div class = titleboxMiddle1><div class = center-text id = gain_amount>Gain Amount: </div></div>    <div class = titlebox><div class = center-text>How many cards do you want to take? </div></div>     <div class = titleboxRight1><div class = center-text id = num_loss_cards>Number of Loss Cards: </div></div>" +
	"<div class = buttonbox-game><button type='button' id = nextButton class = 'CCT-btn select-button' onclick = clearTimers() disabled>Next Round</button></div>"+
	getButtons('game')+
	"</div>"+
	getBoard()



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

/* define static blocks */
var feedback_instruct_text =
	'Welcome to the experiment. Press <strong>enter</strong> to begin.'
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
var instruction_trials = []
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
	'<li>how many points you lose if a loss card appears</li></ul>'+
	'<p>You will not know which specific face-down cards are gain cards or loss cards.</p>'+
	'<p>In each round, you will choose how many cards you want to turn over, from 0 to 32. You will not choose the specific cards. Instead, the computer will randomly select and reveal that many cards from the 32 face-down cards.</p>'+
	'<p>For each gain card revealed, points are added to your score for that round. If a loss card is revealed, points are subtracted from your score and the round ends immediately.</p>'+
	'<p>If you chose to turn over more cards, the remaining selected cards will be shown for transparency, but they will not affect your score.</p>'+
	'<p>Each round starts at 0 points, so each round is independent.</p>'+
	'<p>You will play ' + numRounds + ' rounds. At the end, 3 rounds will be randomly selected, and your bonus payment will be based on your scores in those rounds.</p></div>',
	
    '<div class = centerbox style="text-align:center;"><p class = block-text style="text-align:center;"><strong>Unknown Cards</strong></p>'+
    '<p style="text-align:center;">This is what an unknown card looks like.</p>'+
    '<p style="text-align:center;">Click the card to turn it over.</p>'+
    "<p style=\"text-align:center;\"><input type='image' id = '133' src='images/beforeChosen.png' onclick = instructButton(this.id)>"+
	'</p></div>',

	'<div class = centerbox style="text-align:center;"><p class = block-text style="text-align:center;">There are two types of cards:</p>'+
	'<p style="text-align:center;"><strong>Gain cards:</strong></p>'+
	'<p style="text-align:center;">Each gain card increases your score by either 10 or 30 points, depending on the round.</p>'+
	"<p style=\"text-align:center;\"><input type='image' src='images/chosen.png'></p>"+
	'<p style="text-align:center;"><strong>Loss cards:</strong></p>'+
	"<p style=\"text-align:center;\"><input type='image' src='images/loss.png'></p>"+
	'<p style="text-align:center;">Each loss card decreases your score by either 250 or 750 points, depending on the round. If a loss card appears, the round ends immediately.</p>'+
	'<p style="text-align:center;">Each round will have either 1 or 3 loss cards among the 32 cards.</p>'+
	'<p style="text-align:center;">The number of loss cards, the gain amount, and the loss amount will always be shown on the screen during the round.</p>'+
	'</div>',
	
	"<div class = practiceText><div class = block-text2 id = instruct1><strong>Example 1.</strong> In this example, there are 32 face-down cards. The display tells you there is 1 loss card, each gain card is worth 10 points, and the loss card costs 750 points. Suppose you choose to turn over 7 cards; the computer will randomly select and reveal 7 of the 32 cards. <span style=\"color:red; text-decoration:underline;\">Click <strong>See Result</strong> to see what happens.</span></div></div>"+
	"<div class = cct-box2>"+
	"<div class = titleBigBox>   <div class = titleboxLeft><div class = center-text>Game Round: 1</div></div>   <div class = titleboxLeft1><div class = center-text>Loss Amount: <strong style=\"color:red\">750</strong></div></div>    <div class = titleboxMiddle1><div class = center-text>Gain Amount: <strong style=\"color:red\">10</strong></div></div>    <div class = titlebox><div class = center-text>How many cards do you want to take? </div></div>     <div class = titleboxRight1><div class = center-text>Number of Loss Cards: <strong style=\"color:red\">1</strong></div></div>   <div class = titleboxRight><div class = center-text id = current_round>Current Round Points: 0</div></div>"+
	"<div class = buttonbox2><button type='button' class = CCT-btn id = instructButton onclick= instructFunction()>See Result</button></div></div>"+
	getBoard(2),
	
	"<div class = practiceText><div class = block-text2 id = instruct2><strong>Example 2.</strong> In this example, there are 32 face-down cards. The display tells you there are 3 loss cards, each gain card is worth 30 points, and each loss card costs 250 points. Suppose you choose to turn over 10 cards; the computer will randomly select and reveal up to 10 of the 32 cards. <span style=\"color:red; text-decoration:underline;\">Click <strong>See Result</strong> to see what happens.</span></div></div>"+
	"<div class = cct-box2>"+
	"<div class = titleBigBox>   <div class = titleboxLeft><div class = center-text>Game Round: 1</div></div>   <div class = titleboxLeft1><div class = center-text>Loss Amount: <strong style=\"color:red\">250</strong></div></div>    <div class = titleboxMiddle1><div class = center-text>Gain Amount: <strong style=\"color:red\">30</strong></div></div>    <div class = titlebox><div class = center-text>How many cards do you want to take? </div></div>     <div class = titleboxRight1><div class = center-text>Number of Loss Cards: <strong style=\"color:red\">3</strong></div></div>   <div class = titleboxRight><div class = center-text id = current_round>Current Round Points: 0</div></div>"+
	"<div class = buttonbox2><button type='button' class = CCT-btn id = instructButton onclick= instructFunction2()>See Result</button></div></div>"+
	getBoard(2),
	"<div class = centerbox><p class = block-text>You will now complete two practice rounds before the real game begins.</p><p class = block-text>Please make sure you understand the examples before continuing.</p></div>"
  ],
  allow_keys: false,
  show_clickable_nav: true,
  timing_post_trial: 1000
};
instruction_trials.push(feedback_instruct_block)
instruction_trials.push(instructions_block)

var instruction_node = {
	timeline: instruction_trials,
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

var end_instructions = {
	type: 'poldrack-single-stim',
	stimulus: '<div class = centerbox><p class = center-block-text><strong>End of Instructions </strong></p><p class = center-block-text>Press <strong>enter</strong> when you are ready to play the game.</p></div>',
	is_html: true,
	data: {
		trial_id: 'end_instructions'
	},
	choices: [13],
	timing_post_trial: 0,
	response_ends_trial: true,
};

var end_block = {
	type: 'poldrack-text',
	data: {
		trial_id: 'end',
		exp_id: 'columbia_card_task_cold'
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
	timing_post_trial: 1000
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
		appendTestData()
		roundOver = 0
		currTrial = 0
		whichRound = 0
		numLossCards = 3
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
		appendTestData()
		roundOver = 0
		currTrial = 0
		whichRound = 0
		roundPointsArray = []
	}
};

var test_block = {
	type: 'single-stim-button',
	button_class: 'select-button',
	stimulus: getRound,
	data: {
		trial_id: 'stim',
		exp_stage: 'test'
	},
	timing_post_trial: 0,
	on_finish: appendTestData,
	response_ends_trial: true,
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

var payoutTrial = {
	type: 'call-function',
	data: {
		trial_id: 'calculate reward'
	},
	func: function() {
		totalPoints = math.sum(roundPointsArray)
		randomRoundPointsArray = jsPsych.randomization.repeat(roundPointsArray, 1)
		prize1 = randomRoundPointsArray.pop()
		prize2 = randomRoundPointsArray.pop()
		prize3 = randomRoundPointsArray.pop()
		performance_var = prize1 + prize2 + prize3
	}
};



/* create experiment definition array */
var columbia_card_task_cold_experiment = [];
columbia_card_task_cold_experiment.push(instruction_node);
columbia_card_task_cold_experiment.push(practice_block1);
columbia_card_task_cold_experiment.push(practice_block2);
columbia_card_task_cold_experiment.push(end_instructions)
for (b = 0; b < numRounds; b++) {
	columbia_card_task_cold_experiment.push(test_block);

	// 6s fixation only between rounds, not after the last round
	if (b < numRounds - 1) {
		columbia_card_task_cold_experiment.push(round_delay);
	}
}
columbia_card_task_cold_experiment.push(payoutTrial);
columbia_card_task_cold_experiment.push(end_block);
