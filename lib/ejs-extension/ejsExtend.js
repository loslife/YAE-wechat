/**
 * Created with JetBrains WebStorm.
 * User: ganyue
 * Date: 14-7-31
 * Time: 下午3:20
 * To change this template use File | Settings | File Templates.
 */

exports.init = init;
var ejs = require('ejs');
var moment = require('moment');

function init(app){
    app.locals.dateFormat = function (obj,format) {
        if (format == undefined) {
            format = 'YYYY-MM-DD HH:mm:ss';
        }
        var ret = moment(obj).format(format);
        return ret == 'Invalid date' ? '0000-00-00 00:00:00' : ret;

        return moment(date).format('YYYY年MM月DD日hh:mm:ss dddd');
    };
    app.locals.toJson = function (obj) {
        return JSON.stringify(obj);
    };
}
