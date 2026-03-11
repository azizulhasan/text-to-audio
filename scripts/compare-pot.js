const fs = require('fs');

function extractMsgids(file) {
  const content = fs.readFileSync(file, 'utf8');
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

const potMsgids = extractMsgids('languages/text-to-audio.pot');
const itMsgids = extractMsgids('languages/text-to-audio-it_IT.po');
const ptMsgids = extractMsgids('languages/text-to-audio-pt_PT.po');

const newInPot_it = [...potMsgids].filter(m => !itMsgids.has(m));
const removedFromPot_it = [...itMsgids].filter(m => !potMsgids.has(m));

const newInPot_pt = [...potMsgids].filter(m => !ptMsgids.has(m));
const removedFromPot_pt = [...ptMsgids].filter(m => !potMsgids.has(m));

console.log('POT strings: ' + potMsgids.size);
console.log('');
console.log('=== it_IT ===');
console.log('it_IT strings: ' + itMsgids.size);
console.log('NEW in POT (need translation): ' + newInPot_it.length);
console.log('REMOVED from POT (obsolete): ' + removedFromPot_it.length);

if (newInPot_it.length > 0) {
  console.log('\n--- NEW STRINGS (it_IT) ---');
  newInPot_it.forEach((s, i) => console.log((i+1) + '|' + s));
}
if (removedFromPot_it.length > 0) {
  console.log('\n--- REMOVED STRINGS (it_IT) ---');
  removedFromPot_it.forEach((s, i) => console.log((i+1) + '|' + s));
}

console.log('');
console.log('=== pt_PT ===');
console.log('pt_PT strings: ' + ptMsgids.size);
console.log('NEW in POT (need translation): ' + newInPot_pt.length);
console.log('REMOVED from POT (obsolete): ' + removedFromPot_pt.length);

if (newInPot_pt.length > 0) {
  console.log('\n--- NEW STRINGS (pt_PT) ---');
  newInPot_pt.forEach((s, i) => console.log((i+1) + '|' + s));
}
if (removedFromPot_pt.length > 0) {
  console.log('\n--- REMOVED STRINGS (pt_PT) ---');
  removedFromPot_pt.forEach((s, i) => console.log((i+1) + '|' + s));
}
