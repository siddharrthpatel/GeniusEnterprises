const fs = require('fs');

let html = fs.readFileSync('client/src/pages/raw_landing.html', 'utf8');

// Extract body
const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/i);
if (!bodyMatch) {
    console.error('No body found');
    process.exit(1);
}
let bodyHTML = bodyMatch[1];

// Remove script tags at the bottom
bodyHTML = bodyHTML.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

// Add Login Button to header-contact-info
const loginBtnHTML = '<a href="/portal/login" class="login-portal-btn" style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--accent-red); color: white; text-decoration: none; border-radius: 20px; font-weight: bold;"><i class="fas fa-user-lock"></i> Login Portal</a>';
bodyHTML = bodyHTML.replace(/<\/div>\s*<a href="https:\/\/wa.me/i, '</div>\n                ' + loginBtnHTML + '\n                <a href="https://wa.me');

const scriptJs = fs.readFileSync('client/src/pages/raw_script.js', 'utf8');

const reactComponent = "import React, { useEffect } from 'react';\n" +
"import './LandingPage.css';\n\n" +
"export default function LandingPage() {\n" +
"    useEffect(() => {\n" +
"        " + scriptJs.replace(/\n/g, '\n        ') + "\n" +
"    }, []);\n\n" +
"    return (\n" +
"        <div className=\"lp-root-container\">\n" +
"            <div dangerouslySetInnerHTML={{ __html: `" + bodyHTML.replace(/`/g, '\\`').replace(/\$/g, '\\$') + "` }} />\n" +
"        </div>\n" +
"    );\n" +
"}\n";

fs.writeFileSync('client/src/pages/LandingPage.jsx', reactComponent);
console.log('Successfully generated LandingPage.jsx');
