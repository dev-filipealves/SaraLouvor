const dotenv = require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();
var path = require("path");
const cors = require("cors");
const { format } = require("path");
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);


app.use(
  cors({
    origin: "*", 
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/SaraLouvor", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: String,
  fullName: String,
  password: String,
  userProfile: String,
});

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const escalaSchema = new mongoose.Schema({
  culto: String,
  data: String,
  mes: String,
  escalados: {
    ministro: String,
    back: String,
    violao: String,
    teclado: String,
    baixo: String,
    bateria: String,
    mesaDeSom: String

  },
});

const Escala = new mongoose.model("Escala", escalaSchema);

function allowCors(res) {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
}


//DEFAULT HOME PAGE
app.get("/", (req, res) => {
  allowCors(res)
  User.find({}, (err, foundUsers) => {
    if (!err) {
      const toSend = {
        allUsers: foundUsers,
        loggedUser: req.user ? req.user.username : null,
      };
      res.send(toSend);
    } else {
      res.send(false);
    }
  });
});

app.get("/admin", (req, res) => {
  allowCors(res)
  if (req.isAuthenticated()) {
    User.find({}, (err, foundUsers) => {
      if (!err) {
        const toSend = {
          allUsers: foundUsers,
          loggedUser: req.user ? req.user.username : null,
        };
        res.send(toSend);
      } else {
        res.send(false);
      }
    });
  } else {
    res.send(false);
  }
});

app.get("/login", (req, res) => {
  allowCors(res)
  if (req.isAuthenticated()) {
  } else {
    res.send(false);
  }
});

app.get("/register", (req, res) => {
  //
});

//let now = new Date();
//var options = { weekday: 'long', year: 'numeric', month: 'long'};
//console.log(now.toLocaleDateString('pt-BR', options));

app.get("/escalas", (req, res)=> {
  allowCors(res)
  let loggedUser = null;
  if (req.isAuthenticated()) {
    loggedUser = req.user;
  }
  Escala.find({mes: req.query.mes}, (err, found)=> {
    if (!err && found) {
        res.send({
          escala: found,
          loggedUser: loggedUser
        })
    }
  })
})

app.post("/escalas", (req, res)=> {
  allowCors(res)
  if (req.isAuthenticated()) {
    let optionsMonth = { month: "long" };
    let datereceived = new Date(req.query.data);
    var teste = new Escala({
      culto: req.query.culto,
      data: datereceived,
      mes: datereceived.toLocaleDateString("pt-BR", optionsMonth),
      escalados: {
        ministro: req.query.ministro,
        back: req.query.back,
        violao: req.query.violao,
        teclado: req.query.teclado,
        baixo: req.query.baixo,
        bateria: req.query.bateria,
        mesaDeSom: "Ninguem"
      }})
    teste.save((err, doc)=> {
      if (!err) {
        res.send("sucess");
      }
    });
    
    
  }
})

app.get("/logout", (req, res) => {
  allowCors(res)
  if (req.isAuthenticated()) {
    req.logout();
    res.send(false);
  }
});

app.post("/login", (req, res, next) => {
  allowCors(res)
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      throw err;
      res.send(false);
    }
    if (!user) {
      res.send({ error: "Usuário ou senha incorretos. Teste novamente" });
    } else {
      req.logIn(user, (err) => {
        if (err) throw err;
        res.send({ loggedUser: user });
        console.log("Succesfully Authenticated! " + user.username);
      });
    }
  })(req, res, next);
});

app.listen(process.env.PORT || 4000, () => {
  console.log("Server started");
});
