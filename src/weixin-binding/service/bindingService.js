exports.bind = bind;
exports.bindMember = bindMember;

function bind(req, res, next){

    var enterprise_id = req.params["enterpriseId"];
    var open_id = req.query["open_id"];

    if(!open_id){
        next({errorMessage:"访问参数错误"});
        return;
    }

    res.render("member_binding", {enterprise_id: enterprise_id, open_id: open_id});
}

function bindMember(req, res, next){

    var enterprise_id = req.params["enterpriseId"];
    var open_id = req.body.open_id;
    var member_phone = req.body.phone;

    console.log(enterprise_id);
    console.log(open_id);
    console.log(member_phone);

    res.send("ok");
}