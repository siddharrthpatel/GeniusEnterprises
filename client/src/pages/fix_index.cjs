const fs = require('fs');
let content = fs.readFileSync('../index.css', 'utf8');

// Reduce padding and font sizes of .ge-cred-item
content = content.replace(
    /\.ge-cred-item \{[\s\S]*?min-height: 44px;\s*\}/g,
    `.ge-cred-item {\n  display: flex;\n  align-items: center;\n  gap: 0.25rem;\n  padding: 0.35rem 0.5rem;\n  background: #f7f9fc;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: background 0.15s, transform 0.15s;\n  border: 1px solid transparent;\n  min-height: 40px;\n}`
);

// Reduce font size of badge slightly in ge-cred-grid context
// Actually we can just add a global rule for .ge-cred-item .badge and .ge-cred-email
if (!content.includes('.ge-cred-item .badge')) {
    content = content.replace(
        /\.ge-cred-item:hover \{/g,
        `.ge-cred-item .badge { padding: 0.2rem 0.4rem; font-size: 0.65rem; }\n.ge-cred-item:hover {`
    );
}

fs.writeFileSync('../index.css', content, 'utf8');
console.log("Fixed index.css creds");
