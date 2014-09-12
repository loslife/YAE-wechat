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
                "link" : "http://121.40.75.73/svc/wsite/" + enterpriseId + "/getPresent?fid=" + festivalId,
                "desc" : "优惠活动描述",
                "title" : "优惠活动标题"
            };

            var wxCallbacks = {

                confirm: function(resp) {

                    var url = "/svc/wsite/" + enterpriseId + "/shareBonus?fid=" + festivalId;

                    var shareId = $("#share_id").text();
                    var sharePhone = $("#share_phone").text();

                    var postData = {};
                    if(shareId && shareId !== "undefined"){
                        postData.share_id = shareId;
                    }else{
                        postData.share_phone = sharePhone;
                    }

                    $.post(url, postData, function (response) {});// nothing to do with ajax response
                }
            };

            Api.shareToFriend(wxData, wxCallbacks);
            Api.shareToTimeline(wxData, wxCallbacks);
        }
    });
});
