/**
 * 应用管理
 */
var fs = require("fs"),
    _ = require("underscore"),
    logger = require("./utils/logger").getLogger(),
    express = require('express'),
    passport = require('passport'),
    utils = require("./utils/utils");

function ApplicationManager(applist) {
    if (_.isArray(applist)) {
        this.applist = applist;
    } else {
        this.applist = [];
    }
}
_.extend(ApplicationManager.prototype, {
    start: start,
    stop: stop,
    reload: reload
})

module.exports = {
    ApplicationManager: ApplicationManager,
    Application: Application
}


/**
 * 加载应用启动
 */
function start(router) {
    var that = this;
    logger.debug("服务应用开始加载");
    // 如果是开发环境，映射apk path
    if (global["_g_topo"].env == "dev") {
        router.use("/apk", express.static(__dirname + "/../apk/"));
    }
    _.each(this.applist, function (appName) {
        var application = new Application(appName, router);

        application.loadAppMeta();

        process.nextTick(function () {
            application.loadService();
        });

        // 只有开发环境才用node加载静态文件，生产环境通过nginx加载
        if (global["_g_topo"].env == "dev") {
            process.nextTick(function () {
                application.loadStatic();
            });
        }

        process.nextTick(function () {
            application.loadExpressView();
        });

        process.nextTick(function () {
            application.loadErrorhandler(that);
        });
    });

    //监听所有应用启动状态，如果全部启动成功发布systemOnReady事件
}

/**
 * 停止应用
 */
function stop() {

}

function reload() {

}

function Application(name, router) {
    this.appName = name;
    this.router = router;
}


Application.prototype.loadAppMeta = function () {
    var that = this;

    if (global["_g_topo"].env == "dev") {
        that.appPath = "src/" + that.appName;
    } else {
        that.appPath = "webapps/" + that.appName;
    }

    if (!fs.existsSync(that.appPath)) {
        console.log(that.appPath + " not exists!");
        return false;
    }

    that.METAINF = utils.readJsonFileSync(that.appPath + "/META-INF.json");

    return true;
}
Application.prototype.loadService = function () {

    var that = this;
    var serviceList = that.METAINF.services;
    if (that.METAINF && serviceList && _.isArray(serviceList)) {

        _.each(serviceList, function (service) {
            var impl = service.impl,
                method = service.method,
                path = service.path,
                name = service.name,
                middleware = service.middleware;

            var defaultServicePath = "../" + that.appPath + "/service/";
            var filePath = impl.substring(0, impl.lastIndexOf(".")).replace(/\./, "/");
            var implFnName = impl.substring(impl.lastIndexOf(".") + 1);

            var implMd = require(defaultServicePath + filePath);// 这里执行了require，把portal/service/downloadService.js加载进来
            if (implMd && path && that.router[method]) {
                if (_.isFunction(implMd[implFnName]) || _.isArray(implMd[implFnName])) {

                    path = "/svc" + path;
                    var handler = implMd[implFnName];

                    if(middleware){

                        var middlewareFilePath = middleware.substring(0, impl.lastIndexOf(".")).replace(/\./, "/");
                        var middlewareFnName = middleware.substring(middleware.lastIndexOf(".") + 1);
                        var middlewareModule = require(defaultServicePath + middlewareFilePath);
                        var middleHandler = middlewareModule[middlewareFnName];

                        if (service.auth == false) {
                            that.router[method].call(that.router, path, [middleHandler], handler);
                        } else if (service.auth == "digest") {
                            that.router[method].call(that.router, path, [passport.authenticate('digest', { session: false}), middleHandler], handler);
                        } else if (service.auth == "yilos-session") {
                            that.router[method].call(that.router, path, [passport.authenticate('yilos-session', { session: false,login:service.login}), middleHandler], handler);
                        } else {
                            that.router[method].call(that.router, path, [passport.authenticate('bearer', { session: true, passReqToCallback: true }), middleHandler], handler);
                        }

                    }else{

                        if (service.auth == false) {
                            that.router[method].call(that.router, path, handler);
                        } else if (service.auth == "digest") {
                            that.router[method].call(that.router, path, passport.authenticate('digest', { session: false}), handler);
                        } else if (service.auth == "yilos-session") {
                            that.router[method].call(that.router, path, passport.authenticate('yilos-session', { session: false,login:service.login}), handler);
                        } else {
                            that.router[method].call(that.router, path, passport.authenticate('bearer', { session: true, passReqToCallback: true }), handler);
                        }
                    }
                }
            } else {
                logger.warn(name + " register fail,path:" + path);
            }
        });
    }else{
        console.log(this.appName);
    }
}
Application.prototype.loadStatic = function () {
    var that = this;
    var staticList = that.METAINF.statics;
    if (staticList && _.isArray(staticList)) {
        _.each(staticList, function (staticd) {

            var path = staticd.path;
            var name = staticd.name;
            var dir = staticd.dir || "/static/";

            var staticResourceLocation = __dirname + "/../" + that.appPath + dir;

            if (path) {
                that.router.use(path, express.static(staticResourceLocation));
            } else {
                logger.warn(name + " register fail,dir: " + staticResourceLocation);
            }
        });
    }
}
/**
 * 注册每个应用中声明的express ejsView
 */
Application.prototype.loadExpressView = function () {
    var that = this;
    var ejsviewList = that.METAINF.ejsviews;
    if (ejsviewList && _.isArray(ejsviewList)) {
        _.each(ejsviewList, function (ejsd) {
            var dir = ejsd.dir;

            if (dir) {
                var views = that.router.get("views");
                if (_.isArray(views)) {
                    views.push(__dirname + "/../" + that.appPath + dir)
                }
                that.router.set('views', views);
            } else {
                logger.warn(dir + " register fail,dir:" + __dirname + "/../" + that.appPath + dir);
            }
        });
    }
}

/**
 * 加载系统错误页面处理信息
 * <errorCode,errorHanderDef>
 * 将系统中所有加载模块的错误处理信息加载到ApplicationManager.errorHanderMap中
 */
Application.prototype.loadErrorhandler = function (ApplicationManager) {
    var that = this;
    var errorHandlers = that.METAINF.errorHandler;
    var errorMap = {

    };
    if (errorHandlers && _.isArray(errorHandlers)) {
        _.each(errorHandlers, function (errdef) {
            errorMap[errdef.errorCode] = errdef;
        });
    }
    if (!ApplicationManager.errorHanderMap) {
        ApplicationManager.errorHanderMap = {

        };
    }
    ApplicationManager.errorHanderMap = _.extend(ApplicationManager.errorHanderMap, errorMap);
}
