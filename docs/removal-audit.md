# J25 removal assignment audit

Reviewed all 768 unique catalog names against current Scryfall Oracle text. Removed 23 incorrect Removal tags and added 30 missing ones. R-bearing unique names change from 144 to 151.

## Editorial boundary

- R includes direct creature/permanent damage, destruction, exile, forced opposing sacrifice, toughness reduction, hostile bounce/tuck, countermagic, tapping/freezing, pacification, hostile targeted blocking restrictions, and theft. Conditional effects still count.
- R excludes returning/reanimating your graveyard cards, own-permanent-only bounce/blink, graveyard exile, mill, discard, sacrificing your own cards, self-imposed attack/block restrictions, and deathtouch alone.
- Power-only reduction, including persistent or repeatable suppression, is not R. It cannot remove a creature or stop attacking/blocking. Use trick/support roles as appropriate.
- Targeted hostile cannot-block effects count as tempo R consistently with targeted tap effects. Generic evasion such as flying, menace, trample, or granting your creature unblockable does not itself count as R.
- Planeswalker-only activated burn counts as narrow R; ordinary combat damage and a deathtouch-like combat rider alone do not.

## Remove R

- [Ajani, Adversary of Tyrants](https://scryfall.com/card/j25/157/ajani-adversary-of-tyrants?utm_source=api): `B, R, recursion, tokens, synergy` → `B, recursion, tokens, synergy`. Counters, reanimation, and tokens only; no opposing threat interaction.
- [Blood Beckoning](https://scryfall.com/card/j25/405/blood-beckoning?utm_source=api): `R, recursion` → `recursion`. Returns creature cards from your graveyard to hand; recursion only.
- [Bonecaller Cleric](https://scryfall.com/card/j25/112/bonecaller-cleric?utm_source=api): `R, A, recursion` → `A, recursion`. Sacrifices itself to reanimate your creature; does not remove an opposing creature.
- [Boneclad Necromancer](https://scryfall.com/card/j25/411/boneclad-necromancer?utm_source=api): `R, tokens` → `tokens`. Exiles a creature card in a graveyard to make a token; graveyard hate is not battlefield removal.
- [Chilling Trap](https://scryfall.com/card/j25/297/chilling-trap?utm_source=api): `R, draw` → `draw, trick`. Power-only reduction is a combat trick, not removal.
- [Crawl from the Cellar](https://scryfall.com/card/j25/414/crawl-from-the-cellar?utm_source=api): `R, recursion, synergy` → `recursion, synergy`. Returns your graveyard creature to hand and adds a counter; recursion, not removal.
- [Doomed Necromancer](https://scryfall.com/card/j25/426/doomed-necromancer?utm_source=api): `R, A, recursion` → `A, recursion`. Sacrifices itself to reanimate your creature; no opposing permanent interaction.
- [Drowsing Tyrannodon](https://scryfall.com/card/j25/651/drowsing-tyrannodon?utm_source=api): `R, A` → `A`. Defender and a condition allowing itself to attack; its self-restriction is not removal.
- [Entomber Exarch](https://scryfall.com/card/j25/434/entomber-exarch?utm_source=api): `R, recursion` → `recursion`. Recursion or hand discard; neither mode removes/counters/disables a battlefield threat.
- [Eternal Taskmaster](https://scryfall.com/card/j25/117/eternal-taskmaster?utm_source=api): `R, A, recursion, synergy` → `A, recursion, synergy`. Returns your graveyard creature to hand on attack; recursion only.
- [Gravedigger](https://scryfall.com/card/j25/452/gravedigger?utm_source=api): `R, recursion` → `recursion`. Returns a creature card from your graveyard to hand; recursion only.
- [Isareth the Awakener](https://scryfall.com/card/j25/68/isareth-the-awakener?utm_source=api): `R, A, recursion, synergy` → `A, recursion, synergy`. Reanimates your creature. Its exile clause applies only to that reanimated creature; deathtouch alone is not removal.
- [Leonin of the Lost Pride](https://scryfall.com/card/j25/215/leonin-of-the-lost-pride?utm_source=api): `R, A` → `A`. Exiles a card from an opponent's graveyard; not battlefield removal.
- [Light the Way](https://scryfall.com/card/j25/219/light-the-way?utm_source=api): `R, synergy` → `synergy, trick`. Bounces only a permanent you control or buffs/untaps a creature; protection/combat trick, not hostile bounce.
- [Mogg Flunkies](https://scryfall.com/card/j25/580/mogg-flunkies?utm_source=api): `R, A` → `A`. Cannot attack or block alone; self-restriction is not removal.
- [Mu Yanling, Sky Dancer](https://scryfall.com/card/j25/329/mu-yanling-sky-dancer?utm_source=api): `B, R, draw, tokens` → `B, draw, tokens`. Power and flying suppression cannot remove a creature or prevent it from attacking or blocking; no R under the consistent power-only boundary.
- [Nullpriest of Oblivion](https://scryfall.com/card/j25/472/nullpriest-of-oblivion?utm_source=api): `R, E, A, recursion` → `E, A, recursion`. Kicker reanimates your creature; recursion only.
- [Rodolf Duskbringer](https://scryfall.com/card/j25/482/rodolf-duskbringer?utm_source=api): `B, R, E, recursion, synergy` → `B, E, recursion, synergy`. Reanimates your creature. Deathtouch alone is not a removal effect.
- [Ruthless Technomancer](https://scryfall.com/card/j25/484/ruthless-technomancer?utm_source=api): `R, ramp, recursion` → `ramp, recursion`. Sacrifices your own resources and reanimates your creature; no enemy removal.
- [Tethmos High Priest](https://scryfall.com/card/j25/271/tethmos-high-priest?utm_source=api): `R, A, recursion, synergy` → `A, recursion, synergy`. Heroic reanimates your creature; recursion only.
- [Topiary Stomper](https://scryfall.com/card/j25/730/topiary-stomper?utm_source=api): `R, A, ramp` → `A, ramp`. Fetches a land and restricts its own attacking/blocking; no enemy removal.
- [Undead Butler](https://scryfall.com/card/j25/500/undead-butler?utm_source=api): `R, recursion` → `recursion`. Self-mill, self-exile, and returns your graveyard creature to hand; recursion only.
- [Wall of Lost Thoughts](https://scryfall.com/card/j25/384/wall-of-lost-thoughts?utm_source=api): `R` → `synergy`. Defender and mill; its own attack restriction is not removal.

## Add R

- [Aether Channeler](https://scryfall.com/card/j25/283/aether-channeler?utm_source=api): `A, draw, tokens` → `R, A, draw, tokens`. Its second mode bounces another target nonland permanent, including an opponent's.
- [Ahn-Crop Crasher](https://scryfall.com/card/j25/514/ahn-crop-crasher?utm_source=api): `A` → `R, A`. Exert trigger prevents a target creature from blocking; hostile tempo.
- [Arena Athlete](https://scryfall.com/card/j25/518/arena-athlete?utm_source=api): `A, synergy` → `R, A, synergy`. Heroic trigger prevents an opposing target creature from blocking; hostile tempo.
- [Band Together](https://scryfall.com/card/j25/634/band-together?utm_source=api): `synergy` → `R, synergy`. Your creatures deal damage to another target creature; direct creature removal.
- [Blood Hypnotist](https://scryfall.com/card/j25/522/blood-hypnotist?utm_source=api): `A, synergy` → `R, A, synergy`. Sacrificing Blood tokens prevents a target creature from blocking; hostile tempo.
- [Boldwyr Intimidator](https://scryfall.com/card/j25/527/boldwyr-intimidator?utm_source=api): `E` → `R, E`. Can turn an opposing target creature into a Coward; its Cowards-cannot-block-Warriors ability then disables that blocker against Warriors.
- [Brightmare](https://scryfall.com/card/j25/175/brightmare?utm_source=api): `A` → `R, A`. ETB taps an opposing creature; matches the existing Chrome Prowler/Network Disruptor tempo boundary.
- [Bury in Books](https://scryfall.com/card/j25/292/bury-in-books?utm_source=api): `ramp` → `R, ramp`. Tucks any target creature second from the top of its owner's library.
- [Cartouche of Zeal](https://scryfall.com/card/j25/529/cartouche-of-zeal?utm_source=api): `synergy` → `R, synergy`. ETB prevents a target creature from blocking; hostile tempo.
- [Clear Shot](https://scryfall.com/card/j25/645/clear-shot?utm_source=api): `trick` → `R, trick`. Your creature deals damage to an opposing creature; the pump does not replace its removal role.
- [Gift of Fangs](https://scryfall.com/card/j25/444/gift-of-fangs?utm_source=api): `synergy` → `R, synergy`. Gives non-Vampire enchanted creatures -2/-2; removal despite its friendly Vampire mode.
- [Goblin Fireslinger](https://scryfall.com/card/j25/136/goblin-fireslinger?utm_source=api): `A` → `R, A`. Can repeatedly deal noncombat damage to a target planeswalker; narrow planeswalker removal.
- [Godsend](https://scryfall.com/card/j25/204/godsend?utm_source=api): `B, synergy` → `B, R, synergy`. Exiles an opposing creature on blocking or being blocked; actual exile beyond ordinary combat damage.
- [Goma Fada Vanguard](https://scryfall.com/card/j25/561/goma-fada-vanguard?utm_source=api): `A, synergy` → `R, A, synergy`. Attack trigger prevents a qualifying opposing target creature from blocking; hostile tempo.
- [Goremand](https://scryfall.com/card/j25/448/goremand?utm_source=api): `E` → `R, E`. ETB forces each opponent to sacrifice a creature.
- [Gornog, the Red Reaper](https://scryfall.com/card/j25/49/gornog-the-red-reaper?utm_source=api): `B, A, synergy` → `B, R, A, synergy`. Turns an opposing target creature into a Coward; its Cowards-cannot-block-Warriors ability then disables that blocker against Warriors.
- [Hunter's Edge](https://scryfall.com/card/j25/671/hunters-edge?utm_source=api): `synergy` → `R, synergy`. Your creature deals its power in damage to an opposing creature.
- [Kargan Intimidator](https://scryfall.com/card/j25/569/kargan-intimidator?utm_source=api): `E, A` → `R, E, A`. Can turn an opposing target creature into a Coward; its Cowards-cannot-block-Warriors ability then disables that blocker against Warriors.
- [Markov Retribution](https://scryfall.com/card/j25/576/markov-retribution?utm_source=api): `synergy` → `R, synergy`. Its second mode lets your Vampire deal damage to another creature.
- [Markov Warlord](https://scryfall.com/card/j25/577/markov-warlord?utm_source=api): `A` → `R, A`. ETB prevents up to two target creatures from blocking; hostile tempo.
- [Outflank](https://scryfall.com/card/j25/233/outflank?utm_source=api): `synergy` → `R, synergy`. Deals damage to an attacking or blocking creature.
- [Priest of Forgotten Gods](https://scryfall.com/card/j25/478/priest-of-forgotten-gods?utm_source=api): `draw, ramp` → `R, draw, ramp`. Forces targeted players, including opponents, to sacrifice a creature.
- [Renegade Tactics](https://scryfall.com/card/j25/590/renegade-tactics?utm_source=api): `draw` → `R, draw`. Prevents a target creature from blocking and draws a card; hostile tempo.
- [Repel the Darkness](https://scryfall.com/card/j25/242/repel-the-darkness?utm_source=api): `draw` → `R, draw`. Taps up to two creatures; matches existing Choking Tethers tempo classification.
- [Stinging Lionfish](https://scryfall.com/card/j25/367/stinging-lionfish?utm_source=api): `A, synergy` → `R, A, synergy`. Repeatably taps an opposing nonland permanent during opponents' turns.
- [Unstoppable Ogre](https://scryfall.com/card/j25/609/unstoppable-ogre?utm_source=api): `A, synergy` → `R, A, synergy`. ETB prevents a target creature from blocking; hostile tempo.
- [Voldaren Ambusher](https://scryfall.com/card/j25/611/voldaren-ambusher?utm_source=api): `A` → `R, A`. Conditional ETB deals damage to a creature or planeswalker.
- [Voldaren Duelist](https://scryfall.com/card/j25/612/voldaren-duelist?utm_source=api): `A` → `R, A`. ETB prevents a target creature from blocking; hostile tempo.
- [Zealot of the God-Pharaoh](https://scryfall.com/card/j25/619/zealot-of-the-god-pharaoh?utm_source=api): `A` → `R, A`. Can repeatedly deal noncombat damage to a target planeswalker; narrow planeswalker removal.
- [Zealous Conscripts](https://scryfall.com/card/j25/143/zealous-conscripts?utm_source=api): `B, A` → `B, R, A`. Temporarily steals an opposing permanent, removing its use from its owner and often its ability to block.

## Boundary decisions

- **Liliana, Death's Majesty:** Keep R and recursion: her ultimate destroys all non-Zombie creatures.
- **Silent Departure:** Keep R and recursion: hostile bounce with flashback.
- **Slimebind:** Keep no R: persistent power-only reduction is suppression/support, not removal under the same rule as Mu Yanling and Chilling Trap.
- **Hooded Blightfang:** Keep no R: its planeswalker destruction requires its deathtouch creatures to deal damage; this is treated like combat/deathtouch support, not an independent removal engine. A more literal policy could include it.
- **Torment of Scarabs:** Keep no R: the opponent may choose life loss or discard instead of sacrificing a permanent; it cannot force removal.
- **Uncomfortable Chill:** Keep no R: one-turn power reduction; combat trick rather than removal.
- **Waker of Waves:** Keep no R: incidental -1/-0 team suppression is weaker than a primary soft-removal role.
- **Boldwyr Intimidator / Kargan Intimidator / Gornog, the Red Reaper:** Add R: targeted opponent type-changing disables specific opposing blockers against Warriors, unlike generic evasion granted to your own creatures.

## Scope and implementation

All other tags are preserved except adding `trick` to Chilling Trap and Light the Way and giving Wall of Lost Thoughts `synergy` after removing its sole erroneous R. These are editorial roles, not official Wizards BREAD ratings. No runtime heuristic should derive R from generic words such as return, exile, sacrifice, or cannot attack/block.

The corrected assignments remain in the bundled, name-keyed `CATALOG.cardDraftTags`; collection storage is unchanged. The current app contains other apparent role inconsistencies (cost reduction labeled ramp, missing card draw/recursion in some cases), which are outside this focused R audit.
