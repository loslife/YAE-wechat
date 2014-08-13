var request = require("request");
var mysqlHelper = require("./mysqlHelper");
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();

var dataProxyFC  = require("../db/dataProxyFC");
var nosqlProxy = dataProxyFC.getNoSqlProxy(dataProxyFC.C.DEFAULT_NOSQLDB);
var mysqlProxy = dataProxyFC.getSqlProxy(dataProxyFC.C.DEFAULT_SQLDB);

module.exports = {
    addData: addData,
    getUniqueId: getUniqueId,
    getUniqueCode: getUniqueCode,
    updateByID: updateByID,
    deleteData: deleteData,
    deleteDataByCondition: deleteDataByCondition,
    queryData: queryData,
    update: update,
    updateInc: updateInc,
    count:count,
    distinctCount:distinctCount,
    query:query,
    group:group,
    ensureIndex:ensureIndex,
    execSql:execSql
}

var mysqlTables = [ 'tb_member',
    'tb_memberCardCategory',
    'tb_cardCateDiscount',
    'tb_memberCard',
    'tb_recordCateServices',
    'tb_memberCardAttrMap',
    'tb_memberAccessoryEntity',
    'tb_memberAccessory',
    'tb_memberAccessoryAttrMap' ];

function group(tableName, keys,condition,initial,reduce,command, callBack) {
    nosqlProxy.getConn(function (error) {
        if (error) {
            logger.error("group " + tableName + " db connection error : " + error);
            callBack(error, null);
            return;
        }
        nosqlProxy.group(tableName, keys,condition,initial,reduce,command, function (error, result) {
            if (error) {
                logger.error("group " + tableName + " error : " + error);
                callBack(error, null);
                return;
            }
            callBack(null, result);
        });
    });
}

function addData(tableName, data, callback) {
    if(mysqlTables.indexOf(tableName) != -1){
        mysqlHelper.addData(tableName, data, callback);
    }else{
        nosqlProxy.getConn(function (error) {
            if (error) {
                logger.error("insert " + tableName + " db connection error : " + error);
                callback(error);
                return;
            }
            nosqlProxy.batchInsert(tableName, data, function (error, insertResult) {
                if (error) {
                    logger.error("insert " + tableName + " error : " + error);
                    callback(error);
                    return;
                }
                delete data._id;
                callback(null, insertResult);
            });
        });
    }
}

function updateByID(tableName, data, callback) {
    if(mysqlTables.indexOf(tableName) != -1){
        mysqlHelper.updateByID(tableName, data, callback);
    }else{
    nosqlProxy.getConn(function (error) {
        if (error) {
            logger.error("update " + tableName + " db connection error : " + error);
            callback(error);
            return;
        }
        nosqlProxy.updateByID(data.id, tableName, data, function (error, updateResult) {
            if (error) {
                logger.error("update " + tableName + " error : " + error);
                callback(error);
                return;
            }
            callback(null, updateResult);
        });
    });
    }
}

function update(condition, tableName, record, callback) {
    if(mysqlTables.indexOf(tableName) != -1){
        mysqlHelper.update(condition, tableName, record, callback);
    }else{
    nosqlProxy.getConn(function (error) {
        if (error) {
            logger.error("update " + tableName + " db connection error : " + error);
            callback(error);
            return;
        }
        nosqlProxy.update(condition, tableName, record, function (error, updateResult) {
            if (error) {
                logger.error("update " + tableName + " error : " + error);
                callback(error);
                return;
            }
            callback(null, updateResult);
        });
    });
    }
}

function updateInc(condition, tableName, record, callback) {
    if(mysqlTables.indexOf(tableName) != -1){
        mysqlHelper.updateInc(condition, tableName, record, callback);
    }else{
    nosqlProxy.getConn(function (error) {
        if (error) {
            logger.error("update " + tableName + " db connection error : " + error);
            callback(error);
            return;
        }
        nosqlProxy.updateInc(condition, tableName, record, function (error, updateResult) {
            if (error) {
                logger.error("update " + tableName + " error : " + error);
                callback(error);
                return;
            }
            callback(null, updateResult);
        });
    });
    }
}



