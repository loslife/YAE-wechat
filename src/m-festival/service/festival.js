var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var uuid = require('node-uuid');

exports.list = list;
exports.getPresent = getPresent;
exports.share = share;
exports.walkinCome = walkinGetPresent;

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

function getPresent(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var festivalId = req.query["fid"];
    var memberId = req.session.member_id;

    if(!memberId){

        queryFestivalById(enterpriseId, festivalId, function(err, festival){

            if(err){
                next(err);
                return;
            }

            res.render("input", {enterprise_id: enterpriseId, menu: "festival", festival: festival});
        });

        return;
    }

    // 会员已经登陆的情况
    var condition = {enterprise_id: enterpriseId, member_id: memberId, festival_id: festivalId};

    dbHelper.queryData("weixin_present_received", condition, function(err, result){

        if(err){
            console.log(err);
            next(err);
            return;
        }

        // 不能重复领取
        if(result.length !== 0){
            res.redirect("share");
            return;
        }

        providePresent(enterpriseId, festivalId, memberId, null, function(err){

            if(err){
                next(err);
                return;
            }
            res.redirect("share");
        });
    });
}

function share(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var festivalId = req.query["fid"];

    res.render("gotAndShare", {enterprise_id: enterpriseId, menu: "festival", festival_id: festivalId});
}

function walkinGetPresent(req, res, next){

    var enterpriseId = req.params["enterpriseId"];
    var phone = req.body.phone;
    var festivalId = req.query["fid"];

    var condition = {enterprise_id: enterpriseId, phone: phone, festival_id: festivalId};

    dbHelper.queryData("weixin_present_received", condition, function(err, result){

        if(err){
            console.log(err);
            next(err);
            return;
        }

        // 不能重复领取
        if(result.length !== 0){
            doResponse(req, res, {message: "repeat"});
            return;
        }

        providePresent(enterpriseId, festivalId, null, phone, function(err){

            if(err){
                next(err);
                return;
            }

            doResponse(req, res, {message: "ok"});
        });
    });
}

function queryFestivalById(enterpriseId, festivalId, callback){

    dbHelper.queryData("weixin_festivals", {enterprise_id: enterpriseId, id: festivalId}, function(err, result){

        if(err){
            console.log(err);
            callback(err);
            return;
        }

        if(result.length === 0){
            callback({errorMessage:"活动不存在"});
            return;
        }

        callback(null, result[0]);
    });
}

function providePresent(enterpriseId, festivalId, memberId, phone, callback){

    queryFestivalById(enterpriseId, festivalId, function(err, festival){

        if(err){
            callback(err);
            return;
        }

        var data = {
            id: uuid.v1(),
            enterprise_id: enterpriseId,
            festival_id: festivalId,
            receive_date: new Date().getTime(),
            client_has_sync: 0,
            present_type: festival.present_type,
            present_id: festival.present_id,
            present_name: festival.present_name
        };

        if(memberId){
            data.member_id = memberId;
        }

        if(phone){
            data.phone = phone;
        }

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