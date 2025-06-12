module.exports = (req, res, next) => {
    if (! req.session.isLoggedIn){
        return res.redirect("/login");
    };
    next(); 
}; 

// then add in routes