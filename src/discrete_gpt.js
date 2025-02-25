var running = false;
var request_string = "";
var response_string = "";
const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖabcdefghijklmnopqrstuvwxyzåäö0123456789,.!_§¶/+*- "
var original_title = document.title;

async function make_request(input) {
    try {
        // Construct the prompt with a preface
        const prompt = "Respond to the following with only the answer, no explanation: " + input;

        // Send the request to the GPT-4o-mini model using the Fetch API
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ` + token
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "user", content: prompt }
                ]
            })
        });

        // Parse the response
        const data = await response.json();
        response_string = data.choices[0].message.content;

        // Update the document title with the response
        document.title = response_string;

    } catch (error) {
        console.error("Error:", error);
        response_string = "Error: " + error.message;
        document.title = "Error: " + error.message;
    }
}

function KeyPress(e) {
    var evtobj = window.event ? event : e;

    if (evtobj.keyCode == 20 && evtobj.ctrlKey) {
        request_string = "";
        navigator.clipboard.readText().then((clipText) => (make_request(clipText)));
    }

    // Ctrl + Shift to start a request
    if (evtobj.keyCode == 16 && evtobj.ctrlKey) {
        request_string = "";
        running = true;
        document.title = "⬞ Capturing input...";
    }

    // Ctrl + Alt to submit the request
    if (evtobj.keyCode == 18 && evtobj.ctrlKey) {
        running = false;

        if (request_string.length > 1) {
            make_request(request_string);
            request_string = "";
        } else {
            document.title = original_title;
        }
    }

    // Backspace character deletion
    if (evtobj.keyCode == 8 && request_string.length != 0) {
        request_string = request_string.slice(0, -1);
    }
}

document.onkeydown = KeyPress;

// Checks if keystrokes are valid characters and appends them to the prompt
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