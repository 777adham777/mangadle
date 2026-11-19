# Studio v2 : coiffures et tenues (proposition)

Proposition du 2026-11-19, à valider. Elle s'appuie sur une recherche d'environ 50 sources (liste à la fin) :
- des tutoriels d'artistes japonais et occidentaux (Clip Studio Tips, ichi-up, nukegara, Proko, Anime Outline) ;
- les documentations officielles de VRoid, Live2D et Spine ;
- les systèmes de Picrew, MapleStory, RimWorld, Starbound et Cult of the Lamb ;
- des articles de recherche (2.5D Cartoon Models, 2.5D Cartoon Hair) ;
- les règles de plis (Bridgman, Hogarth) et des devlogs sur la physique 2D.

## 1. Pourquoi les coupes actuelles sont ratées

Le problème vient du moteur, pas des réglages. Les artistes cités contredisent nos choix point par point :

| Ce que fait le moteur v1 | Ce que font les artistes / outils |
| --- | --- |
| Toute la coupe fusionnée en **une seule silhouette** avec un seul contour | La coupe est faite de **couches séparées** (arrière, côtés, dessus, frange, mèche rebelle), chacune avec son contour ; on trace un trait intérieur là où une mèche passe sur une autre. Une silhouette unique donne l'effet « blob » |
| Ombre = **copie décalée** de la forme | Les ombres sont des **formes dessinées** et placées selon des règles : sous chaque mèche, à l'endroit où deux mèches se croisent, la nuque en zone sombre, l'**ombre de la frange portée sur le front**. Une ombre calculée par décalage « se voit » |
| Mèches = lames régulières en éventail (couronne) | 5 à 10 grandes mèches dont **2-3 dominantes**, largeurs et longueurs irrégulières (±30 %), racines larges qui se chevauchent, quelques mèches qui passent derrière leurs voisines. Des piques égales à intervalles égaux, c'est exactement l'« effet scie / couronne posée » que les tutos interdisent |
| Contour **noir** partout | Contour d'une **teinte sombre de la couleur des cheveux** (色トレス), plus fin à l'intérieur, plus épais aux recouvrements ; pas de contour dur entre cheveux et peau (« effet perruque ») |
| Ombre = même teinte assombrie | Ombre **décalée vers le bleu/violet**, plus saturée ; cheveux clairs = 2 ombres, cheveux foncés = 1 ombre + 2 reflets + lumière de contour |
| Quelques traits de reflet par mèche | **L'anneau de lumière** (angel ring) : une seule bande qui suit la sphère du crâne et ignore les mèches, cassée en zigzag à chaque mèche. Pour 3DxDEV, c'est l'élément le plus important des cheveux anime |
| Tête plate : les mèches sont dessinées dans le plan de la tête | Les racines sont posées **sur le crâne en 3D** (VRoid, Live2D, Rivers et al.) : quand la tête tourne, le côté éloigné se resserre et l'ordre des mèches suit la profondeur |
| Les mèches ondulent toutes pareil (sinus) | La racine est fixe, les pointes bougent ; c'est une **chaîne de 2 à 5 segments** par groupe, avec un retard par rapport à la tête et au corps, la frange plus légère que l'arrière (Live2D, Spine, VRoid) |

Pour les tenues, même constat :
- Les pièces sont **collées à plat sur le corps**, comme un tatouage, sans épaisseur ni écart avec la peau.
- **Aucun pli** n'apparaît aux articulations.
- Il n'y a **pas de matière** : tissu, cuir et métal sont rendus pareil.
- Les ourlets ne bougent pas.
- Les pièces **se déchirent aux coudes et aux genoux**, parce qu'une pièce suit un seul os.

## 2. Coiffures v2

### 2.1 Modèle : une coupe = des couches, une couche = des mèches

```
Coupe
├── palette : base + ombres (décalées vers le bleu) + reflet + contour, dérivés d'une rampe
├── volume : distance entre le crâne et les cheveux (serré 2-4 % du rayon, anime 8-15 %)
├── épi ou raie : point d'où partent les mèches (milieu, raie 2:8, ou aucun pour les coupes à piques)
├── implantation : ligne du front, tempes
└── couches (ordre de dessin fixe)
    1. arrière   (derrière le corps : cheveux longs, queues)
    2. nuque     (derrière la tête, zone la plus sombre)
    3. côtés     (mèches latérales, ancrées aux oreilles et à la mâchoire)
    4. dessus    (calotte et mèches du sommet)
    5. frange    (devant le visage ; porte l'ombre sur le front)
    6. extras    (mèche rebelle, mèches folles, chignon, élastique, barrette)
```

