var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var async = require("async");

exports.index = index;
exports.check = check;

function index(req, res, next){

    var enterpriseId = req.session.enterpriseId;

    if(!enterpriseId){
        next({message: "请重新登陆"});
        return;
    }

    var state;
    var checklist = {};

    async.series([_queryState, _checkBaseinfo, _checkShelf], function(err){

        var data = {
            layout: "storeadmin_layout",
            menu: "kaitong",
            storeName: req.session.storeName,
            state: state,
            checklist: checklist,
            enterpriseId: enterpriseId
        };

        res.render("kaitong", data);
    });

    function _queryState(callback){

        dbHelper.queryData("weixin_setting", {enterprise_id: enterpriseId}, function(err, result){

            if(err){
                callback(err);
                return;
            }

            if(result.length === 0){
                callback({message: "未找到店铺"});
                return;
            }

            state = result[0].state;// 0表示未开通，1表示已开通

            callback(null);
        });
    }

    function _checkBaseinfo(callback){

        dbHelper.queryData("tb_enterprise", {id: enterpriseId}, function(err, result){

            if(err){
                callback(err);
                return;
            }

            checklist.baseinfo = result[0].addr_state_city_area ? true : false;
            callback(null);
        });
    }

    function _checkShelf(callback){

        var sql = "select count(1) as count from planx_graph.weixin_shelvesItem" +
            " where enterprise_id = :enterprise_id and status = 'active';";

        dbHelper.execSql(sql, {enterprise_id: enterpriseId}, function (err, result) {

            if (err) {
                callback(err);
                return;
            }

            checklist.shelf = (result[0].count > 0);
            callback(null);
        });
    }
}

function check(req, res, next){

    var enterpriseId = req.session.enterpriseId;

    async.series([_checkBaseinfo, _checkShelf, _do], function(err){

        if(err){
            console.log(err);
            doResponse(req, res, {code: 1, result: err});
            return;
        }

        doResponse(req, res, {code: 0, message: "ok"});
    });

    function _checkBaseinfo(callback){

        dbHelper.queryData("tb_enterprise", {id: enterpriseId}, function(err, results){

            if(err){
                callback(err);
                return;
            }

            if(!results[0].contact_phoneMobile){
                callback({errorCode: 1, errorMessage: "店铺基本信息未设置"});
                return;
            }

            callback(null);
        });
    }

    function _checkShelf(callback){

        dbHelper.queryData("weixin_shelvesItem", {enterprise_id: enterpriseId}, function(err, results){

            if(err){
                callback(err);
                return;
            }

            if(results.length === 0){
                callback({errorCode: 2, errorMessage: "未上架商品"});
                return;
            }

            callback(null);
        });
    }

    function _do(callback){

        dbHelper.update({enterprise_id: enterpriseId}, "weixin_setting", {state: 1}, function(err){

            if(err){
                callback({errorCode: 3, errorMessage: "后台开通失败，请联系客服"});
                return;
            }

            callback(null);
        });
    }
}