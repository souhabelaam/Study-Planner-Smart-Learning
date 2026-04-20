# 🔍 Guide Complet - Vérifier les Utilisateurs dans MongoDB

## ⚠️ PROBLÈME : Les utilisateurs ne s'affichent pas dans MongoDB

### ✅ ÉTAPES DE VÉRIFICATION

#### 1. Vérifier que MongoDB est DÉMARRÉ

```powershell
# Ouvrir PowerShell en administrateur
# Vérifier le statut MongoDB
Get-Service MongoDB

# Démarrer MongoDB si nécessaire
net start MongoDB
```

**OU** dans le Gestionnaire de services Windows :
1. Appuyer sur `Windows + R`
2. Taper `services.msc`
3. Chercher "MongoDB"
4. Vérifier qu'il est "En cours d'exécution"
5. Si non, clic droit → Démarrer

#### 2. Se connecter à MongoDB Shell

```bash
# Ouvrir un terminal/PowerShell
mongosh

# Vous devriez voir quelque chose comme :
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000
```

#### 3. Vérifier la BASE DE DONNÉES CORRECTE

```javascript
// Voir toutes les bases de données
show dbs

// Utiliser la BONNE base de données
use studyplanner

// Vérifier que vous êtes dans la bonne base
db.getName()
// Devrait afficher: studyplanner
```

#### 4. Vérifier les COLLECTIONS

```javascript
// Voir toutes les collections
show collections

// Vous devriez voir au minimum:
// - users
// - roles
// - subjects (si vous avez créé des matières)
// - study_sessions (si vous avez créé des sessions)
```

#### 5. Voir TOUS les utilisateurs

```javascript
// Voir tous les utilisateurs en format lisible
db.users.find().pretty()

// Compter les utilisateurs
db.users.countDocuments()

// Voir les utilisateurs un par un
db.users.find().forEach(user => {
    print("ID: " + user._id);
    print("Username: " + user.username);
    print("Email: " + user.email);
    print("Roles: " + user.roles);
    print("---");
})
```

#### 6. Chercher un utilisateur spécifique

```javascript
// Chercher par username
db.users.findOne({username: "votre_username"})

// Chercher par email
db.users.findOne({email: "votre_email@example.com"})

// Chercher tous les usernames
db.users.find({}, {username: 1, email: 1, _id: 0})
```

### 🔧 PROBLÈMES COURANTS

#### Problème 1 : Vous regardez dans la MAUVAISE base de données

**Mauvaise** : `use test` ou `use admin`
**Bonne** : `use studyplanner`

**Solution** :
```javascript
use studyplanner
db.users.find().pretty()
```

#### Problème 2 : MongoDB n'est pas démarré

**Symptômes** :
- Erreur de connexion dans les logs de l'application
- `mongosh` ne se connecte pas

**Solution** : Démarrer MongoDB (voir étape 1)

#### Problème 3 : Vous regardez la mauvaise collection

**Mauvaise** : `db.user.find()` (sans 's')
**Bonne** : `db.users.find()` (avec 's')

#### Problème 4 : Les utilisateurs sont dans une AUTRE base MongoDB

**Vérifier** :
```javascript
// Voir toutes les bases de données
show dbs

// Vérifier chaque base
use test
db.users.find().pretty()

use admin
db.users.find().pretty()
```

### 📊 STRUCTURE D'UN UTILISATEUR

Un utilisateur devrait ressembler à ceci :

```json
{
  "_id": ObjectId("675abc123def456789012345"),
  "username": "monusername",
  "email": "email@example.com",
  "password": "$2a$10$...",
  "roles": [
    {
      "$ref": "roles",
      "$id": ObjectId("675abc123def456789012346")
    }
  ]
}
```

### 🧪 TESTER LA CRÉATION D'UTILISATEUR

#### Étape 1 : Créer un compte via l'interface web

1. Aller sur `http://localhost:8080/register`
2. Remplir le formulaire :
   - Username : `testuser`
   - Email : `test@example.com`
   - Password : `password123`
3. Cliquer sur "Créer mon compte"

