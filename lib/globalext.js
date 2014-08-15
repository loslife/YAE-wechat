global.FRAMEWORKPATH = __dirname;
global.doError = doError;
global.doResponse = doResponse;
global.logRequest = logRequest;
global.assembleResultObject = assembleResultObject;
global.wrapResult = assembleResultObject;

var logger = require("./utils/logger").getLogger();

function doError(callback, err) {
    logger.error(err);
    callback(err);
}
function doResponse(req, res, jsonObj) {
    var executeTime = new Date().getTime() - res.getHeader("beginTime");
    var requestId = res.getHeader("requestId");
    if(!jsonObj){
        jsonObj = {
            code:0,
            result:{}
        }
    }else if(jsonObj && jsonObj.code == undefined){
        jsonObj = {
            code:0,
            result:jsonObj
        }
    }
    var jsons = JSON.stringify(jsonObj);
    var statusCode = 200;
    if(res.statusCode){
        statusCode = res.statusCode;
    }
    res.writeHead(statusCode, {'executeTime': executeTime, 'Content-Type': "application/json;charset=UTF-8"});
    res.end(jsons);

}
function logRequest(req, res) {
    if (req) {
        logger.error("request body:" + JSON.stringify(req.body));
        logger.error("request header:" + JSON.stringify(req.headers));
        logger.error("request params:" + JSON.stringify(req.params));
        logger.error("request query:" + JSON.stringify(req.query));
    }
    if (res) {
        logger.error("response.statusCode:" + res.statusCode);
        logger.error("request body:" + JSON.stringify(res.body));
        logger.error("request header:" + JSON.stringify(res.headers));
        logger.error("request params:" + JSON.stringify(res.params));
        logger.error("request query:" + JSON.stringify(res.query));
    }
}


function assembleResultObject(err, result) {

    var response = {};
    if (err) {
        response.code = 1;
        response.error = err
    } else {
        response.code = 0;
        response.result = result;
    }
    return response;
}
