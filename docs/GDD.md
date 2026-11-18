# TRI-REALM --- Game Design Document

**Version : 1.0**\
**Type : Document de référence Game Design**\
**Destination : Claude Code --- projet de jeu existant**

------------------------------------------------------------------------

## 0. Objectif et périmètre du document

Ce document définit la direction de game design de **TRI-REALM**, un
idle RPG inspiré de plusieurs univers manga : Naruto, One Piece, Bleach,
Dragon Ball, Jujutsu Kaisen et Hunter × Hunter.

**Le jeu existe déjà.** Ce document n'est pas une demande de créer un
nouveau projet, de remplacer l'architecture technique existante ou de
réécrire le jeu.

### Instructions pour l'implémentation

-   Commencer par analyser le projet existant : systèmes déjà présents,
    données, progression, interface, sauvegardes et conventions du code.
-   Comparer l'existant aux intentions de game design de ce document.
-   Réutiliser et adapter les systèmes existants dès que possible.
-   Ne pas supprimer ou remplacer une fonctionnalité existante sans
    vérifier ses dépendances et sans nécessité clairement établie.
-   Ne pas inventer de nouvelles mécaniques majeures pour combler les
    détails qui ne sont pas spécifiés ici.
-   Lorsqu'une règle est indiquée comme « à définir », proposer une
    solution cohérente et la signaler avant de la considérer comme
    définitivement validée.
-   Préserver la compatibilité des sauvegardes autant que possible.
    Toute migration nécessaire doit être explicite et sûre.
-   Les noms, valeurs numériques et exemples de ce document sont des
    références de design, pas nécessairement des valeurs finales
    d'équilibrage.

**Priorité : le game design et la cohérence des systèmes.** Les choix de
technologie, de structure de fichiers, de framework et d'architecture
logicielle doivent être décidés à partir du projet existant, pas imposés
par ce document.

------------------------------------------------------------------------

# 1. Vision du jeu

TRI-REALM est un idle RPG de progression à long terme dans lequel le
joueur traverse plusieurs mondes inspirés de mangas connus.

Chaque monde apporte une identité, des activités et des mécaniques
nouvelles. Toutefois, le joueur conserve un seul personnage et une seule
progression globale.

Le jeu doit donner le sentiment de développer progressivement un
personnage à travers un multivers, et non de recommencer un jeu
différent à chaque monde.

### Piliers de design

1.  **Progression continue :** les mondes successifs enrichissent les
    systèmes déjà débloqués.
2.  **Interconnexion :** les ressources et récompenses doivent avoir
    plusieurs utilisations pertinentes.
3.  **Choix du joueur :** les techniques équipées, les armes, les
    compagnons et les bonus permettent de construire différents profils.
4.  **Collection :** techniques, équipements, créatures, cartes,
    ressources rares et découvertes donnent des objectifs à long terme.
5.  **Idle satisfaisant :** les activités continuent de produire des
    résultats selon les règles de progression hors ligne du jeu.
6.  **Identité des univers :** chaque monde doit être reconnaissable par
    ses activités, ses récompenses et ses mécaniques thématiques.

### Boucle de jeu principale

1.  Choisir une activité : combattre, récolter, produire, s'entraîner ou
    explorer.
2.  Obtenir de l'expérience, des ressources et des récompenses.
3.  Utiliser ces récompenses pour améliorer le personnage, les
    techniques, les armes ou les activités.
4.  Débloquer de nouvelles zones, recettes, techniques, équipements et
    systèmes.
5.  Vaincre les gardiens et progresser vers le monde suivant.
6.  Revenir aux activités précédentes avec de nouveaux objectifs et de
    nouvelles possibilités.

------------------------------------------------------------------------

# 2. Architecture de progression --- principes de design

Le jeu repose sur quatre piliers interconnectés.

## 2.1 Personnage

Le personnage représente la progression globale du joueur.

Il possède : - un niveau global ; - des statistiques ; - des niveaux de
maîtrise des activités ; - des disciplines énergétiques débloquées au
fil des mondes ; - des transformations et spécialisations ; - des
emplacements d'équipement, de techniques et de compagnons.

