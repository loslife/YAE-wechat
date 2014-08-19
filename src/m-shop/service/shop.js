var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var _ = require("underscore");

exports.jumpToWShop = jumpToWShop;

function jumpToWShop(req, res, next){

    var enterprise_id = req.params["enterpriseId"];

    if(!enterprise_id){

        next({errorCode: 400, errorMessage:"请求参数错误", enterprise_id: enterprise_id});
        return;
    }

    dbHelper.queryData("tb_member", {"enterprise_id": enterprise_id}, function(err, result){

        if(err){
            console.log(err);
            next({errorCode: 500, errorMessage:"数据库访问错误", enterprise_id: enterprise_id});
            return;
        }

        var members = [];

        _.each(result, function(item){
            members.push({name: item.name});
        });

        res.render("shop", {members: members, enterprise_id: enterprise_id});
    });
}