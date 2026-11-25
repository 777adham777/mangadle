'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Opportunities: a small bonus for the player who is watching, DOM-free
   While you play (page visible, you acted in the last 2 minutes, something runs), now and
   then something from the current world shows up for 30 seconds (omens-ui.js spawns it).
   One click takes it; missed, nothing is lost. Never offline. Each world's is its own:
     Leaf Village · a messenger toad: a Leaf Scroll (once techniques are open)
     Orange Town  · a message in a bottle: your ships at sea sail 10 minutes ahead
     Soul City    · a hell butterfly: 60 s of double yield (skills) and double gold (battle)
     Kaio Planet  · a shooting star: 60 s of double skill speed and +50% attack speed
     Shinjuku     · a fleeing curse: 1-2 Cursed Fragments
     Green Island · a drifting card: 1 in 5 a Greed Island card of that world, else gold
     (Echo Quarter, The Rift: a glint of gold.) Gold gifts grow with your newest world.
   Loaded after scouter.js.
   ========================================================================== */

const OMEN_LIFE = 30, OMEN_BUFF = 60;
const omensOn = () => isUnlocked('feature:omens');
const OMENS = {
  shinobi: { name: 'Messenger Toad', icon: 'frog' },
  seas:    { name: 'Message in a Bottle', icon: 'bottle' },
  soul:    { name: 'Hell Butterfly', icon: 'butterfly' },
  ki:      { name: 'Shooting Star', icon: 'falling-star' },
  hex:     { name: 'Fleeing Curse', icon: 'floating-ghost' },
  hunter:  { name: 'Drifting Card', icon: 'card' },
  echo:    { name: 'Glinting Relic', icon: 'two-coins' },
  rift:    { name: 'Rift Spark', icon: 'two-coins' },
};
const omenGold = () => Math.round(120 * (1 + worldIndex(frontier())) ** 2);
const omenBuff = (k) => !!(S.omen && S.omen.buff && S.omen.buff.k === k && S.omen.buff.t > 0);
hook('tick', (dt) => { if (S.omen && S.omen.buff && S.omen.buff.t > 0) S.omen.buff.t -= dt; });
hook('double', () => (omenBuff('soul') ? 1 : 0));
hook('gold', () => (omenBuff('soul') && S.combat.zone != null ? 2 : 1));
hook('speed', () => (omenBuff('ki') ? 2 : 1));
hook('haste', () => (omenBuff('ki') ? 1.5 : 1));

// The world an opportunity comes from: where you are busy, else any world you know.
function omenRealm() {
  let r = null;
  if (S.action && SKILLS[S.action.skill]) r = SKILLS[S.action.skill].realm;
  else if (S.combat.zone != null && ZONES[S.combat.zone]) r = ZONES[S.combat.zone].realm;
  if (!r || !OMENS[r] || !realmOpen(r)) r = pick(WORLD_ORDER.filter((x) => OMENS[x] && realmOpen(x)));
  return r;
}
// Takes an opportunity. Returns { text, items: {id: n}, gold }.
function omenGrant(r) {
  if (!S.omen || typeof S.omen !== 'object') S.omen = {};
  S.omen.n = (S.omen.n || 0) + 1;
  const res = { items: {}, gold: 0, text: '' };
  const gold = () => { res.gold = omenGold(); S.gold += res.gold; };
  if (r === 'shinobi') {
    if (techOn()) { addItem('scroll_shinobi', 1); res.items.scroll_shinobi = 1; res.text = `+1 ${ITEMS.scroll_shinobi.name}`; }
    else { gold(); res.text = `The toad leaves you ${fmt(res.gold)} gold`; }
  } else if (r === 'seas') {
    const sea = S.exped.ships.filter((sh) => sh.left > 0);
    if (sea.length) { for (const sh of sea) sh.left = Math.max(0.5, sh.left - 600); res.text = `${sea.length} ship${sea.length > 1 ? 's' : ''} sail 10 minutes ahead`; }
    else { gold(); res.text = `${fmt(res.gold)} gold in the bottle`; }
  } else if (r === 'soul') { S.omen.buff = { k: 'soul', t: OMEN_BUFF }; res.text = '60 s of double yield and double battle gold'; }
  else if (r === 'ki') { S.omen.buff = { k: 'ki', t: OMEN_BUFF }; res.text = '60 s of double skill speed and faster attacks'; }
  else if (r === 'hex' && ITEMS.cursed_fragment) { const n = randInt(1, 2); addItem('cursed_fragment', n); res.items.cursed_fragment = n; res.text = `+${n} Cursed Fragment${n > 1 ? 's' : ''}`; }
  else if (r === 'hunter' && typeof giveCard === 'function' && Math.random() < 0.2) { const c = giveCard('hunter', 'Drifting Card'); res.text = c ? `Card: ${CARDS[c].name}` : 'Your card page is full: gold instead'; }
  else { gold(); res.text = `+${fmt(res.gold)} gold`; }
  dirty = true;
  return res;
}
