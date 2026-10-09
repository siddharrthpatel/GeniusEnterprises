const fs = require('fs');
let content = fs.readFileSync('index.css', 'utf8');

const rIndex = content.indexOf('RESPONSIVE BREAKPOINTS');
const aIndex = content.indexOf('GE AUTH PAGES');

if (rIndex !== -1 && aIndex !== -1) {
    const rStart = content.lastIndexOf('/*', rIndex);
    const aStart = content.lastIndexOf('/*', aIndex);
    
    if (rStart < aStart) {
        const beforeResponsive = content.substring(0, rStart);
        const responsiveBlock = content.substring(rStart, aStart);
        const authBlock = content.substring(aStart);
        
        fs.writeFileSync('index.css', beforeResponsive + authBlock + '\n\n' + responsiveBlock, 'utf8');
        console.log("Fixed index.css");
    } else {
        console.log("Already in correct order");
    }
} else {
    console.log("Could not find blocks");
}
