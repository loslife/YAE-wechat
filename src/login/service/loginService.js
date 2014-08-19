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

    dbHelper.queryData("tb_member", {"enterprise_id": enterprise_id, "phoneMobile": phone}, function(err, result){

        if(err){
            console.log(err);
            next({errorCode: 500, errorMessage:"数据库访问错误"});
            return;
        }

        if(result.length === 0){
            next({errorCode: 501, errorMessage:"用户手机号错误"});
            return;
        }

        req.session.member_id = result[0].id;
        res.send({code: 0, message: "ok"});
    });
}