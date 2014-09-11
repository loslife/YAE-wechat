var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");

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

        



        res.render("got", {enterprise_id: enterpriseId, menu: "festival"})
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