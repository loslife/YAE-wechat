var api = require("wechat-toolkit");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var _ = require("underscore");
var request = require("request");

var app_id = "wxb5243e6a07f2e09a";
var app_secret = "06808347d62dd6a1fc33243556c50a5d";
var PARAM_SPLITTER = "___";
var baseurl = global["_g_clusterConfig"].baseurl;

exports.route = route;
exports.selectShop = selectShop;
exports.foundNoMember = foundNoMember;

// 500: 数据库访问错误
// 501: 获取open_id错误
function route(req, res, next){

    var code = req.query["code"];

    // 非微信OAuth跳转
    if(!code){
        res.send("请通过微信打开此页面");
        return;
    }

    api.exchangeAccessToken(app_id, app_secret, code, function(err, result){

        if(err){
            console.log(err);
            next({errorCode: 501, errorMessage: "获取open_id失败"});
            return;
        }

        var condition = {};
        condition.wx_open_id = result.openid;

        dbHelper.queryData("weixin_member_binding", condition, function(err, result){

            if(err){
                console.log(err);
                next({errorCode: 500, errorMessage:"数据库访问错误"});
                return;
            }

            // 根据此open_id无法判断所属店铺，要求用户输入手机号
            if(result.length === 0){
                res.render("inputPhone", {layout: false, type: "multi_binding", open_id: condition.wx_open_id, enterprise_id: ""});
                return;
            }

            // 找到唯一店铺，进入微店铺首页
            if(result.length === 1){
                var enterprise_id = result[0].enterprise_id;
                var member_id = result[0].member_id;
                res.redirect("../" + enterprise_id + "/shop?m_id=" + member_id);
                return;
            }

            // 多个店铺的情况
            var enterprises = [];
            var members = [];

            _.each(result, function(item){
                enterprises.push(item.enterprise_id);
                members.push(item.member_id);
            });

            var params = "eid=" + enterprises.join(PARAM_SPLITTER) + "&mid=" + members.join(PARAM_SPLITTER);
            res.redirect("../selection?" + params);
        });
    });
}

// 500: 查询企业名称失败
function selectShop(req, res, next){

    var member_ids = req.query["mid"];
    var enterprise_ids = req.query["eid"];

    var members = member_ids.split(PARAM_SPLITTER);
    var enterprises = enterprise_ids.split(PARAM_SPLITTER);

    var url = baseurl + "/enterprise/names?ids=" + enterprise_ids;

    var options = {
        method: "GET",
        uri: url,
        json: true
    };

    request(options, function(err, response, body) {

        if(err){
            next({errorCode: 500, errorMessage: "查询企业名称失败"});
            return;
        }

        var code = body.code;
        if(code !== 0){
            next({errorCode: 500, errorMessage: "查询企业名称失败"});
            return;
        }

        var params = [];

        var results = body.result;

        for(var i = 0; i < members.length; i++){

            var name = "";
            var phone = "";
            var addr = "";

            for(var j = 0; j < results.length; j++){

                if(results[j].id === enterprises[i]){
                    name = results[j].name;
                    phone = results[j].phone;
                    addr = results[i].address;
                    break;
                }
            }

            params.push({enterprise_id: enterprises[i], member_id: members[i], enterprise_name: name, phone: phone, addr: addr});
        }

        res.render("selection", {layout: false, params: params});
    });
}

function foundNoMember(req, res, next){

    res.render("memberNotFound", {layout: false});
}