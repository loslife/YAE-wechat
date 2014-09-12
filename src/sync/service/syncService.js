var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");
var async = require("async");
var _ = require("underscore");

exports.festivals = festivals;

// 400: 参数错误，通常是没有带t
// 500: 数据库访问错误
function festivals(req, res, next){

    var latestSyncTime = req.query.t;
    var enterpriseId = req.params["enterpriseId"];

    if(!latestSyncTime){
        next({errorCode: "400"});
        return;
    }

    // 全量下发
    if(latestSyncTime === "0"){

        var latest_festivals = 0;
        var latest_presents = 0;

        async.series([queryAllFestivals, queryAllPresents], function(err, results){

            if(err){
                next({errorCode: "500"});
                return;
            }

            // 如果某条记录的create_date和modify_date都不存在，下面将得到undefined
            var latest = Math.max(latest_festivals, latest_presents);
            if(!latest){
                latest = 0;
            }

            var response = {
                latestSyncTime: latest,
                festivals: results[0],
                presents: results[1]
            };

            doResponse(req, res, response);
        });

        return;

        function queryAllFestivals(callback){

            _queryFestivals({enterprise_id: enterpriseId}, function(err, festivals){

                if(err){
                    callback(err);
                    return;
                }

                if(festivals.length > 0){
                    latest_festivals = _resolveLatestSyncTime(festivals);
                }

                callback(null, {add: festivals});
            });
        }

        function queryAllPresents(callback){

            _queryPresents({enterprise_id: enterpriseId}, function(err, presents){

                if(err){
                    callback(err);
                    return;
                }

                if(presents.length > 0){
                    latest_presents = _resolveLatestSyncTime(presents);
                }

                callback(null, {add: presents});
            });
        }
    }

    var latest_festivals_add = 0;
    var latest_festivals_update = 0;
    var latest_presents_add = 0;
    var latest_presents_update = 0;

    // 增量下发
    async.series([queryFestivalsByDate, queryPresentsByDate], function(err, results){

        if(err){
            next({errorCode: "500"});
            return;
        }

        // 如果某条记录的create_date和modify_date都不存在，下面将得到undefined
        var latest = Math.max(latest_festivals_add, latest_festivals_update, latest_presents_add, latest_presents_update);
        if(!latest){
            latest = 0;
        }

        var response = {
            latestSyncTime: latest,
            festivals: results[0],
            presents: results[1]
        };

        doResponse(req, res, response);
    });

    function queryFestivalsByDate(callback){

        async.series([_queryAddFestivals, _queryUpdateFestivals], function(err, results){

            if(err){
                callback(err);
                return;
            }

            callback(null, {add: results[0], update: results[1]});
        });

        function _queryAddFestivals(callback){

            var conditions = {};
            conditions.enterprise_id = enterpriseId;
            conditions.create_date = {$gt: parseInt(latestSyncTime)};

            _queryFestivals(conditions, function(err, result){

                if(err){
                    callback(err);
                    return;
                }

                if(result.length > 0){
                    latest_festivals_add = _resolveLatestSyncTime(result);
                }

                callback(null, result);
            });
        }

        function _queryUpdateFestivals(callback){

            var conditions = {};
            conditions.enterprise_id = enterpriseId;
            conditions.create_date = {$lt: parseInt(latestSyncTime)};
            conditions.modify_date = {$gt: parseInt(latestSyncTime)};

            _queryFestivals(conditions, function(err, result){

                if(err){
                    callback(err);
                    return;
                }

                if(result.length > 0){
                    latest_festivals_update = _resolveLatestSyncTime(result);
                }

                callback(null, result);
            });
        }
    }

    function queryPresentsByDate(callback){

        async.series([_queryAddPresents, _queryUpdatePresents], function(err, results){

            if(err){
                callback(err);
                return;
            }

            callback(null, {add: results[0], update: results[1]});
        });

        function _queryAddPresents(callback){

            var conditions = {};
            conditions.enterprise_id = enterpriseId;
            conditions.create_date = {$gt: parseInt(latestSyncTime)};

            _queryPresents(conditions, function(err, result){

                if(err){
                    callback(err);
                    return;
                }

                if(result.length > 0){
                    latest_presents_add = _resolveLatestSyncTime(result);
                }

                callback(null, result);
            });
        }

        function _queryUpdatePresents(callback){

            var conditions = {};
            conditions.enterprise_id = enterpriseId;
            conditions.create_date = {$lt: parseInt(latestSyncTime)};
            conditions.modify_date = {$gt: parseInt(latestSyncTime)};

            _queryPresents(conditions, function(err, result){

                if(err){
                    callback(err);
                    return;
                }

                if(result.length > 0){
                    latest_presents_update = _resolveLatestSyncTime(result);
                }

                callback(null, result);
            });
        }
    }

    function _queryFestivals(conditions, callback){

        dbHelper.queryData("weixin_festivals", conditions, function(err, result){

            if(err){
                console.log(err);
                callback(err);
                return;
            }

            _.each(result, function(item){
                delete item._id;
            });

            callback(null, result);
        });
    }

    function _queryPresents(conditions, callback){

        dbHelper.queryData("weixin_present_received", conditions, function(err, result){

            if(err){
                console.log(err);
                callback(err);
                return;
            }

            _.each(result, function(item){
                delete item._id;
            });

            callback(null, result);
        });
    }

    // 找出最大时间
    function _resolveLatestSyncTime(array){

        // modify_date如果存在，必定大于create_date
        var dateArray = _.map(array, function(item){

            if(item.modify_date){
                return item.modify_date;
            }

            return item.create_date;
        });

        var sorted = _.sortBy(dateArray, function(item){
            return item;
        });

        return _.last(sorted);
    }
}