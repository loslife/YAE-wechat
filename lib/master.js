var net = require('net');
var fs = require("fs");
var cp = require('child_process');
var program = require('commander');
var _ = require('underscore');

var utils = require('./utils/utils');


var CONFIG = {};
var PORT = 3000;
var GRACE_EXIT_TIME = 2000;//2s
var WORKER_PATH = __dirname + '/worker.js';
var WORKER_HEART_BEAT = 10 * 1000;//10s, update memory ,etc
var self = this;

function output(str) {
    console.log(str);
}
function main(fn) {
    fn();
}
var childs = [];

function startWorker(handle) {
    var debug = isDebug();
    for (var i = 0; i < self.clusterConfig.workerno; i++) {
        var c = null;
        if (debug) {
            c = cp.fork(WORKER_PATH, {execArgv: [ '--debug=' + (process.debugPort + i + 1),"--stack-trace-limit=50" ]});
        } else {
            c = cp.fork(WORKER_PATH);
        }
        c.send({"server": true, "nodeId": i, "topoConfig":self.topoConfig,"clusterConfig": self.clusterConfig}, handle, { track: false, process: false });

        c.onUnexpectedExit = function (code, signal) {
            console.log("Child process terminated with code: " + code);
            process.exit(1);
        }
        c.on("exit", c.onUnexpectedExit);
        c.shutdown = function () {
            // Get rid of the exit listener since this is a planned exit.
            this.removeListener("exit", this.onUnexpectedExit);
            this.kill("SIGTERM");
        }
        childs.push(c);
    }

}
var exitTimer = null;
function aboutExit() {
    console.log("exit");
    if (exitTimer) return;
    exitTimer = setTimeout(function () {
        output('master exit...');
        process.exit(0);
    }, GRACE_EXIT_TIME);
}
function startServer() {
    var tcpServer = net.createServer();


    tcpServer.listen(self.clusterConfig.port, self.clusterConfig.ip, function () {
        startWorker(tcpServer._handle);
        tcpServer.close();
    });
}

/*
 setInterval(function(){
 inspect(childMng.getStatus());
 childMng.updateStatus();
 },WORKER_HEART_BEAT);
 */
function isDebug() {
    for (var i = 0; i < process.execArgv.length; i++) {
        if (process.execArgv[i].indexOf("--debug") == 0) {
            return true;
        }
    }
    return false;
}

function initSysconfig(sysconfig){
    //设置debug环境
    if(isDebug()){
        initDebugEnv();
    }else{
        if (sysconfig.clusterConfig) {
            self.PORT = sysconfig.clusterConfig.port;
            self.WORKER_NUMBER = sysconfig.clusterConfig.workerno;
        } else {
            output('cluster :' + program.clusterName + ' not in topo config!');
            return false;
        }

        self.clusterConfig = sysconfig.clusterConfig;
        self.topoConfig = sysconfig.topoConfig;
    }
    output('listen on '+self.clusterConfig.port+"...");

    function initDebugEnv(){


        var listenIp = getLocalIP()?getLocalIP():self.clusterConfig.ip;
        self.PORT = sysconfig.clusterConfig.port;
        self.WORKER_NUMBER = sysconfig.clusterConfig.workerno;
        self.clusterConfig = sysconfig.clusterConfig;
        self.clusterConfig.ip = listenIp;
        self.clusterConfig.baseurl = "http://"+self.clusterConfig.ip+":"+self.clusterConfig.port+"/svc";

        //设置客户端连接的服务器地址信息
        if(!sysconfig.topoConfig.clientAccess.staticurl){
            sysconfig.topoConfig.clientAccess.staticurl = "http://"+self.clusterConfig.ip+":"+self.clusterConfig.port;
        }
        if(!sysconfig.topoConfig.clientAccess.authurl){
            sysconfig.topoConfig.clientAccess.authurl = "http://"+self.clusterConfig.ip+":"+self.clusterConfig.port+"/svc";
        }
        if(!sysconfig.topoConfig.clientAccess.serviceurl){
            sysconfig.topoConfig.clientAccess.serviceurl = "http://"+self.clusterConfig.ip+":"+self.clusterConfig.port+"/svc";
        }
        if(!sysconfig.topoConfig.clientAccess.uploadurl){
            sysconfig.topoConfig.clientAccess.uploadurl = "http://"+self.clusterConfig.ip+":"+self.clusterConfig.port+"/svc/file-upload";
        }
        if(!sysconfig.topoConfig.connector.nail_pc_url){
            sysconfig.topoConfig.connector.nail_pc_url = "http://"+self.clusterConfig.ip+":3000";  //开发态美甲PC版本地址端口默认为3000
        }

        sysconfig.topoConfig["ip-whitelist"].push(self.clusterConfig.ip);
        self.topoConfig = sysconfig.topoConfig;
    }
}



var os = require('os');
function getLocalIP() {
    var addrInfo, ifaceDetails, _len;
    var localIPInfo = {};
    //Get the network interfaces
    var networkInterfaces = require('os').networkInterfaces();



    //Iterate over the network interfaces
    for (var ifaceName in networkInterfaces) {
        ifaceDetails = networkInterfaces[ifaceName];
        //Iterate over all interface details
        for (var _i = 0, _len = ifaceDetails.length; _i < _len; _i++) {
            addrInfo = ifaceDetails[_i];
            if (addrInfo.family === 'IPv4') {
                //Extract the IPv4 address
                if (!localIPInfo[ifaceName]) {
                    localIPInfo[ifaceName] = {};
                }
                localIPInfo[ifaceName].IPv4 = addrInfo.address;
            } else if (addrInfo.family === 'IPv6') {
                //Extract the IPv6 address
                if (!localIPInfo[ifaceName]) {
                    localIPInfo[ifaceName] = {};
                }
                localIPInfo[ifaceName].IPv6 = addrInfo.address;
            }
        }
    }
    if(localIPInfo["en0"]){
        return localIPInfo["en0"].IPv4;
    }

    if(localIPInfo["en1"]){
       return  localIPInfo["en1"].IPv4;
    }

    if(localIPInfo["以太网"]){
        return  localIPInfo["以太网"].IPv4;
    }

    return null;
}

void main(function () {

    var sysconfig = utils.parseCommand();
    initSysconfig(sysconfig);



    if (sysconfig.clusterConfig) {
        startServer();
        output('master is running...');
        process.on('SIGINT', aboutExit);
        process.on('SIGTERM', aboutExit);
        process.once("exit", function () {
            childs.forEach(function (c) {
                c.shutdown();
            })
        });
        process.once("uncaughtException", function (error) {
            // If this was the last of the listeners, then shut down the child and rethrow.
            // Our assumption here is that any other code listening for an uncaught
            // exception is going to do the sensible thing and call process.exit().
            if (process.listeners("uncaughtException").length === 0) {
                childs.forEach(function (c) {
                    c.shutdown();
                });
                throw error;
            }
        });


    } else {
        output('master start fail...');
    }
});