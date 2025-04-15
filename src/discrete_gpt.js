var running = false;
var request_string = "";
var response_string = "";
const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖabcdefghijklmnopqrstuvwxyzåäö0123456789,.!_§¶/+*- ";
var original_title = document.title;
var popupDiv = null;

async function make_request(input) {
	try {
		const prompt = "Respond to the following with only the answer, no explanation: " + input;

		document.title = "⬞ Processing...";
		if (popupDiv) popupDiv.style.display = 'none';

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ` + token
			},
			body: JSON.stringify({
				model: "gpt-4o",
				messages: [{ role: "user", content: prompt }]
			})
		});

		const data = await response.json();
		response_string = data.choices[0].message.content;

		// Update title and show popup
		document.title = response_string;
		if (popupDiv) {
			popupDiv.textContent = response_string;
		}

	} catch (error) {
		console.error("Error:", error);
		response_string = "Error: " + error.message;
		document.title = "Error: " + error.message;
		if (popupDiv) {
			popupDiv.textContent = response_string;
			popupDiv.style.display = 'block';
		}
	}
}

function initPopup() {
	popupDiv = document.createElement('div');
	popupDiv.id = 'gpt-popup';
	popupDiv.style.display = 'none';
	popupDiv.style.position = 'fixed';
	popupDiv.style.bottom = '40px';
	popupDiv.style.right = '10px';
	popupDiv.style.width = '300px';
	popupDiv.style.maxHeight = '300px';
	popupDiv.style.overflow = 'auto';
	popupDiv.style.backgroundColor = 'white';
	popupDiv.style.color = 'black';
	popupDiv.style.border = '1px solid #ddd';
	popupDiv.style.padding = '10px';
	popupDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
	popupDiv.style.zIndex = '10000';
	document.body.appendChild(popupDiv);

	// Optional: clicking the popup prevents it from closing by accident
	popupDiv.addEventListener('click', function(e) {
		e.stopPropagation();
	});

	// Optional: clicking outside the popup hides it
	document.addEventListener('click', function () {
		if (popupDiv) popupDiv.style.display = 'none';
	});
}

function KeyPress(e) {
	const evtobj = window.event ? event : e;

	// Ctrl + CapsLock = clipboard mode
	if (evtobj.keyCode == 20 && evtobj.ctrlKey) {
		request_string = "";
		navigator.clipboard.readText().then((clipText) => (make_request(clipText)));
	}

	// Ctrl + Shift = start running mode (typing capture)
	if (evtobj.keyCode == 16 && evtobj.ctrlKey) {
		request_string = "";
		running = true;
		document.title = "⬞ Capturing input...";
	}

	// Ctrl + Alt = submit typed request
	if (evtobj.keyCode == 18 && evtobj.ctrlKey) {
		running = false;

		if (request_string.length > 1) {
			make_request(request_string);
			request_string = "";
		} else {
			document.title = original_title;
		}
	}

	// Backspace = delete last character in typed mode
	if (evtobj.keyCode == 8 && request_string.length != 0) {
		request_string = request_string.slice(0, -1);
	}

	// Ctrl + / = toggle popup visibility
	if (evtobj.key === '/' && evtobj.ctrlKey) {
		if (popupDiv) {
			popupDiv.style.display = popupDiv.style.display === 'none' ? 'block' : 'none';
		}
	}
}

initPopup();
document.onkeydown = KeyPress;

// Captures manual typing while in running mode
document.addEventListener("keydown", function(event) {
	if (running) {
		if (charset.includes(event.key)) {
			request_string += event.key;
		}

		if (request_string.length != 0) {
			document.title = "⬞ " + request_string;
		} else {
			document.title = "⬞ " + original_title;
		}
	}
});

// Click-to-extract question and auto-request
document.addEventListener("click", function(event) {
	if (!running) return;

	const questionDiv = event.target.closest("div[id*='_question_text']");
	if (!questionDiv) return;

	const questionText = questionDiv.textContent.trim();
	const questionIdMatch = questionDiv.id.match(/question_(\d+)_question_text/);
	if (!questionIdMatch) return;

	const questionId = questionIdMatch[1];
	const answersContainer = questionDiv.parentElement.querySelector(".answers");
	if (!answersContainer) return;

	const answerLabels = answersContainer.querySelectorAll(`div[id^='question_${questionId}_answer_']`);
	if (!answerLabels.length) return;

	const formattedAnswers = Array.from(answerLabels).map((labelDiv, index) => {
		const letter = String.fromCharCode(65 + index); // A, B, C, ...
		return `${letter}) ${labelDiv.textContent.trim()}`;
	});

	const fullPrompt = `Q: ${questionText}\n${formattedAnswers.join('\n')}`;

	make_request(fullPrompt);
	running = false;

	// Optional: highlight question briefly
	questionDiv.style.outline = '2px solid #4CAF50';
	setTimeout(() => {
		questionDiv.style.outline = 'none';
	}, 2000);
});
