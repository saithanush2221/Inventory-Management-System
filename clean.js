const fs = require('fs');
const path = 'c:/Users/Thanush/Downloads/claude-api/InvenTrack_Full_Thesis.txt';
let content = fs.readFileSync(path, 'utf8');

// Fix the corrupted rupee symbol
content = content.replace(/â‚¹/g, '₹');

// Remove horizontal rules
content = content.replace(/^---+$/gm, '');

// Remove headings (e.g., '# ', '## ', '### ')
content = content.replace(/^#+\s+/gm, '');

// Remove bold (**text**)
content = content.replace(/\*\*(.*?)\*\*/g, '$1');

// Remove italic (*text*)
content = content.replace(/\*(.*?)\*/g, '$1');

// Remove inline code (`text`)
content = content.replace(/`(.*?)`/g, '$1');

// Remove code block markers
content = content.replace(/^```\w*$/gm, '');

// Remove table markers but keep the text spacing
content = content.replace(/^\|---\|.*$/gm, '');
content = content.replace(/\|/g, '  ');

fs.writeFileSync(path, content, 'utf8');
console.log('Markdown formatting removed successfully.');
