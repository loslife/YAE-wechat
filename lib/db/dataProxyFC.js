var mongodbProxyC = require("./mongodbProxy");
var mysqlProxyC = require("./mysqlProxy");

var nosqlproxyCache = {
}

var sqlproxyCache = {
}

module.exports = {
    "getNoSqlProxy": function (datasource) {
        var datasourceTag = datasource.dbserver.url + "/" + datasource.dbName;
        if (!nosqlproxyCache[datasourceTag]) {
            nosqlproxyCache[datasourceTag] = new mongodbProxyC(datasource);
        }
        return  nosqlproxyCache[datasourceTag];
    },
    "getSqlProxy": function (datasource) {
        var datasourceTag = datasource + ":" + datasource.dbserver.port + "/" + datasource.dbName;
        if (!sqlproxyCache[datasourceTag]) {
            sqlproxyCache[datasourceTag] = new mysqlProxyC(datasource);
        }
        return  sqlproxyCache[datasourceTag];
    },
    C: {
        "DEFAULT_NOSQLDB": {
            "dbName": "planx_graph_r",
            dbserver: {
                host:global["_g_topo"].dataServer.mongodb.ip,
                port:global["_g_topo"].dataServer.mongodb.port,
                url: global["_g_topo"].dataServer.mongodb.connectionurl,
                option: {
                    auto_reconnect: true,
                    poolSize: 5
                }
            }
        },
        "DEFAULT_SQLDB": {
            "dbName": "planx_graph",
            dbserver: {
                host: global["_g_topo"].dataServer.mysql.ip,
                port: global["_g_topo"].dataServer.mysql.port,
                user: global["_g_topo"].dataServer.mysql.user,
                password: global["_g_topo"].dataServer.mysql.password
            }
        }
    }
};
