/* ************************************ */
/* Define helper functions */
/* ************************************ */
// Position in the chained sequence; set by index.html. Standalone runs count as first.
var IS_FIRST_TASK = (typeof CHAIN_INDEX === 'undefined') || CHAIN_INDEX === 0

/* ---------------------------------------------------------------- */
/* Event log.                                                        */
/* Every exported row is appended here at the moment the event       */
/* happens, so onsets, ends and UTC timestamps are measured rather   */
/* than reconstructed at export time. cctBuildCSV() is the only      */
/* source for the result CSV; jsPsych's own trial data is still      */
/* recorded but is no longer exported.                               */
/* ---------------------------------------------------------------- */
var CCT_VERSION = 'cold'

var CCT_COLUMNS = ['participant_id', 'row_timestamp_utc', 'cct_version', 'phase', 'trial_index',
	'event_type', 'which_round', 'condition_repetition', 'num_loss_cards', 'gain_amount',
	'loss_amount', 'action_type', 'card_id_in_a_hot_round', 'num_cards_chosen',
	'loss_revealed_on_action', 'termination_reason', 'running_round_score_in_hot',
	'round_net_points', 'event_onset_ms_from_run_start', 'response_time_ms',
	'event_end_ms_from_run_start']

// One monotonic origin for every relative time in the file: this task launch.
var CCT_CLOCK = (window.performance && typeof window.performance.now === 'function') ?
	function() { return window.performance.now() } :
	function() { return Date.now() }
var CCT_T0 = CCT_CLOCK()

function cctMs() { return Math.round(CCT_CLOCK() - CCT_T0) }

var CCT_EVENTS = []
var cctSeq = 0

// Context that rows inherit, so every row inside a round carries its round and
// its condition without each call site repeating them.
var cctPhase = 'instructions'
var cctRound = null
var cctRep = null
var cctParams = null
var cctRoundOpen = false
var cctRespAvailAt = null
var cctCondCounts = {}
var cctOpenTrialEvent = null
var cctLastCardId = null
var cctPracticeCards = 0

// Time from the moment a response became available to the response itself.
function cctRt() {
	if (cctRespAvailAt === null) return null
	var rt = cctMs() - cctRespAvailAt
	return rt >= 0 ? rt : null
}

function cctOpen(event_type, fields) {
	var e = {
		participant_id: (typeof PARTICIPANT_ID === 'string') ? PARTICIPANT_ID : '',
		row_timestamp_utc: null,
		cct_version: CCT_VERSION,
		phase: cctPhase,
		trial_index: null,
		event_type: event_type,
		which_round: cctRound,
		condition_repetition: cctRep,
		num_loss_cards: cctParams ? cctParams.num_loss_cards : null,
		gain_amount: cctParams ? cctParams.gain_amount : null,
		loss_amount: cctParams ? cctParams.loss_amount : null,
		action_type: null,
		card_id_in_a_hot_round: null,
		num_cards_chosen: null,
		loss_revealed_on_action: null,
		termination_reason: null,
		running_round_score_in_hot: null,
		round_net_points: null,
		event_onset_ms_from_run_start: cctMs(),
		response_time_ms: null,
		event_end_ms_from_run_start: null,
		_seq: cctSeq++
	}
	if (fields) {
		for (var k in fields) { if (fields.hasOwnProperty(k)) e[k] = fields[k] }
	}
	CCT_EVENTS.push(e)
	return e
}

// A row is stamped with its UTC time when it is finalised, not at export.
function cctClose(e, fields) {
	if (!e) return null
	if (fields) {
		for (var k in fields) { if (fields.hasOwnProperty(k)) e[k] = fields[k] }
	}
	if (e.event_end_ms_from_run_start === null) e.event_end_ms_from_run_start = cctMs()
	e.row_timestamp_utc = new Date().toISOString()
	return e
}

// A click or a screen change is instantaneous: it starts and ends at one moment.
function cctMark(event_type, fields) { return cctClose(cctOpen(event_type, fields), null) }

