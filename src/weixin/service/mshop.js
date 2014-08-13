var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var _ = require("underscore");

exports.jumpToWShop = jumpToWShop;

function jumpToWShop(req, res, next){

    var enterprise_id = req.query["enterprise_id"];

    if(!enterprise_id){
        res.render("shop_error", {layout: "error_layout", errorCode: 400, errorMessage:"请求参数错误"});
        return;
    }

    dbHelper.queryData("tb_member", {"enterprise_id": enterprise_id}, function(err, result){

        if(err){
            console.log(err);
            res.render("shop_error", {layout: "error_layout", errorCode: 500, errorMessage:"数据库访问错误"});
            return;
        }

        var members = [];

        _.each(result, function(item){
            members.push({name: item.name});
        });

        res.render("shop_success", {members: members});
    });
}