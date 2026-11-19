# Audit : jeu existant ↔ GDD v1.0

Correspondance entre le jeu tel qu'il est (commit `2d9cf22`, 2026-11-18) et `docs/GDD.md`.
Légende : ✅ conforme · 🟡 existe mais diffère · ❌ absent · ➕ existe mais hors GDD.

## Mondes

| GDD | Jeu actuel | État |
| --- | --- | --- |
| 1 · Leaf Village | Shinobi Lands | ✅ ordre conforme depuis `2d9cf22` (Woodcutting → arme → combat) |
| 2 · Orange Town | Endless Blue | ✅ |
| 3 · Soul City | Soul Afterlands | ✅ |
| 4 · Kaio Planet | Ki Frontier | ✅ |
| 5 · Shinjuku | Hexbound City | ✅ |
| 6 · Green Island | Hunter's Wilds | ✅ |
| — | Echo Quarter (monde 7) | ➕ |
| — | The Rift (finale, Rift Tear horaire) | ➕ |

## Piliers de progression (GDD §2)

| GDD | Jeu actuel | État |
| --- | --- | --- |
| Niveau global du personnage | Aucun ; 3 skills de combat (Strength / Defense / Vitality, max 120) | ❌ |
| Stats Attack / Defense / Vitality / Speed / Luck | Max hit, défense, PV ; vitesse fixe 2,4 s ; chance = Lucky Coin (Market) | 🟡 |
| Techniques en slots, collection permanente | 6 techniques, rang 1-5, 3 slots (Chakra Focus 30/60) | 🟡 |
| Slots typés Attaque ×3 / Défense / Support / Passive / Ultimate | Slots génériques | ❌ |
| Parchemins en combat, découverte aléatoire, doublons → fragments | Parchemins fabriqués (Shinobi Arts), choisis | 🟡 (déterministe uniquement) |
| Tags (feu, zone, multi-hit…) | Aucun | ❌ |
| Paliers qui changent le comportement | Rangs = valeurs numériques seulement | ❌ |
| Pas de jauge d'énergie obligatoire | Barre de chakra qui paie chaque technique | 🟡 conflit |
| Arme : XP propre → niveau | XP d'arme en combat, sert seulement à l'éveil | 🟡 |
| Raffinage (lingots + gemmes) | Reforge (gold + reliques du monde le plus récent), sockets de gemmes | 🟡 |
| Éveil qualitatif | First / Final Release = +40 % / +100 % ATK | 🟡 (numérique seulement) |
| Compagnons passifs, ~3 slots, issus de la chasse | Beast Taming : 1 compagnon actif (niv. 20) + pets de skill/boss permanents | 🟡 |

## Combat (GDD §3)

| GDD | Jeu actuel | État |
| --- | --- | --- |
| Combat auto, build préparé | ✅ tick auto, nourriture, techniques, formes, Domain | ✅ |
| Communs / élites / mini-boss / boss | Communs + 1 boss par monde | 🟡 |
| Tables de loot identifiables, raisons de refaire les boss | Drops par ennemi, schémas, coffres, Ascension | ✅ |

## Activités (GDD §4)

| GDD | Jeu actuel | État |
| --- | --- | --- |
| Woodcutting → Crafting | Woodcutting → Shinobi Arts | ✅ |
| Fishing → Cooking | ✅ + Shiny / Perfect + épices | ✅ |
| Expeditions passives ≥ 10 min, destination + durée | Voyaging : action active de 10-26 s qui bloque le reste | 🟡 conflit |
| Gem Mining | Reishi Mining (+ gemmes rares) | ✅ |
| Smelting (minerai → lingots) | Absent : Bladesmithing forge directement depuis le minerai | ❌ |
| Farming → Cooking | Farming (Ki) : parcelles en temps réel, repas buff | ✅ |
| Gravity Training → Transformations | ✅ | ✅ |
| Cursed Research → techniques / Domain | Exorcism + Sigilcraft (Domain = plateau 3×3 de sigils, système à part) | 🟡 |
| Hunting → Pets / Cooking | Tracking + Trapcraft + Beast Taming | 🟡 (3 skills pour 1) |
| — | Herbalism, Chakra Focus, Soul Harvest, Tinkering, Pacts, Archaeology, Restoration, Echo Bonding | ➕ |

