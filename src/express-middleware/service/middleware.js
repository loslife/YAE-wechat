/**
 * Created with JetBrains WebStorm.
 * User: huangzhi
 * Date: 14-9-16
 * Time: 下午3:59
 * To change this template use File | Settings | File Templates.
 */
var wx = require("wechat-toolkit")
    ,session_refresh = require("./session-refresh")
    ,preload_member = require("./preload-member");
exports.loadMiddleWare = loadMiddleWare;
function loadMiddleWare(app,clusterConfig) {
    app.use("/svc", session_refresh);
    app.use("/svc/wsite", session_refresh);
    app.use("/svc/wsite", preload_member);
    app.use("/svc/weixin", wx.xml_parser());
}
