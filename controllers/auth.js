const User = require("../models/user"); 
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const crypto = require("crypto"); 
const { validationResult } = require("../middleware/validation"); 
const env = require("dotenv");
env.config(); 

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: process.env.NODEMAILER_API_KEY
  }, 
})); 

exports.getLogin = (req, res, next) => {
  let message = req.flash("error"); 
  if (message.length > 0) {
    message = message[0]; 
  } else {
    message = null; 
  }
    res.render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: message,
      oldInput: { email: "", password: "" },
      validationErrors: []
    }); 
}; 

exports.postLogin = async (req, res, next) => {
  const email = req.body.email; 
  const password = req.body.password;  
  const errors = validationResult(req);

  // helper function to render login with errors
  const renderLoginWithError = (errorMsg, passwordError = false) => {
  const validationErrors = [...errors.array()];
    
    // add password error if needed
    if (passwordError) {
      validationErrors.push({
        type: 'field',
        path: 'password',
        msg: errorMsg
      });
    }

    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errorMsg,
      oldInput: { email: email, password: password },
      validationErrors: validationErrors
    });
  };

  // check route validation errors first
  if (!errors.isEmpty()) {
    return renderLoginWithError(errors.array()[0].msg);
  }

  // async await User.findOne()
    try {
    const user = await User.findOne({ email: email }); 
    if (!user) {
      return renderLoginWithError("Invalid email or password", true);
    }

    const doMatch = await bcrypt.compare(password, user.password);
    if (doMatch) {
      req.session.isLoggedIn = true;
      req.session.user = user;
      return req.session.save(err => {
        if (err) return next(err);
        res.redirect("/");
      });
    }
    return renderLoginWithError("Invalid assword. Please try again.", true);
  } catch (err) {
    next(err); 
  }

  // User.findOne({ email: email })
  //   .then(user => {
  //     if (!user) {
  //     throw new Error("User not found");
  //   }; 

  //     return bcrypt.compare(password, user.password)
  //       .then(doMatch => {
  //         if (doMatch) { 
  //           req.session.isLoggedIn = true;
  //           req.session.user = user; 
  //           return req.session.save(err => {  
  //             console.log(err);
  //             return res.redirect("/");
  //           }); 
  //         }
          
  //         // password doesn't match - render with password error
  //         return renderLoginWithError("Invalid password. Please try again!", true);
  //       });
  //   })
  // .catch(err => next(err));
};


exports.getSignup = (req, res, next) => {
  let message = req.flash("error"); 
  if (message.length > 0) {
    message = message[0]; 
  } else {
    message = null;
  }
    res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Sign Up',
      errorMessage: message,
      oldInput: { email: "", password: "", confirmPassword: "" },
      validationErrors: []  
    }); 
}; 

exports.postSignup = (req, res, next) => {
  const email = req.body.email; 
  const password = req.body.password;
  const errors = validationResult(req); // result from check("email").isEmail()
  const saltRounds = 10; 

  if (!errors.isEmpty()) {
    // console.log(errors.array()); 
    return res.status(422).render(
      'auth/signup', {
      path: '/signup',
      pageTitle: 'Sign Up',
      errorMessage: errors.array()[0].msg,
      oldInput: { email: email, password: password, confirmPassword: req.body.confirmPassword }, 
      // better UX so input is still kept
      validationErrors: errors.array()
    }); 
  }
  // check whether user exists already inside routes
  bcrypt.hash(password, saltRounds)
      .then(hashedPassword => {
      // if no user then create a new one
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] }
      }); 
      return user.save();
    })
    .then(result => {
      res.redirect("/login"); 
      return transporter.sendMail({
        to: email,
        from: "yufenlai0825@gmail.com",
        subject: "Sign Up succeeded!",
        html: "<h1>Welcome! You successfully signed up! </h1>"
      });
    })
  .catch(err => next(err));  
}; 

exports.postLogout = (req, res, next) => {  
      req.session.destroy(() => {
        res.redirect("/"); 
      });  
}; 

exports.getReset= (req, res, next) => {  
  let message = req.flash("error", "Error setting password, please try again."); 
  if (message.length > 0) {
    message = message[0]; 
  } else {
    message = null; 
  }; 
      res.render("auth/reset", {
        path: "/reset",
        pageTitle: "Reset Password",
        errorMessage: message
      });
}; 

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if(err){
      console.log(err);
      return res.redirect("/reset")
    };
    const token = buffer.toString("hex");
    User.findOne({email : req.body.email})
    .then(user => {
      if (!user) {
        req.flash("error", "No account with the email found.");
        return res.redirect("/reset");
      }; 
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000; // 1hr
      return user.save();
    })
    .then(result => {
      res.redirect("/");
      // skip return here to perform async action without waiting for email to be sent
      transporter.sendMail({
        to: req.body.email,
        from: "yufenlai0825@gmail.com",
        subject: "Passwort reset",
        html: `
        <p>You requested to have your password reset.</p>
        <p>Click <a href="http://localhost:3000/reset/${token}">here</a> to set a new password. The link will expire after 1 hour.</p>
        `
      })
    })
  .catch(err => next(err));
  });
}; 

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken : token, resetTokenExpiration: { $gt: Date.now() } }) //expiration in the future
  .then( user => {
    let message = req.flash("error"); 
    if (message.length > 0) {
      message = message[0]; 
    } else {
      message = null; 
    }
    res.render('auth/new-password', {
      path: '/new-password',
      pageTitle: 'New Password',
      errorMessage: message,
      userID: user._id.toString(), // pass via ejs
      passwordToken: token // add token to prevent ppl adding random token and edit from backend
    }); 
  }
  ).catch(err => next(err));
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userID = req.body.userID;
  const passwordToken = req.body.passwordToken; 
  let resetUser;

  User.findOne({ resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() }, _id: userID })
  .then(user => {
    resetUser = user; // store in resetUser
    return bcrypt.hash( newPassword, 10 ); 
  })
  .then(hashedPassword => {
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined; 
    return resetUser.save(); 
  })
  .then(result => res.redirect("/login"))
  .catch(err => next(err));
}; 

