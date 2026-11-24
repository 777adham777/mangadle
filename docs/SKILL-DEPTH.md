# Profondeur des métiers (theorycraft, 2026-11-24)

Demande du joueur : « ajouter de la profondeur à chaque skill : plus de recettes, de ressources, d'items… pour que
monter chaque skill soit intéressant, gratifiant et excitant, et qu'on découvre ses possibilités au fur et à mesure ».
Inspiration : Melvor Idle (sous-produits, potions à effet de métier, perks de maîtrise, capes, nœuds rares),
RuneScape (chaque palier débloque quelque chose), Stardew (la profession qui change la façon de jouer).

## Constat (audit du 2026-11-24)

| Métier | Actions | Trous entre déblocages | Ce qui manque |
|---|---|---|---|
| Woodcutting | 8 arbres (1→88) | 10 à 16 niveaux | aucun sous-produit propre, rien d'unique en montant |
| Crafting | 109 recettes | dense | aucun consommable qui aide les autres métiers |
| Fishing | 8 poissons | 10 à 18 niveaux | un seul sous-produit (épices) |
| Cooking | 17 plats | 30→45, 45→58 vides | — |
| Voyaging | 7 routes | 13 à 17 niveaux | rien après 82 |
| Reishi Mining | 8 minerais | 10 à 16 niveaux | aucun sous-produit commun |
| Smelting | **8 lingots seulement** | 10 à 16 niveaux | le métier le plus plat du jeu |
| Autres mondes | 7 à 16 actions | 10 à 15 niveaux | même schéma |

Et pour tous : les paliers 10/25/50/75/99 donnent les **mêmes** bonus génériques à chaque métier. Rien ne dit
« ce métier-ci devient différent quand tu y investis ».

## Les 4 leviers

1. **Perks de métier** (le cœur) : 5 perks *propres à chaque métier* aux niveaux 15, 35, 55, 70 et 90, qui
   s'intercalent avec les paliers génériques (10, 25, 50, 75, 99). Un déblocage nommé tous les 5 à 15 niveaux,
   visible à l'avance dans la fenêtre **Path** du métier. Chaque métier a au moins un perk qui touche *sa*
   mécanique (veine, forge, trophées, percées, cultures géantes, flair, restaurations parfaites…) et un perk
   « Racines du monde » : une chance d'obtenir aussi la ressource du palier au-dessus.
2. **Sous-produits** : chaque métier de récolte laisse quelque chose en plus (sève, huile, poussière…), qui
   nourrit d'autres métiers. C'est le principe Melvor « tout sert à quelque chose ».
3. **Nouveaux nœuds et recettes** dans les trous : nouveaux arbres, poissons, minerais, lingots, alliages, plats,
   routes, outils Mk IV.
4. **Toniques** (Crafting) : consommables à boire depuis la Banque, qui donnent ce que les repas ne donnent pas :
   doubler sa récolte, économiser ses matériaux, multiplier les sous-produits.

Règles respectées (docs/DECISIONS.md) : rien n'apparaît avant d'être atteignable (les recettes restent cachées
avec leur monde), chaque nouvelle ressource a au moins deux usages, l'équipement passe par economy.js (même
courbe que tout le reste), aucune nouvelle mécanique de monde n'est ajoutée.

## 1. Les perks de métier

