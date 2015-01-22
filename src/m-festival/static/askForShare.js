$(function(){
    var enterpriseId = $("#enterprise_id").text();
    var festivalId = $("#festival_id").text();
    var storeName = $(".store-name").text();
    var festivalTitle = $("#f_title").text();
    var festivalDesc = $("#f_desc").text();
    var app_id = $("#app_id").text();
    var nowUrl=window.location.href;
    var signUrl="/svc/wsite/" + app_id + "/" + enterpriseId + "/festival/sign";
    var signature=null;
    init();
    var ua = window.navigator.userAgent.toLowerCase();
    if(ua.match(/MicroMessenger/i) == 'micromessenger'){
        initWx();
    }
    function init(){
        $("#btn_share").prop("disabled", false);

        $("#back").on("click", function ($even) {
            location.href = "../festival";
            $even.stopPropagation();
        });
    }

    function initWx(){

        $.post(signUrl, {url:nowUrl}, function(response){
            signature=response.sign;
            wx.config({
                debug: false,
                appId: app_id,
                timestamp: 1421670363,
                nonceStr: 'q2XFkAiqofKmi1Y2',
                signature: signature,
                jsApiList: [
                    'onMenuShareTimeline',
                    'onMenuShareAppMessage'
                ]
            });
            wx.ready(function() {

                $("#btn_share").click(function(){

                    var windowHeight = $(window).height();
                    var contentHeight = $("#content").height();
                    var max = Math.max(windowHeight, contentHeight);

                    $("#share_tips").height(max).show().tap(function(){
                        $(this).hide();
                    });
                });

                var friendData = {
                    "imgUrl": global["_g_server"].staticurl + "/resource/share_thumb.png",
                    "link": global["_g_server"].wxserviceurl + "/wsite/" + app_id + "/" + enterpriseId + "/festival/route?fid=" + festivalId,
                    "desc": festivalDesc,
                    "title": storeName + "·" + festivalTitle,
                    "appId": app_id === "wxb5243e6a07f2e09a" ? "wxf932fcca3e6bf697" : app_id
                };

                var timelineData = {
                    "imgUrl": global["_g_server"].staticurl + "/resource/share_thumb.png",
                    "link": global["_g_server"].wxserviceurl + "/wsite/" + app_id + "/" + enterpriseId + "/festival/route?fid=" + festivalId,
                    "desc": storeName + " | " + festivalTitle + "：" + festivalDesc,
                    "title": storeName + "·" + festivalTitle,
                    "appId": app_id === "wxb5243e6a07f2e09a" ? "wxf932fcca3e6bf697" : app_id
                };

                wx.onMenuShareTimeline({
                    title: timelineData.desc, // 分享标题
                    link: timelineData.link, // 分享链接
                    imgUrl: timelineData.imgUrl, // 分享图标
                    success: function (res) {
                        // 用户确认分享后执行的回调函数
                        var url = "/svc/wsite/" + app_id + "/" + enterpriseId + "/festival/getPresent?fid=" + festivalId;

                        $.post(url, {}, function (response) {

                            var status = response.result.status;
                            if(status === 1){
                                location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + app_id + "&redirect_uri=http%3A%2F%2Fwx.yilos.com%2Fsvc%2Fwsite%2F" + app_id + "%2F"+ enterpriseId +"%2Ffestival%2FdoneRoute&response_type=code&scope=snsapi_base&state=success#wechat_redirect";
                            }
                        });

                        var shareCountURL = "/svc/wsite/" + app_id + "/" + enterpriseId + "/festival/countShare?fid=" + festivalId;
                        $.post(shareCountURL, {}, function(response){});
                    },
                    cancel: function () {
                        // 用户取消分享后执行的回调函数
                    }
                });
                wx.onMenuShareAppMessage({
                    title: friendData.title, // 分享标题
                    desc: friendData.desc, // 分享描述
                    link: friendData.link, // 分享链接
                    imgUrl: friendData.imgUrl, // 分享图标
                    type: '', // 分享类型,music、video或link，不填默认为link
                    dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                    success: function () {
                        // 用户确认分享后执行的回调函数
                    },
                    cancel: function () {
                        // 用户取消分享后执行的回调函数
                    }
                });

            });
        });
    }

});