Le niveau du personnage et les niveaux des activités sont deux
progressions distinctes. Un joueur peut donc avoir un personnage avancé
tout en ayant certaines activités peu développées.

### Statistiques principales proposées

  Statistique   Fonction
  ------------- -------------------------------------------------
  Attack        Augmente les dégâts infligés
  Defense       Réduit les dégâts reçus
  Vitality      Augmente les points de vie
  Speed         Influence la vitesse d'attaque
  Luck          Influence certaines probabilités de récompenses

Ces statistiques sont communes à tous les mondes. Les techniques, armes,
transformations, compagnons, cartes et consommables peuvent les
modifier.

Les formules exactes, les plafonds et les rendements décroissants
restent à équilibrer dans le contexte du jeu existant.

## 2.2 Techniques

Les techniques sont des capacités collectionnables. Les techniques
débloquées restent dans la collection du joueur, mais seules celles
équipées dans les emplacements disponibles sont actives.

**Décision validée : système de slots.**

Les techniques ne sont pas des compétences consommées à chaque
utilisation. Elles font partie du build du personnage.

Catégories fonctionnelles : - **Offensive :** inflige des dégâts. -
**Défensive :** réduit, bloque ou évite des dégâts. - **Support :**
améliore le personnage ou ses activités. - **Passive :** applique un
bonus tant que la technique est équipée.

Une technique peut également posséder plusieurs tags : projectile, zone,
multi-hit, critique, feu, foudre, saignement, invocation, drain de vie,
etc.

Les tags servent à créer des synergies entre techniques, armes,
disciplines énergétiques et effets. Ils ne doivent pas devenir des
systèmes indépendants.

### Emplacements de techniques --- proposition initiale

  Slot        Déblocage proposé
  ----------- ---------------------------
  Attaque 1   Départ
  Attaque 2   Progression initiale
  Attaque 3   Progression intermédiaire
  Défense     Progression initiale
  Support     Soul City
  Passive     Kaio Planet
  Ultimate    Shinjuku

Ce tableau est une proposition de progression, à adapter aux systèmes et
à l'équilibrage existants.

### Obtention des techniques

Sources possibles : - parchemins obtenus en combat ; - boss ; -
expéditions ; - objectifs et quêtes ; - récompenses de collection ; -
récompenses spécifiques à certains mondes.

Le système de parchemins du premier monde peut utiliser une découverte
aléatoire de techniques. Il faut cependant éviter que la progression
dépende exclusivement de la chance.

**Protection contre la frustration :** - les doublons doivent avoir une
utilité ; - les doublons peuvent être convertis en fragments de la
technique ; - les fragments permettent d'améliorer la technique ; -
certaines techniques ou familles de techniques doivent pouvoir être
ciblées par des objectifs ou récompenses déterministes.

### Amélioration des techniques

Chaque technique possède un niveau propre. L'amélioration augmente
progressivement son efficacité et peut débloquer des effets
supplémentaires à certains paliers.

Exemple de structure : - niveau 1 : effet de base ; - niveaux
intermédiaires : amélioration numérique ; - palier avancé : effet
secondaire ou amélioration fonctionnelle ; - niveau maximum : version
optimisée de la technique.

Les coûts, niveaux maximum et multiplicateurs sont à équilibrer. Éviter
que l'amélioration se limite à une inflation de dégâts : certains
paliers doivent modifier le comportement ou l'utilité de la technique.

## 2.3 Équipement et armes

**Décision validée : chaque arme possède sa propre progression
indépendante.**

Le joueur peut collectionner plusieurs armes et choisir librement celle
qu'il équipe. Une arme ne doit pas être automatiquement remplacée ou
détruite lorsqu'une meilleure arme est obtenue.

Chaque arme peut posséder : - une rareté ; - des statistiques de base
; - un niveau et une expérience propres ; - un niveau de raffinage ; -
un état d'éveil ; - éventuellement un passif ou un effet spécifique.

### Trois couches de progression

**A. Expérience de l'arme**

L'arme équipée gagne de l'expérience en combat. Ses niveaux améliorent
ses statistiques et peuvent satisfaire les prérequis d'éveil.

