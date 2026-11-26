# Pages de démonstration
- [x] Compter uniquement les lots avec descriptif et photo réellement affichable, et exclure les cases vides des catalogues.
- [x] Vérifier ce critère par 11 tests et dans les listes et catalogues sur ordinateur et téléphone : vente vide inactive, vente partielle à 1 lot, catalogue complet à 30 lots, ouverture d’une fiche et aucune erreur d’exécution.
- [x] Conserver toutes les spécialités du menu, mais rendre seulement Art moderne et Vins et spiritueux cliquables, sur ordinateur et téléphone.
- [x] Supprimer la fenêtre d’avertissement des spécialités et vérifier les accès.
- [x] Griser et désactiver les ventes sans lots, sans pastille ni fenêtre d’avertissement.
- [x] Conserver les ventes renseignées cliquables et vérifier les listes sur ordinateur et téléphone.

## Contrôle transversal
Règle : un lot renseigné possède une photo affichable et un descriptif ; un numéro ou une case ne suffit pas.
- [x] Listes ventes à venir, ventes passées (les deux pages), accueil et La Maison : accès via le comptage partagé ; totaux affichés corrigés.
- [x] Calendrier, survols, détails et frise : comptage et classement en préparation fondés sur les lots renseignés.
- [x] Catalogue de vente, titres, bouton catalogue, lots précédent/suivant, galerie d’accueil et After Sale : même filtre photo et descriptif.
- [x] Cartes de spécialités et retours vers une vente (en-têtes et accordéon) : accès partagé.
- [x] Imports JSON, externes et synchronisation Interenchères : le nombre annoncé reste une donnée source, jamais une preuve de catalogue rempli ; aucune donnée modifiée.
- [x] Export CSV d’archive et historiques personnels d’achats : conservés sans filtrage destructif ni modification des lots, paiements, paramètres ou autorisations.
- [x] Migrations : aucun calcul de disponibilité publique des ventes ; aucune fonction de base à modifier.