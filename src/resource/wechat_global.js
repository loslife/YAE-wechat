var g_env = {
    security_code_url: global["_g_server"].serviceurl +  "/getCode/",
    check_code_url: global["_g_server"].serviceurl + "/checkCode/",
    binding_url: global["_g_server"].wxserviceurl + "/wsite/"
};

// button点击获取验证码
$.fn.getCodeButton = function(){

    this.click(function(){

        var self = this;

        $(this).prop("disabled", true);

        var phone = $("#phone").val();

        if(!phone){
            alert("请输入手机号");
            $(this).prop("disabled", false);
            return;
        }

        var url = g_env.security_code_url + phone + "?u=weixin_binding";

        var count = 60;
        var intervalTag;

        $.get(url, function(response){
            alert("验证码已发送到您的手机");
            intervalTag = setInterval(countDown, 1000);
        });

        function countDown(){

            count --;

            if(count > 0){
                $(self).text(count + "秒后可重新获取");
                return;
            }

            $(self).prop("disabled", false);
            $(self).text("获取验证码");
            clearInterval(intervalTag);
        }
    });
};