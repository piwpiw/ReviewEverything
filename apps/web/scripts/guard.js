const fs = require('fs');
const path = require('path');

/**
 * Guard script to prevent recurring technical issues.
 * Checks for:
 * 1. Strictly UTF-8 encoding (No garbled characters in build).
 * 2. Critical imports (Link, Image) when used in TSX.
 */

const TARGET_DIRS = [
    path.join(__dirname, '../app'),
    path.join(__dirname, '../components'),
    path.join(__dirname, '../sources'),
    path.join(__dirname, '../lib')
];

let errorsFound = 0;

function checkFile(filePath) {
    const ext = path.extname(filePath);
    if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return;

    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Check for garbled characters (common indicator of encoding issues)
    // Looking for the replacement character or excessive high-bit patterns
    if (content.includes('\ufffd')) {
        console.error(`❌ [ENCODING ERROR] ${filePath}: Contains invalid UTF-8 characters (\ufffd).`);
        errorsFound++;
    }

    // 2. Check for missing Link/Image imports in TSX
    if (ext === '.tsx') {
        if (content.includes('<Link') && !content.includes('import Link from "next/link"')) {
            console.error(`❌ [IMPORT ERROR] ${filePath}: <Link> used but 'next/link' not imported.`);
            errorsFound++;
        }
        if (content.includes('<Image') && !content.includes('import Image from "next/image"')) {
            console.error(`❌ [IMPORT ERROR] ${filePath}: <Image> used but 'next/image' not imported.`);
            errorsFound++;
        }
    }
}

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            walk(fullPath);
        } else {
            checkFile(fullPath);
        }
    });
}

console.log('🛡️ Starting System Guard integrity check...');
TARGET_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) walk(dir);
});

if (errorsFound > 0) {
    console.error(`\n🚨 Guard failed with ${errorsFound} issues. Please fix them before proceeding.`);
    process.exit(1);
} else {
    console.log('\n✅ Integrity check passed. Ready for deployment.');
}
