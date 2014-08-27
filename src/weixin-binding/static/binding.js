$(function(){

    $("#getSecurityCode").tap(function(){

        var phone = $("#phone").val();

        if(!phone){
            alert("请输入手机号");
            return;
        }

        var url = g_env.security_code_url + phone + "?u=weixin_binding";

        $.get(url, function(response){
            alert("验证码已发送到您的手机");
        });
    });

    $("#btn_binding").tap(function(){

        var phone = $("#phone").val();
        var secure_code = $("#code").val();

        if(!phone || !secure_code){
            alert("输入不能为空");
            return;
        }

        var url = g_env.check_code_url + phone + "?u=weixin_binding&c=" + secure_code;
        $.get(url, function(response){

            var code = response.code;
            if(code !== 0){
                alert("验证码错误");
                return;
            }

            var enterprise_id = $("#enterprise_id").text();
            var open_id = $("#open_id").text();

            var bindingURL = g_env.binding_url + enterprise_id + "/doBinding";
            $.post(bindingURL, { open_id: open_id, phone: phone }, function(response){
                alert(response);
            })
        });
    });

});