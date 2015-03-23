var wx = require("wechat-toolkit");
var preload_member = require("./preload-member");

exports.loadMiddleWare = loadMiddleWare;

function loadMiddleWare(app, clusterConfig) {

    app.use("/svc/wsite", preload_member);
    app.use("/svc/weixinInterface", wx.xml_parser());
    app.use("/svc/weixinmeiyeguanjia", wx.xml_parser());
}
