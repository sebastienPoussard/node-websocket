// dependances
const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');
const session = require('express-session');
// creation du serveur express
const app = express();

// connexion à la BDD
const db_name = path.join(__dirname, "data", "apptest.db");
const db = new sqlite3.Database(db_name, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connexion réussie à la base de données 'apptest.db'");
});

// initilisation du serveur
app.listen(3000, () => {
    console.log("Serveur démarré (http://localhost:3000/) !");
});

// configuration du serveur
// vues
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
// emplacement des fichiers statics pour bootstrap
app.use(express.static(path.join(__dirname, "public")));
// parametrage du middleware
app.use(express.urlencoded({ extended: false }));
// cookies et session
app.use(cookieParser());
app.use(session({secret: "thesecret"}));
// body parser for POST
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies




// vues

// racine
app.get("/", (req, res) => {
    if(!req.session.pseudo){
        res.render("login");
    } else {
    var model = {
        pseudo : req.session.pseudo
    };
    res.render("index", {model: model});
    }
});


// identification
app.post("/logindone", (req, res) => {

    // creer la session à partir
    req.session.pseudo = req.body.pseudo;
    var pseudo = req.body.pseudo;
    // créer l'utilisateur s'il n'existe pas déjà
    const sql = "SELECT personneID FROM Personne where pseudo='"+pseudo+"'";
    db.all(sql, [], (err, pseudo) => {
        if (err) {
            return console.error(err.message);
        }
        if(pseudo.length == 0) {
            const sql2 = "INSERT INTO Personne (pseudo) VALUES ('"+req.body.pseudo+"')";
            db.run(sql2, [], err => {
                if (err) {
                    return console.error(err.message);
                }
            });
        }
    });
    res.render("logindone", {model : pseudo});
});



// preferences
app.get("/preferences", (req, res) => {

    // variable à passer en parametre à la vue
    const variables = {
        livres: null,
        pseudo: null,
        id : null
    }

    if(!req.session.pseudo){
        res.render("login");
    } else {
        // requête pour avoir les livres
        const sql = "SELECT * FROM Livres ORDER BY Titre";
        db.all(sql, [], (err, livres) => {
            if (err) {
                return console.error(err.message);
            }
            variables.livres = livres;
            // requete pour avoir l'id de l'utilisateur
            const sql2 = "SELECT personneID FROM Personne where pseudo='"+req.session.pseudo+"'";
            db.all(sql2, [], (err, pseudo) => {
            if (err) {
                return console.error(err.message);
            }
            variables.id = pseudo[0]["personneID"];
            variables.pseudo = req.session.pseudo;
            res.render("prefs", { model: variables });
            });
        });
    }
});


app.post("/preferences", (req, res) => {
    // choper les parametres
    date = req.body.date;
    estMatin = req.body.matin;
    livreid = req.body.livre;
    userid = req.body.idUser;
    // verifier que le creneau existe pas déjà, sinon le créer
    const sql = "SELECT idcreneau FROM Crenaux WHERE Date='"+date+"' AND EstLeMatin='"+estMatin+"' AND livre='"+livreid+"'"
    db.all(sql, [], (err, idcreneau) => {
        if (err) {
            return console.error(err.message);
        }
        if(idcreneau.length == 0) {
            const sql2 = "INSERT INTO Crenaux ('Date', 'EstLeMatin', 'livre') VALUES ('"+date+"', '"+estMatin+"', '"+livreid+"')";
            console.log("insertion dans la BDD "+sql2);
            db.all(sql2, [], (err, none) => {
                if (err) {
                    return console.error(err.message);
                }
            });
        }
        // re récuperer l'id du créneau puisqu'on est pas sur de l'avoir s'il vient d'être créer
        const sql3 = "SELECT idcreneau FROM Crenaux WHERE Date='"+date+"' AND EstLeMatin='"+estMatin+"' AND livre='"+livreid+"'"
        db.all(sql3, [], (err, idcreneau) => {
            if (err) {
                return console.error(err.message);
            }
            // ajouter l'inscription
            creneauID = idcreneau[0]["idcreneau"];
            const sql4 = "INSERT INTO Participe ('PersonneID', 'CreneauID') VALUES ('"+userid+"', '"+creneauID+"')";
            console.log("insertion de participation "+ sql4);
            db.all(sql4, [], (err, insc) => {
                if (err) {
                    return console.error(err.message);
                }
            res.render("creneauxDone");
            });
        });
    });
});

