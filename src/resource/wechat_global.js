var g_env = {
    security_code_url: global["_g_server"].serviceurl +  "/getCode/",
    check_code_url: global["_g_server"].serviceurl + "/checkCode/",
    binding_url: global["_g_server"].wxserviceurl + "/wsite/"
};

// button点击获取验证码
$.fn.getCodeButton = function(usage){

    usage = usage || "weixin_binding";

    this.click(function(){

        var self = this;

        $(this).prop("disabled", true);

        var phone = $("#phone").val();

        if(!phone){
            alert("请输入手机号");
            $(this).prop("disabled", false);
            return;
        }

        var url = g_env.security_code_url + phone + "?u=" + usage;

        var count = 60;
        var intervalTag;

        $(this).text("正在发送");

        $.get(url, function(response){
            alert("验证码已发送到您的手机");
            intervalTag = setInterval(countDown, 1000);
        });

        function countDown(){

            count --;

            if(count > 0){
                $(self).text(count);
                return;
            }

            $(self).prop("disabled", false);
            $(self).text("获取验证码");
            clearInterval(intervalTag);
        }
    });
};