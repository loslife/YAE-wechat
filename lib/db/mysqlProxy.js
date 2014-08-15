var mysql = require('mysql');
var logger = require(FRAMEWORKPATH + "/utils/logger").getLogger();
var uuid = require('node-uuid');

module.exports = MysqlProxy;

function MysqlProxy(datasource){
    this.databaseName = datasource.dbName;
    this.pool  = mysql.createPool(datasource.dbserver);

}

MysqlProxy.prototype = {
    getConn:getConn,
    execSql:execSql,
    getUniqueEnterpriseId:getUniqueEnterpriseId,
    getUniqueId:getUniqueId,
    queryRouter:queryRouter,
    updateRouter:updateRouter,
    batchUpdateRouter:batchUpdateRouter,
    deleteRouter:deleteRouter,
    getUniqueCode:getUniqueCode
}



function execSql (sql,option,callback){
    this.getConn(function(err, conn) {
        if(err){
            logger.error(err);
            closeConn(conn);
            callback(err,-1);
            return;
        }
        conn.query(sql,option,function(err,result){
            if(err){
                logger.error(err);
                logger.error(sql);
                logger.error(option);
                closeConn(conn);
                err.code = err.errno;
                callback(err,result);
                return;
            }
            closeConn(conn);
            callback(null,result);
        });
    });
}


function queryPage (table,where,$page,$pagesize,sort,callback){
    this.getConn(function(err, conn) {
        if(err){
            logger.error(err);
            closeConn(conn);
            callback(err,-1);
            return;
        }

        if(!sort){
            sort = "id";
        }
        //SELECT * FROM   products JOIN (SELECT id FROM   products ORDER  BY date LIMIT  0, 10) AS t ON t.id = products.id;
        //SELECT * FROM `content` WHERE id <= (SELECT id FROM `content` ORDER BY id desc LIMIT ".($page-1)*$pagesize.", 1) ORDER BY id desc LIMIT $pagesize
        //var sql = "SELECT * FROM "+table +" WHERE "+ where +"& id <= (SELECT id FROM '"+table+"' WHERE "+where+" ORDER BY id desc LIMIT "+($page-1)*$pagesize +", "+$pagesize+") ORDER BY id desc LIMIT "+$pagesize;
        var sql = "SELECT * FROM "+that.databaseName+"."+table+" as t1 JOIN (SELECT id FROM   "+table+" WHERE "+where+" ORDER  BY "+sort+" LIMIT  "+($page-1)*$pagesize+", "+$pagesize+") AS t2 ON t2.id = t1.id"
        conn.query(sql,{},function(err,rows){
            if(err){
                logger.error(err);
                closeConn(conn);
                callback(err,-1);
                return;
            }
            closeConn(conn);
            callback(null,rows);
        });
    });
}

function getConn(callback){
    this.pool.getConnection(function(err, conn) {
        if(err){
            logger.error(err);
            callback(err,-1);
        }else{
            conn.config.queryFormat = function (query, values) {
                if (!values) return query;
                return query.replace(/\:(\w+)/g, function (txt, key) {
                    if (values.hasOwnProperty(key)) {
                        return this.escape(values[key]);
                    }
                    return txt;
                }.bind(this));
            };
            conn.query("SET character_set_client=utf8,character_set_connection=utf8");

            callback(null,conn);
        }
    });
}
/**
 * ID规则 数据库企业ID计数器(7)+节点ID(3位)+进程ID(5位)+JS方法上下文计数器(3位)（利用JS单线程机制）等长18位
 * @param callback
 */
function getUniqueEnterpriseId(callback){
    var that = this;
    var updatesql = "UPDATE "+that.databaseName+".ticket_mutex SET value=:value WHERE name='ENTERPRISEID';";
    var querysql = "SELECT value FROM "+that.databaseName+".ticket_mutex WHERE name='ENTERPRISEID'";
    that.getConn(function(err, conn) {
        if(err){
            logger.error(err);
            closeConn(conn);
            callback(err,-1);
            return;
        }

        conn.query(querysql,function(err,rows){
            if(err){
                logger.error(err);
                closeConn(conn);
                callback(err,-1);
                return;
            }
            var currentID = parseInt(rows[0].value);
            if(!getUniqueEnterpriseId.contextID){
                getUniqueEnterpriseId.contextID = 1;
            }else if(getUniqueEnterpriseId.contextID>=9998){
                getUniqueEnterpriseId.contextID = 1;
            }
            var contextID = getUniqueEnterpriseId.contextID++;
            conn.query(updatesql,{value:(currentID+1)},function(err,rows){
                if(err){
                    logger.error(err);
                    closeConn(conn);
                    callback(err,-1);
                    return;
                }
                closeConn(conn);
                //进程函数上下文中存储当前ID
                var runtimeID = _buqiNumberString(global.nodeID+""+process.pid,8);
                //上下文计数器等长3位
                contextID =  _buqiNumberString(contextID+"",3);
                var tmp = (currentID+1)+""+runtimeID+""+contextID;
                callback(null,tmp);
            });
        });
    });

}