**B. Raffinage**

Le raffinage utilise principalement les lingots et gemmes issus de
Mining et Smelting. Il augmente les statistiques de l'arme par paliers.

**C. Éveil**

L'éveil représente une évolution qualitative de l'arme : capacité
spéciale, effet passif, propriété élémentaire, nouvelle interaction ou
changement visuel.

Le raffinage améliore principalement les statistiques ; l'éveil donne
une identité et des capacités particulières.

### Principes d'équilibrage

-   L'expérience d'une arme ne doit pas être transférée automatiquement
    à une autre.
-   Les armes anciennes peuvent rester intéressantes grâce à leur
    progression, leur spécialité ou leur effet unique.
-   Les nouvelles armes peuvent avoir un potentiel supérieur sans rendre
    toutes les anciennes obsolètes.
-   Les coûts de raffinage et d'éveil doivent donner une utilité durable
    aux ressources de Soul City.
-   La progression des armures peut être plus simple au lancement ; ne
    pas imposer immédiatement la même profondeur que pour les armes.

## 2.4 Compagnons

**Décision validée : les compagnons apportent des bonus passifs. Ils ne
combattent pas automatiquement.**

Les compagnons sont des créatures collectionnables, débloquées
principalement par la chasse de familles de monstres.

Chaque compagnon peut posséder : - une rareté ; - un niveau ; - un bonus
passif ; - une capacité ou spécialité ; - un coût d'amélioration.

Familles de bonus : - **Combat :** dégâts, défense, points de vie,
critique. - **Gathering :** rendement de récolte. - **Exploration :**
rendement ou chances de récompenses rares. - **Production :** bonus de
fabrication ou de cuisine. - **Spécial :** effet unique.

### Équipement des compagnons

Le joueur dispose d'un nombre limité d'emplacements. Trois slots
constituent une cible possible à terme, mais leur déblocage et leur
nombre initial restent à équilibrer.

Le choix des compagnons doit créer un arbitrage : privilégier le combat,
la récolte, l'exploration ou un mélange de bonus.

Les compagnons ne doivent pas devenir une deuxième équipe de combat à
gérer. Leur rôle est de personnaliser passivement la progression.

------------------------------------------------------------------------

# 3. Combat

Le combat est le moteur principal de progression et de découverte.

Le modèle souhaité est un combat automatique dans lequel le joueur
prépare son build avant de lancer ou poursuivre une activité.

### Configuration du personnage

Les résultats du combat dépendent notamment : - des statistiques du
personnage ; - de l'arme équipée ; - des techniques équipées ; - des
passifs ; - des transformations ; - des compagnons ; - des bonus
temporaires de nourriture ; - des effets et spécialisations débloqués
dans les mondes.

### Fonctionnement souhaité

-   Une attaque de base est disponible.
-   Les techniques offensives sont utilisées selon leur ordre de
    priorité et/ou leurs temps de recharge.
-   Les techniques défensives peuvent se déclencher selon leurs
    conditions.
-   Les passifs restent actifs tant que les techniques correspondantes
    sont équipées.
-   Les effets persistants et les altérations sont gérés par un système
    commun.

Le détail de l'algorithme de combat doit être adapté au moteur existant.
Ne pas réécrire le combat si le jeu dispose déjà d'un système
fonctionnel.

### Ennemis et boss

Chaque monde doit proposer : - ennemis communs ; - ennemis rares ou
élites ; - mini-boss ; - boss de progression.

Les ennemis doivent avoir des tables de récompenses identifiables. Les
boss doivent proposer des drops spécifiques et des raisons de les
combattre à nouveau.

Les récompenses peuvent inclure : - expérience ; - ressources ; -
parchemins ou fragments de techniques ; - équipements ; - matériaux
d'amélioration ; - objets de collection ; - récompenses propres au
monde.

------------------------------------------------------------------------

# 4. Activités et économie des ressources

Les activités sont les sources de ressources et d'expérience qui
alimentent les autres systèmes.

Trois grandes familles : - **Gathering :** récolter directement des
ressources. - **Production :** transformer des ressources en objets ou
consommables. - **Progression :** améliorer le personnage, les armes,
les techniques ou les collections.