// Opens a round and records which of the two presentations of this condition it is.
function cctRoundStart(phase, round, numLoss, gain, loss, countRepetition, extra) {
	cctPhase = phase
	cctRound = round
	cctParams = { num_loss_cards: numLoss, gain_amount: gain, loss_amount: loss }
	if (countRepetition) {
		var key = numLoss + '|' + gain + '|' + loss
		cctCondCounts[key] = (cctCondCounts[key] || 0) + 1
		cctRep = cctCondCounts[key]
	} else {
		cctRep = null
	}
	cctRoundOpen = true
	cctPracticeCards = 0
	cctLastCardId = null
	return cctMark('round_onset', extra || null)
}

// Closes a round. Ignored if the round is already closed, so a stray click on a
// control that is still enabled after the round ended cannot add a second row.
function cctRoundEnd(fields) {
	if (!cctRoundOpen) return null
	cctRoundOpen = false
	return cctMark('round_end', fields)
}

/* Trial-level hooks, wired up in index.html. Trials that are a whole event in
   themselves (an instruction page, the inter-round fixation, the final wait
   screen) get their row from here; rounds log their own finer-grained events. */
function cctTrialStart() {
	var t = jsPsych.currentTrial()
	cctRespAvailAt = cctMs()
	if (!t) return
	var id = t.data ? t.data.trial_id : undefined
	if (id === 'stim') return          // a round trial: it logs its own events
	if (t.type === 'call-function') return   // payout computation, not an event
	cctRound = null
	cctRep = null
	cctParams = null
	if (t.type === 'poldrack-text' && id === 'end') {
		cctOpenTrialEvent = cctOpen('task_end', null)
	} else if (t.type === 'single-stim-button' && typeof t.data === 'undefined') {
		cctOpenTrialEvent = cctOpen('iti_onset', null)
	} else {
		cctPhase = 'instructions'
		cctOpenTrialEvent = cctOpen('instructions', null)
	}
}

function cctTrialFinish(data) {
	if (!cctOpenTrialEvent) return
	// The plugins store -1 when a trial ended on its own timer; that is not a
	// response time, so it is exported as a blank cell.
	var rt = (data && typeof data.rt === 'number' && data.rt >= 0) ? data.rt : null
	cctClose(cctOpenTrialEvent, { response_time_ms: rt })
	cctOpenTrialEvent = null
}

function cctCell(v) {
	if (v === null || v === undefined || v === '') return ''
	if (v === true) return 'true'
	if (v === false) return 'false'
	var s = String(v)
	if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"'
	return s
}

function cctBuildCSV() {
	// Safety net: an event still in progress would otherwise export a blank end
	// time. The normal path cannot reach here with one open, because a trial is
	// always finalised before the experiment's on_finish runs.
	for (var n = 0; n < CCT_EVENTS.length; n++) {
		if (CCT_EVENTS[n].event_end_ms_from_run_start === null) cctClose(CCT_EVENTS[n], null)
	}
	// Chronological by measured onset; _seq keeps events that share a millisecond
	// in the order they actually occurred.
	var rows = CCT_EVENTS.slice().sort(function(a, b) {
		return (a.event_onset_ms_from_run_start - b.event_onset_ms_from_run_start) ||
			(a._seq - b._seq)
	})
	var lines = [CCT_COLUMNS.join(',')]
	for (var i = 0; i < rows.length; i++) {
		rows[i].trial_index = i    // zero-based index of the final row order
		var cells = []
		for (var j = 0; j < CCT_COLUMNS.length; j++) {
			cells.push(cctCell(rows[i][CCT_COLUMNS[j]]))
		}
		lines.push(cells.join(','))
	}
	return lines.join('\n')
}

// State-dependent prompts.
var PROMPT_CHOOSE = 'How many cards do you want to take?'
var SUBPROMPT_CHOOSE = 'Select one number from 0 to 32.'
var CARD_CLICK_MESSAGE = 'Please use the numbered buttons below to make your choice.'

var setPrompt = function(text) {
	var el = document.getElementById('round_prompt')
	if (el) el.innerHTML = text
}

var setSubPrompt = function(text) {
	var el = document.getElementById('sub_prompt')
	if (el) el.innerHTML = text
}

