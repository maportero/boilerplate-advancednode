const bcrypt = require('bcrypt'); 
const passport = require('passport');

module.exports = (app, myDataBase ) => {

  app.route('/').get((req, res) => {
    
    res.render(
      'pug', 
      { title: 'Connected to Database',
       message: 'Please login',
       showLogin: true,
       showRegistration: true,
       showSocialAuth: true
      });
    
  });
  
  app.route('/auth/github').get(passport.authenticate('github'));

  app.route('/auth/github/callback')
     .get(passport.authenticate('github', { failureRedirect: '/' }),(req, res) => {
        console.log('redirect profile after authenticate github');
        req.session.user_id = req.user._id;
        res.redirect('/chat');
  });

  app.route('/chat').get(ensureAuthenticated, (req, res)=> {
      res.render('pug/chat'); 
  });
  
  app.route('/login')
     .post(passport.authenticate(
       'local', 
       { failureRedirect: '/' }), (req, res) => {
          console.log('redirect profile');
          res.redirect('/profile');
  });
  
  app.route('/profile')
     .get(ensureAuthenticated, (req, res) => {
        console.log('render profile');
        res.render(process.cwd() + '/views/pug/profile', { username: req.user.username });
  });
  
  app.route('/logout').get((req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.route('/register').post(
    (req, res, next) => {
      console.log('register');
      myDataBase.findOne({ username: req.body.username }, function (err, user) {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect('/');
        } else {
          const hash = bcrypt.hashSync(req.body.password, 12);
          myDataBase.insertOne({ username: req.body.username, password: hash }, (err, doc) => {
            if (err) {
              res.redirect('/');
            } else {
              next(null, doc.ops[0]);
            }
          });
        }
      });
    },
      
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      console.log('redirect from register');
      res.redirect('/profile');
    }
  );
  
  app.use((req, res, next) => {
    res.status(404).type('text').send('Not Found');
  });
    
}

function ensureAuthenticated(req, res, next) {
  console.log('ensure authenticated', req.isAuthenticated() );
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}


