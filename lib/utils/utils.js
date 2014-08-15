var fs = require("fs");
var program = require('commander');
var _ = require('underscore');
var uuid = require('node-uuid');

module.exports = {
    readJsonFileSync: readJsonFileSync,
    readJsonFile: readJsonFile,
    md5: md5,
    parseCommand: parseCommand,
    endsWith: endsWith,
    cleanObject: _cleanObject,
    getDateString: _getDateString,
    getDateTimeString:_getDateTimeString,
    isXhr: isXhr,
    isCordovahr: isCordovahr,
    uid: uid,
    getUniqueId: getUniqueId
}

Date.prototype.nextMonth = nextMonth;
Date.prototype.prevMonth = prevMonth;
Date.prototype.getWeekOfYear = getWeekOfYear;
Date.prototype.getWeekOfMonth = getWeekOfMonth;
Date.prototype.Format = format;
Date.prototype.isSameDay = isSameDay;
Date.prototype.laterThan = laterThan;
Date.prototype.daysFromToday = daysFromToday;


//新的同步获取唯一ID的方法
function getUniqueId(enterpriseId){
    var id = uuid.v1();
    return enterpriseId+"-"+id;
}
/**
 * 是否是ajax请求
 * 所有跨域ajax请求的请求，必须在请求头中增加{xhr:"xhr"}
 * @param req
 * @returns {boolean}
 */
function isXhr(req){
    var xRequestedWith = req.headers['XRequestedWith'] || req.headers['x-requested-with'] || req.headers["X-Requested-With"];
    if(xRequestedWith && xRequestedWith.indexOf("XMLHttpRequest") != -1){
        return true;
    }
    if(req.headers["xhr"]){
        return true;
    }
    return false;
}
/**
 * 是否来自于Cordova应用的请求
 * @param req
 * @returns {boolean}
 */
function isCordovahr(req){
    if (req.headers && (req.headers['cordova'] || req.query['cordova'])) {
        return true;
    }
    //适配老版本，从app中跳来的请求没有referer字段
    if(req.headers && !(req.headers['cordova'] || req.query['cordova'])){
        if(!req.headers['referer']){
            return true;
        }
    }

    if(req.session.isCordovaApp){
        return true;
    }
    return false;
}




function readJsonFileSync(cfgPath) {
    var data = fs.readFileSync(cfgPath, "UTF-8");
    return JSON.parse(data);
}
function readJsonFile(cfgPath, callback) {
    fs.readFile(cfgPath, "UTF-8", function (err, data) {
        callback(err, JSON.parse(data));
    });
}
function md5(str) {
    var hash = require('crypto').createHash('md5');
    return hash.update(str + "").digest('hex');
}

function uid(len) {
    var buf = []
        , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        , charlen = chars.length;

    for (var i = 0; i < len; ++i) {
        buf.push(chars[getRandomInt(0, charlen - 1)]);
    }

    return buf.join('');
};

//删除提交数据中不需要提交的数据
function _cleanObject(object) {
    if ("$$hashKey" in object) {
        delete object.$$hashKey;
    }
    object.__proto__ = null;
    for (var p in object) {
        if (p.indexOf("_") == 0 || p.indexOf("$") == 0) {
            delete object[p];
        } else if (_.isObject(object[p])) {
            _cleanObject(object[p]);
        }
    }
}

/**
 * Return a random int, used by `utils.uid()`
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
 */

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseCommand() {
    program.version('0.0.1')
        .option('-m, --runMode', 'is production env or dev env?')
        .option('-n, --clusterName', 'started cluster Name')
        .parse(process.argv);
    var runMode = program.args[0];
    var clusterName = program.args[1];
    var topoConfig = loadConfiguration(runMode);
    var sysconfig = {};
    sysconfig.topoConfig = topoConfig;
    if (clusterName) {
        _.each(topoConfig.cluster, function (cluster) {
            if (cluster && cluster.name === clusterName) {
                sysconfig.clusterConfig = cluster;
                return false;
            }
        });
    }
    return sysconfig;

}

