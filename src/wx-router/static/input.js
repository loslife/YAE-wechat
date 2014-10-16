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

            var open_id = $("#open_id").text();

            var bindingURL = g_env.binding_url + "bindingAll";
            $.post(bindingURL, {open_id: open_id, phone: phone}, function(response){

                var code = response.code;

                if(code !== 0){
                    alert("绑定失败");
                    return;
                }

                var bindings = response.result;

                if(bindings.length === 0){
                    alert("没有找到您的手机号");
                    return;
                }

                if(bindings.length === 1){
                    var enterprise_id = bindings[0].enterprise_id;
                    var member_id = bindings[0].member_id;
                    location.href = "../" + enterprise_id + "/shop?m_id=" + member_id;
                    return;
                }

                var enterprises = [];
                var members = [];

                _.each(bindings, function(item){
                    enterprises.push(item.enterprise_id);
                    members.push(item.member_id);
                });

                var params = "eid=" + enterprises.join("##") + "&mid=" + members.join("##");
                location.href = "selection?" + params;
            });
        });
    });
});