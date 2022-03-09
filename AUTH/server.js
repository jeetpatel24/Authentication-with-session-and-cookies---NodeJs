const express = require('express')
require('dotenv').config();
const bcrypt = require('bcryptjs');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session')
const MongoDBSession = require('connect-mongodb-session')(session);
const UserModel = require('./models/User');

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then((res) => {
        console.log("MongoDB Connected")
    })

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const store = new MongoDBSession({
    uri: mongoURI,
    collection: "mySession"
})


//session middleware -> it will fire for every consecutive request to the sever
//this session will receive a object and this object as few options
app.use(
    session({
        secret: 'key that will sign cookie',
        resave: false,                        //for every request to the server we want to createa new session
        saveUninitialized: false,              //if we have not modified the session we dont want to save it
        store: store
    }))

const isAuth = (req, res, next) => {
    if (req.session.isAuth) {
        next();
    }
    else {
        res.redirect('/login');
    }
}

app.get('/', (req, res) => {
    res.render('landing');
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
        res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        res.redirect('/login');
    }

    req.session.isAuth = true;
    res.redirect('/dashboard');
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    let user = await UserModel.findOne({ email });
    if (user) {
        return res.redirect('/register');
    }

    const hashedPwd = await bcrypt.hash(password, 12);

    user = new UserModel({
        username,
        email,
        password: hashedPwd
    })

    await user.save();
    res.redirect('/login');
})

app.get('/dashboard', isAuth, (req, res) => {
    res.render('dashboard');
})

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) { throw err }
        res.redirect('/');
    })
})

app.listen(5000, () => {
    console.log('server is ruuning on http://localhost:5000');
})