## 4.1 Activités prévues

  -----------------------------------------------------------------------
  Activité                Production principale   Utilisations
  ----------------------- ----------------------- -----------------------
  Woodcutting             Bois                    Crafting

  Crafting                Armes et objets         Équipement, progression

  Fishing                 Poissons                Cooking

  Cooking                 Nourriture              Combat, expéditions

  Expeditions             Ressources, objets      Plusieurs systèmes
                          rares, découvertes      

  Gem Mining              Minerais et gemmes      Smelting, raffinage

  Smelting                Lingots                 Refinement

  Farming                 Cultures alimentaires   Cooking

  Gravity Training        Progression             Transformations
                          d'entraînement          

  Cursed Research         Fragments et            Techniques, Domain
                          connaissances occultes  

  Hunting                 Matériaux de créatures  Compagnons, Cooking
  -----------------------------------------------------------------------

Toutes les activités ne doivent pas nécessairement être des skills au
sens technique du jeu. Certaines peuvent être des systèmes, des
activités ou des interfaces s'appuyant sur les mêmes règles de
progression.

## 4.2 Ressources

Trois familles fonctionnelles sont recommandées :

  -----------------------------------------------------------------------
  Type                    Rôle                    Exemples
  ----------------------- ----------------------- -----------------------
  Communes                Production et coûts     Bois, poissons,
                          réguliers               minerais

  Rares                   Améliorations et        Gemmes, ingrédients
                          recettes avancées       spéciaux

  Uniques                 Déblocages et           Matériaux de boss,
                          évolutions majeures     fragments spéciaux
  -----------------------------------------------------------------------

Chaque ressource doit avoir une utilité identifiable. Éviter les
matériaux qui ne servent qu'à une recette isolée, sauf s'il s'agit
volontairement d'un objet de collection ou d'une récompense
exceptionnelle.

Les ressources des anciens mondes doivent conserver une utilité dans les
mondes suivants lorsque cela est cohérent.

## 4.3 Cuisine et consommables

Cooking transforme des ingrédients en plats consommables.

Les plats apportent des bonus temporaires, par exemple : - dégâts ; -
défense ; - expérience ; - rendement de récolte ; - récompenses
d'expédition ; - chances de certaines récompenses.

La cuisine commence avec les poissons d'Orange Town. Farming ajoute
ensuite des ingrédients végétaux et débloque de nouvelles recettes.
Hunting enrichit plus tard le catalogue avec des ingrédients de
créatures.

Les consommables doivent créer des décisions intéressantes sans devenir
obligatoires pour chaque activité.

## 4.4 Expéditions

Les expéditions sont des activités passives qui durent au minimum 10
minutes.

Le joueur choisit une destination et une durée. L'expédition rapporte
des ressources et peut offrir des objets rares ou des découvertes.

Familles de récompenses : 1. **Ressources :** matériaux utiles aux
activités et améliorations. 2. **Objets rares :** coffres, équipements,
objets de collection, coffres de fruits du démon. 3. **Découvertes :**
nouvelles destinations, recettes, types d'expédition ou contenu.

Les plats de Cooking peuvent améliorer les résultats d'une expédition.
Les bonus doivent rester compréhensibles et ne pas rendre la nourriture
obligatoire.

Les durées, destinations, limites de simultanéité et règles hors ligne
sont à définir à partir du fonctionnement actuel du jeu.

------------------------------------------------------------------------

# 5. Progression par monde

Chaque monde possède une identité thématique, introduit de nouvelles
activités et enrichit plusieurs systèmes déjà connus.

La progression est permanente : débloquer un nouveau monde ne
réinitialise pas le personnage ni les mondes précédents.

## Monde 1 --- Leaf Village (Naruto)

**Rôle : fondations du jeu.**

### Activités et systèmes

-   Woodcutting
-   Crafting
-   Combat
-   Collection de techniques

### Boucle initiale

1.  Récolter du bois.
2.  Fabriquer une première arme, notamment une épée en bois.
3.  Combattre les ennemis.
4.  Obtenir des ressources et des parchemins de technique.
5.  Utiliser les parchemins pour découvrir de nouvelles attaques.
6.  Équiper les techniques utiles et améliorer son personnage.
7.  Vaincre le gardien pour progresser.

