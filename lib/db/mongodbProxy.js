var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var mongodb = require("mongodb");
var utils = require("../utils/utils");
var _ = require("underscore");

var self = this;

module.exports =  mongodbProxy;

function mongodbProxy(datasource){
    this.dbName = datasource.dbName;
    this.dbserver = datasource.dbserver;
}

mongodbProxy.prototype.get = function(id,table,callback){
    var that = this;
    if(!that.db){
        this.assertDBState(callback);
        return;
    }

    that.db.collection(table, function(err,collection){
        if(err) {
            logger.error("[ERROR] findById: %s:%s\n%s", err.name, err.msg, err.message);
            callback(err);
        }else{
            collection.findOne({id: id}, function(err, document) {
                if(err) {
                    logger.error("[ERROR] findById: %s:%s\n%s", err.name, err.msg, err.message);
                    callback(err);
                }
                else {
                    callback(null,document);
                }
            });
        }

    });
}

mongodbProxy.prototype.updateByID = function(id,table,record,callback){
    var that = this;
    if(!that.db){
        this.assertDBState(callback);
        return;
    }
    that.update({"id": id},table,record,callback);
}

mongodbProxy.prototype.group = function(tableName, keys,condition,initial,reduce,command,callback){
    var that = this;

    that.db.collection(tableName, function(err,collection){
        if(err) {
            logger.error("[ERROR] group: %s:%s\n%s", err.name, err.msg, err.message);
            callback(err);
        }else{
            collection.group(
                keys,
                condition,
                initial,
                reduce,
                command,
                function(err,results){
                    if(err) {
                        logger.error("[ERROR] update: %s:%s\n%s", err.name, err.msg, err.message);
                        callback(err);
                    }
                    else {
                        callback(null,results);
                    }
                }
            )
        }
    });
}


mongodbProxy.prototype.update = function(condition,table,record,callback){
    var that = this;
    if(!that.db){
        this.assertDBState(callback);
        return;
    }

    that.db.collection(table, function(err,collection){
        if(err) {
            logger.error("[ERROR] update: %s:%s\n%s", err.name, err.msg, err.message);
            callback(err);
        }else{
            utils.cleanObject(record);

            collection.update(
                condition,
                {
                    $set:record
                }
                ,
                {
                },
                function(err){
                    if(err) {
                        logger.error("[ERROR] update: %s:%s\n%s", err.name, err.msg, err.message);
                        callback(err);
                    }
                    else {
                        callback(null,record);
                    }
                }
            )
        }
    });
}


mongodbProxy.prototype.updateInc = function(condition,table,record,callback){
    var that = this;
    if(!that.db){
        this.assertDBState(callback);
        return;
    }

    that.db.collection(table, function(err,collection){
        if(err) {
            logger.error("[ERROR] update: %s:%s\n%s", err.name, err.msg, err.message);
            callback(err);
        }else{
            utils.cleanObject(record);

            collection.update(
                condition,
                {
                    $inc:record
                }
                ,
                {
                    multi:true
                },
                function(err){
                    if(err) {
                        logger.error("[ERROR] update: %s:%s\n%s", err.name, err.msg, err.message);
                        callback(err);
                    }
                    else {
                        callback(null,record);
                    }
                }
            )
        }
    });
}



mongodbProxy.prototype.insert = function(table,record,callback){
    var that = this;
    if(!that.db){
        this.assertDBState(callback);
        return;
    }
    that.db.collection(table, function(err,collection){
        if(err) {
            logger.error("[ERROR] insert: %s:%s\n%s", err.name, err.msg, err.message);
            callback(err);
        }else{

            collection.insert(record,{
                    safe:true
                },function(err,objects){

                    if(err) {
                        logger.error("[ERROR] insert: %s:%s\n%s", err.name, err.msg, err.message);
                        callback(err);
                    }
                    else {
                        callback(null,objects);
                    }
                }
            )
        }
    });
}

mongodbProxy.prototype.batchInsert = function(table,records,callback){
    var that = this;
    if(!that.db){
        this.assertDBState(callback);
        return;
    }
    if(!records){
        callback(null);
        return;
    }
    if(records.length==0){
        callback(null);
        return;
    }
    that.db.collection(table, function(err,collection){
        if(err) {
            logger.error("[ERROR] insert: %s:%s\n%s", err.name, err.msg, err.message);
            callback(err);
        }else{

            collection.insert(records,{
                    safe:true
                },function(err,objects){

                    if(err) {
                        logger.error("[ERROR] insert: %s:%s\n%s", err.name, err.msg, err.message);
                        callback(err);
                    }
                    else {
                        callback(null,objects);
                    }
                }
            )
        }
    });
}



    mongodbProxy.prototype.delete = function(id,table,callback){
        var that = this;
        if(!that.db){
            this.assertDBState(callback);
            return;
        }

        that.db.collection(table, function(err,collection){
            if(err) {
                logger.error("[ERROR] delete: %s:%s\n%s", err.name, err.msg, err.message);
                callback(err);
                return;
            }else{
                collection.remove(
                    {
                        id: id
                    },function(err){
                        if(err) {
                            logger.error("[ERROR] delete: %s:%s\n%s", err.name, err.msg, err.message);
                            callback(err);
                        }
                        else {
                            callback(null,id);
                        }
                    }
                )
            }
        });
    }

    mongodbProxy.prototype.deleteByCondition = function(condition,table,callback){
        var that = this;
        if(!that.db){
            this.assertDBState(callback);
            return;
        }

        if(!condition || _.isEmpty(condition)){
            logger.error("[ERROR] deleteByCondition: 系统不允许全表删除，必须指定删除条件");
            callback({errorCode:"100000008",msg:"系统不允许全表删除，必须指定删除条件"});
            return;
        }

        that.db.collection(table, function(err,collection){
            if(err) {
                logger.error("[ERROR] delete: %s:%s\n%s", err.name, err.msg, err.message);
                callback(err);
                return;
            }else{
                collection.remove(
                    condition
                    ,function(err){
                        if(err) {
                            logger.error("[ERROR] delete: %s:%s\n%s", err.name, err.msg, err.message);
                            callback(err);
                        }
                        else {
                            callback(null);
                        }
                    }
                )
            }
        });
    }


    mongodbProxy.prototype.count = function(table,option,callback){
        var that = this;
        that.db.collection(table, function(err,collection){
            if(err) {
                logger.error(err);
                logger.error("[ERROR] query: %s:%s\n%s", err.name, err.msg, err.message);
                callback(err);
            }else{
                collection.find(option).count(function(err,count){
                    callback(err, count);
                })
            }
        })
    }