Une **mèche** contient :
- une **colonne vertébrale** de 3 à 6 points, avec sa racine sur le crâne en 3D ;
- un **profil de largeur** (racine, ventre, pointe) ;
- une **pointe** au choix : piquante, arrondie, recourbée vers l'intérieur, relevée, fourchue en 2 ou 3, coupée net ;
- une courbe en S, une torsion et une profondeur (ordre d'empilement).

Une **mèche fourchue** se sépare en sous-mèches à partir d'un point. C'est la règle des tutos : séparer les pointes adoucit la coupe.

Un **groupe** génère des mèches en éventail, comme dans VRoid. Ses réglages :
- nombre, position autour de la tête, angle couvert, raie ;
- longueur et variation de longueur ;
- arrondi de l'ourlet (concave ou bombé), direction du flux ;
- regroupement vers les pointes (clumping), boucles, épaisseur et variation ;
- graine de hasard et symétrie.

Les règles anti-scie sont **intégrées au générateur** : mèches dominantes, irrégularité, racines qui se chevauchent, quelques mèches passées derrière. On peut ensuite **figer** un groupe en mèches libres pour les retoucher une par une. VRoid suit exactement ce chemin : du procédural d'abord, puis du libre.

### 2.2 Rendu, dans l'ordre

1. **Couches** dessinées de l'arrière vers l'avant, chacune avec son contour coloré. Le trait est plus épais là où une mèche recouvre l'autre et plus fin à l'intérieur. Il n'y a pas de contour entre la frange et la peau.
2. **Ombres dessinées** :
   - sous chaque mèche, le long de son bord inférieur ;
   - sur la mèche du dessous quand deux se croisent ;
   - à la fourche, en V ;
   - sur la nuque et l'intérieur des cheveux longs, en zone sombre ;
   - sur la moitié basse des queues.
3. **Ombre portée de la frange sur le front**, découpée sur la peau. C'est le seul endroit où une copie décalée est légitime (c'est ainsi que font les modeleurs Live2D).
4. **Anneau de lumière** : un arc sur la sphère du crâne, à 30-40 % sous le sommet, découpé sur la coupe et cassé en zigzag à chaque mèche. Il peut prendre trois styles : arc, zigzag, ou triangle (chibi). Un fin trait d'ombre passe juste dessous. Un second anneau, plus discret, est possible sur les queues.
5. **Lumière de contour**, fine, côté lumière. Elle est surtout utile sur les cheveux foncés.
6. **Pointes** : un dégradé teinte peau au bout de la frange (« transparence »), un dégradé vers une autre couleur en option (pointes colorées, mèches de deux couleurs), et quelques **mèches folles** fines ajoutées à la fin.

### 2.3 Tête qui tourne et mouvement

- **Racines en 3D sur le crâne**, projetées selon l'angle de la tête. L'ordre de profondeur suit la projection. Le côté éloigné se resserre, la raie glisse vers le côté proche, la queue de cheval passe derrière la tête en forme de point d'interrogation.
- **Physique par groupe** : un pendule à 2 ou 3 étages, dans le style de Live2D.
  - Entrées : rotation de la tête et mouvement du corps, chacune avec son poids.
  - Réglages par groupe : souplesse, retard, amortissement, gravité.
  - La frange est légère et courte, l'arrière lourd. Le mouvement est le plus fort à la pointe.
  - Les cheveux s'ébouriffent au départ d'une action (coup, lancer de canne, coup de hache) et retombent légèrement en désordre.
- **Chapeaux** : chaque chapeau déclare les couches qu'il cache ou aplatit (« cache le dessus », « aplatit la frange »), comme le système de MapleStory. Les débordements disparaissent.

### 2.4 L'éditeur de coiffure

1. **Partir d'un archétype**, défini avec les paramètres des tutos : piques shōnen, hime cut, carré, queue de cheval, couettes, undercut, longs lisses, ondulés, mèche sur l'œil, coiffé en arrière…
2. **Travailler couche par couche** (arrière, nuque, côtés, dessus, frange, extras). Chaque couche a ses groupes, avec les curseurs du générateur et un bouton « figer ».
3. **Retoucher sur la scène** : on tire les points de la colonne, on règle la largeur avec des poignées, on choisit le type de pointe, on fourche une mèche d'un clic, on ajoute une mèche au pinceau. La symétrie et le miroir restent.
4. **Palette** : on choisit une seule couleur de base. Les ombres, le reflet et le contour sont dérivés selon les règles de clarté (clair = 2 ombres, foncé = 1 ombre + 2 reflets), et chaque teinte reste ajustable.
5. **Vues de contrôle** :
   - un test de silhouette (coupe en noir plein : si on ne la reconnaît pas, la forme est à revoir) ;
   - un tour de tête (face, 3/4, profil) ;
   - une secousse pour tester la physique ;
   - la bande des 8 poses.

## 3. Tenues v2

### 3.1 Modèle

