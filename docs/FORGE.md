# La Forge : refonte du craft et de l'équipement (2026-11-26)

Source : audit `scratch/craftaudit/forge-audit.html` (deck), décisions du joueur du 2026-11-26.
Ce fichier est le cahier des charges ; `docs/DECISIONS.md` en garde le résumé.

## Décisions du joueur

1. L'héritage (qui fond l'arme) est remplacé par la maîtrise de famille + le transfert gratuit.
2. Les sculptures redeviennent une cargaison d'expédition, avec moins d'XP.
3. Les armes et les pièces de set ne tombent plus : les monstres lâchent des matériaux rares, la forge fait la pièce.
4. Sets d'armure à 6 pièces : torse, casque, jambes, bottes, amulette, anneau.
5. Le lot 2 sort avant la pré-alpha publique.
6. Les 6 emplacements sont ouverts dès le début. Au niveau 1, il n'y a pas de pièce pour chaque emplacement : les recettes arrivent au fil des niveaux. Les sets arrivent un peu plus tard ; ils sont plus rares et plus forts que les pièces génériques de chaque monde.
7. Pas de recyclage : on vend, toujours avec un bénéfice qui dépend de la pièce (autour de 5 à 10 %).

## Règles

### Emplacements
Arme + `head` (casque), `chest` (torse), `legs` (jambes), `feet` (bottes), `amulet` (amulette), `ring` (anneau).
Les anciens `armor` deviennent `chest` ; les anciens `accessory` vont dans `head`, `amulet` ou `ring` selon leur nature.

Budget : un équipement complet d'un stage vaut l'ancienne armure + l'ancien accessoire du même stage, donc la courbe des combats reste valable.
Parts de l'armure (DEF et PV) : torse 40 %, jambes 25 %, casque 20 %, bottes 15 %. Amulette et anneau : chacun la moitié d'un ancien accessoire.

### Pièces génériques et sets
- Chaque monde a des pièces génériques forgées (rôle `craft`), une par emplacement et par palier, qui s'ouvrent avec le niveau de Crafting.
- Chaque monde a 2 ou 3 sets de 6 pièces (rôle `set` : stats ×1,12, plus un bonus de set). Ils s'ouvrent plus tard dans le monde et se forgent avec un matériau rare du set (lâché par certains monstres du monde).
- Bonus à 2, 4 et 6 pièces. Les bonus contrent les mécaniques des combats (voir Parades).
- L'arme ne fait plus partie des sets : sa progression passe par la maîtrise (P8).

### Parades (stats de set)
| Mécanique (existe déjà) | Parade (stat) |
| --- | --- |
| Brûlure, poison, saignement | `rBurn`, `rPoison`, `rBleed` : durée et dégâts réduits |
| Affaiblissement | `rWeaken` : durée réduite |
| Étourdissement | `rStun` (ténacité) : durée réduite |
| Phase de bouclier | `shieldBreak` : dégâts sur bouclier augmentés |
| Ennemi blindé | `pierce` : réduit l'armure contre les attaques auto |
| Ennemi évasif | `acc` (précision) : réduit l'esquive de l'ennemi |
| Régénération, vol de vie de l'ennemi | `wounds` (plaies) : réduit ses soins |
| Frénésie, accélération | `calm` : réduit le bonus de dégâts de l'enrage et de la hâte |
| Coup chargé annoncé | `parry` : dégâts des coups télégraphiés réduits |
| Coups multiples | `brace` : dégâts des attaques en plusieurs coups réduits |
| Feu, foudre, vent | `rFire`, `rLightning`, `rWind` : dégâts des coups de cet élément réduits |

### Matériaux rares (P6)
Toute arme ou pièce de set qui tombait devient une recette : le monstre lâche un **fragment** de la pièce, et 3 fragments + les matériaux du monde la forgent.
Chance du fragment = 3 × chance de l'arme × 80/90 : même temps moyen, mais la progression se voit. Les fragments en trop raffinent cette arme (ils remplacent les lingots d'un rang).
Le recyclage disparaît. Les reliques qu'il donnait viennent des gardiens.

### Vente (P4) et lingots (P2)
- Vendre une pièce forgée rapporte la valeur de ses matériaux + une marge : 5 % (pièce simple), 7 % (schéma), 8 % (pièce de set), 10 % (arme à fragments).
- Un lingot vaut ses ingrédients + 5 à 10 % (plus le niveau monte, plus la marge monte).
- Garde-fou : tout matériau vendu en boutique coûte au moins 25 % de plus que sa valeur de vente.
- Les coûts de forge (raffinage, éveil, reforge) gardent leur barème d'avant (`tierValue`), sinon ils exploseraient avec les nouvelles valeurs.

### Crafting (P1)
- La première fabrication de chaque pièce d'équipement rapporte une prime d'XP (`FIRST_FORGE`), réglée pour qu'environ 40 % de l'XP de Crafting de chaque monde vienne de l'équipement.
- Sculptures : XP réduite, elles restent une cargaison d'expédition.

### Armes (P3, P8)
- **Maîtrise de famille** : l'XP de combat va à la famille de l'arme (lame courte, épée, lourde, distance, cutlass), niveaux 1 à 50. Une arme neuve démarre au niveau de maîtrise de sa famille. +2 % d'attaque par niveau de maîtrise.
- Raffinage +1 à +10 : rang n demande la maîtrise 5n.
- Éveil I : maîtrise 15 et +3. Éveil II : maîtrise 35, +7 et le matériau du gardien du monde de l'arme.
- **Transfert** : le raffinage, l'éveil et l'élément passent gratuitement à une arme plus forte. L'ancienne reste dans l'armurerie, sans ses rangs. Rien n'est fondu.
- Les familles des armes de donjon (lance, faux, poing, couperet, griffe) sont rattachées aux 5 familles.

### Code (P5)
Une seule forge : `js/forge.js` (puissance d'une pièce, raffinage, éveil, transfert, maîtrise, reforge, sockets). Les sets et les parades vivent dans `js/sets.js` (chargé après `foes.js`, dont ils enveloppent les mécaniques).
Supprimés : l'ancien éveil par objet (`RELEASE`, `awaken`, `relNeed`), les sockets d'arme, la reforge d'arme cachée, l'héritage, le recyclage.
Trois paires de noms en double sont renommées.

### Lot 3
- **P10** : la chance de Perfect monte avec le nombre de fabrications de la recette (1 % → 8 %). L'option « Soin » coûte +50 % de matériaux et triple la chance. Un Perfect renforce le perk de la pièce au lieu de donner +20 % brut.
- **P11** : les pièces en double sont retirées ou deviennent des pièces de set.
- **P12** : une recette d'équipement se révèle quand on a fabriqué la précédente de son emplacement (ou de sa famille), ou quand on ramasse son fragment. Les schémas restent pour les pièces iconiques.
