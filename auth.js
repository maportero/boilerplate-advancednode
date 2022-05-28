const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt'); 
const passport = require('passport');
const ObjectID = require('mongodb').ObjectID;
const GitHubStrategy = require('passport-github').Strategy;

module.exports = (app, myDataBase) => {

  passport.serializeUser((user, done) => {
    console.log('serialeze User');
    done(null, user._id);
  });
  
  passport.deserializeUser((id, done) => {
    console.log('deserialize User');
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      if (err) return console.error(err);
      done(null, doc);
    });
  });
  
  passport.use(new LocalStrategy(
    function (username, password, done) {
      myDataBase.findOne({ username: username }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (!bcrypt.compareSync(password , user.password)) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://boilerplate-advancednode.marcoportero.repl.co/auth/github/callback"
  },
    function(accessToken, refreshToken, profile, cb) {
      console.log('Github profile ',profile);
      /*
      myDataBase.findOne({ username: profile.username }, function (err, user) {
        return cb(err, user);
      
      */
      myDataBase.findOneAndUpdate(
        { id: profile.id },
        {
          $setOnInsert: {
            id: profile.id,
            name: profile.displayName || 'John Doe',
            photo: profile.photos[0].value || '',
            email: Array.isArray(profile.emails) ? profile.emails[0].value : 'No public email',
            created_on: new Date(),
            provider: profile.provider || ''
          },
          $set: {
            last_login: new Date()
          },
          $inc: {
            login_count: 1
          }
        },
        { upsert: true, new: true },
        (err, doc) => {
          return cb(null, doc.value);
        }
      ); 
    }
  ));
}