```
Vêtement
├── couche : intérieur, milieu, extérieur, ceinture, dos (cape, intérieur et extérieur séparés)
├── couverture : parties du corps occupées (deux vêtements ne s'excluent que s'ils partagent une couche et une partie)
├── coupe : écart à la peau par os (moulant 0-1 px, ajusté 2-3, ample 5-10, évasé vers l'ourlet pour hakama et robes)
├── matière : tissu, tissu épais, cuir, métal, fourrure, avec le rendu propre à chacune
├── couleurs : emplacements principal / bordure / accent / métal ; ombres dérivées automatiquement
└── formes : pièces sur le corps (comme en v1), mais
    · pondérées entre deux os près des coudes, genoux et hanches (plus de déchirure)
    · découpées sur la silhouette du membre (les motifs ne débordent plus)
    · sur plusieurs profondeurs (col par-dessus les cheveux, pan de manteau derrière la jambe)
```

### 3.2 Plis générés selon la pose

Les sept types de plis (Bridgman et Hogarth) sont posés par règles, dans une version simplifiée au style anime :

| Endroit | Pli | Règle |
| --- | --- | --- |
| Intérieur du coude ou du genou plié | demi-boucle (half-lock) | 0 trait bras tendu, 2-3 petits U au-delà de 60°, plus une ombre en goutte |
| Extérieur du coude ou du genou | tension | 1-2 longues lignes vers l'articulation suivante au-delà de 30° |
| Sous une ceinture ou une sash, sur une jupe ou une cape | tuyau (pipe) | 2-4 traits qui s'évasent vers le bas ; ourlet en vagues |
| Col, écharpe, capuche | drapé (diaper) | 1-3 U emboîtés entre deux points d'attache |
| Manches et jambes | spirale | traits en S diagonaux autour du membre |
| Bras levé | « le bras monte, la manche descend » | tissu ramassé à l'épaule, lignes de tension de l'aisselle vers la hanche |

Le **nombre de plis dépend de la matière** : un tissu fin en a beaucoup et fins, un tissu épais ou du cuir peu et larges, un tissu stretch presque aucun. Les traits de plis sont plus fins que le contour.

Les plis sont légèrement aléatoires (jamais deux pareils) et se figent pour un même vêtement et une même pose.

### 3.3 Rendu par matière

- **Tissu** : 2 tons, ombres de plis en petits triangles, peu ou pas de reflet.
- **Cuir** : plis rares et larges, coutures visibles, reflet court en ovale ou en fine bande, reflet de rebond dans l'ombre.
- **Métal** : ombre dure à teinte décalée (acier vers le bleu-gris, or vers le brun), bande de rebond en bas, **une** fine bande de reflet presque blanche qui suit la forme, bord éclairé.
- **Fourrure** : contour en dents irrégulières, ombre dentelée, pas de reflet.
- **Ombres portées** du vêtement extérieur sur l'intérieur : col sur la poitrine, veste sur chemise. Le col intérieur dépasse toujours un peu (gakuran, kimono).
- **Palette** : 60 % de couleur dominante, 30 % de secondaire, 10 % d'accent (métal, bordures), et un contrôle en niveaux de gris.

### 3.4 Mouvement

Les ourlets de jupe et de hakama, les pans de manteau, les capes, les bouts de sash et les rubans utilisent **la même physique en chaîne que les cheveux** : 5 points pour une queue, 8 pour une cape, des collisions avec le corps. Le retard dépend de la matière : une cape lourde traîne, un ruban vole, une pièce rigide (casque, armure) ne bouge pas.

### 3.5 Kits par monde

Chaque monde fournit des modèles de départ qui respectent la construction réelle :

| Monde | Kit | Règles de construction |
| --- | --- | --- |
| Leaf Village | ninja | contour hors du bras, bandes de tibia, tabi, nœud de capuche |
| Orange Town | pirate | formes triangulaires : tricorne, pans de manteau, revers de bottes |
| Soul City | kimono et hakama | gauche par-dessus droite, obi à 2 têtes sous le menton, hakama évasé avec plis étagés, plus haut derrière |
| Kaio Planet | gi | col croisé, manches courtes, ceinture nouée à deux pans |
| Shinjuku | gakuran | col droit rigide avec liseré blanc, 5 boutons, épaules marquées |
| Green Island | chasseur | formes carrées : sangles, poches, gilet de cuir superposé |

### 3.6 L'éditeur de tenues

On garde le dessin sur le corps de la v1 et on ajoute :
- la couche, la coupe (écart), la matière et les couleurs par emplacement ;
- des réglages de plis (densité, plis visibles ou non) ;
- la physique des ourlets ;
- une vue « pose extrême » pour repérer ce qui traverse le corps ;
- les kits par monde comme point de départ.

## 4. Ce qui est partagé

