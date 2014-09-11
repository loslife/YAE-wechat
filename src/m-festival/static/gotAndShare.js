$(function(){

    $("#btn_share").hide();

    // 如果是在微信中打开
    WeixinApi.ready(function(Api) {

        $("#btn_share").show().tap(function(){
            alert("点击右上角，分享到朋友圈");
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
                    alert("分享成功");
                }
            };

            Api.shareToFriend(wxData, wxCallbacks);
            Api.shareToTimeline(wxData, wxCallbacks);
        }
    });
});