mongodbProxy.prototype.distinctCount = function(tableName,keys, option, callback){
    var that = this;
    that.db.collection(tableName, function(err,collection){
        if(err) {
            logger.error(err);
            logger.error("[ERROR] query: %s:%s\n%s", err.name, err.msg, err.message);
            callback(err);
        }else{
            collection.distinct(keys, option,function(err,count){
                callback(err, count);
            })
        }
    })
}


    mongodbProxy.prototype.query = function(table,option,page,pageno,sort,filter,callback){
    //TODO 增加缓存机制
    var that = this;
    if(arguments.length < 7 ){
        logger.error("[ERROR] query paramters not enough! current paramters are: %s", arguments.length);
        callback({
            name:"argumentsNotCorrect",
            msg:"query paramters not enough!"
        });
        return;
    }
    this.getConn(doquery);
    function doquery(err,db){
        if(err) {
            logger.error("[ERROR] query: %s:%s\n%s", err.name, err.msg, err.message);
            callback(err);
            return;
        }
        that.db.collection(table, function(err,collection){
            if(err) {
                logger.error(err);
                logger.error("[ERROR] query: %s:%s\n%s", err.name, err.msg, err.message);
                callback(err);
            }else{
                var sortField = {};
                if(sort){
                    sortField[sort] = -1;
                }
                if(page && pageno && _.isNumber(page) && _.isNumber(pageno)){
                    collection.find(option).limit(pageno).skip((page-1)*pageno).sort(sortField).toArray(function (err, docs) {
                        if (err) {
                            callback(err, null);
                        }
                        if(filter && typeof(filter)=="function"){
                            callback(null, _.filter(docs,filter));
                        } else{
                            callback(null, docs);
                        }
                    });
                }else{
                    collection.find(option).sort(sortField).toArray(function (err, docs) {
                        if (err) {
                            callback(err, null);
                        }
                        if(filter && typeof(filter)=="function"){
                            callback(null, _.filter(docs,filter));
                        } else{
                            callback(null, docs);
                        }
                    });
                }
             }
        });
    }
}

mongodbProxy.prototype.tableCreate = function(tableName,option,callback){
    var that = this;
    if(!that.db){
        this.assertDBState(callback);
        return;
    }

    that.db.createCollection(tableName, option,function(err, collection){
        if(err){
            logger.error(err);
            doError(callback,err);
        }
        else {
            callback(null,tableName);
        }
    });
}

mongodbProxy.prototype.dbCreate = function(option,callback){
    var that = this;
    var mongoserver = new mongodb.Server(this.dbserver.host, this.dbserver.port, this.dbserver.option);
    that.db_connector = new mongodb.Db(that.dbName, mongoserver, {});
    that.db_connector.open(function(err,db){
        if(err){
            logger.error(err);
            throw err;
        }else{
            that.db = db;
            db.on("close", function(error){
                logger.error("Connection to the database was closed!"+error);
            });
            callback(null,db);
        }
    });
}

mongodbProxy.prototype.initDBConn = function(callback){
    var that = this;

    that.getConn(function(err,db){
        that.db = db;
        callback(err,db);

    });
}


mongodbProxy.prototype.tableList = function(callback){
    var that = this;
    if(!that.db){
        this.assertDBState(callback);
        return;
    }
    that.db.collectionNames(callback);
}

mongodbProxy.prototype.dbList = function(callback){
    var that = this;
    var adminDb = that.db.admin();
    // List all the available databases
    adminDb.listDatabases(function(err, dbs) {
        if(err) {
            logger.debug("[ERROR] query: %s:%s\n%s", err.name, err.msg, err.message);
            callback(err);
        }else{
            callback(null,dbs.databases);

        }
    });
}

mongodbProxy.prototype.getConn = function(callback){
    var that = this;

    if(!that.db){
        that.dbCreate({},callback);
    }else{
        callback(null,that.db);
    }
}

mongodbProxy.prototype.ensureIndex = function(tableName,keys,options,callback){
    var that = this;
    that.db.collection(tableName, function(err,collection){
        if(err) {
            logger.error(err);
            logger.error("[ERROR] ensureIndex: %s:%s\n%s", err.name, err.msg, err.message);
            callback(err);
        }else{
            collection.ensureIndex(keys,options);
            callback(null);
        }
    })
}
mongodbProxy.prototype.assertDBState = function(callback){
    logger.error("[ERROR] mongodb's db not init dbName: %s", this.dbName);
    logger.error((new Error()).stack);
    callback({
        name:"dbNotInit",
        msg:"proxy not init connection!"
    });
}