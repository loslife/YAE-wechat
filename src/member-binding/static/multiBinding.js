$(function(){

    var PARAM_SPLITTER = "___";

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

            var open_id = $("#open_id").text();
            var app_id = $("#app_id").text();
            var bindingURL = g_env.binding_url + app_id + "/bindingAll";
            $.post(bindingURL, {open_id: open_id, phone: phone}, function(response){

                var code = response.code;

                if(code !== 0){
                    alert("绑定失败");
                    $(self).prop("disabled", false);
                    return;
                }

                var bindings = response.result;

                var dist = "";

                if(bindings.length === 0){

                    dist = "/svc/wsite/memberNotFound";
                }else if(bindings.length === 1){

                    if(bindings[0].master_id){
                        var enterprise_id = bindings[0].master_id;
                        var store_type = "chain";
                    }else{
                        var enterprise_id = bindings[0].enterprise_id;
                        var store_type = "single";
                    }

                    var member_id = bindings[0].member_id;
                    dist = "/svc/wsite/" + app_id + "/" + enterprise_id + "/shop?m_id=" + member_id + "&store_type=" + store_type;
                }else{

                    var enterprises = [];
                    var members = [];

                    for(var i = 0; i < bindings.length; i++){
                        if(bindings[0].master_id){
                            enterprises.push(bindings[i].master_id);
                        }else{
                            enterprises.push(bindings[i].enterprise_id);
                        }
                        members.push(bindings[i].member_id);
                    }

                    var params = "eid=" + enterprises.join(PARAM_SPLITTER) + "&mid=" + members.join(PARAM_SPLITTER);
                    dist = "/svc/wsite/selection?" + params;
                }

                $("#binding_success_tip").show();
                setTimeout(function(){
                    location.href = dist;
                },2000);
            });
        });
    });
});


