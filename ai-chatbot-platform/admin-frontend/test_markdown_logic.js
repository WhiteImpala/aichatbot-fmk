
function parseMarkdown(text) {
    // 1. Escape HTML to prevent XSS (basic)
    let safeText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // 2. Bold: **text** -> <strong>text</strong>
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 3. Lists: * item -> <ul><li>item</li></ul>
    const lines = safeText.split('\n');
    let inList = false;
    let processedLines = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let isList = line.trim().startsWith('* ');

        if (isList) {
            if (!inList) {
                processedLines.push('<ul>');
                inList = true;
            }
            processedLines.push(`<li>${line.trim().substring(2)}</li>`);
        } else {
            if (inList) {
                processedLines.push('</ul>');
                inList = false;
            }
            // Add <br> for text lines, except the last one (optional, but cleaner)
            if (i < lines.length - 1) {
                processedLines.push(line + '<br>');
            } else {
                processedLines.push(line);
            }
        }
    }
    if (inList) {
        processedLines.push('</ul>');
    }

    return processedLines.join('');
}

// Test cases
const test1 = "Hello **world**";
const expected1 = "Hello <strong>world</strong>";

const test2 = "List:\n* Item 1\n* Item 2";
// Expected: List:<br><ul><br><li>Item 1</li><br><li>Item 2</li><br></ul> (approximately, depending on join)
// Actually my logic joins EVERYTHING with <br>.
// Let's see the output.

console.log("Test 1:", parseMarkdown(test1));
console.log("Test 2:", parseMarkdown(test2));

const test3 = "DataLoom is a real-time analytics & visualization engine. Key details include: * **Price:** $299/month, with an enterprise tier also available. * **Features:** It offers live dashboards, SQL & NoSQL ingestion, predictive analytics, custom visuals, and API/webhooks. * **Use Cases:** It's designed for monitoring sales performance, IoT telemetry tracking, executive dashboards, and customer behavior analytics.";
// The user's example had * inline? No, "Key details include: * **Price:**..."
// If the user's input has newlines, my code works. If it's all one line, my code WON'T work for lists because I split by \n.
// The user's request showed:
// "Key details include: * **Price:** $299/month... * **Features:**..."
// It looks like it might be one line or have newlines.
// If it's one line, `* ` won't be at the start of the line for the second item if it's just wrapped.
// But usually LLMs send newlines.
// Let's assume newlines are present or I should handle inline * if they are preceded by newline or start of string.
// But my code splits by `\n`.
// Let's check if the user's input in the prompt implies newlines.
// "Key details include: * **Price:**... * **Features:**..."
// It looks like a list.
// I will test with the user's exact text assuming it might have newlines.

const userText = `DataLoom is a real-time analytics & visualization engine. Key details include:
* **Price:** $299/month, with an enterprise tier also available.
* **Features:** It offers live dashboards, SQL & NoSQL ingestion, predictive analytics, custom visuals, and API/webhooks.
* **Use Cases:** It's designed for monitoring sales performance, IoT telemetry tracking, executive dashboards, and customer behavior analytics.`;

console.log("User Text Parsed:\n", parseMarkdown(userText));
