var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");

exports.login = login;
exports.doLogin = doLogin;

function login(req, res, next){

    var enterprise_id = req.params["enterpriseId"];

    res.render("login", {enterprise_id: enterprise_id});
}

function doLogin(req, res, next){

    var enterprise_id = req.params["enterpriseId"];

    var phone = req.body.phone;

    res.send({code: 0, message: "ok"});
}