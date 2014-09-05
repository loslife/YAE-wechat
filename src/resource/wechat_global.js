var g_env = {
    security_code_url: "http://192.168.1.130:3000/svc/getCode/",
    check_code_url: "http://192.168.1.130:3000/svc/checkCode/",
    binding_url: "http://192.168.1.130:5000/svc/wsite/"
};

$(function () {
    var menuH = $("#menu").height();
    var windowH = window.innerHeight;

    $("#content").height(windowH - menuH);
});