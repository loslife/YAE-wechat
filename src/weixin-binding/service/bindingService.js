exports.bind = bind;

function bind(req, res, next){

    var enterprise_id = req.params["enterpriseId"];

    res.render("member_binding", {enterprise_id: enterprise_id});
}