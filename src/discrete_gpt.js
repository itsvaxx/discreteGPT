var running = false;
var request_string = "";
var response_string = "";
const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖabcdefghijklmnopqrstuvwxyzåäö0123456789,.!_§¶/+*- "
var original_title = document.title;
var notificationBadge = null;
var popupDiv = null;

async function make_request(input) {
    try {
        const prompt = "Respond to the following with only the answer, no explanation: " + input;
        
        document.title = "⬞ Processing...";
        if (notificationBadge) notificationBadge.style.display = 'none';
        if (popupDiv) popupDiv.style.display = 'none';

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ` + token
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "user", content: prompt }
                ]
            })
        });

        const data = await response.json();
        response_string = data.choices[0].message.content;

        // Update title and show notification
        document.title = response_string;
        if (notificationBadge && popupDiv) {
            notificationBadge.style.display = 'block';
            notificationBadge.style.backgroundColor = '#4CAF50';
            popupDiv.textContent = response_string;
            
            // Auto-hide notification after 30 seconds
            setTimeout(() => {
                notificationBadge.style.display = 'none';
                popupDiv.style.display = 'none';
            }, 30000);
        }

    } catch (error) {
        console.error("Error:", error);
        response_string = "Error: " + error.message;
        document.title = "Error: " + error.message;
        if (notificationBadge && popupDiv) {
            notificationBadge.style.display = 'block';
            notificationBadge.style.backgroundColor = '#f44336';
            popupDiv.textContent = response_string;
            popupDiv.style.display = 'block';
        }
    }
}

function initNotificationBadge() {
    // Create the notification badge
    notificationBadge = document.createElement('div');
    notificationBadge.id = 'gpt-notification';
    notificationBadge.style.position = 'fixed';
    notificationBadge.style.bottom = '10px';
    notificationBadge.style.right = '10px';
    notificationBadge.style.width = '20px';
    notificationBadge.style.height = '20px';
    notificationBadge.style.backgroundColor = '#4CAF50';
    notificationBadge.style.borderRadius = '50%';
    notificationBadge.style.zIndex = '9999';
    notificationBadge.style.display = 'none';
    notificationBadge.style.cursor = 'pointer';
    notificationBadge.title = 'Click to view response';
    document.body.appendChild(notificationBadge);
    
    // Create the popup div
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
    popupDiv.style.border = '1px solid #ddd';
    popupDiv.style.padding = '10px';
    popupDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
    popupDiv.style.zIndex = '10000';
    document.body.appendChild(popupDiv);
    
    // Add click handler for the badge
    notificationBadge.addEventListener('click', function(e) {
        e.stopPropagation();
        popupDiv.style.display = popupDiv.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close popup when clicking anywhere else
    document.addEventListener('click', function() {
        popupDiv.style.display = 'none';
    });
    
    // Prevent popup from closing when clicking inside it
    popupDiv.addEventListener('click', function(e) {
        e.stopPropagation();
    });
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

initNotificationBadge();
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
