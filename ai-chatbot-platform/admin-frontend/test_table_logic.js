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

    // 3. Process lines for tables, lists, and text
    const lines = safeText.split('\n');
    let inList = false;
    let inTable = false;
    let processedLines = [];
    let i = 0;

    while (i < lines.length) {
        let line = lines[i];
        let isList = line.trim().startsWith('* ');
        let isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');

        // Check if this is the start of a table (current line and next line are table rows)
        if (isTableRow && !inTable && i + 1 < lines.length) {
            let nextLine = lines[i + 1].trim();
            // Check if next line is a separator (contains only |, -, and spaces)
            if (nextLine.match(/^\|[\s\-:|]+\|$/)) {
                // Start table
                if (inList) {
                    processedLines.push('</ul>');
                    inList = false;
                }
                inTable = true;
                processedLines.push('<table>');

                // Parse header
                processedLines.push('<thead><tr>');
                let headers = line.split('|').filter(h => h.trim());
                headers.forEach(h => {
                    processedLines.push(`<th>${h.trim()}</th>`);
                });
                processedLines.push('</tr></thead>');

                // Skip separator line
                i += 2;
                processedLines.push('<tbody>');
                continue;
            }
        }

        // Continue table rows
        if (inTable && isTableRow) {
            processedLines.push('<tr>');
            let cells = line.split('|').filter(c => c.trim());
            cells.forEach(c => {
                processedLines.push(`<td>${c.trim()}</td>`);
            });
            processedLines.push('</tr>');
            i++;
            continue;
        }

        // End table if we were in one
        if (inTable && !isTableRow) {
            processedLines.push('</tbody></table>');
            inTable = false;
        }

        // Handle lists
        if (isList) {
            if (!inList) {
                processedLines.push('<ul>');
                inList = true;
            }
            processedLines.push(`<li>${line.trim().substring(2)}</li>`);
        } else if (!isTableRow) {
            if (inList) {
                processedLines.push('</ul>');
                inList = false;
            }
            // Add <br> for text lines, except the last one
            if (i < lines.length - 1) {
                processedLines.push(line + '<br>');
            } else {
                processedLines.push(line);
            }
        }

        i++;
    }

    // Close any open tags
    if (inList) {
        processedLines.push('</ul>');
    }
    if (inTable) {
        processedLines.push('</tbody></table>');
    }

    return processedLines.join('');
}

// Test case from user's screenshot
const testTable = `Here are ABC Corp's products with their prices:

| Product Name | Price |
|--------------|-------|
| NimbusFlow | Starting at $49/month per team, Business tier $149/month |
| DataLoom | $299/month, enterprise tier available |
| VaultSphere | $0.12/GB per month, compliance add-on $59/month |
| EchoLink Pro| $9/user per month |
| QuantumEdge | $499/month, AI add-ons $99/month |`;

console.log("Table Test Output:");
console.log(parseMarkdown(testTable));
console.log("\n\n");

// Test mixed content
const mixedTest = `Product info:
* **Bold item 1**
* Item 2

| Name | Value |
|------|-------|
| Test | 123 |

End text.`;

console.log("Mixed Content Test:");
console.log(parseMarkdown(mixedTest));
