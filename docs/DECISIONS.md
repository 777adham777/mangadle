# Décisions de design (rework GDD v1.0)

Choix validés avec le joueur le 2026-11-18, puis propositions à valider.

## Validé

| Sujet | Décision |
| --- | --- |
| Noms | On adopte les noms du GDD (mondes et systèmes). Les identifiants internes du code (`shinobi`, `seas`, `soul`, `ki`, `hex`, `hunter`) ne changent pas. |
| Echo Quarter + The Rift | Gardés comme contenu post-game, derrière le monde 6. Retouchés plus tard. |
| Sauvegardes | Reset autorisé quand un changement de fond l'exige (`SAVE_V` monte, les anciennes sauvegardes repartent de zéro). |
| Skills hors GDD | On colle au GDD : Herbalism, Chakra Focus, Soul Harvest, Tinkering, Sigilcraft, Pacts (en tant que skill) sont retirés ou fusionnés monde par monde ; Tracking + Trapcraft + Beast Taming deviennent Hunting. Leurs ressources sont recyclées. |
| Personnage | Un niveau de personnage unique, gagné en combat, qui monte les 5 stats (Attack, Defense, Vitality, Speed, Luck). Le build vient des armes, techniques, compagnons, cartes, nourriture. Strength / Defense / Vitality et le style de combat disparaissent. |
| Techniques | Recharges seules, déclenchées dans l'ordre des slots (défensives sur condition). Plus de barre de chakra. |
| Disciplines énergétiques | Inner Power garde son moteur d'allocation ; ses entraînements deviennent les disciplines (une de plus par monde). Rebirth / Karma retirés. |
| Armes (Soul City) | Chaque arme est un exemplaire unique avec sa progression. Bladesmithing devient Smelting (minerai → lingots), ses recettes passent dans Crafting. L'éveil donne un élément puis le passif de la famille d'arme. |
| Kaio Planet | Tinkering retiré : ses outils (vitesse permanente des skills de récolte) et l'équipement Ki passent dans Crafting ; le slot Gadget et les gadgets sont supprimés. Les Dragon Balls s'ouvrent après 10 victoires dans les Rocky Plains. |
| Shinjuku | Exorcism devient Cursed Research : en plus de ses matériaux, il donne des Cursed Fragments, qui comptent comme fragments de n'importe quelle technique. Sigilcraft et le plateau de sigils sont retirés : les Domain Expansions sont des techniques Ultimate (parchemins des ennemis de Shinjuku) — un gros coup, puis 10 s (15 s au niveau 5) où les techniques partageant un tag d'élément du domaine font +50 %, plus la règle du domaine. Pacts n'est plus un skill : Binding Vows (slots à Cursed Research 1/40/80, bonus +1 % par niveau), réversibles à tout moment ; nouveau vœu Narrow Path (seuls les 2 premiers slots de techniques combattent, +30 % de puissance des techniques). L'équipement maudit passe dans Crafting. |
| Green Island | Tracking, Trapcraft et Beast Taming deviennent Hunting : pistes des familles de bêtes (matériaux, graines, Game Meat pour Cooking : Hunter's Stew, Beast Feast) et chasses des bêtes de chaque monde avec un piège. Pièges, appâts et équipement de chasseur passent dans Crafting. Compagnons : bonus passifs seulement, 3 slots actifs (1, Hunting 30, Hunting 60). |
| Time Chamber | Les heures d'absence au-delà de la limite hors-ligne (12 h) remplissent une réserve ; activée, elle fait tourner l'activité en cours et les bateaux 2× plus vite (pas le combat). Capacité 4 h, +4 h tous les 25 niveaux de Gravity Training ; 1 h offerte au déblocage (Gravity 20). |
| Expéditions | Passives, en parallèle de l'activité en cours et hors ligne, ≥ 10 min. 1 bateau au départ, un 2e plus tard. Un plat optionnel améliore le butin. Voyaging garde ses niveaux. |

## Proposé (à valider en jeu)

| Sujet | Proposition |
| --- | --- |
| Soin dans le monde 1 | Crafting fabrique les Soldier Pills avec les Healing Leaves que donne Woodcutting (sous-bois). Les techniques défensives (Healing Palm, Iron Skin, Mist Step) complètent. |
| Herbes (ex-Herbalism) | Sous-produits de Woodcutting : chaque arbre donne l'herbe de son palier (25-30 %), les arbres anciens un peu de chakra brut. |
| Cristaux de chakra (ex-Chakra Focus) | Deviennent des drops de combat du monde 1, utilisés par Crafting. |
| Restes d'âmes (ex-Soul Harvest) | Deviennent des drops de combat du monde 3. |
| Crafting | Shinobi Arts devient Crafting, l'unique skill de fabrication d'armes et d'objets (Bladesmithing y sera fusionné au monde 3, après Smelting). La première arme est l'Épée en bois. |
| Personnage : formules | Attack = 8 + 1,5 × niv + équipement ; Defense = 1,5 × niv ; Vitality (PV de base) = 40 + 9 × niv ; Speed = 0,2 × niv (+1 % vitesse d'attaque / point) ; Luck = 0,1 × niv + 15 par Lucky Coin (+1 % de chance rare / point). Paliers 10/25/50/75/99 : +4 % dégâts, défense, PV. |
| Techniques : chiffres | Niveaux 1-10, paliers de comportement aux niveaux 5 et 10. Un doublon = 5 fragments ; coûts 3-20 fragments par niveau (83 au total). Parchemin : 1/40 par ennemi commun, 1/4 par boss, garanti après 60 victoires sans parchemin, le premier au plus tard à la 10e victoire. Techniques inconnues 3× plus probables. |
| Slots de techniques | Attaque I au départ, Défense au niveau 8, Attaque II au niveau 15, Attaque III au niveau 35, Support à Soul City, Passive à Kaio Planet, Ultimate à Shinjuku. |
| Disciplines : effets | Une par monde, chacune = un effet de combat + le bonus idle de l'ancien entraînement qu'elle remplace. Par niveau : Chakra +1 % puissance des techniques, +0,2 % vitesse des skills · Haki +0,5 % dégâts, +1 % or · Reiatsu +1 % PV max, +1 % XP d'arme · Ki +1 % défense, +0,2 Speed · Cursed Energy +0,5 % XP, +0,5 % puissance des techniques · Nen +0,1 Luck, +1 % bonus de compagnon. Rebirth, Karma et ses perks (dont +2 h de hors-ligne) sont retirés. |
| Expéditions : chiffres | Durées 10 min / 1 h / 4 h / 8 h (+0 / 5 / 10 / 15 % de butin). Une « prise » de butin par minute en mer (or, table de la destination, raretés, cargaison d'épices), multipliée par la vitesse de Voyaging. Coque obligatoire : 2 bûches du bois de la destination par 10 min (Woodcutting garde son utilité). Provisions optionnelles : 1 plat par 10 min, +30 % de prises. XP de Voyaging : 2 × l'XP de base par prise. 2e bateau à Voyaging 30. Option « renvoyer au retour » activée par défaut. |
| Armes : chiffres | Niveau 1-50 (XP de combat de l'arme maniée, XP totale 60 × (N−1)^2,5), +2 % d'attaque d'arme par niveau. Raffinage +1 à +10 : lingots du palier de l'arme (2 + 2 × rang), gemme à +4 (Jade), +7 (Ruby), +10 (Void Diamond), +10 % d'attaque par rang, rang +n demande le niveau 5n. Éveil I : niveau 25 et +5, âmes de Soul City, choix d'un élément (Feu +15 % dégâts des attaques auto, Foudre 15 % de double frappe, Vent +12 % vitesse, Saignement ignore 20 % de défense, Drain soigne 8 % des dégâts) qui renforce aussi de 25 % les techniques du même tag. Éveil II : niveau 50 et +10, + 3 Husk Hearts, passif de famille (lame courte +15 % vitesse, épée recharge des techniques +15 %, lourde +25 % contre les boss, distance 1re frappe ×3, sabre +10 Luck). Armures et accessoires gardent la progression partagée (sockets, reforge). |
| Pools de techniques | Chaque monde a son parchemin : Leaf (7, base du jeu), Sea (Haki, canons : 3), Soul (faucheurs : 3), Ki (1 attaque + 3 passives, pour le slot Passive qui s'ouvre là), Cursed (4 Domain Expansions, Ultimate), Hunter (les 6 catégories de Nen : Renforcement, Émission, Conjuration, Manipulation, Transmutation (passive), Spécialisation (Ultimate)). Le Nen personnalise ainsi les builds sans barre ni arbre séparés. |
