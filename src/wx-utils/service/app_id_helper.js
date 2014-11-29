var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");

exports.getAppIdByEnterpriseId = getAppIdByEnterpriseId;

// callback(err, app_id, app_secret)
function getAppIdByEnterpriseId(enterprise_id, callback){

    dbHelper.queryData("weixin_binding", {enterprise_id: enterprise_id}, function(err, results){

        if(err){
            callback(err);
            return;
        }

        if(results.length === 0){
            callback(null, "wxb5243e6a07f2e09a", "06808347d62dd6a1fc33243556c50a5d");
        }else{
            callback(null, results[0].app_id, results[0].app_secret);
        }
    });
}