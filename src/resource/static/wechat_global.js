var g_env = {
    security_code_url: "http://192.168.1.124:3000/svc/getCode/",
    check_code_url: "http://192.168.1.124:3000/svc/checkCode/",
    binding_url: "http://192.168.1.124:5000/svc/wsite/"
};

function adjustHeight() {
    $("body .content").height($(window).height() - $("body .menu").height());
}