Un seul moteur sert aux cheveux et aux tissus :
- **les chaînes physiques** (pendule ou Verlet) ;
- **les profondeurs et couches**, avec des règles « cache / aplatit » ;
- **les palettes dérivées** (ombre à teinte décalée, contour coloré) ;
- **la tête en 2.5D** (racines sur une sphère, projection).

Les **teintures** (variantes de couleur) sont en option, voir les décisions.

## 5. Plan par étapes

Chaque étape est livrée et jouable avant de passer à la suivante.

| Étape | Contenu | Ce que tu verras |
| --- | --- | --- |
| **0. Prototype de rendu** | Nouveau rendu de cheveux : couches, contours colorés, ombres dessinées, ombre de frange, anneau de lumière. Appliqué à 3 archétypes codés à la main (piques shōnen, hime cut, queue de cheval) | Une planche avant / après. **Tu valides le rendu avant qu'on construise l'outil** |
| 1. Moteur de coiffure | Mèches avec colonne, profil et pointes ; fourches ; groupes générateurs ; racines 3D et tête qui tourne ; physique par groupe ; chapeaux qui cachent des couches | Les coupes intégrées refaites en v2 dans le jeu |
| 2. Éditeur de coiffure | Couches, générateur et figer, retouche sur la scène, palette dérivée, vues de contrôle, 12 archétypes | Tu crées tes coupes toi-même |
| 3. Moteur de tenues | Couches et couverture, coupe par os, pondération aux articulations, plis selon la pose, matières, ombres portées, physique des ourlets | Les tenues intégrées refaites |
| 4. Éditeur de tenues | Réglages ci-dessus, kits par monde, vue pose extrême | Tu crées tes tenues |
| 5. Contenu | Je refais une première série de coupes et de tenues avec les nouveaux outils, et tu juges | |

## 6. Décisions à prendre

1. **Les 10 coupes actuelles** (en ligne) : les retirer tout de suite, ou les laisser jusqu'à la v2 ?
2. **Coupes modulaires** : garder des coupes entières comme cosmétiques, ou permettre au joueur de combiner frange, côtés et arrière débloqués séparément (Picrew, VRoid, MapleStory) ?
3. **Coupes et tenues intégrées** : les refaire toutes en v2, ou garder l'ancien rendu à côté ?
4. **Teintures** : un système de couleurs à débloquer (cohérent avec « tout se gagne par des exploits »), ou couleurs fixes par cosmétique ?

## Sources principales

Cheveux, technique d'artiste :
- tips.clip-studio.com (articles 10811, 4035, 15752, 6399) ;
- lavaritte.com/blogs/anime-hair-tutorial ;
- animeoutline.com (ombrage, vue de 3/4, hime cut) ;
- 3dxdev.com (anneau de lumière, ombres teintées) ;
- proko.com/course-lesson/how-to-draw-hair ;
- clipstudio.net/how-to-draw/archives/161517 ;
- oekaki-zukan.com/articles/2830 ;
- ichi-up.net/2015/006 ;
- jerwoodvisualarts.org (vue de 3/4) ;
- note.com/moimoi_sp (Live2D).

Systèmes et outils :
- note.com/602e3 (paramètres VRoid) ;
- docs.live2d.com (physique, découpage, rotation de tête) ;
- esotericsoftware.com (skins et physique Spine) ;
- support.picrew.me ;
- github.com/neeerp/RustMS (couches et chapeaux MapleStory) ;
- rimworldwiki.com/wiki/Apparel_layers ;
- starbounder.org (teintures) ;
- cotl-api.vercel.app (couleurs par emplacement) ;
- Unreal Groom, Frostbite hair (SIGGRAPH 2019), Houdini Hair Clump ;
- Rivers et al., *2.5D Cartoon Models* (SIGGRAPH 2010) ;
- Yeh et al., *2.5D Cartoon Hair Modeling* (TVCG 2015).

Tenues :
- tips.clip-studio.com (articles 6809, 17349, 2964, 3054, 4496, 1678, 1457) ;
- clipstudio.net/how-to-draw/archives/157926 ;
- animeartacademy.com (plis) ;
- *How to Draw Manga vol. 38 : Ninja & Samurai* ;
- lavaritte.com (métal) ;
- 80.lv et rocketbrush.com (silhouette, langage des formes) ;
- aegongames.com (teintures) ;
- abratabia.com (chaînes Verlet) ;
- cgiacademyhub.com (retards par matière) ;
- dfworkshop.net (couches de vêtements).

Points non vérifiés :
- Les chiffres de nombre de mèches viennent d'un seul blog.
- Les pages d'aide officielles de VRoid étaient inaccessibles : ses paramètres viennent d'un guide tiers.
- Les comptes de plis (« 2-3 ») et les écarts de coupe en pixels sont des estimations cohérentes avec les sources, pas des chiffres sourcés.
