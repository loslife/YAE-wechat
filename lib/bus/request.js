var Q = require('q');
var request = require('request');
var async = require('async');
var logger = require("../utils/logger").getLogger();
var _ = require('underscore');

var serverInfo = {
    host: global["_g_clusterConfig"].baseurl
};

module.exports = ResourceRequest;

function ResourceRequest() {

}

ResourceRequest.prototype.getResource = getResource;
ResourceRequest.prototype.postResource = postResource;
ResourceRequest.prototype.putResource = putResource;
ResourceRequest.prototype.deleteResource = deleteResource;
ResourceRequest.prototype.setServerInfo = setServerInfo;
ResourceRequest.prototype.getServerInfo = getServerInfo;

function setServerInfo(host){
    this.host = host;
}

function getServerInfo(){
    return this.host ? this.host : serverInfo.host;
}

function getResource(resourcePath) {
    var deferred = Q.defer();
    var that = this;
    request({
        method: 'GET',
        uri: this.getServerInfo() + "/" + resourcePath,// http://192.168.1.117:5000/svc/graph/global/enterprise
        headers: {
            "xhr": "xhr",
            "Authorization": "Bearer SUPERTOKEN"
        },
        json: true
    }, function (error, response, body) {
        if (error) {
            logger.error(error);
            logger.error(body);
            logRequest(null, response);
            deferred.reject({
                errorCode: "10000100",
                detail: "调用 GET" + that.getServerInfo() + "/" + resourcePath + "失败"
            });
            return;
        }
        if (response.statusCode == 200) {

            if (0 == body.code) {
                deferred.resolve(body.result);
            } else {
                 if(body.error){
                     deferred.reject(body.error);
                 }else{
                     deferred.reject({
                         errorCode: "10000101",
                         detail: "调用 GET" + that.getServerInfo() + "/" + resourcePath + "失败，请求未返回正确的error对象"
                     });
                 }
            }
            return;
        }else{
            logger.error(error);
            logger.error(body);
            logRequest(null, response);
            deferred.reject({
                errorCode: "10000102",
                statusCode: response.statusCode,
                message: body,
                detail: "调用 POST " + that.getServerInfo() + "/" + resourcePath + "失败"
            });

        }
    });
    return deferred.promise;
}

function postResource(resourcePath, enterpriseId, record) {
    var deferred = Q.defer();
    var that = this;
//    delete record.id;
    request({
        method: 'POST',
        uri: this.getServerInfo() + "/" + resourcePath,
        body: record,
        headers: {
            "xhr": "xhr",
            "Authorization": "Bearer SUPERTOKEN",
            "custom-enterpriseId": enterpriseId
        },
        json: true
    }, function (error, response, body) {
        if (error) {
            logger.error(error);
            logger.error(body);
            logRequest(null, response);
            deferred.reject({
                errorCode: "10000102",
                detail: "调用 POST" + that.getServerInfo() + "/" + resourcePath + "失败"
            });
            return;
        }
        if (response.statusCode == 200) {
            if (0 == body.code) {
                deferred.resolve(body.result);
            } else {
                deferred.reject(body.error);
            }
            return;

        }

        logger.error(error);
        logger.error(body);
        logRequest(null, response);
        deferred.reject({
            errorCode: "10000103",
            statusCode: response.statusCode,
            message: body,
            detail: "调用 POST " + that.getServerInfo() + "/" + resourcePath + "失败"
        });

    });
    return deferred.promise;
}
function putResource(resourcePath, record) {
    var deferred = Q.defer();
    var that = this;
//    delete record.id;
    request({
        method: 'PUT',
        uri: this.getServerInfo() + "/" + resourcePath,
        body: record,
        headers: {
            "xhr": "xhr",
            "Authorization": "Bearer SUPERTOKEN"
        },
        json: true
    }, function (error, response, body) {
        if (error) {
            logger.error(error);
            logger.error(body);
            logRequest(null, response);
            deferred.reject({
                errorCode: "10000104",
                detail: "调用" + that.getServerInfo() + "/" + resourcePath + "失败"
            });
            return;
        }
        if (response.statusCode == 200) {
            if (0 == body.code) {
                deferred.resolve(body.result);
            } else {
                deferred.reject(body.error);
            }
            return;

        }

        logger.error(error);
        logger.error(body);
        logRequest(null, response);
        deferred.reject({
            errorCode: "10000105",
            message: body,
            detail: "调用 PUT " + that.getServerInfo() + "/" + resourcePath + "失败"
        })

    });
    return deferred.promise;

}
function deleteResource(resourcePath) {
    var deferred = Q.defer();
    var that = this;
    request({
        method: 'DELETE',
        uri: this.getServerInfo() + "/" + resourcePath,
        headers: {
            "xhr": "xhr",
            "Authorization": "Bearer SUPERTOKEN"
        }, json: true
    }, function (error, response, body) {
        if (error) {
            logger.error(error);
            logger.error(body);
            logRequest(null, response);
            deferred.reject({
                errorCode: "10000106",
                detail: "调用" + that.getServerInfo() + "/" + resourcePath + "失败"
            });
            return;
        }
        if (response.statusCode == 200) {

            if (0 == body.code) {
                deferred.resolve(body.result);
            } else {
                deferred.reject(body.error);
            }
            return;


        }

        logger.error(error);
        logger.error(body);
        logRequest(null, response);
        deferred.reject({
            errorCode: "10000107",
            statusCode: response.statusCode,
            detail: "调用 DELETE " + that.getServerInfo() + "/" + resourcePath + "失败"
        })

    });
    return deferred.promise;
}
