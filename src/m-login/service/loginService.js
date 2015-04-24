var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var chainDbHelper = require(FRAMEWORKPATH + "/utils/ChainDbHelper");

exports.login = login;
exports.doLogin = doLogin;

function login(req, res, next) {

    var enterprise_id = req.params["enterpriseId"];
    var app_id = req.params["appId"];
    if(req.query["store_type"]){
        var single_chain = req.query["store_type"];
        req.session.single_chain = single_chain;
    }

    res.render("inputPhone", {menu: "member", type: "login", open_id: "", enterprise_id: enterprise_id, app_id: app_id, store_type: single_chain});
}

function doLogin(req, res, next) {

    var enterprise_id = req.params["enterpriseId"];
    var phone = req.body.phone;

    dbHelper.queryData("tb_member", {"enterprise_id": enterprise_id, "phoneMobile": phone}, function (err, result) {

        if (err) {
            console.log(err);
            next({errorCode: 500, errorMessage: "数据库访问错误"});
            return;
        }
        if (result.length === 0) {
            chainDbHelper.queryData("tb_member", {"master_id": enterprise_id, "phoneMobile": phone}, function (error, results) {
                if (error) {
                    console.log(error);
                    next({errorCode: 500, errorMessage: "数据库访问错误"});
                    return;
                }
                if (results.length === 0){
                    next({errorCode: 501, errorMessage: "用户手机号错误"});
                    return;
                }
                if(!req.session[enterprise_id]){
                    req.session[enterprise_id] = {};
                }
                req.session[enterprise_id].member_id = results[0].id;
                req.session.single_chain = "chain";

                res.send({code: 0, message: "ok"});
            });

        }else{
            if(!req.session[enterprise_id]){
                req.session[enterprise_id] = {};
            }
            req.session[enterprise_id].member_id = result[0].id;
            req.session.single_chain = "single";

            res.send({code: 0, message: "ok"});
        }
    });
}