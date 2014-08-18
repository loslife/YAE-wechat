exports.login = login;

function login(req, res, next){

    var enterprise_id = req.params["enterpriseId"];

    res.render("login", {layout: false, enterprise_id: enterprise_id});
}