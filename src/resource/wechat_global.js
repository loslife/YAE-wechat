var g_env = {
    security_code_url: "http://192.168.1.106:3000/svc/getCode/",
    check_code_url: "http://192.168.1.106:3000/svc/checkCode/",
    binding_url: "http://192.168.1.106:5000/svc/wsite/"
};

var YLS = {};

YLS.getQueryString = function(name){

    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);

    if (r != null) {
        return unescape(r[2]);
    }
    return null;
}

YLS.openInWeixin = function(){
    return /MicroMessenger/i.test(navigator.userAgent);
}

$(function () {
    var menuH = $("#menu").height();
    var windowH = window.innerHeight;

    $("#content").height(windowH - menuH);
});