function deleteData(tableName, data, callback)
{
    if(mysqlTables.indexOf(tableName) != -1){
        mysqlHelper.deleteData(tableName, data, callback);
    }else{
    nosqlProxy.getConn(function (error) {
        if (error) {
            logger.error("delete " + tableName + " db connection error : " + error);
            callback(error);
            return;
        }
        nosqlProxy.delete(data, tableName, function (error, deleteId) {
            if (error) {
                logger.error("delete " + tableName + " error : " + error);
                callback(error);
                return;
            }
            callback(null, deleteId);
        });
    });
    }
}


function getUniqueId(enterpriseId,callback){
    mysqlProxy.getUniqueId(enterpriseId, function (err, id) {
        if (err) {
            callback(err);
        } else {
            callback(null,id);
        }
    });
}

function getUniqueCode(entity,len,callback){
    mysqlProxy.getUniqueCode(entity,len,function (err, id) {
        if (err) {
            callback(err);
        } else {
            callback(null,id);
        }
    });
}


function deleteDataByCondition(tableName, condition, callback) {
    if(mysqlTables.indexOf(tableName) != -1){
        mysqlHelper.deleteDataByCondition(tableName, condition, callback);
    }else{
    nosqlProxy.getConn(function (error) {
        if (error) {
            logger.error("delete " + tableName + " db connection error : " + error);
            callback(error);
            return;
        }
        nosqlProxy.deleteByCondition(condition, tableName, function (error) {
            if (error) {
                logger.error("delete " + tableName + " error : " + error);
                callback(error);
                return;
            }
            callback(null);
        });
    });
    }
}


function queryData(tableName, option, callBack) {
    if(mysqlTables.indexOf(tableName) != -1){
        mysqlHelper.queryData(tableName, option, callBack);
    }else{
        nosqlProxy.getConn(function (error) {
            if (error) {
                logger.error("queryData " + tableName + " db connection error : " + error);
                callBack(error, null);
                return;
            }
            nosqlProxy.query(tableName, option, null, null, null, null, function (error, result) {
                if (error) {
                    logger.error("queryData " + tableName + " error : " + error);
                    callBack(error, null);
                    return;
                }
                callBack(null, result);
            });
        });
    }
}

function count(tableName, option, callBack) {
    if(mysqlTables.indexOf(tableName) != -1){
        mysqlHelper.count(tableName, option, callBack);
    }else{
    nosqlProxy.getConn(function (error) {
        if (error) {
            logger.error("count " + tableName + " db connection error : " + error);
            callBack(error, null);
            return;
        }
        nosqlProxy.count(tableName, option,function (error, count) {
            if (error) {
                logger.error("count " + tableName + " error : " + error);
                callBack(error, null);
                return;
            }
            callBack(null, count);
        });
    });
    }
}


function distinctCount(tableName,keys, option, callBack) {
    nosqlProxy.getConn(function (error) {
        if (error) {
            logger.error("distinct " + tableName + " db connection error : " + error);
            callBack(error, null);
            return;
        }
        nosqlProxy.distinctCount(tableName, keys,option,function (error, count) {
            if (error) {
                logger.error("distinct " + tableName + " error : " + error);
                callBack(error, null);
                return;
            }
            callBack(null, count.length);
        });
    });
}




function query(tableName, option, page, pageno, sort, filter, callBack) {
    if(mysqlTables.indexOf(tableName) != -1){
        mysqlHelper.query(tableName, option, page, pageno, sort, filter, callBack);
    }else{
    nosqlProxy.getConn(function (error) {
        if (error) {
            logger.error("query " + tableName + " db connection error : " + error);
            callBack(error, null);
            return;
        }
        nosqlProxy.query(tableName, option, page, pageno, sort, filter, function (error, result) {
            if (error) {
                logger.error("query " + tableName + " error : " + error);
                callBack(error, null);
                return;
            }
            callBack(null, result);
        });
    });
    }
}
function ensureIndex(tableName, keys,option,callBack){
    nosqlProxy.getConn(function (error) {
        if (error) {
            logger.error("ensureIndex " + tableName + " db connection error : " + error);
            callBack(error, null);
            return;
        }
        nosqlProxy.ensureIndex(tableName,keys, option,  function (error, result) {
            if (error) {
                logger.error("ensureIndex " + tableName + " error : " + error);
                callBack(error, null);
                return;
            }
            callBack(null, result);
        });
    });
}
function execSql(sql,option,callback){
    mysqlProxy.execSql(sql,option,callback);
}