### Identité du monde

Le premier monde doit apprendre au joueur les boucles fondamentales :
récolte, fabrication, combat, loot, équipement et build.

### Discipline énergétique

Introduction du Chakra comme première discipline de maîtrise
énergétique. Il doit s'intégrer à la progression commune des techniques
et du personnage, sans créer une jauge indépendante obligatoire.

## Monde 2 --- Orange Town (One Piece)

**Rôle : exploration, cuisine et récompenses passives.**

### Activités et systèmes

-   Fishing
-   Cooking
-   Expeditions

### Fishing

Le joueur pêche différentes espèces selon les zones. Les poissons
servent principalement d'ingrédients pour Cooking et peuvent inclure des
variantes rares.

### Cooking

Au départ, seules les ressources issues de Fishing sont utilisées. Les
plats apportent des bonus temporaires utiles au combat et aux
expéditions.

### Expeditions

Le joueur envoie son personnage explorer des destinations pendant une
durée d'au moins 10 minutes.

Récompenses possibles : - ressources ; - objets rares ; - coffres de
fruits du démon ; - équipements ; - objets de collection ; - nouvelles
destinations ou découvertes.

### Synergies

-   Fishing alimente Cooking.
-   Cooking améliore les expéditions.
-   Expeditions fournit des ressources utiles aux autres activités et
    des récompenses rares.
-   Les récompenses peuvent aussi enrichir la collection et
    l'équipement.

### Discipline énergétique

Introduction du Haki comme discipline supplémentaire de la maîtrise
énergétique commune.

## Monde 3 --- Soul City (Bleach)

**Rôle : progression approfondie de l'équipement.**

### Activités et systèmes

-   Gem Mining
-   Smelting
-   Equipment Refinement
-   Weapon Awakening

### Gem Mining

Extraction de minerais et gemmes de différentes raretés.

### Smelting

Transformation des minerais en lingots utilisables.

### Equipment Refinement

Utilisation des lingots et gemmes pour améliorer les statistiques des
armes.

### Weapon Awakening

Évolution qualitative d'une arme permettant de débloquer des capacités
ou propriétés spécifiques.

### Chaîne de progression

**Gem Mining → Smelting → Refinement → Weapon Awakening**

### Synergies

-   Mining et Smelting alimentent directement l'amélioration des armes.
-   Les armes améliorées rendent les combats et boss plus accessibles.
-   Les boss peuvent fournir des matériaux d'éveil spécifiques.
-   Les armes conservent leur progression individuelle.

### Discipline énergétique

Introduction du Reiatsu dans le système commun de maîtrise énergétique.

## Monde 4 --- Kaio Planet (Dragon Ball)

**Rôle : développement de puissance, accélération et enrichissement de
la cuisine.**

### Activités et systèmes

-   Gravity Training
-   Transformations
-   Farming
-   Time Chamber
-   Dragon Balls

### Gravity Training

Activité d'entraînement qui développe le potentiel du personnage. Elle
doit utiliser une progression identifiable et contribuer à débloquer ou
renforcer les transformations.

### Transformations

Les transformations représentent des paliers importants de puissance.
Elles peuvent offrir : - multiplicateurs de dégâts ; - bonus défensifs
; - bonus de statistiques ; - effets spécifiques ; - identité visuelle.

Leur déblocage peut dépendre de prérequis d'entraînement, de maîtrise et
de matériaux.

### Farming

Culture d'ingrédients alimentaires. Les cultures enrichissent Cooking et
permettent de débloquer de nouvelles recettes.

### Time Chamber

Système permettant d'accélérer certaines activités ou productions.

Activités candidates : - Woodcutting ; - Fishing ; - Mining ; -
production ; - expéditions ; - autres activités compatibles avec le
système de temps existant.

Le système doit être limité par une réserve ou une capacité de stockage.
Il ne doit pas rendre les durées normales et les activités précédentes
obsolètes.

### Dragon Balls

