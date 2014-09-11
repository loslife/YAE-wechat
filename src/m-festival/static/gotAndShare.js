$(function(){

    alert(YLS.openInWeixin());

    WeixinApi.ready(function(Api) {

        var enterpriseId = $("#enterprise_id").text();
        var festivalId = $("#festival_id").text();

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
