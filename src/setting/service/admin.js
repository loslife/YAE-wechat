var _ = require("underscore");

module.exports = {
    login: login,
    logout: logout
}

var layout = {
    layout:"storeadmin_layout"
};

function login(req, res, next) {
    var model = _.extend({},{layout:false})
    res.render('store_login',model);
}

function logout(req, res, next) {
    var model = _.extend({},layout)
    res.render('store_login',model);
}