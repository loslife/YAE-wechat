/**
 * Created with JetBrains WebStorm.
 * User: huangzhi
 * Date: 14-7-7
 * Time: 上午9:24
 * To change this template use File | Settings | File Templates.
 */

exports.getLastWeekStartDate = getLastWeekStartDate;
exports.getLastWeekEndDate = getLastWeekEndDate;
exports.getNextWeekStartDate = getNextWeekStartDate;
exports.getNextWeekEndDate = getNextWeekEndDate;
exports.getWeekStartDate = getWeekStartDate;
exports.getWeekEndDate = getWeekEndDate;
exports.getDateMillisecond = getDateMillisecond;
exports.getTodayStartMilli = getTodayStartMilli;
exports.maxDaysOfMonth = maxDaysOfMonth;
exports.getWeekDays = _getWeekDays;

exports.initMobiScrollDate = initMobiScrollDate;
exports.initMobiScrollDateTime = initMobiScrollDateTime;

Date.prototype.nextMonth = nextMonth;
Date.prototype.prevMonth = prevMonth;
Date.prototype.prevDay = prevDay;
Date.prototype.nextDay = nextDay;
Date.prototype.getWeekOfYear = getWeekOfYear;
Date.prototype.getWeekOfMonth = getWeekOfMonth;
Date.prototype.Format = format;
Date.prototype.isSameDay = isSameDay;
Date.prototype.laterThan = laterThan;
Date.prototype.daysFromToday = daysFromToday;

// 某月有多少天
function maxDaysOfMonth(date) {

    var year = date.getFullYear();
    var month = date.getMonth() + 1;

    var temp = new Date(year, month, 0);
    return temp.getDate();
}

//获取上周开始日期
function getLastWeekStartDate(now) {
    var nowDayOfWeek = now.getDay(); //今天本周的第几天
    var nowDay = now.getDate(); //当前日
    var nowMonth = now.getMonth(); //当前月
    var nowYear = now.getYear(); //当前年
    nowYear += (nowYear < 2000) ? 1900 : 0; //

    var weekStartDate = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek - 7);
    return weekStartDate;
}

//获取上周结束日期
function getLastWeekEndDate(now) {
    var nowDayOfWeek = now.getDay(); //今天本周的第几天
    var nowDay = now.getDate(); //当前日
    var nowMonth = now.getMonth(); //当前月
    var nowYear = now.getYear(); //当前年
    nowYear += (nowYear < 2000) ? 1900 : 0; //

    var weekEndDate = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek - 1);
    return weekEndDate;
}

//获取下周周开始日期
function getNextWeekStartDate(now) {
    var nowDayOfWeek = now.getDay(); //今天本周的第几天
    var nowDay = now.getDate(); //当前日
    var nowMonth = now.getMonth(); //当前月
    var nowYear = now.getYear(); //当前年
    nowYear += (nowYear < 2000) ? 1900 : 0; //

    var weekStartDate = new Date(nowYear, nowMonth, nowDay + (6 - nowDayOfWeek) + 1);
    return weekStartDate;
}

//获取下周结束日期
function getNextWeekEndDate(now) {
    var nowDayOfWeek = now.getDay(); //今天本周的第几天
    var nowDay = now.getDate(); //当前日
    var nowMonth = now.getMonth(); //当前月
    var nowYear = now.getYear(); //当前年
    nowYear += (nowYear < 2000) ? 1900 : 0; //

    var weekEndDate = new Date(nowYear, nowMonth, nowDay + (6 - nowDayOfWeek) + 7);
    return weekEndDate;
}

//获得本周的开始日期
function getWeekStartDate(now) {
    var nowDayOfWeek = now.getDay(); //今天本周的第几天
    var nowDay = now.getDate(); //当前日
    var nowMonth = now.getMonth(); //当前月
    var nowYear = now.getYear(); //当前年
    nowYear += (nowYear < 2000) ? 1900 : 0; //
    var weekStartDate = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek);
    return weekStartDate;
}

//获得本周的结束日期
function getWeekEndDate(now) {
    var nowDayOfWeek = now.getDay(); //今天本周的第几天
    var nowDay = now.getDate(); //当前日
    var nowMonth = now.getMonth(); //当前月
    var nowYear = now.getYear(); //当前年
    nowYear += (nowYear < 2000) ? 1900 : 0; //
    var weekEndDate = new Date(nowYear, nowMonth, nowDay + (6 - nowDayOfWeek));
    return weekEndDate;
}

// 1988-8-8 => 1988/8/8 => 毫秒数
function getDateMillisecond(date) {
    var dateStr = date.replace(new RegExp("-", "gm"), "/");
    var myDate = new Date(dateStr);
    return myDate.getTime();
}


function getTodayStartMilli() {

    var now = new Date();

    var year = now.getFullYear();
    var month = now.getMonth();
    var date = now.getDate();

    return new Date(year, month, date).getTime();
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

function prevDay() {
    return new Date(this.getTime()-24*60*60*1000);
}

function nextDay() {
    return new Date(this.getTime()+24*60*60*1000);
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

function initMobiScrollDate(id, options) {
    var defaultOpt = {
        preset: 'date',
        theme: 'android-ics light', //皮肤样式
        display: 'bubble', //显示方式
        mode: 'scroller', //日期选择模式
        dateFormat: "yy-mm-dd",
        dateOrder: "yymmdd",
        lang: 'zh'
    };
    var optDate = $.extend(defaultOpt, options);

    $("#" + id).val('').scroller('destroy').scroller(optDate);
}

function initMobiScrollDateTime(id, options) {
    var currYear = new Date().getFullYear();
    var defaultOpt = {
        preset: 'datetime',
        stepMinute: 10,
        theme: 'android-ics light',
        display: 'bubble',
        mode: 'scroller',
        dateFormat: "yy-mm-dd",
        dateOrder: "yymmdd",
        lang: 'zh',
        endYear: currYear + 10
    };
    var optDateTime = $.extend(defaultOpt, options);
    $("#" + id).mobiscroll(optDateTime);
}

function _getWeekDays(curr) {
    var nowDayOfWeek = curr.getDay(); //今天本周的第几天
    var nowDay = curr.getDate(); //当前日
    var nowMonth = curr.getMonth(); //当前月
    var nowYear = curr.getYear(); //当前年
    nowYear += (nowYear < 2000) ? 1900 : 0; //
    var day1 = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek);
    var day2 = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek + 1);
    var day3 = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek + 2);
    var day4 = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek + 3);
    var day5 = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek + 4);
    var day6 = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek + 5);
    var day7 = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek + 6);
    return [day1, day2, day3, day4, day5, day6, day7];
}