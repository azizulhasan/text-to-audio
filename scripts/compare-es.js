const fs = require('fs');

function extractMsgids(file) {
  const content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const lines = content.split('\n');
  const msgids = [];
  let currentMsgid = '';
  let collectingMsgid = false;

  for (const line of lines) {
    if (line.startsWith('msgid "') && line !== 'msgid ""') {
      currentMsgid = line.replace(/^msgid "/, '').replace(/"$/, '');
      collectingMsgid = false;
    } else if (line === 'msgid ""') {
      currentMsgid = '';
      collectingMsgid = true;
    } else if (collectingMsgid && line.startsWith('"')) {
      currentMsgid += line.replace(/^"/, '').replace(/"$/, '');
    } else if (line === 'msgstr ""' && currentMsgid) {
      msgids.push(currentMsgid);
      currentMsgid = '';
      collectingMsgid = false;
    } else if (line.startsWith('msgstr "') && currentMsgid) {
      msgids.push(currentMsgid);
      currentMsgid = '';
      collectingMsgid = false;
    } else {
      collectingMsgid = false;
    }
  }
  return new Set(msgids);
}

// Also extract msgid->msgstr pairs for checking untranslated
function extractPairs(file) {
  const content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const lines = content.split('\n');
  const pairs = {};
  let currentMsgid = '';
  let collectingMsgid = false;

  for (const line of lines) {
    if (line.startsWith('msgid "') && line !== 'msgid ""') {
      currentMsgid = line.replace(/^msgid "/, '').replace(/"$/, '');
      collectingMsgid = false;
    } else if (line === 'msgid ""') {
      currentMsgid = '';
      collectingMsgid = true;
    } else if (collectingMsgid && line.startsWith('"')) {
      currentMsgid += line.replace(/^"/, '').replace(/"$/, '');
    } else if (line.startsWith('msgstr ') && currentMsgid) {
      const msgstr = line.replace(/^msgstr "/, '').replace(/"$/, '');
      pairs[currentMsgid] = msgstr;
      currentMsgid = '';
      collectingMsgid = false;
    } else {
      collectingMsgid = false;
    }
  }
  return pairs;
}

const potMsgids = extractMsgids('languages/text-to-audio.pot');
const esMsgids = extractMsgids('languages/text-to-audio-es_ES.po');
const esPairs = extractPairs('languages/text-to-audio-es_ES.po');

const newInPot = [...potMsgids].filter(m => !esMsgids.has(m));
const removedFromPot = [...esMsgids].filter(m => !potMsgids.has(m));
const untranslated = [...esMsgids].filter(m => potMsgids.has(m) && esPairs[m] === '');

console.log('POT strings: ' + potMsgids.size);
console.log('es_ES strings: ' + esMsgids.size);
console.log('MISSING from es_ES (in POT but not in .po): ' + newInPot.length);
console.log('EXTRA in es_ES (in .po but not in POT): ' + removedFromPot.length);
console.log('UNTRANSLATED (msgstr is empty): ' + untranslated.length);

if (newInPot.length > 0) {
  console.log('\n--- MISSING STRINGS (need to add to es_ES) ---');
  newInPot.forEach((s, i) => console.log((i+1) + '|' + s));
}
if (removedFromPot.length > 0) {
  console.log('\n--- EXTRA STRINGS (obsolete in es_ES) ---');
  removedFromPot.forEach((s, i) => console.log((i+1) + '|' + s));
}
if (untranslated.length > 0) {
  console.log('\n--- UNTRANSLATED STRINGS (empty msgstr) ---');
  untranslated.forEach((s, i) => console.log((i+1) + '|' + s));
}
