const authBySession = (req, res, next) => {
    if (!req.session.uid && !req.session.username) {
        return res
            .status(401)
            .render('user/login.njk', { title: 'Access denied' });
    }
    return next();
};

module.exports = { authBySession };