function getUniqueCode(entity,len,callback){
    var that = this;
    var updatesql = "UPDATE "+that.databaseName+".ticket_mutex SET value=:value WHERE name='"+entity+"';"
    var querysql = "SELECT value FROM "+that.databaseName+".ticket_mutex WHERE name='"+entity+"'";
    var insertsql = "INSERT "+that.databaseName+".ticket_mutex (name,value) values(:name,:value)";

    that.getConn(function(err, conn) {
        if(err){
            logger.error(err);
            conn.release();
            callback(err,-1);
            return;
        }
        conn.query(querysql,function(err,rows){
            if(err){
                logger.error(err);
                closeConn(conn);
                callback(err,-1);
                return;
            }
            if(rows.length ==0 ){
                conn.query(insertsql,{name:entity,value:"1"},function(err,row){
                    if(err){
                        logger.error(err);
                        closeConn(conn);
                        callback(err,-1);
                        return;
                    }
                    else{
                        closeConn(conn);
                        var currentID = 1;
                        updateUnique(currentID,callback)
                    }
                });
            }else{
                var currentID = parseInt(rows[0].value);
                updateUnique(currentID,callback)
            }
        });
        function updateUnique(currentID,callback){
            conn.query(updatesql,{value:(currentID+1)},function(err,rows){
                if(err){
                    logger.error(err);
                    closeConn(conn);
                    callback(err,-1);
                    return;
                }
                closeConn(conn);
                if(!len || len==0){
                    callback(null,currentID);

                }else{
                    callback(null,_buqBeforeiNumberString(currentID+"",len));
                }
            });
        }
    });



}

/**
 * ID规则 企业ID(18)+节点ID(3)+进程ID(5)+数据库计数器(<=8)+JS方法上下文计数器(3)（利用JS单线程机制）<37位
 * @param enterpriseId
 * @param callback
 */
function getUniqueId(enterpriseId,callback){
    var id = uuid.v1();
    callback(null,enterpriseId+"-"+id);
}

function _buqiNumberString(nos,len){
    var noslen = nos.length;
    var _tmp = nos;
    if(noslen<len){
        for(var i=0;i<(len-noslen);i++){
            _tmp = _tmp+"0";
        }
    }
    return _tmp;
}
function _buqBeforeiNumberString(nos,len){
    var noslen = nos.length;
    var _tmp = nos;
    if(noslen<len){
        for(var i=0;i<(len-noslen);i++){
            _tmp = "0"+_tmp;
        }
    }
    return _tmp;
}

function updateRouter(id,table,callback){
    var that = this;
    that.getConn(function(err, conn) {
        if(err){
            logger.error(err);
            closeConn(conn);
            callback(err,-1);
            return;
        }
        var sql = "INSERT "+that.databaseName+".record_router (id,tableName) values(:id,:tableName)";
        conn.query(sql,{id:id,tableName:table},function(err){
            if(err){
                logger.error(err);
                logger.error("record_router:"+JSON.stringify({id:id,tableName:table}));
                closeConn(conn);
                callback(err,-1);
            }
            else{
                closeConn(conn);
                callback(null)
            }
        });
    });
}

function batchUpdateRouter(ids,table,callback){
    var that = this;
    that.getConn(function(err, conn) {
        if(err){
            logger.error(err);
            closeConn(conn);
            callback(err,-1);
            return;
        }
        var values = [];
        for(var i=0;i<ids.length;i++){
            values.push([ids[i],table]);
        }

        var sql = "INSERT "+that.databaseName+".record_router (id,tableName) values ?";
        conn.query(sql,[values],function(err){
            if(err){
                logger.error(err);
                closeConn(conn);
                callback(err,-1);
            }
            else{
                closeConn(conn);
                callback(null)
            }
        });
    });
}

function queryRouter(id,callback){
    var that = this;
    if(id.length==33){
        id = id.substring(0,32);
    }
    that.getConn(function(err, conn) {
        if(err){
            logger.error(err);
            closeConn(conn);
            callback(err,-1);
            return;
        }
        var sql = "SELECT tableName FROM "+that.databaseName+".record_router WHERE id = :id";
        conn.query(sql,{id:id},function(err,rows){
            if(err){
                logger.error(err);
                closeConn(conn);
                callback(err,-1);
                return;
            }
            else{
                if(rows.length>0){
                    closeConn(conn);
                    callback(null,rows[0].tableName)
                }else{
                    closeConn(conn);
                    callback({code:404,msg:id+" not exist!"});
                }
            }
        });
    });
}

function deleteRouter(id,callback){
    var that = this;
    that.getConn(function(err, conn) {
        if(err){
            logger.error(err);
            closeConn(conn);
            callback(err,-1);
            return;
        }
        var sql = "delete FROM "+that.databaseName+".record_router WHERE id = :id";
        conn.query(sql,{id:id},function(err,rows){
            if(err){
                logger.error(err);
                closeConn(conn);
                callback(err,-1);
            }
            else{
                closeConn(conn);
                callback(null,id)
            }
        });
    });
}
function closeConn(conn){
    try{
        conn.release();
    }catch(e){
        logger.error(e);
    }
}