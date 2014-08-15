var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var mysql = require('mysql');
var uuid = require('node-uuid');
var dataProxyFC  = require("../db/dataProxyFC");
var sqlHelper  = require("../db/sqlHelper");
var conditionBuilder = require(FRAMEWORKPATH + "/db/mongo-sql/conditionBuilder");

var mysqlProxy = dataProxyFC.getSqlProxy(dataProxyFC.C.DEFAULT_SQLDB);


module.exports = {
    addData: addData,
    updateByID: updateByID,
    deleteData: deleteData,
    deleteDataByCondition: deleteDataByCondition,
    queryData: queryData,
    update: update,
    updateInc: updateInc,
    count:count,
    query:query
}


///**
// * 可以删除，只有function adjustEnterpriseRepeatData(req, res, next)一处调用
// */
//function group(tableName, keys,condition,initial,reduce,command, callBack) {
//
//
//}
//
////只有去重代码才有，暂时可以不管
//function distinctCount(tableName,keys, option, callBack) {
//
//}

function addData(tableName, data, callback) {
    if(_.isArray(data)){
        async.eachLimit(data,5,function(record,cb){
            addOneData(tableName, record, cb)
        },callback)
    }else{
        addOneData(tableName, data, callback)
    }


}

function addOneData(tableName, data, callback) {
    sqlHelper.replaceColumnName(tableName,data);
    var cond =  _buildValues(data);
    var sql = "insert into "+"planx_graph."+tableName +cond.names+" values "+cond.valueStr;
    mysqlProxy.execSql(sql, cond.values,callback);
}

function updateByID(tableName, data, callback) {
    sqlHelper.replaceColumnName(tableName,data)
    var sets =  _buildUpdates(data);
    var cond =  _buildCondition(tableName,{id:data.id});
    var sql = "update "+"planx_graph."+tableName +" set "+sets.sets  +cond.where;
    mysqlProxy.execSql(sql, data,callback);
}

function update(condition, tableName, record, callback) {
    sqlHelper.replaceColumnName(tableName,record)
    var sets =  _buildUpdates(record);
    var cond =  _buildCondition(tableName,condition);
    var sql = "update "+"planx_graph."+tableName +" set "+sets.sets  +cond.where;
    var options = _.extend(condition,record);
    mysqlProxy.execSql(sql, options,callback);
}

function updateInc(condition, tableName, record, callback) {
    sqlHelper.replaceColumnName(tableName,record)
    var sets =  _buildUpdateIncs(record);
    var cond =  _buildCondition(tableName,condition);
    var sql = "update "+"planx_graph."+tableName +" set "+sets.sets  +cond.where;
    var options = _.extend(condition,record);
    mysqlProxy.execSql(sql, options,callback);
}


function deleteData(tableName, id, callback) {
    var sql = "delete from "+" planx_graph."+tableName+ "  where id=:id";
    mysqlProxy.execSql(sql, {id:id},callback);
}

function deleteDataByCondition(tableName, condition, callback) {
    var cond =  _buildCondition(tableName,condition);
    var  sql = "delete from "+ "planx_graph."+tableName+cond.where;
    mysqlProxy.execSql(sql, cond.values,callback);
}

function queryData(tableName, option, callback) {
    sqlHelper.replaceColumnName(tableName,option);
    var fields = "*";

    if(sqlHelper.NEEDCONVERTTABLES.indexOf(tableName) != -1){
        fields = sqlHelper.getCompatibleFields(tableName);
    }

    var cond =  _buildCondition(tableName,option);

    var  sql = "select "+fields+" from "+ "planx_graph."+tableName+cond.where;

    mysqlProxy.execSql(sql,[],callback);
}

function count(tableName, option, callback) {
    sqlHelper.replaceColumnName(tableName,option);
    var sql = "select count(id) as count from planx_graph."+tableName +"";
    var cond =  _buildCondition(tableName,option);
    sql = sql+cond.where;
    mysqlProxy.execSql(sql,option,function(error,result){
        if(error){
           callback(error);
        }else{
            var count =  result[0].count;

            callback(null,count);
        }
    });
}

function query(tableName, option, page, pageno, sort, filter, callback) {
    sqlHelper.replaceColumnName(tableName,option)
    var fields = "*";

    if(sqlHelper.NEEDCONVERTTABLES.indexOf(tableName) != -1){
        fields = sqlHelper.getCompatibleFields(tableName);
    }

    var cond =  _buildCondition(tableName,option);
    var  sql = "select "+fields+" from "+ "planx_graph."+tableName+cond.where;
    if(page && pageno){
        sql = sql +" LIMIT "+((pageno-1)*page)+" "+pageno ;
    }
    mysqlProxy.execSql(sql,option,callback);
}

function _buildCondition(tableName,condition){

    var values = {};
    var where =  conditionBuilder(condition,tableName,values);
    if(where){
        return{
            where:" where "+where,
            values:values
        }
    }else{
        return{
            where:"",
            values:{}
        }
    }

//    var where = "";
//    var values = {};
//    _.each(condition,function(value,key){
//        if(key!="$or" && key!="$and"){
//            where += key+"=:"+key+" and ";
//            values[key] = value;
//        }
//        if(key == " $or "){
//            where += key+"=:"+key+" and ";
//            values[key] = value;
//        }
//
//    });
//    if(where.length>0){
//        where = where.substring(0,where.length-5);
//    }
//    return {
//        where:where,
//        values:values
//    }
}

function _buildValues(condition){
    var names = "(";
    var valueStr = "(";
    var values = {};
    _.each(condition,function(value,key){
        if(key!="$or" && key!="$and"){
            names += key+",";
            valueStr += ":"+key+",";
            values[key] = value;
        }
    });
    if(names.length>0){
        names = names.substring(0,names.length-1)+")";
        valueStr = valueStr.substring(0,valueStr.length-1)+")";
    }
    return {
        names:names,
        valueStr:valueStr,
        values:values
    }
}


function _buildUpdates(condition){
    var sets = "";
    var values = {};
    _.each(condition,function(value,key){
        if(key!="$or" && key!="$and"){
            sets += key+"=:"+key+",";
            values[key] = value;
        }
    });

    if(sets.length>0){
        sets = sets.substring(0,sets.length-1);
    }
    return {
        sets:sets,
        values:values
    }
}

function _buildUpdateIncs(condition){
    var sets = "";
    var values = {};
    _.each(condition,function(value,key){
        if(key!="$or" && key!="$and"){
            sets += key+"="+key+"+:"+key+",";
            values[key] = value;
        }
    });

    if(sets.length>0){
        sets = sets.substring(0,sets.length-1);
    }
    return {
        sets:sets,
        values:values
    }
}