Collection transversale : les Dragon Balls peuvent être obtenues
aléatoirement dans plusieurs activités et mondes.

Lorsque les sept sont réunies, le joueur peut invoquer Shenron et
choisir une récompense parmi plusieurs possibilités : - ressources rares
; - matériaux d'amélioration ; - bonus temporaires ; - cosmétiques ; -
récompenses uniques.

Le système doit encourager la pratique de différentes activités, pas
uniquement le farm d'une source unique.

### Discipline énergétique

Introduction du Ki dans le système commun de maîtrise énergétique.

## Monde 5 --- Shinjuku (Jujutsu Kaisen)

**Rôle : maîtrise avancée et personnalisation des techniques.**

### Activités et systèmes

-   Cursed Research
-   Binding Vows
-   Domain Expansion

### Cursed Research

Étude des malédictions et collecte de ressources ou fragments occultes.

Utilisations : - améliorer des techniques existantes ; - débloquer des
variantes ; - obtenir des matériaux avancés ; - progresser vers les
mécaniques de Domain.

Ce système doit enrichir la collection de techniques existante. Il ne
doit pas créer une deuxième collection d'attaques indépendante.

### Binding Vows

Le joueur accepte une restriction en échange d'un bonus.

Exemples : - réduire le nombre de techniques équipées contre un bonus de
dégâts ; - renoncer à une option défensive contre une spécialisation
offensive ; - accepter une contrainte d'activité contre un bonus de
rendement.

Les restrictions et leurs récompenses doivent être explicites, lisibles
et réversibles ou clairement présentées comme permanentes avant
validation.

### Domain Expansion

Évolution avancée des techniques et du build.

Un Domain peut : - modifier certains effets de techniques ; - renforcer
une famille d'attaques ; - appliquer des effets spéciaux au combat ; -
apporter une capacité ultime ou une spécialisation avancée.

Il s'agit d'une couche avancée du système de techniques, pas d'un
système de combat parallèle.

### Discipline énergétique

Introduction de l'énergie occulte dans la maîtrise énergétique commune.

## Monde 6 --- Green Island (Hunter × Hunter)

**Rôle : spécialisation, chasse, compagnons et collection.**

### Activités et systèmes

-   Nen Mastery
-   Hunting
-   Pets
-   Greed Island Cards

### Nen Mastery

Le Nen est une spécialisation avancée de la maîtrise énergétique et des
techniques.

Les six catégories peuvent orienter les effets et la personnalisation
: - Renforcement ; - Émission ; - Manipulation ; - Matérialisation ; -
Transformation ; - Spécialisation.

Elles ne doivent pas créer six barres d'énergie ni six arbres de
progression entièrement indépendants. Leur rôle est de personnaliser les
techniques et les builds.

### Hunting

Chasse de familles de créatures pour obtenir : - ressources spécifiques
; - ingrédients rares pour Cooking ; - matériaux d'amélioration ; -
conditions de déblocage de compagnons.

Chaque famille doit avoir une identité, des récompenses et une raison
d'être chassée.

### Pets

Les compagnons sont débloqués grâce à la chasse et apportent des bonus
passifs. Ils peuvent être améliorés avec les matériaux obtenus via
Hunting.

Ils soutiennent le combat, la récolte, l'exploration ou la production
sans combattre directement.

### Greed Island Cards

Cartes collectionnables donnant des bonus.

Familles possibles : - combat ; - récolte ; - production ; - exploration
; - effets spéciaux.

Sources : - ennemis ; - boss ; - expéditions ; - activités de récolte
; - récompenses spécifiques.

Des ensembles de cartes peuvent donner un bonus supplémentaire
lorsqu'ils sont complétés.

### Discipline énergétique

Introduction du Nen dans le système commun de maîtrise énergétique.

------------------------------------------------------------------------

# 6. Systèmes transversaux

Ces systèmes peuvent être débloqués progressivement, mais leurs règles
restent communes à l'ensemble du jeu.

## 6.1 Collection Log

Répertorie les découvertes : - objets ; - ressources ; - ennemis ; -
boss ; - techniques ; - armes ; - compagnons ; - cartes ; - recettes ; -
expéditions.

