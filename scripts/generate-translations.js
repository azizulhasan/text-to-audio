#!/usr/bin/env node
/**
 * Complete Translation Generator
 *
 * Intelligently separates PHP and JS translations:
 * - JSON files: JS-related strings (from .js files)
 * - MO files: PHP-related strings (from .php files)
 * - Shared strings: Included in BOTH JSON and MO files
 *
 * Usage: npm run translate
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const languagesDir = path.join(__dirname, '..', 'languages');

// Mapping from source paths to built files
const sourceToBuiltMap = {
    // Dashboard components map to dashboard UI build file
    'src/dashboard/components/': 'admin/js/build/text-to-audio-dashboard-ui.js',
    // Add more mappings as needed
};

// Map source file to its built file
function mapSourceToBuilt(sourcePath) {
    for (const [sourcePattern, builtFile] of Object.entries(sourceToBuiltMap)) {
        if (sourcePath.startsWith(sourcePattern)) {
            return builtFile;
        }
    }
    // If no mapping found, return the original path
    return sourcePath;
}

// Calculate MD5 hash for the primary dashboard file (for filename)
function calculateHash(filepath) {
    return crypto.createHash('md5').update(filepath).digest('hex');
}

// Parse PO file and categorize strings by their source files
function parsePOFile(poFilePath) {
    const content = fs.readFileSync(poFilePath, 'utf8');
    const lines = content.split('\n');

    const phpStrings = { "": { domain: "messages", plural: "nplurals=1; plural=0;" } };
    const fileToStrings = new Map(); // Map of built file -> strings

    let currentContext = {
        references: [],
        msgid: null,
        msgstr: null
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Reference line (shows which file the string is from)
        if (line.startsWith('#:')) {
            const refs = line.substring(2).trim().split(/\s+/);
            currentContext.references.push(...refs);
        }
        // msgid line
        else if (line.startsWith('msgid "') && !line.startsWith('msgid ""')) {
            currentContext.msgid = line.substring(7, line.length - 1);
        }
        // msgstr line
        else if (line.startsWith('msgstr "')) {
            currentContext.msgstr = line.substring(8, line.length - 1);

            // Save the translation if we have both msgid and msgstr
            if (currentContext.msgid && currentContext.msgstr && currentContext.msgstr !== '') {
                const hasJsReference = currentContext.references.some(ref =>
                    ref.endsWith('.js') || ref.includes('.js:')
                );

                const hasPhpReference = currentContext.references.some(ref =>
                    ref.endsWith('.php') || ref.includes('.php:') ||
                    (!ref.endsWith('.js') && !ref.includes('.js:'))
                );

                // Add to specific JS file's strings
                if (hasJsReference) {
                    // Extract JS source file paths and map them to built files
                    const builtFiles = new Set();
                    currentContext.references.forEach(ref => {
                        if (ref.endsWith('.js') || ref.includes('.js:')) {
                            // Remove line number if present (e.g., "file.js:123" -> "file.js")
                            const filePath = ref.split(':')[0];
                            // Map source path to built file
                            const builtFile = mapSourceToBuilt(filePath);
                            builtFiles.add(builtFile);
                        }
                    });

                    // Add this string to each built file it belongs to
                    builtFiles.forEach(builtFile => {
                        if (!fileToStrings.has(builtFile)) {
                            fileToStrings.set(builtFile, {
                                "": { domain: "messages", plural: "nplurals=1; plural=0;" }
                            });
                        }
                        fileToStrings.get(builtFile)[currentContext.msgid] = [currentContext.msgstr];
                    });
                }

                // Add to MO if used in PHP files
                if (hasPhpReference) {
                    phpStrings[currentContext.msgid] = [currentContext.msgstr];
                }
            }

            // Reset context
            currentContext = { references: [], msgid: null, msgstr: null };
        }
    }

    return { phpStrings, fileToStrings };
}

// Get locale from PO file header
function getLocaleFromPO(poFilePath) {
    const content = fs.readFileSync(poFilePath, 'utf8');
    const match = content.match(/"Language:\s*([^\\]+)\\n"/);
    return match ? match[1] : null;
}

// Generate JSON files - one per source file with only its strings
function generateDashboardJSON(locale, fileToStrings) {
    const generatedFiles = [];
    let totalStrings = 0;

    console.log(`  Generating JSON files for ${fileToStrings.size} source file(s)...`);

    // Generate a separate JSON file for each source file with only its strings
    fileToStrings.forEach((strings, sourceFile) => {
        const hash = calculateHash(sourceFile);
        const outputFile = path.join(languagesDir, `text-to-audio-${locale}-${hash}.json`);

        const stringCount = Object.keys(strings).filter(k => k !== "").length;
        totalStrings += stringCount;

        const jsonContent = {
            "translation-revision-date": new Date().toISOString().replace(/\.\d{3}Z$/, '+01:00'),
            "generator": "generate-translations.js",
            "source": sourceFile,
            "domain": "messages",
            "locale_data": {
                "messages": strings
            }
        };

        fs.writeFileSync(outputFile, JSON.stringify(jsonContent, null, 2), 'utf8');
        generatedFiles.push(path.basename(outputFile));

        console.log(`    ✅ ${path.basename(outputFile)} → ${sourceFile} (${stringCount} strings)`);
    });

    console.log(`  Total: ${generatedFiles.length} JSON file(s) with ${totalStrings} strings total`);

    return generatedFiles;
}

// Generate PHP-only MO file
function generatePHPMO(locale, phpStrings, poFilePath) {
    // Create temporary PO file with only PHP strings
    const tempPOContent = generatePOContent(locale, phpStrings, poFilePath);
    const tempPOFile = path.join(languagesDir, `temp-php-${locale}.po`);

    fs.writeFileSync(tempPOFile, tempPOContent, 'utf8');

    // Generate MO from temp PO
    try {
        execSync(`wp i18n make-mo "${tempPOFile}"`, { stdio: 'pipe' });

        // Rename temp MO to final name
        const tempMOFile = tempPOFile.replace('.po', '.mo');
        const finalMOFile = path.join(languagesDir, `text-to-audio-${locale}.mo`);

        if (fs.existsSync(tempMOFile)) {
            fs.renameSync(tempMOFile, finalMOFile);
            const phpCount = Object.keys(phpStrings).filter(k => k !== "").length;
            console.log(`  ✅ PHP MO: text-to-audio-${locale}.mo (${phpCount} PHP strings)`);
        }
    } catch (error) {
        console.error(`  ❌ Error generating MO for ${locale}:`, error.message);
    } finally {
        // Clean up temp PO file
        if (fs.existsSync(tempPOFile)) {
            fs.unlinkSync(tempPOFile);
        }
    }
}

// Generate PO file content from strings
function generatePOContent(locale, strings, originalPOFile) {
    const originalContent = fs.readFileSync(originalPOFile, 'utf8');
    const headerMatch = originalContent.match(/^(.*?)\n\n/s);
    const header = headerMatch ? headerMatch[1] : '';

    let content = header + '\n\n';

    for (const [msgid, msgstr] of Object.entries(strings)) {
        if (msgid === "") continue; // Skip metadata

        content += `msgid "${msgid}"\n`;
        content += `msgstr "${msgstr[0]}"\n\n`;
    }

    return content;
}

// Clean up old JSON files
function cleanupOldJSONFiles(validFiles) {
    const jsonFiles = fs.readdirSync(languagesDir)
        .filter(file => file.endsWith('.json') && file.startsWith('text-to-audio-'));

    let deletedCount = 0;
    jsonFiles.forEach(file => {
        if (!validFiles.includes(file)) {
            const filePath = path.join(languagesDir, file);
            fs.unlinkSync(filePath);
            console.log(`  🗑️  Deleted: ${file}`);
            deletedCount++;
        }
    });

    if (deletedCount > 0) {
        console.log(`  Cleaned up ${deletedCount} old JSON file(s)\n`);
    }
}

// Main execution
console.log('='.repeat(70));
console.log('Translation Generator - Smart PHP/JS Separation');
console.log('='.repeat(70));
console.log();

// Get all PO files (except POT)
const poFiles = fs.readdirSync(languagesDir)
    .filter(file => file.endsWith('.po') && !file.startsWith('temp-'))
    .map(file => path.join(languagesDir, file));

if (poFiles.length === 0) {
    console.log('No .po files found.');
    process.exit(0);
}

console.log(`Found ${poFiles.length} translation file(s)\n`);

const validJSONFiles = [];

// Process each locale
poFiles.forEach(poFile => {
    const locale = path.basename(poFile, '.po').replace('text-to-audio-', '');

    console.log(`Processing ${locale}...`);

    // Parse PO file and categorize strings
    const { phpStrings, fileToStrings } = parsePOFile(poFile);

    // Calculate shared strings (strings in both JS and PHP)
    const allJsStrings = new Set();
    fileToStrings.forEach(strings => {
        Object.keys(strings).filter(k => k !== "").forEach(k => allJsStrings.add(k));
    });
    const phpOnlyKeys = Object.keys(phpStrings).filter(k => k !== "");
    const sharedStrings = [...allJsStrings].filter(k => phpOnlyKeys.includes(k));

    // Generate JSON files (JS strings per file)
    const jsonFiles = generateDashboardJSON(locale, fileToStrings);
    validJSONFiles.push(...jsonFiles);

    // Generate MO file (PHP strings)
    generatePHPMO(locale, phpStrings, poFile);

    // Show shared strings info
    if (sharedStrings.length > 0) {
        console.log(`  ℹ️  Shared strings (in both JSON & MO): ${sharedStrings.length}`);
    }

    console.log();
});

// Clean up old JSON files
console.log('Cleaning up old files...');
cleanupOldJSONFiles(validJSONFiles);

console.log('='.repeat(70));
console.log('✅ Translation generation complete!');
console.log('='.repeat(70));
console.log('\nHow it works:');
console.log('  - Strings used in .js files → JSON file');
console.log('  - Strings used in .php files → MO file');
console.log('  - Strings used in BOTH → Included in BOTH files');
console.log('\nNext step: Test your translations in WordPress!');
