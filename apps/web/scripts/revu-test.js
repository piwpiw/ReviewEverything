const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('revu_sample.html', 'utf8');
const $ = cheerio.load(html);

console.log("Card classes containing 'camp' or 'card':");
const classes = Array.from($('*')).map(el => el.attribs?.class).filter(c => c && (c.includes('camp') || c.includes('card')));
console.log(Array.from(new Set(classes)).slice(0, 15));

console.log("\nSome link hrefs that might be campaign details:");
const hrefs = Array.from($('a')).map(el => el.attribs?.href).filter(h => h && h.includes('campaign'));
console.log(Array.from(new Set(hrefs)).slice(0, 15));
