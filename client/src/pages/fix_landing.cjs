const fs = require('fs');
let content = fs.readFileSync('LandingPage.css', 'utf8');

content = content.replace(
    /\.footer-contact li \{[\s\S]*?line-height: 1\.6;\s*\}/g,
    `.footer-contact li {\n    display: flex;\n    gap: 15px;\n    align-items: flex-start;\n    color: #a8b8d0;\n    line-height: 1.6;\n    word-wrap: break-word;\n    word-break: break-word;\n}`
);

content = content.replace(
    /@media \(max-width: 768px\) \{[\s\S]*?\.company-name \{ font-size: 1\.2rem; \}\s*\.header-contact-info \{ flex-direction: row; gap: 8px; flex-wrap: wrap; \}\s*\.contact-item span \{ display: none; \} \/\* Hide text, show only icons \*\//g,
    `@media (max-width: 768px) {\n    .company-name { font-size: 1.2rem; }\n    .header-contact-info { flex-direction: row; gap: 8px; flex-wrap: nowrap; }\n    .contact-item { display: none !important; }\n    .floating-contacts { display: none !important; }`
);

fs.writeFileSync('LandingPage.css', content, 'utf8');
console.log("Fixed LandingPage.css");
