WeixinApi.ready(function(Api) {

    var wxData = {
        "appId": "",
        "imgUrl" : 'http://www.baidufe.com/fe/blog/static/img/weixin-qrcode-2.jpg',
        "link" : 'http://www.yilos.com',
        "desc" : '实践出真知，分享动作有回调，URL也可自定义',
        "title" : "分享朋友圈，可以自定义，也可以回调"
    };

    var wxCallbacks = {

        ready: function() {
            alert("准备分享");
        },
        cancel: function(resp) {
            alert("分享被取消，msg=" + resp.err_msg);
        },
        fail: function(resp) {
            alert("分享失败，msg=" + resp.err_msg);
        },
        confirm: function(resp) {
            alert("分享成功，msg=" + resp.err_msg);
        },
        all: function(resp,shareTo) {
            alert("分享" + (shareTo ? "到" + shareTo : "") + "结束，msg=" + resp.err_msg);
        }
    };

    Api.shareToFriend(wxData, wxCallbacks);
    Api.shareToTimeline(wxData, wxCallbacks);
});