Effets possibles : vitesse, double, XP, trouvailles rares, *épargne* (une fabrication ne consomme rien),
*sous-produits ×*, *palier supérieur* (chance d'obtenir la ressource du nœud au-dessus), et les perks de mécanique.

| Métier | 15 | 35 | 55 | 70 | 90 |
|---|---|---|---|---|---|
| Woodcutting | Clean Cut · +6 % double | Sap Tapper · sous-produits ×1,6 | Forest Stride · +10 % vitesse | Amber Eye · rares ×1,5 | Root of the World · 4 % bûche de l'arbre au-dessus |
| Crafting | Steady Hands · +6 % vitesse | Thrifty Hands · 5 % épargne | Batch Work · +8 % double | Artisan's Eye · +12 % XP | Living Legacy · +8 % épargne |
| Fishing | Patient Line · +6 % vitesse | Net Mender · prises annexes ×1,5 | Trophy Waters · poissons +15 % plus lourds | Deep Waters · +8 % double | Lord of the Deep · 4 % poisson du palier au-dessus |
| Cooking | Hot Pan · +6 % vitesse | Spice Saver · 6 % épargne | Double Batch · +8 % double | Chef's Instinct · +12 % XP | All Blue · +8 % épargne |
| Voyaging | Light Hull · +8 % butins | Lucky Charts · rares ×1,4 | Trade Winds · +12 % XP | **Third Ship · +1 navire** | Grand Line Legend · +15 % butins |
| Reishi Mining | Steady Pick · +6 % vitesse | Rock Reader · sous-produits ×1,6 | Lode Sense · Mother Lode ×2 | Deep Seam · +8 % double | Heart of the Mountain · 4 % minerai au-dessus |
| Smelting | Bellows · chaleur ×1,5 | Flux Master · 6 % épargne | White Flame · White Heat +3 fontes | Twin Mold · +8 % double | Soul Forge · +8 % épargne |
| Gravity | Iron Will · +6 % vitesse | Heavy Breath · +8 % double | Kaio's Lesson · +12 % XP | Zenkai · percées +25 % | Limit Breaker · percées +25 % |
| Farming | Green Thumb · pousse +10 % | Bumper Crop · +10 % double | Giant's Garden · géantes ×1,5 | Seed Keeper · mutations ×1,5 | Eternal Harvest · pousse +15 % |
| Cursed Research | Sharp Eyes · +6 % vitesse | Grade Reader · grades élevés ×1,4 | Binding Study · +8 % double | Domain Scholar · +12 % XP | Six Eyes · grades élevés ×1,6 |
| Hunting | Light Step · +6 % vitesse | Strong Scent · flair ×1,5 | Trap Saver · 10 % épargne | Beast Sense · bêtes Shiny ×1,5 | Hunter's License · rares ×1,5 |
| Archaeology | Fine Brush · +6 % vitesse | Layer Reader · +8 % double | Field Notes · +12 % XP | Relic Sense · rares ×1,5 | Lost Civilisation · 4 % fragment au-dessus |
| Restoration | Gentle Hands · +6 % vitesse | Spare Parts · 6 % épargne | Steady Glue · Flawless +8 % | Restorer's Eye · +12 % XP | Living History · Flawless +10 % |
| Echo Bonding | Calm Mind · +6 % vitesse | Echo Voice · +12 % XP | Deep Bond · +10 % vitesse | Resonance · rares ×1,5 | Two Souls · +15 % XP |

## 2. Vague 1 — Leaf Village, Orange Town, Soul City (implémentée)

### Woodcutting
- Sous-produits : **Chakra Sap** (6 % par coupe, tous les arbres) → toniques, Amber Pendant ;
  **Fossil Amber** (trouvaille rare) → Amber Pendant, routes de voyage.
- Nouveaux arbres : **Living Wood** (Lv 52, l'arbre Mokuton) → Living Wood Mail, sculpture ;
  **Divine Tree Root** (Lv 95, la racine du Shinju) → Divine Root Longbow, Chakra Saw Mk IV, The Final Island.

### Crafting
- **Toniques** (à boire depuis la Banque, comme un repas) :
  | Tonique | I (Lv 12) | II (Lv 42) | III (Lv 74) |
  |---|---|---|---|
  | Abundance Tonic · double récolte | +5 % · 20 min | +10 % · 30 min | +15 % · 40 min |
  | Thrift Tonic · fabrications gratuites | 6 % | 12 % | 18 % |
  | Forager's Tonic · sous-produits | ×1,3 | ×1,6 | ×2 |
- Nouvel équipement : Amber Pendant, Thunder Harpoon, Sekki Bracers, Frostvoid Scythe, Living Wood Mail,
  Kido Focus Staff, Sunstar Plate, Divine Root Longbow (voir economy.js pour les stats).
- Outils Mk IV pour Woodcutting, Reishi Mining et Fishing (+15 % de vitesse, comme les autres paliers).

### Fishing
- Sous-produit : **Fish Oil** (6 % par prise) → toniques, Fish-Oil Tempura, Thunder Harpoon.
- Nouveaux poissons : **Thunder Catfish** (Lv 38) et **Coral Dragonet** (Lv 78), avec leur poids de trophée.

### Cooking
- **Thunder Catfish Hotpot** (Lv 40), **Fish-Oil Tempura** (Lv 52), **Coral Dragonet Sashimi** (Lv 80) :
  le trou 30→58 est comblé, et l'huile de poisson sert.

### Voyaging
- **Fishman Island** (Lv 46) : Thunder Catfish, Sekki Stone, sève ; perles et ambre en rare.
- **The Final Island** (Lv 95) : la route de fin de partie (racines divines, quartz kido, Devil Fruit).
- Perk 70 : un troisième navire.

### Reishi Mining
- Sous-produit : **Reishi Dust** (7 % par minerai) → toniques, alliages, Sekki Bracers.
- Nouveaux minerais : **Sekki Stone** (Lv 38, la pierre qui bloque le reiatsu) et **Kido Quartz** (Lv 80).

### Smelting (le métier le plus plat devient un vrai métier)
- Lingots : **Sekki Ingot** (Lv 40), **Kido Ingot** (Lv 82).
- **Alliages** (deux lingots + poussière de reishi) : **Frostvoid Alloy** (Lv 50) et **Sunstar Alloy** (Lv 76),
  pour l'équipement le plus fort de leur palier.

## 3. Vague 2 — mondes 4 à 7 (à faire)

Même recette, une fois que la vague 1 a été jouée :
- Gravity : sous-produit *Sweat-Forged Band* (bracelet de gravité usé) ; nœud 92 *Divine Ki*.
- Farming : deux cultures (*Namek Ajisa* Lv 42 → toniques ; *Tree of Might Fruit* Lv 72 → repas de fin).
- Cursed Research : Cursed Fragment devient un sous-produit commun ; nœud 90 *Finger of the King*.
- Hunting : Beast Essence en sous-produit ; nouveau piège ; bête Lv 92.
- Archaeology / Restoration : un site Lv 90 et deux artefacts de plus.
- Outils Mk IV des métiers de ces mondes, capes de Grand Maître au niveau 99.

## Icônes

Les nouveaux objets ont un glyphe et une couleur de secours jusqu'à leur icône peinte. Le brief prêt pour ChatGPT
est dans `docs/DEPTH-ICONS.md` (même format et même découpeur que l'armurerie).