function loadConfiguration(runMode) {
    if (runMode == "production") {
        return readJsonFileSync("conf/topo-production.json");
    } else if (runMode == "image") {
        return readJsonFileSync("conf/topo-image.json");
    } else {
        return readJsonFileSync("conf/topo-dev.json");
    }
}

function endsWith(str, substring, position) {
    substring = String(substring);

    var subLen = substring.length | 0;

    if (!subLen)return true;//Empty string

    var strLen = str.length;

    if (position === void 0)position = strLen;
    else position = position | 0;

    if (position < 1)return false;

    var fromIndex = (strLen < position ? strLen : position) - subLen;

    return (fromIndex >= 0 || subLen === -fromIndex)
        && (
        position === 0
            // if position not at the and of the string, we can optimise search substring
            //  by checking first symbol of substring exists in search position in current string
            || str.charCodeAt(fromIndex) === substring.charCodeAt(0)//fast false
        )
        && str.indexOf(substring, fromIndex) === fromIndex
        ;
}

function _getDateString(millisecond) {
    var currentDate;
    if (millisecond) {
        if (typeof(millisecond) == "string") {
            millisecond = parseInt(millisecond);
        }
        currentDate = new Date(millisecond);
    } else {
        currentDate = new Date();
    }
    return currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getDate();
}

function prevMonth() {
    var thisMonth = this.getMonth();
    this.setMonth(thisMonth - 1);
    if (this.getMonth() != thisMonth - 1 && (this.getMonth() != 11 || (thisMonth == 11 && this.getDate() == 1)))
        this.setDate(0);
    return this;
}

function nextMonth() {
    var that = new Date(this);
    var thisMonth = that.getMonth();
    that.setMonth(thisMonth + 1);
    if (that.getMonth() != thisMonth + 1 && this.getMonth() != 0)
        that.setDate(1);
    return that;
}

function getWeekOfMonth(weekStart) {
    weekStart = (weekStart || 0) - 0;
    if (isNaN(weekStart) || weekStart > 6)
        weekStart = 0;

    var dayOfWeek = this.getDay();
    var day = this.getDate();
    return Math.ceil((day - dayOfWeek - 1) / 7) + ((dayOfWeek >= weekStart) ? 1 : 0);
}

function getWeekOfYear(weekStart) {
    weekStart = (weekStart || 0) - 0;
    if (isNaN(weekStart) || weekStart > 6)
        weekStart = 0;

    var year = this.getFullYear();
    var firstDay = new Date(year, 0, 1);
    var firstWeekDays = 7 - firstDay.getDay() + weekStart;
    var dayOfYear = (((new Date(year, this.getMonth(), this.getDate())) - firstDay) / (24 * 3600 * 1000)) + 1;
    return Math.ceil((dayOfYear - firstWeekDays) / 7) + 1;
}

function format(fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

function isSameDay(anotherDate) {

    var year = this.getFullYear();
    var month = this.getMonth();
    var day = this.getDate();

    var otherYear = anotherDate.getFullYear();
    var otherMonth = anotherDate.getMonth();
    var otherDay = anotherDate.getDate();

    return (year === otherYear && month === otherMonth && day === otherDay);
}

function laterThan(otherDate) {

    var time1 = this.getTime();
    var time2 = otherDate.getTime();

    return (time1 - time2 >= 0);
}

function daysFromToday(sDate) {
    var birthDate = new Date(sDate);
    var birthDay = new Date(birthDate.getYear(), birthDate.getMonth(), birthDate.getDate())
    var now = new Date();
    var today = new Date(now.getYear(), now.getMonth(), now.getDate());// today 0:00:00
    return Math.round((birthDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}
function _getDateTimeString(millisecond) {
    var currentDate;
    if (millisecond) {
        if (typeof(millisecond) == "string") {
            millisecond = parseInt(millisecond);
        }
        currentDate = new Date(millisecond);
    } else {
        currentDate = new Date();
    }
    return currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getDate();
}