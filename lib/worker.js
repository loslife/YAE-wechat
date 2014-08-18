var logger = require("./utils/logger").getLogger(),
    flash = require('connect-flash'),
    timeout = require('./express-middleware/connect-timeout'),
    express = require('express'),
    expressext = require("./express-middleware/expressext"),
    MongoStore = require('connect-mongo')(express),
    passport = require('passport'),
    _ = require('underscore'),
    globalext = require('./globalext'),
    partials = require('./express-middleware/partials'),
    Loader = require('loader'),
    appmgr = require('./appmgr'),
    utils = require('./utils/utils'),
    ejsExtend = require('./ejs-extension/ejsExtend'),
    self = this,
    wx = require("wechat-toolkit"),
    check_member = require("./express-middleware/check-member");


var domain = require('domain');


function output(str) {
    console.log(str);
}

function main(fn) {
    fn();
}

var GRACE_EXIT_TIME = 1500;

var app = null;
var exitTimer = null;
var childReqCount = 0;

function allowCrossDomain(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Origin, Accept, Content-Type, X-HTTP-Method, X-HTTP-METHOD-OVERRIDE,XRequestedWith,X-Requested-With,xhr,custom-enterpriseId');
    res.setHeader('Access-Control-Max-Age', '10');
    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.end("POST, GET, PUT, DELETE");
    }
    else {
        next();
    }
};

function statistics(req, res, next) {
    var beginTime = (new Date()).getTime();
    var requestId = nodeID + "-" + beginTime;
    res.setHeader("beginTime", beginTime);
    res.setHeader("requestId", requestId);
    if (req.user) {
        res.writeHead(200, {'USERNAME': req.user.username});
    }
    next();
}

function setCommonHeader(req, res, next) {
    res.setHeader('Keep-Alive', 'timeout=1, max=100');
    next();

}

void main(function () {
    app = express();
    // 覆盖express的视图查找逻辑，使其支持多个视图文件
    // 用以支持每个应用可以指定自己的express视图目录
    expressext.enableMultipleViewFolders(app.settings);
    app.set('views', [__dirname + '/views']);
    app.set('view engine', 'ejs');
    app.use(partials());
    app.locals({
        config: self.clusterConfig,
        Loader: Loader
    });
    function initExpress() {

        app.use(express.bodyParser())
            .use(express.compress())
            .use(allowCrossDomain)
            .use(express.cookieParser())
            .use(express.methodOverride())
            .use(flash())
            .use(timeout({
                time: 30 * 60 * 1000
            }))
            .use("/svc/wsite", express.session({
                store: new MongoStore({
                    url: 'mongodb://' + global['_g_topo'].dataServer.mongodb.connectionurl + '/wsite_session'
                }),
                cookie: {
                    maxAge: 60 * 60 * 1000
                },
                secret: '1234567890QWERTY'
            }))
            .use("/svc/wsite", check_member)
            .use("/svc/weixin", wx.xml_parser())
            .use(statistics);

        app.get('/favicon.ico', function (req, res, next) {
            res.end("");
        });
        ejsExtend.init(app);
    }

    process.on('message', function (m, handle) {
        if (handle) {
            global.nodeID = m.nodeId;
            self.clusterConfig = m.clusterConfig;
            //设置全局配置信息
            global["_g_topo"] = m.topoConfig;
            global["_g_clusterConfig"] = m.clusterConfig;
            //app.use("/", express.static(__dirname + "/../fontend"));
            initExpress();

            var appManager = new appmgr.ApplicationManager(self.clusterConfig.applications);
            appManager.start(app);
            app.use(function (err, req, res, next) {
                logger.error(JSON.stringify(err));
                var errHander = appManager.errorHanderMap[err.errorCode];
                if (errHander) {
                    if (!errHander.returnTo) {
                        errHander.returnTo = global["_g_clusterConfig"].baseurl + "/portal/index.html";
                        errHander.returnToMsg = "返回登录";
                    }
                    if (utils.isXhr(req)) {
                        res.end(JSON.stringify(wrapError(err, errHander)));
                    } else {
                        if (errHander.templ) {
                            res.render(errHander.templ, _.extend(err, errHander));
                        } else {
                            res.end(JSON.stringify(wrapError(err, errHander)));
                        }

                    }
                } else {
                    if (utils.isXhr(req)) {
                        res.end(JSON.stringify(wrapError(err, errHander)));
                    } else {
                        res.render("error", {error: err,layout:"error_layout"});
                    }

                }
                function wrapError(err, errHander) {
                    var responseObject = err;
                    if (err && err.code == undefined) {
                        responseObject = {
                            code: 1,
                            error: _.extend(err, errHander)
                        }
                    }
                    return responseObject;
                }
            });

            app.listen(handle, function (err) {
                if (err) {
                    output('worker listen error');
                } else {
                    process.send({'listenOK': true});
                    output('worker listen ok');
                }
            });
        }
        if (m.status == 'update') {
            process.send({'status': process.memoryUsage()});
        }
    });

    output('worker is running...');
});