## Systèmes thématiques et transversaux (GDD §5-6)

| GDD | Jeu actuel | État |
| --- | --- | --- |
| Disciplines énergétiques (Chakra, Haki, Reiatsu, Ki, occulte, Nen) dans une maîtrise commune | Inner Power : 6 entraînements à énergie allouée + Rebirth / Karma | 🟡 |
| Time Chamber (réserve d'accélération) | Absent (la Dilation n'étend que le hors-ligne) | ❌ |
| Dragon Balls (7, invocation, choix) | Wish Stones ★1-7 → vœu permanent | ✅ |
| Binding Vows | Pacts (6 vœux, 1-3 slots) | ✅ |
| Domain Expansion = couche des techniques | Domain = plateau de sigils séparé | 🟡 |
| Nen : 6 catégories qui personnalisent les techniques | Absent | ❌ |
| Greed Island Cards, sets | Card Book : une page par monde, bonus de page | ✅ |
| Collection Log | ✅ objets + pets | 🟡 (pas techniques / ennemis) |
| Market | ✅ | ✅ |
| Shiny / Perfect | Fishing + Cooking seulement | 🟡 |
| Objectifs quotidiens / hebdo / permanents | Chaîne guidée de 58 objectifs ; contrats de chasse (4 h) | 🟡 |
| Renown / Ascension | Renown par monde + 3 tiers d'Ascension | ➕ (le GDD le prévoit « après les six mondes ») |

## Sauvegardes

`SAVE_V = 6` : les sauvegardes antérieures sont refusées. Les objectifs sont stockés par index (`S.goal`) :
insérer un objectif décale tous les suivants et demande une migration.

## Avancement (2026-11-18)

Fait : noms du GDD · niveau de personnage + 5 stats · techniques (27, parchemins de chaque monde, fragments, slots typés,
paliers, recharges, passives, Domain Expansions, catégories de Nen) · monde 1 (Woodcutting, Crafting, Combat) · disciplines
énergétiques · expéditions passives · Soul City (Smelting, armes par exemplaire : niveau, raffinage, éveil) · Kaio Planet
(Time Chamber, Tinkering retiré) · Shinjuku (Cursed Research, Binding Vows, Domain) · Green Island (Hunting, 3 compagnons) ·
élites et mini-boss · objectifs quotidiens / hebdomadaires · Collection Log étendu · kits d'ennemis (rôles, faiblesses,
coups annoncés, phases de boss, affixes d'élites), altérations communes, créatures dessinées et bestiaire détaillé (2026-11-19).

Reste : équilibrage inter-mondes (les mondes 4-7 ont été réglés avant le retrait de plusieurs multiplicateurs : perks de Karma,
sigils, gadgets, skills fusionnés) · Shiny / Perfect sur les autres skills · scènes animées des mondes 1, 3-6 · Ascension
(prévue par le GDD après les six mondes : à redéfinir) · Echo Quarter / Rift en post-game.

## Ordre de travail proposé (GDD §9)

1. **Socle transversal** : niveau de personnage + 5 stats, techniques (drops, fragments, slots typés, paliers), progression d'arme (niveau, raffinage, éveil).
2. **Monde 1** jouable de bout en bout avec ce socle.
3. **Monde 2** : expéditions passives.
4. **Monde 3** : Smelting → Refinement → Awakening.
5. Mondes 4-6, puis Time Chamber, objectifs quotidiens / hebdo, Collection Log étendu.

Les décisions prises avec le joueur sont consignées dans `docs/DECISIONS.md`.
