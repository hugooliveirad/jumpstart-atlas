const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Read bundled data without booting the UI or fetching Scryfall metadata.
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const catalogMatch = html.match(/const CATALOG\s*=\s*(\{[^\n]+\});/);
const tagsMatch = html.match(/CATALOG\.cardDraftTags\s*=\s*(\{[\s\S]*?\n\});/);
assert(catalogMatch && tagsMatch, 'Bundled catalog and role assignments must be readable');
const catalog = JSON.parse(catalogMatch[1]);
const tags = JSON.parse(tagsMatch[1]);
const assignedNames = [...tagsMatch[1].matchAll(/^\s*("(?:\\.|[^"\\])*")\s*:/gm)]
  .map(match => JSON.parse(match[1]));
assert.equal(new Set(assignedNames).size, assignedNames.length, 'Duplicate name-keyed assignments are not allowed');
const names = [...new Set(catalog.decks.flatMap(deck =>
  deck.cards.map(card => card.name)))].sort();
assert.equal(names.length, 768, 'J25 contains 768 unique bundled English names');
assert.deepEqual(Object.keys(tags).sort(), names, 'Every bundled name must have exactly one assignment');

const allowed = new Set(['B', 'R', 'E', 'A', 'D', 'draw', 'ramp', 'trick', 'recursion', 'tokens', 'synergy', 'land']);
for (const [name, roles] of Object.entries(tags)) {
  assert(Array.isArray(roles) && roles.length > 0, `${name}: roles must be a nonempty array`);
  assert.equal(new Set(roles).size, roles.length, `${name}: duplicate role`);
  for (const role of roles) assert(allowed.has(role), `${name}: unknown role ${role}`);
}

function hasRole(name, role, expected, reason) {
  assert(Object.hasOwn(tags, name), `Missing fixture card: ${name}`);
  assert.equal(tags[name].includes(role), expected, `${name}: ${reason}`);
}

// Graveyard targets and the word "return" alone do not make removal.
for (const name of ['Blood Beckoning', 'Gravedigger', 'Ajani, Adversary of Tyrants',
  'Bonecaller Cleric', 'Isareth the Awakener', 'Undead Butler', 'Rodolf Duskbringer']) {
  hasRole(name, 'R', false, 'reusing your creatures is not removal');
  hasRole(name, 'recursion', true, 'retain the independent recursion role');
}
for (const [name, reason] of [
  ['Light the Way', 'bounce restricted to your own permanent is protection'],
  ["Yarok's Wavecrasher", 'own-only bounce is not hostile tempo'],
  ['Boneclad Necromancer', 'graveyard exile does not remove a battlefield threat'],
  ['Leonin of the Lost Pride', 'graveyard hate is not removal'],
  ['Drowsing Tyrannodon', 'defender restricts this creature itself'],
  ['Mogg Flunkies', 'its own blocking restriction is not interaction'],
  ['Topiary Stomper', 'its own attacking restriction is not interaction'],
  ['Wall of Lost Thoughts', 'mill and defender are not removal'],
  ['Chilling Trap', 'power-only reduction cannot kill or disable a blocker'],
  ['Mu Yanling, Sky Dancer', 'repeatable power-only reduction is not removal'],
  ['Slimebind', 'persistent power-only reduction is not removal'],
  ['Hooded Blightfang', 'a deathtouch-like combat rider is not direct removal'],
  ['Voldaren Epicure', 'player-only damage does not remove permanents'],
  ['Phantom Ninja', 'own unblockability is evasion, not hostile tempo'],
]) hasRole(name, 'R', false, reason);

for (const [name, reason] of [
  ['Murder', 'destroys a creature'],
  ['Gift of Fangs', 'negative toughness can kill non-Vampires'],
  ['Clear Shot', 'a combat buff also deals removal damage'],
  ['Priest of Forgotten Gods', 'forces opponents to sacrifice creatures'],
  ['Aether Channeler', 'a modal creature can bounce opposing permanents'],
  ['Bury in Books', 'library tuck removes a creature from the battlefield'],
  ['Remand', 'countermagic belongs to Removal'],
  ['Brightmare', 'tapping a chosen enemy is hostile tempo'],
  ['Repel the Darkness', 'temporary tapping is hostile tempo'],
  ['Renegade Tactics', 'preventing a chosen enemy from blocking is hostile tempo'],
  ['Blood Hypnotist', 'its hostile blocking restriction matters despite its own restriction'],
  ['Kargan Intimidator', 'targeted Coward conversion disables a blocker against Warriors'],
  ['Godsend', 'explicit exile is distinct from ordinary combat damage'],
  ['Goblin Fireslinger', 'planeswalker damage can remove a permanent'],
  ['Zealous Conscripts', 'temporary hostile control is tempo'],
]) hasRole(name, 'R', true, reason);

for (const name of ["Liliana, Death's Majesty", 'Silent Departure']) {
  hasRole(name, 'R', true, 'retain its genuine removal effect');
  hasRole(name, 'recursion', true, 'removal and recursion may coexist');
}

console.log(`Removal role regressions passed; ${names.length} catalog names have valid assignments.`);