// Cards are display elements in this task. A click is never a response; it only
// nudges the participant toward the numbered buttons.
var cardNotAResponse = function() {
	var el = document.getElementById('card_click_msg')
	if (el) el.innerHTML = CARD_CLICK_MESSAGE
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

/* ---------------------------------------------------------------- */
/* Shared responsive screen builder.                                  */
/* Every section is a block in normal flow, stacked by .game-layout,  */
/* so each one pushes the next down instead of overlaying it.         */
/* ---------------------------------------------------------------- */
var settingCell = function(id, label, value, primary) {
	return '<div class = "setting' + (primary ? ' setting--primary' : ' setting--secondary') + '">' +
		'<div class = setting-label>' + label + '</div>' +
		'<div class = setting-value id = "' + id + '">' + value + '</div>' +
		'</div>'
}

// One Round Settings panel for the tutorial, practice and real rounds.
// roundLabel carries the round indicator so no second one is shown as a
// heading. points === null omits the cell (this task shows no running total).
var roundSettings = function(roundLabel, gainAmount, lossAmount, lossCards, points) {
	var html = '<div class = round-settings>' +
		settingCell('game_round', 'ROUND', roundLabel, false) +
		settingCell('gain_amount', 'PER GAIN CARD', '+' + gainAmount + ' points', true) +
		settingCell('loss_amount', 'LOSS PENALTY', '\u2212' + lossAmount + ' points', true) +
		settingCell('num_loss_cards', 'LOSS CARDS', lossCards, true)
	if (points !== null && points !== undefined) {
		html += settingCell('current_round', 'CURRENT ROUND POINTS', points, false)
	}
	return html + '</div>'
}

var gameScreen = function(parts) {
	var html = '<div class = game-layout>'
	if (parts.heading) {
		html += '<h1 class = gl-heading>' + parts.heading + '</h1>'
	}
	if (parts.settings) {
		html += parts.settings
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

// Returns the 0-32 buttons only; the caller wraps them in the wrapping .gl-numbers row.
var getButtons = function(handler) {
	var fn = handler || 'chooseButton'
	var buttons = ''
	for (i = 0; i < 33; i++) {
		buttons += "<button type = 'button' class = 'CCT-btn chooseButton' id = " + i +
			" onclick = " + fn + "(this.id)>" + i + "</button>"
	}
	return buttons
}

var nextRoundButton = function(withTimerClear) {
	return "<button type='button' id = nextButton class = 'CCT-btn select-button'" +
		(withTimerClear ? " onclick = coldNextRound()" : "") + " disabled>NEXT ROUND</button>"
}

var getBoard = function() {
	// Cards are never response controls in this task: not focusable, and a click only
	// shows a corrective message. They stay face-down for the whole round.
	// Returns card elements only; the caller wraps them in the .gl-cards grid.
	var cards = ''
	for (i = 1; i < 33; i++) {
		cards += "<input class = 'card_image display-card' type='image' id = c" + i +
			" src='images/beforeChosen.png' tabindex='-1' onclick = cardNotAResponse()>"
	}
	return cards
}

var coldNextRound = function() {
	cctMark('participant_action', { action_type: 'next_round', response_time_ms: cctRt() })
	cctRespAvailAt = cctMs()
	clearTimers()
}

function clearTimers() {
	for (var i = 0; i < CCT_timeouts.length; i++) {
		clearTimeout(CCT_timeouts[i]);
	}
}


var getPractice1 = function() {
	whichLossCards = [17]
	gainAmt = 30
	lossAmt = 250
	cctRoundStart('practice', 1, 1, gainAmt, lossAmt, false, null)
	return practiceSetup1
}

var getPractice2 = function() {
	whichLossCards = [2,6,31]
	gainAmt = 10
	lossAmt = 750
	cctRoundStart('practice', 2, 3, gainAmt, lossAmt, false, null)
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
	cctMark('participant_action', { action_type: 'choose_card_count',
		num_cards_chosen: currID, response_time_ms: cctRt() })
	cctRoundEnd({ num_cards_chosen: currID, termination_reason: 'cold_end_of_round',
		round_net_points: roundPoints })
	cctRespAvailAt = cctMs()
	// Scoring above is unchanged. Nothing about the outcome is shown: no card is
	// flipped, no identity revealed, no loss-card feedback given for this round.
	$('#' + clicked_id).addClass('selected-number')
	setPrompt('You selected ' + currID + ' card' + (currID === 1 ? '' : 's') +
		'. Click NEXT ROUND to continue.')
	setSubPrompt('')
	var msg = document.getElementById('card_click_msg')
	if (msg) msg.innerHTML = ''
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
	cctRoundStart('test', whichRound, numLossCards, gainAmt, lossAmt, true, null)
	return coldRoundScreen(whichRound, lossAmt, gainAmt, numLossCards)
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

// Header panel shared by the tutorial, practice rounds and real rounds.
// One screen shape for the tutorial, practice rounds and real rounds.
var coldRoundScreen = function(round, lossAmount, gainAmount, lossCards, opts) {
	opts = opts || {}
	return gameScreen({
		heading: opts.heading,
		// No running total in this task, so the points cell is omitted.
		settings: roundSettings(opts.roundLabel || round, gainAmount, lossAmount, lossCards, null),
		lead: opts.lead,
		// The tutorial carries its own instruction in `lead`, so the generic
		// round prompt and sub-prompt are omitted there.
		prompt: opts.tutorial ? undefined : PROMPT_CHOOSE,
		subprompt: opts.tutorial ? undefined : SUBPROMPT_CHOOSE,
		actions: nextRoundButton(!opts.tutorial),
		numbers: getButtons(opts.tutorial ? 'tutorialChoose' : 'chooseButton'),
		cards: getBoard()
	})
}

/* ---------------------------------------------------------------- */
/* Cold tutorial ("Try It") - select 7, nothing is revealed          */
/* ---------------------------------------------------------------- */
var tutorialChoose = function(clicked_id) {
	var n = parseInt(clicked_id)
	if (n !== 7) {
		document.getElementById('card_click_msg').innerHTML =
			'For this tutorial, please select 7.'
		return
	}
	$('.chooseButton').prop('disabled', true)
	$('#' + clicked_id).addClass('selected-number')
	document.getElementById('card_click_msg').innerHTML = ''
	document.getElementById('tutorial_text').innerHTML =
		'You selected 7 cards.<br>The cards remain face-down. Click <strong>NEXT ROUND</strong> to continue.'
	$('#nextButton').prop('disabled', false)
}

var getColdTutorial = function() {
	return coldRoundScreen(1, 250, 30, 1, {
		heading: '<span id = tutorial_heading>Try It</span>',
		lead: 'Suppose you want to take 7 cards.<br>Use the numbered buttons below to select 7.',
		tutorial: true
	})
}

var practiceSetup1 = coldRoundScreen(1, 250, 30, 1, { roundLabel: 'Practice 1 of 2' })

var practiceSetup2 = coldRoundScreen(2, 750, 10, 3, { roundLabel: 'Practice 2 of 2' })
	
	
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
	'<p>In the next game, you will use numbered buttons to choose how many cards to take.</p>' +
	'<p>The cards will remain face-down after you make your choice.</p>' +
	'<p>Please read the following instructions carefully before beginning.</p>');

/* ---------------------------------------------------------------- */
/* Cold page C1 - How to Play                                        */
/* ---------------------------------------------------------------- */
// Numbered by the order this participant plays the games, not by which
// task it is: whichever game comes first is Game 1.
var GAME_NUMBER = IS_FIRST_TASK ? 1 : 2

var PAGE_C1 = instrPage('How to Play Game ' + GAME_NUMBER,
	'<p>At the beginning of each round, choose how many cards you want to take.</p>' +
	'<p>Click one numbered button from 0 to 32.</p>' +
	'<p><strong>The computer will randomly determine which cards are selected.</strong></p>' +
	'<p>Use the numbered buttons to make your choice. The card images are not buttons.</p>' +
	'<p>Selecting 0 means taking no cards. Your score for that round will be 0.</p>');

/* ---------------------------------------------------------------- */
/* Cold page C2 - How Your Choice Is Scored                          */
/* ---------------------------------------------------------------- */
var PAGE_C2 = instrPage('How Your Choice Is Scored',
	'<p>After you choose a number, the computer evaluates that number of cards in a ' +
	'random order.</p>' +
	'<p>Each gain card before the first loss card adds the gain amount shown for that ' +
	'round.</p>' +
	'<p>If a loss card occurs, the loss amount is subtracted and scoring for that round ' +
	'stops. Any selected cards after the first loss card do not affect the score.</p>' +
	'<p>The cards will remain face-down.</p>' +
	'<p>You will not see which cards the computer selected, and the screen will not tell ' +
	'you during that round whether a selected card was a loss card.</p>' +
	'<p>Your choice and score will be recorded automatically.</p>');

/* ---------------------------------------------------------------- */
/* Cold tutorial C3 - Try It                                         */
/* ---------------------------------------------------------------- */
var cold_tutorial_block = {
	type: 'single-stim-button',
	button_class: 'select-button',
	stimulus: getColdTutorial,
	is_html: true,
	data: {
		trial_id: 'instruction',
		exp_stage: 'tutorial'
	},
	timing_post_trial: 500,
	response_ends_trial: true
};

/* ---------------------------------------------------------------- */
/* Cold page C4 - Practice Rounds                                    */
/* ---------------------------------------------------------------- */
var cold_page_C4 = instrTrial(instrPage('Practice Rounds',
	'<p>You will now complete two practice rounds.</p>' +
	'<p>These practice rounds work like the real game.</p>' +
	'<p>Before making your choice, pay attention to:</p>' +
	'<ul><li>the number of loss cards;</li>' +
	'<li>the gain amount;</li>' +
	'<li>the loss amount.</li></ul>' +
	'<p>Use the numbered buttons to choose how many cards you want to take.</p>' +
	'<p>After you choose a number, the cards will remain face-down.</p>'), 'START PRACTICE');

// Cold page C5 - Ready to Begin
var end_instructions = instrTrial(instrPage('Ready to Begin',
	'<p>The practice rounds are complete.</p>' +
	'<p>You will now play ' + numRounds + ' rounds.</p>' +
	'<p>In each round, select one number from 0 to 32.</p>' +
	'<p>After you select a number, the cards will remain face-down. ' +
	'Click <strong>NEXT ROUND</strong> to continue.</p>'), 'BEGIN GAME');
end_instructions.data = { trial_id: 'end_instructions' };

var end_block = {
	type: 'poldrack-text',
	data: {
		trial_id: 'end',
		exp_id: 'columbia_card_task_cold'
	},
	text: '<div class = centerbox><p class = center-block-text>Please wait.</p></div>',
	cont_key: [13],
	timing_response: 1200,
	timing_post_trial: 0,
  	on_finish: assessPerformance
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

// Common instructions are shown once, before the first game only. They share a
// single trial with the game-specific pages so BACK can page through them.
var intro_pages = IS_FIRST_TASK
	? [PAGE_A1, PAGE_A2, PAGE_A3, PAGE_A4, PAGE_C1, PAGE_C2]
	: [PAGE_TRANSITION, PAGE_C1, PAGE_C2];

columbia_card_task_cold_experiment.push(instrBlock(intro_pages, 'CONTINUE'));
columbia_card_task_cold_experiment.push(cold_tutorial_block);
columbia_card_task_cold_experiment.push(cold_page_C4);
columbia_card_task_cold_experiment.push(practice_block1);
columbia_card_task_cold_experiment.push(practice_block2);
columbia_card_task_cold_experiment.push(end_instructions);
for (b = 0; b < numRounds; b++) {
	columbia_card_task_cold_experiment.push(test_block);

	// 5s fixation only between rounds, not after the last round
	if (b < numRounds - 1) {
		columbia_card_task_cold_experiment.push(round_delay);
	}
}
columbia_card_task_cold_experiment.push(payoutTrial);
columbia_card_task_cold_experiment.push(end_block);
