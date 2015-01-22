$(function(){
    var enterpriseId = $("#enterprise_id").text();
    var festivalId = $("#festival_id").text();
    var storeName = $(".store-name").text();
    var festivalTitle = $("#f_title").text();
    var festivalDesc = $("#f_desc").text();
    var app_id = $("#app_id").text();
    var nowUrl=window.location.href;
    var signUrl="/svc/wsite/" + app_id + "/" + enterpriseId + "/sign";
    var signature=null;
    init();
    var ua = window.navigator.userAgent.toLowerCase();
    if(ua.match(/MicroMessenger/i) == 'micromessenger'){
        initWx();
    }
    function init(){
        $("#btn_get").prop("disabled", false);

        // 手机上弹出键盘时，底部按钮遮挡的问题
        $("#input_phone").focus(function(){
            $("#back").removeClass("fixed-bottom0");
        }).blur(function(){
            $("#back").addClass("fixed-bottom0");
        });

        $("#present_form").submit(function($event){

            $event.preventDefault();

            var phone = $("#input_phone").val();

            if (!phone) {
                alert("请输入手机号");
                return;
            }

            if(!_checkPhone()){
                alert("手机号有误，请重新输入");
                return;
            }

            var enterprise_id = $("#enterprise_id").text();
            var festival_id = $("#festival_id").text();
            var app_id = $("#app_id").text();

            var url = "/svc/wsite/" + app_id + "/" + enterprise_id + "/festival/getPresent?fid=" + festival_id;

            $.post(url, {phone: phone}, function (response) {

                var code = response.code;

                if(code !== 0){
                    alert("领取失败，请联系客服");
                    return;
                }

                var status = response.result.status;

                if(status === 1){
                    location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + app_id + "&redirect_uri=http%3A%2F%2Fwx.yilos.com%2Fsvc%2Fwsite%2F" + app_id + "%2F" + enterprise_id +"%2Ffestival%2FdoneRoute&response_type=code&scope=snsapi_base&state=success#wechat_redirect";
                }else{
                    location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + app_id + "&redirect_uri=http%3A%2F%2Fwx.yilos.com%2Fsvc%2Fwsite%2F" + app_id + "%2F" + enterprise_id +"%2Ffestival%2FdoneRoute&response_type=code&scope=snsapi_base&state=repeat#wechat_redirect";
                }
            });

            function _checkPhone(){
                return (/^13\d{9}$/g.test(phone) || (/^15\d{9}$/g.test(phone)) || (/^18\d{9}$/g.test(phone)) || (/^17\d{9}$/g.test(phone)));
            }
        });

        $("#back").on("click", function ($even) {
            location.href = "../festival";
            $even.stopPropagation();
        });
    }
    function initWx(){
        $.post(signUrl, {url:nowUrl, appId: app_id}, function(response){
            signature=response.result.sign;
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
