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

            var enterprise_id = $("#enterprise_id").text();
            var open_id = $("#open_id").text();
            var app_id = $("#app_id").text();

            var bindingURL = g_env.binding_url + app_id + "/" + enterprise_id + "/doBinding";
            $.post(bindingURL, { open_id: open_id, phone: phone }, function(response){

                var code = response.code;

                if(code !== 0){
                    var errorCode = response.error.errorCode;
                    if(errorCode === 501){
                        alert("会员不存在");
                    }else{
                        alert("绑定失败，请联系客服");
                    }
                    $(self).prop("disabled", false);
                    return;
                }

                $("#binding_success_tip").show();
                setTimeout(function(){
                    location.href = g_env.binding_url + app_id + "/" + enterprise_id + "/member?m_id=" + response.member_id;
                },2000);
            });
        });
    });
});