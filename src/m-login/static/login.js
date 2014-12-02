$(function () {

    $("#getSecurityCode").getCodeButton("weixin_login");

    $("#btn_binding").click(function () {

        var self = this;

        $(this).prop("disabled", true);

        var phone = $("#phone").val();
        var secure_code = $("#code").val();

        if(!phone || !secure_code) {
            alert("输入不能为空");
            $(this).prop("disabled", false);
            return;
        }

        var url = g_env.check_code_url + phone + "?u=weixin_login&c=" + secure_code;
        $.get(url, function (response) {

            if (response.code !== 0) {
                alert("验证码错误");
                $(self).prop("disabled", false);
                return;
            }

            var enterprise_id = $("#enterprise_id").text();
            var app_id = $("#app_id").text();

            var url = "/svc/wsite/" + app_id + "/" + enterprise_id + "/login";

            $.post(url, {phone: phone}, function (response) {

                if (response.code !== 0) {

                    alert("没有找到你的资料，询问店主，在美业管家中是否有你的会员信息。");
                    $(self).prop("disabled", false);
                } else {

                    $("#binding_success_tip").show();
                    setTimeout(function(){
                        window.location = "member";
                    },2000);
                }
            });
        });
    });
});


