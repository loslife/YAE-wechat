$(function(){

    WeixinApi.ready(function(Api) {

        var enterpriseId = $("#enterprise_id").val();
        var festivalId = $("#festival_id").val();

        var shareURL = "http://121.40.75.73/svc/wsite/" + enterpriseId + "/getPresent?fid=" + festivalId;

        var wxData = {
            "imgUrl" : "http://121.40.75.73/resource/share_thumb.jpg",
            "link" : shareURL,
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
    });
});