Il peut fournir des objectifs et des récompenses de complétion.

## 6.2 Market

Système d'achat et de vente des ressources et objets, selon les règles
économiques déjà présentes dans le jeu.

Il doit éviter de supprimer l'intérêt des activités de récolte ou de
rendre les récompenses rares triviales à obtenir.

## 6.3 Shiny / Perfect

Variantes rares de certains objets, équipements ou découvertes.

Elles doivent apporter une dimension de collection et, si elles ont un
impact fonctionnel, des bonus raisonnables qui ne rendent pas les
versions normales inutiles.

## 6.4 Objectives et Achievements

-   objectifs quotidiens ;
-   objectifs hebdomadaires ;
-   objectifs permanents ;
-   accomplissements de collection ;
-   défis de progression par monde.

Les récompenses doivent encourager la variété des activités et les
retours sur les anciens mondes.

## 6.5 Renown / Ascension

Système de progression avancée à définir après les six mondes.

Il peut permettre de recommencer une partie de la progression en échange
d'une ressource ou de bonus permanents. Les éléments conservés,
réinitialisés et les bénéfices doivent être définis précisément avant
implémentation.

------------------------------------------------------------------------

# 7. Synergies à préserver

Les synergies sont une exigence centrale du design.

  -----------------------------------------------------------------------
  Chaîne                              Synergie
  ----------------------------------- -----------------------------------
  Woodcutting → Crafting              Le bois devient des armes et objets

  Fishing → Cooking                   Les poissons deviennent des plats

  Cooking → Expeditions               Les plats améliorent les résultats
                                      d'exploration

  Mining → Smelting                   Les minerais deviennent des lingots

  Smelting → Refinement               Les lingots améliorent les armes

  Refinement → Awakening              La progression d'arme prépare
                                      l'éveil

  Farming → Cooking                   Les cultures débloquent de
                                      nouvelles recettes

  Training → Transformations          L'entraînement développe le
                                      potentiel du personnage

  Cursed Research → Techniques /      La recherche améliore le système de
  Domain                              techniques

  Hunting → Pets                      La chasse permet de débloquer et
                                      améliorer les compagnons

  Hunting → Cooking                   Les créatures fournissent des
                                      ingrédients rares

  Expeditions → Collections           L'exploration donne accès à des
                                      objets et découvertes

  Toutes les activités → Dragon Balls La collection globale donne une
                                      raison de revisiter les activités

  Techniques / armes / pets / cartes  Les systèmes de progression
  → Combat                            enrichissent le build
  -----------------------------------------------------------------------

### Règles de cohérence

1.  Un nouveau système doit, lorsque c'est pertinent, alimenter au moins
    deux autres systèmes.
2.  Chaque nouveau monde doit réutiliser plusieurs systèmes déjà connus.
3.  Les anciens skills doivent conserver une utilité après le déblocage
    de nouveaux mondes.
4.  Une nouvelle ressource doit avoir une utilisation claire.
5.  Les nouveaux systèmes doivent enrichir les systèmes existants plutôt
    que les dupliquer.
6.  Ne pas ajouter un nouveau skill simplement pour représenter chaque
    univers.
7.  Les mécaniques thématiques doivent rester reconnaissables sans
    fragmenter la progression globale.

------------------------------------------------------------------------

# 8. Économie, récompenses et équilibrage

Les valeurs définitives ne sont pas fixées dans ce document.
L'équilibrage doit être construit à partir des données et de la
progression actuelles du jeu.

### Principes d'équilibrage

-   Les récompenses doivent être proportionnelles au temps, au risque et
    aux prérequis.
-   Les activités doivent rester utiles sans devenir toutes obligatoires
    simultanément.
-   Les objets rares doivent être désirables, mais les systèmes
    aléatoires doivent intégrer des protections contre la frustration.
-   Les améliorations doivent proposer des paliers lisibles.
-   Les bonus multiplicatifs doivent être surveillés pour éviter une
    inflation incontrôlée.
-   Les consommables doivent offrir un avantage significatif sans
    devenir une taxe obligatoire.
-   Les mondes doivent apporter de nouveaux objectifs sans rendre
    instantanément obsolètes les précédents.

