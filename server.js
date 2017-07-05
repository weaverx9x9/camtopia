var express = require("express"),
    exphbs = require('express-handlebars'),
    app = express(),
    router = express.Router(),
    path = __dirname + '/views/',
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    passport = require('passport'),
    localStrategy = require('passport-local'),
    GoogleStrategy = require('passport-google');

var config = require('./config.js');
var funct = require('./functions.js');

var app = express();

//================= PASSPORT ==================//

// Passport session setup.
passport.serializeUser(function(user, done) {
  console.log("serializing " + user.username);
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  console.log("deserializing " + obj);
  done(null, obj);
});

passport.use('local-signin', new localStrategy(
    { passReqToCallback : true },
    function(req, username, password, done) {
        funct.localAuth(username, password)
        .then(function(user) {
            if(user) {
                console.log("LOGGED IN AS: " + user.username);
                req.session.success = 'You are successfully logged in ' + user.username + '!';
                done(null, user);
            }
            if(!user) {
                console.log("COULD NOT LOG IN");
                req.session.error = 'Could not log user in.  Please try again.'; 
                done(null, user);
            }
        })
        .fail(function(err) {
            console.log(err.body);
        });
    }
));

passport.use('local-signup', new localStrategy(
    { passReqToCallback : true },
    function(req, username, password, done) {
        funct.localReg(username, password)
        .then(function(user) {
            if(user) {
                console.log("REGISTERED: " + user.username);
                req.session.success = 'You are successfully registered and logged in ' + user.username + '!';
                done(null, user);
            } else {
                req.session.error = 'Username ' + username + 'is taken!';
                done(null, user);
            }
        })
        .fail(function(err) {
            console.log(err.body);
        });
    }
));

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  req.session.error = 'Please sign in!';
  res.redirect('/signin');
}

//================= EXPESSS ===================//

app.use(logger('combined'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(session({ secret: 'supernova', saveUnitialized: false, resave: true }));
app.use(passport.initialize());
app.use(passport.session());

// Session-persisted message middleware
app.use(function(req, res, next){
  var err = req.session.error,
      msg = req.session.notice,
      success = req.session.success;

  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;

  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;

  next();
});

// Configure express to use handlebars templates
var hbs = exphbs.create({
    defaultLayout: 'main',
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

//================== ROUTES =================//

app.get('/', function(req, res) {
    res.render('home', { user: req.user });
});

app.get('/signin', function(req, res) {
    res.render('signin');
});

// send the reqest through our local signup strategy
app.post('/local-reg', passport.authenticate('local-signup', {
        successRedirect: '/',
        failureRedirect: '/signin'
    })
);

app.post('/login', passport.authenticate('local-signin', {
        successRedirect: '/',
        failureRedirect: '/signin'
    })
);

app.get('/logout', function(req, res) {
    var name = req.user.username;
    console.log("LOGGING OUT " + req.user.username);
    req.logout();
    res.redirect('/');
    req.session.notice = "You have successfully been logged out " + name + "!";
});

//================== PORT ==================//

var port = process.env.PORT || 5000;
app.listen(port);
console.log("listening on " + port + "!");

/*
router.use(function (req,res,next) {
    console.log("/" + req.method);
    next();
});

router.get("/",function(req,res){
    res.sendFile(path + "index.html");
});

router.get("/about",function(req,res){
    res.sendFile(path + "about.html");
});

router.get("/contact",function(req,res){
    res.sendFile(path + "contact.html");
});

app.use("/",router);

app.use("*",function(req,res){
    res.sendFile(path + "404.html");
});

app.listen(3000,function(){
    console.log("Live at Port 3000");
});
*/