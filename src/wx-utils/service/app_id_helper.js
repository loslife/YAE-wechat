var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");

exports.getSecretByAppId = getSecretByAppId;

// callback(err, app_id, app_secret)
function getSecretByAppId(app_id, callback){

    if(app_id === "wxb5243e6a07f2e09a"){
        callback(null, "wxb5243e6a07f2e09a", "06808347d62dd6a1fc33243556c50a5d");
        return;
    }

    dbHelper.queryData("weixin_binding", {app_id: app_id}, function(err, results){

        if(err){
            callback(err);
            return;
        }

        if(results.length === 0){
            callback({message: "app_id not found"});
        }else{
            callback(null, app_id, results[0].app_secret);
        }
    });
}