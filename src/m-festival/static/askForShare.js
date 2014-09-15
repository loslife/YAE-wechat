$(function(){

    $("#btn_share").hide();
    $("#share_tips").hide();

    // 如果是在微信中打开
    WeixinApi.ready(function(Api) {

        $("#btn_share").show().tap(function(){
            $("#share_tips").show().tap(function(){
                $(this).hide();
            });
        });

        attachShareCallback();

        function attachShareCallback(){

            var enterpriseId = $("#enterprise_id").text();
            var festivalId = $("#festival_id").text();

            var wxData = {
                "imgUrl" : "http://121.40.75.73/resource/share_thumb.jpg",
                "link" : "http://121.40.75.73/svc/wsite/" + enterpriseId + "/route?fid=" + festivalId,
                "desc" : "优惠活动描述",
                "title" : "优惠活动标题"
            };

            var wxCallbacks = {

                confirm: function(resp) {

                    var url = "/svc/wsite/" + enterpriseId + "/getPresent?fid=" + festivalId;

                    $.post(url, {}, function (response) {

                        var status = response.result.status;
                        if(status === 1){
                            location.href = "done?duplicate=false";
                        }else{
                            location.href = "done?duplicate=true";
                        }
                    });

                    var shareCountURL = "/svc/wsite/" + enterpriseId + "/countShare?fid=" + festivalId;
                    $.post(shareCountURL, {}, function(response){});
                }
            };

            Api.shareToTimeline(wxData, wxCallbacks);
        }
    });
});
