var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var uuid = require('node-uuid');

exports.bind = bind;
exports.bindMember = bindMember;
exports.unbindMember = unbindMember;

function bind(req, res, next){

    var enterprise_id = req.params["enterpriseId"];
    var open_id = req.query["open_id"];

    if(!open_id){
        next({errorMessage:"访问参数错误"});
        return;
    }

    res.render("member_binding", {layout: false, enterprise_id: enterprise_id, open_id: open_id});
}

// 500: 数据库访问错误
// 501: 用户不存在
function bindMember(req, res, next){

    var enterprise_id = req.params["enterpriseId"];
    var open_id = req.body.open_id;
    var member_phone = req.body.phone;

    dbHelper.queryData("tb_member", {enterprise_id: enterprise_id, phoneMobile: member_phone}, function(err, result){

        if(err){
            console.log(err);
            next({errorCode: 500, errorMessage:"数据库访问错误"});
            return;
        }

        if(result.length === 0){
            next({errorCode: 501, errorMessage:"用户不存在"});
            return;
        }

        var member = result[0];

        var model = {
            id: uuid.v1(),
            enterprise_id: enterprise_id,
            member_id: member.id,
            wx_open_id: open_id,
            phone: member_phone
        }

        dbHelper.addData("weixin_member_binding", model, function(err, result){

            if(err){
                console.log(err);
                next({errorCode: 500, errorMessage:"数据库访问错误"});
                return;
            }

            res.send({code: 0, message: "ok", member_id: member.id});
        });
    });
}

// 400：请求参数错误
// 500：数据库访问错误
// 501：绑定不存在
// 502：解除绑定失败
function unbindMember(req, res, next){

    var enterprise_id = req.params["enterpriseId"];
    var open_id = req.body.open_id;

    if(!open_id){
        next({errorCode: 400, errorMessage:"请求参数错误"});
        return;
    }

    var condition = {};
    condition.enterprise_id = enterprise_id;
    condition.wx_open_id = open_id;

    dbHelper.queryData("weixin_member_binding", condition, function(err, result){

        if(err){
            console.log(err);
            next({errorCode: 500, errorMessage:"数据库访问错误"});
            return;
        }

        if(result.length === 0){
            next({errorCode: 501, errorMessage:"绑定关系不存在"});
            return;
        }

        dbHelper.deleteDataByCondition("weixin_member_binding", condition, function(err){
            if(err){
                next({errorCode: 502, errorMessage:"解除绑定失败"});
                return;
            }
            res.send({code: 0, message: "ok"});
        });
    });
}