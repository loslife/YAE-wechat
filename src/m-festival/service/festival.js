var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var uuid = require('node-uuid');

exports.list = list;
exports.share = share;

function list(req, res, next){

    var enterpriseId = req.params["enterpriseId"];

    dbHelper.queryData("weixin_festivals", {enterprise_id: enterpriseId, state: 1}, function(err, result){

        if(err){
            console.log(err);
            next(err);
            return;
        }

        res.render("festivals", {enterprise_id: enterpriseId, menu: "festival", festivals: result});
    });
}

function share(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var festivalId = req.query["fid"];
    var memberId = req.session.member_id;

    pageCount();

    if(memberId){

        var condition = {enterprise_id: enterpriseId, member_id: memberId, festival_id: festivalId};

        dbHelper.queryData("weixin_present_received", condition, function(err, result){

            if(err){
                console.log(err);
                next(err);
                return;
            }

            // 已经领取过活动礼物，返回
            if(result.length !== 0){
                res.render("got", {enterprise_id: enterpriseId, menu: "festival"});
                return;
            }

            providePresent(enterpriseId, festivalId, memberId, function(err){

                if(err){
                    next(err);
                    return;
                }

                res.render("got", {enterprise_id: enterpriseId, menu: "festival"});
            });
        });

    }else{

        dbHelper.queryData("weixin_festivals", {enterprise_id: enterpriseId, id: festivalId}, function(err, result){

            if(err){
                console.log(err);
                next(err);
                return;
            }

            if(result.length === 0){
                next({message: "活动不存在"});
                return;
            }

            res.render("input", {enterprise_id: enterpriseId, menu: "festival", festival: result[0]});
        });
    }

    function pageCount(){

    }
}

function providePresent(enterpriseId, festivalId, memberId, callback){

    dbHelper.queryData("weixin_festivals", {enterprise_id: enterpriseId, id: festivalId}, function(err, result){

        if(err){
            console.log(err);
            callback(err);
            return;
        }

        if(result.length === 0){
            callback({errorMessage: "活动不存在"});
            return;
        }

        var festival = result[0];

        var data = {
            id: uuid.v1(),
            enterprise_id: enterpriseId,
            member_id: memberId,
            festival_id: festivalId,
            receive_date: new Date().getTime(),
            client_has_sync: 0,
            present_type: festival.present_type,
            present_id: festival.present_id,
            present_name: festival.present_name
        };

        // 发放礼物
        dbHelper.addData("weixin_present_received", data, function(err, result){

            if(err){
                console.log(err);
                callback(err);
                return;
            }

            callback(null);
        });
    });
}