### À ne pas figer prématurément

Ne pas inventer des valeurs définitives pour : - XP nécessaire par
niveau ; - dégâts et statistiques ; - taux de drop ; - raretés et
probabilités ; - coûts de raffinage ; - durée et capacité des
expéditions ; - recharge de Time Chamber ; - nombre final de slots ; -
coûts et bonus d'Ascension.

Ces valeurs doivent être établies après audit de l'équilibrage existant
et tests dans le jeu.

------------------------------------------------------------------------

# 9. Priorités de conception et d'implémentation

Le but n'est pas d'implémenter immédiatement les six mondes. Il faut
d'abord vérifier que les systèmes fondamentaux peuvent supporter la
progression prévue.

## Priorité 1 --- Consolider l'existant

-   Auditer les systèmes déjà implémentés.
-   Identifier les fonctionnalités équivalentes à celles décrites ici.
-   Repérer les doublons ou contradictions.
-   Préserver les données et sauvegardes.
-   Établir une correspondance entre les systèmes existants et ce
    document.

## Priorité 2 --- Valider la boucle fondamentale

La boucle du premier monde doit fonctionner de bout en bout : - récolter
; - fabriquer ; - combattre ; - obtenir des récompenses ; - débloquer et
équiper des techniques ; - améliorer le personnage ; - vaincre un boss
; - ouvrir le monde suivant.

## Priorité 3 --- Valider les systèmes transversaux

Avant d'ajouter beaucoup de contenu, vérifier que le jeu supporte
correctement : - inventaire et ressources ; - collection de techniques
et slots ; - progression individuelle des armes ; - effets et bonus
communs ; - récompenses et tables de loot ; - progression hors ligne ; -
sauvegarde et chargement.

## Priorité 4 --- Ajouter les mondes dans l'ordre

1.  Leaf Village
2.  Orange Town
3.  Soul City
4.  Kaio Planet
5.  Shinjuku
6.  Green Island

Chaque monde doit être jouable et cohérent avant d'étendre massivement
son contenu.

## Priorité 5 --- Équilibrage et contenu avancé

-   équilibrage inter-mondes ;
-   objectifs et collections ;
-   récompenses rares ;
-   contenu répétable ;
-   Ascension ;
-   extensions futures.

------------------------------------------------------------------------

# 10. Questions ouvertes à ne pas considérer comme des décisions déjà validées

Les éléments suivants demandent encore des choix de design ou des tests
:

-   nombre exact de slots de techniques à chaque palier ;
-   nombre de slots de compagnons ;
-   nombre maximum de niveaux des techniques et des armes ;
-   transfert éventuel d'une partie de la progression d'une arme ;
-   détail des statistiques et formules de combat ;
-   durée et nombre d'expéditions simultanées ;
-   fonctionnement précis de la réserve de Time Chamber ;
-   effets exacts des six disciplines énergétiques ;
-   conditions et coût d'accès aux Domain Expansions ;
-   fonctionnement détaillé des cartes et des bonus de sets ;
-   règles de conservation et de réinitialisation d'Ascension ;
-   modèle économique exact du Market.

Ne pas transformer silencieusement ces propositions en exigences
définitives. Les signaler et proposer des options cohérentes avec le jeu
existant.

------------------------------------------------------------------------

# 11. Résultat attendu

À terme, TRI-REALM doit proposer :

-   un personnage persistant à travers six univers ;
-   des activités idle et de production connectées ;
-   une collection de techniques avec des slots de build ;
-   des armes possédant une progression individuelle ;
-   des compagnons collectionnables à bonus passifs ;
-   un combat automatique enrichi par les choix du joueur ;
-   une économie de ressources qui traverse les mondes ;
-   des mécaniques thématiques qui approfondissent les systèmes communs
    ;
-   des objectifs de collection et de progression à long terme.

**La règle de design la plus importante : chaque nouveau monde doit
donner de nouvelles raisons d'utiliser ce que le joueur a déjà
débloqué.**

TRI-REALM doit rester un seul jeu, avec une progression cohérente, même
lorsque son contenu s'étend à de nouveaux univers.
