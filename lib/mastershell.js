var net = require('net');
var fs = require("fs");
var cp = require('child_process');
var program = require('commander');
var _ = require('underscore');
var program = require('commander');
var utils = require('./utils/utils');
var globalext = require('./globalext');
global._ = _;
global.async = require('async');


var CONFIG = {};
var self = this;

function output(str) {
    console.log(str);
}
function main(fn) {
    fn();
}

function startExecScript(sysconfig) {
    //执行指定的脚本
    var script = sysconfig.scriptName;

    var scriptInstance = require(script);
    scriptInstance.exec(sysconfig.program);
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
        self.clusterConfig = sysconfig.clusterConfig;
        self.topoConfig = sysconfig.topoConfig;
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

    var sysconfig = parseCommand();

    initSysconfig(sysconfig);
    startExecScript(sysconfig);

});
function parseCommand() {
    program.version('0.0.1')
        .option('-m, --runMode', 'is production env or dev env?')
        .option('-s, --scriptName', 'exec javascript')
        .parse(process.argv);
    var runMode = program.args[0];
    var scriptName = program.args[1];

    var topoConfig = loadConfiguration(runMode);
    var sysconfig = {};
    sysconfig.topoConfig = topoConfig;
    sysconfig.scriptName = scriptName;
    sysconfig.program = program;

    global.nodeID = sysconfig.nodeId;
    //设置全局配置信息
    global["_g_topo"] = sysconfig.topoConfig;

    return sysconfig;

}

function loadConfiguration(runMode) {
    if (runMode == "production") {
        return utils.readJsonFileSync("conf/topo-production.json");
    } else if (runMode == "image") {
        return utils.readJsonFileSync("conf/topo-image.json");
    } else {
        return utils.readJsonFileSync("conf/topo-dev.json");
    }
}
