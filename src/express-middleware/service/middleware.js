var wx = require("wechat-toolkit");
var session_refresh = require("./session-refresh");
var preload_member = require("./preload-member");

exports.loadMiddleWare = loadMiddleWare;

function loadMiddleWare(app, clusterConfig) {

    app.use("/svc/wsite", session_refresh);
    app.use("/svc/wsite", preload_member);
    app.use("/svc/weixinInterface", wx.xml_parser());
}