//créneaux
app.get("/creneaux", (req, res) => {


    const sqlcre = "select Date, EstLeMatin as Matin,count(*) as Participants, titre from Crenaux, Livres, Participe where Crenaux.livre = Livres.Livre_ID and Crenaux.idcreneau = Participe.CreneauID group by Crenaux.idcreneau ";
    db.all(sqlcre, [], (err, creneaux) => {
        if (err) {
            return console.error(err.message);
        }
        if(!req.session.pseudo){
            res.render("login");
        } else {
            var model = {
                pseudo : req.session.pseudo,
                creneaux : creneaux
        };
        res.render("creneaux", {model : model});
        }
    });
});


// livres
app.get("/livres", (req, res) => {

    // variable à passer en parametre à la vue
    const variables = {
        livres: null,
        pseudo: null,
        id : null
    }

    if(!req.session.pseudo){
        res.render("login");
    } else {
        // requête pour avoir les livres
        const sql = "SELECT * FROM Livres ORDER BY Titre";
        db.all(sql, [], (err, livres) => {
            if (err) {
                return console.error(err.message);
            }
            variables.livres = livres;
            // requete pour avoir l'id de l'utilisateur
            const sql2 = "SELECT personneID FROM Personne where pseudo='"+req.session.pseudo+"'";
            db.all(sql2, [], (err, pseudo) => {
            if (err) {
                return console.error(err.message);
            }
            variables.id = pseudo[0]["personneID"];
            variables.pseudo = req.session.pseudo;
            res.render("livres", { model: variables });
            });
        });
    }
});

// GET  edit
app.get("/edit/:id", (req, res) => {

    // variable à passer en parametre à la vue
    const variables = {
        livres: null,
        pseudo: null,
        id : null,
    }

    if(!req.session.pseudo){
        res.render("login");
    } else {
        // requête pour avoir les livres
        const sql = "SELECT * FROM Livres WHERE Livre_ID = ?";
        db.all(sql, req.params.id, (err, livres) => {
            if (err) {
                return console.error(err.message);
            }
            variables.livres = livres;
            // requete pour avoir l'id de l'utilisateur
            const sql2 = "SELECT personneID FROM Personne where pseudo='"+req.session.pseudo+"'";
            db.all(sql2, [], (err, pseudo) => {
                if (err) {
                    return console.error(err.message);
                }
                variables.id = pseudo[0]["personneID"];
                variables.pseudo = req.session.pseudo;
                console.log(variables.livres);
                res.render("edit", { model: variables });
            });
        });
    }
});

// POST edit
app.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  const book = [req.body.Titre, req.body.Auteur, req.body.Commentaires, id];
  const sql = "UPDATE Livres SET Titre = ?, Auteur = ?, Commentaires = ? WHERE (Livre_ID = ?)";
  db.run(sql, book, err => {
    // if (err) ...
    res.redirect("/livres");
  });
});
// GET create
app.get("/create", (req, res) => {
  res.render("create", { model: {} });
});
// POST create
app.post("/create", (req, res) => {
  const sql = "INSERT INTO Livres (Titre, Auteur, Commentaires) VALUES (?, ?, ?)";
  const book = [req.body.Titre, req.body.Auteur, req.body.Commentaires];
  db.run(sql, book, err => {
    // if (err) ...
    res.redirect("/livres");
  });
});
// GET /delete
app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM Livres WHERE Livre_ID = ?";
  db.get(sql, id, (err, row) => {
    // if (err) ...
    res.render("delete", { model: row });
  });
});
// POST delete
app.post("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM Livres WHERE Livre_ID = ?";
  db.run(sql, id, err => {
    // if (err) ...
    res.redirect("/livres");
  });
});


var ws = require("nodejs-websocket");

var server = ws.createServer(function(conn) {

    console.log("Nouvelle connexion");

    // Réception d'un message texte
    conn.on("text", function(msg) {

    });

    // Fermeture de connexion
    conn.on("close", function(code, reason) {
        console.log("Connexion fermée");
    });

    // En cas d'erreur
    conn.on("error", function(err) {
      console.log(err);
    });

}).listen(2222); // On écoute sur le port 2222