#### Étape 2 : Vérifier les LOGS de l'application

Vous devriez voir dans la console :
```
========== [DEBUG] DÉBUT ENREGISTREMENT UTILISATEUR ==========
[DEBUG] Username: testuser
[DEBUG] Email: test@example.com
[DEBUG] ✓ Vérifications de doublons passées
[DEBUG] Rôle assigné: USER (1 rôle(s))
[DEBUG] Objet User créé (avant sauvegarde)
[DEBUG] >>> Début de la sauvegarde en MongoDB...
[DEBUG] ✓✓✓ Utilisateur SAUVEGARDÉ avec succès! ✓✓✓
[DEBUG] ID MongoDB: 675abc123def456789012345
[DEBUG] Username: testuser
[DEBUG] Email: test@example.com
[DEBUG] ✓✓✓ VÉRIFICATION RÉUSSIE: Utilisateur trouvé en base de données MongoDB! ✓✓✓
[DEBUG] ✓✓✓ Vérification par username RÉUSSIE: Utilisateur trouvé! ✓✓✓
[DEBUG] Nombre total d'utilisateurs en base: 1
========== [DEBUG] FIN ENREGISTREMENT UTILISATEUR ==========
```

#### Étape 3 : Vérifier IMMÉDIATEMENT dans MongoDB

```javascript
// Dans mongosh
use studyplanner
db.users.find().pretty()
```

Vous devriez voir votre utilisateur !

### 🚨 SI VOUS NE VOYEZ TOUJOURS RIEN

#### Vérification complète :

```javascript
// 1. Vérifier que MongoDB est connecté
db.runCommand({connectionStatus: 1})

// 2. Lister TOUTES les bases de données
show dbs

// 3. Vérifier dans CHAQUE base
use studyplanner
show collections
db.users.find().pretty()

use test
show collections
db.users.find().pretty()

// 4. Voir les statistiques de la collection
use studyplanner
db.users.stats()

// 5. Compter dans toutes les bases
db.adminCommand("listDatabases").databases.forEach(db => {
    print("Base: " + db.name);
    use(db.name);
    if (db.getCollectionNames().includes("users")) {
        print("  Users: " + db.users.countDocuments());
    }
})
```

### 💡 COMMANDES MONGODB UTILES

```javascript
// Voir toutes les bases
show dbs

// Changer de base
use studyplanner

// Voir toutes les collections
show collections

// Voir tous les utilisateurs
db.users.find().pretty()

// Compter
db.users.countDocuments()

// Supprimer tous les utilisateurs (ATTENTION!)
// db.users.deleteMany({})

// Voir la structure d'un document
db.users.findOne()

// Chercher par username
db.users.find({username: "testuser"})

// Voir les index
db.users.getIndexes()

// Créer un index si nécessaire
db.users.createIndex({username: 1}, {unique: true})
db.users.createIndex({email: 1}, {unique: true})
```

### 🔍 VÉRIFICATION DANS L'APPLICATION

Les logs de debug montrent clairement :
- Si l'utilisateur est sauvegardé
- L'ID MongoDB généré
- Si la vérification réussit
- Le nombre total d'utilisateurs en base

**Si les logs montrent "SAUVEGARDÉ avec succès" mais vous ne voyez rien dans MongoDB :**

1. Vérifiez que vous êtes dans la BONNE base (`use studyplanner`)
2. Vérifiez que vous regardez la BONNE collection (`db.users.find()`)
3. Vérifiez que MongoDB est bien démarré
4. Vérifiez les logs de l'application pour voir s'il y a des erreurs

### ✅ RÉSUMÉ

**Les utilisateurs SONT sauvegardés en MongoDB si :**
- ✓ Les logs montrent "SAUVEGARDÉ avec succès"
- ✓ Les logs montrent "VÉRIFICATION RÉUSSIE"
- ✓ MongoDB est démarré
- ✓ Vous êtes dans la base `studyplanner`
- ✓ Vous utilisez la collection `users` (avec 's')

**Si vous ne les voyez pas, vous regardez probablement au mauvais endroit !**

