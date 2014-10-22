$(function(){

    $("#getSecurityCode").getCodeButton();

    $("#btn_binding").click(function(){

        var self = this;

        $(this).prop("disabled", true);

        var phone = $("#phone").val();
        var secure_code = $("#code").val();

        if(!phone || !secure_code){
            alert("输入不能为空");
            $(this).prop("disabled", false);
            return;
        }

        var url = g_env.check_code_url + phone + "?u=weixin_binding&c=" + secure_code;
        $.get(url, function(response){

            var code = response.code;
            if(code !== 0){
                alert("验证码错误");
                $(self).prop("disabled", false);
                return;
            }

            var queryURL = g_env.binding_url + "findEnterpriseByPhone?phone=" + phone;
            $.get(queryURL, function(response){

                var code = response.code;
                if(code !== 0){
                    alert("登陆失败");
                    $(self).prop("disabled", false);
                    return;
                }

                var result = response.result;
                if(result.length === 0){
                    alert("手机号不存在");
                    $(self).prop("disabled", false);
                    return;
                }

                $(self).prop("disabled", false);
                $("#binding_success_tip").show();

                setTimeout(function(){
                    location.href = "./" + result[0].eid + "/shop?m_id=" + result[0].mid;
                },2000);
            });
        });
    });
});