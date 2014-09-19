$(function () {

    $("#getSecurityCode").tap(function () {

        var phone = $("#input_phone").val();

        if (!phone) {
            alert("请输入手机号");
            return;
        }

        var url = g_env.security_code_url + phone + "?u=weixin_login";

        $.get(url, function (response) {
            alert("验证码已发送到您的手机");
        });
    });

    $("#btn_submit").tap(function () {

        var phone = $("#input_phone").val();
        var secure_code = $("#code").val();

        if (!phone || !secure_code) {
            alert("输入不能为空");
            return;
        }

        var url = g_env.check_code_url + phone + "?u=weixin_login&c=" + secure_code;
        $.get(url, function (response) {
            if (response.code !== 0) {
                alert("登陆失败，请检查手机号是否正确");
            }
            else {
                window.location = "member";
            }

            var enterprise_id = $("#enterprise_id").text();

            var url = "/svc/wsite/" + enterprise_id + "/login";

            $.post(url, {phone: phone}, function (response) {

                if (response.code !== 0) {
                    alert("登陆失败，请检查手机号是否正确");
                } else {
                    window.location = "member";
                }
            });
        });
    });
});


