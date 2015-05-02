var wx = require("wechat-toolkit");
var dbHelper = require(FRAMEWORKPATH + "/utils/dbHelper");

var http_server = global["_g_clusterConfig"].baseurl;
var error_message = "乐美业管家似乎出了点问题，正在修复中";
var token = "yilos_wechat";
var app_id = "wxd37396c2dc23ba21";
var httpHelper = require(FRAMEWORKPATH + "/bus/httpHelper");

var server_address;

if(global["_g_topo"].env === "dev"){
    server_address = "http://127.0.0.1/";
}else{
    server_address = "http://wx.yilos.com/";
}

exports.handle = handleMessage;

function handleMessage(req, res, next){

    async.waterfall([_validate, _doHandle], function(err){

        if(err){
            console.log(err);
            wx.replyTextMessage(req, res, error_message);
        }
    });

    function _validate(callback){

        var flag = wx.validate(req, token);
        if(!flag){
            callback({message: "不是微信发来的消息"});
        }else{
            callback(null);
        }
    }

    function _doHandle(callback){

        switch(req.weixin.message_type){

            case "text":
                handleTextMessage();
                break;

            case "event":
                handleEvent();
                break;

            default :
                res.send("");
        }

        function handleTextMessage(){
            wx.replyTextMessage(req, res, "您好，您的留言我们已收到，稍后与您联系");
        }

        function handleEvent(){

            switch(req.weixin.event){

                case "subscribe":
                    handleSubscribe();
                    break;

                case "CLICK":
                    handleClick();
                    break;

                case "VIEW":
                    handleView();
                    break;

                case "merchant_order":
                    handleOrder();
                    break;

                default:
                    res.send("");
            }

            function handleSubscribe(){

                var sentence = "感谢关注乐斯美业，我们致力于建立移动互联网时代美业管理营销平台!\n" +
                                "●了解产品请进入“认识乐斯”\n" +
                                "●App下载指南、新手上路、人工客服请进入“玩转乐斯”";
                wx.replyTextMessage(req, res, sentence);
            }

            function handleClick(){

                switch(req.weixin.event_key){

                    case "LS_INTRO":
                        handleLsIntro();
                        break;

                    case "LS_USER":
                        handleLsUser();
                        break;

                    case "LS_PRODUCTION":
                        handleLsProduction();
                        break;

                    case "USER_GUIDE":
                        handleLsUserGuide();
                        break;

                    case "APP_DOWNLOAD":
                        handleLsAppDownload();
                        break;

                    case "HUMAN_SERVICE":
                        handleLsHumanService();
                        break;

                    default :
                        wx.replyTextMessage(req, res, "无法识别的点击事件");
                }

                function handleLsIntro(){

                    var url = "http://mp.weixin.qq.com/s?__biz=MzA3NDk0NjUxNg==&mid=204712829&idx=1&sn=617debfa037378fdbd4581428cc88951&key=8ea74966bf01cfb61569b516e2e94afb11f67841f3245f15361bd57d59993de74e950dd450bbac4886e21719c19374e0&ascene=0&uin=Mzk1MTE4OTk1&devicetype=iMac+Macmini7%2C1+OSX+OSX+10.10.2+build(14C109)&version=11020012&pass_ticket=yqDP0xYsrKTcQ%2FmlUn%2BvvDmUXafbSvewlEWwuNZjT4ycnG%2BwgJC3HWEf8idLn3Z6";

                    var item = {
                        title: "关于乐斯",
                        desc: "乐斯，作为行业领先的美业管理与客户服务平台解决方案供应商，致力于把全球范围内的先进行业管理理念与实践带入美业，助力美业的服务转型与升级。",
                        picUrl: "https://mmbiz.qlogo.cn/mmbiz/7T6ibEkAUs8CLTWKtBXuvFrxOUNZJAX06TIJ7AbCiaPWAZ6sM90vSsHYU8BjiaVb5uiaOQF7HZUXBBoNWEVj5p0rzQ/0",
                        url: url
                    };

                    var contents = [item];

                    wx.replyNewsMessage(req, res, contents);
                }

                function handleLsUser(){

                    var contents = [];

                    var header = {
                        title: "哪些人在用乐斯",
                        picUrl: "https://mmbiz.qlogo.cn/mmbiz/7T6ibEkAUs8Afd0jznmnicaiaYWfzynXEx5Da3feZAsboAsqL3dJ4E6lGFb7E3ma6EiaaQsYE4yCYkPlTI1tz8TKPw/0",
                        url: "http://mp.weixin.qq.com/s?__biz=MzA3NDk0NjUxNg==&mid=204724536&idx=1&sn=36e885faf5789c9b2f4615e0f4a2186f&key=8ea74966bf01cfb6415281707b0b5e3d5584e13049d64602bf4c722e6387a1768a733967aeaadc83d94cde3aefc4c246&ascene=0&uin=Mzk1MTE4OTk1&devicetype=iMac+Macmini7%2C1+OSX+OSX+10.10.2+build(14C109)&version=11020012&pass_ticket=yqDP0xYsrKTcQ%2FmlUn%2BvvDmUXafbSvewlEWwuNZjT4ycnG%2BwgJC3HWEf8idLn3Z6"
                    };

                    var message = {
                        title: "看看乐斯的用户们在说些什么",
                        picUrl: "https://mmbiz.qlogo.cn/mmbiz/7T6ibEkAUs8Afd0jznmnicaiaYWfzynXEx5acXWtsGndWcwYnDgNDF6vYOxkCibsMzZyK0lGxddfgibcMD26n3FcbGQ/0",
                        url: "http://mp.weixin.qq.com/s?__biz=MzA3NDk0NjUxNg==&mid=204724536&idx=2&sn=d8c402b9117d684fbe85a1232b152508&key=8ea74966bf01cfb676d0a0a3e5c4ede409d41fb16143c599d8916257769cdab6ad210eda4d683579c6587d12b945dbb2&ascene=0&uin=Mzk1MTE4OTk1&devicetype=iMac+Macmini7%2C1+OSX+OSX+10.10.2+build(14C109)&version=11020012&pass_ticket=yqDP0xYsrKTcQ%2FmlUn%2BvvDmUXafbSvewlEWwuNZjT4ycnG%2BwgJC3HWEf8idLn3Z6"
                    };

                    contents.push(header);
                    contents.push(message);

                    wx.replyNewsMessage(req, res, contents);
                }

                function handleLsProduction(){

                    var contents = [];

                    var header = {
                        title: "乐斯·美业管家 线上互动客户 线下搞定店务",
                        picUrl: "https://mmbiz.qlogo.cn/mmbiz/7T6ibEkAUs8BpUC3rFx5hHcWIwicuTQy4u6UxCrKicphlOKcibpT9zS8wfdOqIAel4VvR1t0uicglexyrJTWM1CPqVA/0",
                        url: "http://mp.weixin.qq.com/s?__biz=MzA3NDk0NjUxNg==&mid=204709196&idx=1&sn=92045ae8bb4ab6537148f5c31b70b7e4#rd"
                    };

                    var message1 = {
                        title: "手机端下载“乐斯小秘书”实现远程店务管理！",
                        picUrl: "https://mmbiz.qlogo.cn/mmbiz/7T6ibEkAUs8BpUC3rFx5hHcWIwicuTQy4u7jFmbYoUAXl3icaw1dxXa6UEhZpRfpvUloJpQv1BDJzK2jiaiaia385kgA/0",
                        url: "http://mp.weixin.qq.com/s?__biz=MzA3NDk0NjUxNg==&mid=204709196&idx=2&sn=43feb95ab97a3909b9f965022e00cc19#rd"
                    };

                    var message2 = {
                        title: "微信关注“乐斯美蜜”将你的店开在顾客的口袋里！",
                        picUrl: "https://mmbiz.qlogo.cn/mmbiz/7T6ibEkAUs8BpUC3rFx5hHcWIwicuTQy4uWQXceuVzMSnof86Yc4ssg6y1cs4JtkM3eKpqrAQzPxaDBwhZEvO5bA/0",
                        url: "http://mp.weixin.qq.com/s?__biz=MzA3NDk0NjUxNg==&mid=204709196&idx=3&sn=02e87a2ae03cb355a9872ceac31e47f9#rd"
                    };

                    contents.push(header);
                    contents.push(message1);
                    contents.push(message2);

                    wx.replyNewsMessage(req, res, contents);
                }

                function handleLsUserGuide(){
                    var contents = [];

                    var header = {
                        title: "新手上路不完全指南",
                        picUrl: "https://mmbiz.qlogo.cn/mmbiz/7T6ibEkAUs8Buib3icQ6es9zLjqceoXkZTzJ3XndMAnyR288JPxIHIBqyUK1L5J9RvSyM3ZNgOhiaoUMn4buX4M8WQ/0",
                        url: "http://mp.weixin.qq.com/s?__biz=MzA3NDk0NjUxNg==&mid=204724657&idx=1&sn=f639afb01ab714b37ed006a874e3ffba#rd"
                    }

                    var message = {
                        title: "软件使用时常见问题解析",
                        picUrl: "https://mmbiz.qlogo.cn/mmbiz/7T6ibEkAUs8Buib3icQ6es9zLjqceoXkZTzTK210Qw4QTqlpAZgke9nMIynu1WsjER2JYpapTEZUKsHib4icLzIZWAA/0",
                        url: "http://mp.weixin.qq.com/s?__biz=MzA3NDk0NjUxNg==&mid=204724657&idx=2&sn=950591b7035504addda42026099fa90f#rd"
                    };

                    contents.push(header);
                    contents.push(message);

                    wx.replyNewsMessage(req, res, contents);
                }

                function handleLsAppDownload(){
                    var url = "http://mp.weixin.qq.com/s?__biz=MzA3NDk0NjUxNg==&mid=204724797&idx=1&sn=f5e069453f85abee14af8ec929d479a9#rd";

                    var item = {
                        title: "App下载指南",
                        desc: "配置要求：苹果支持iOS 7.0或更高版本；安卓支持Android 4.0或更高版本。",
                        picUrl: "https://mmbiz.qlogo.cn/mmbiz/7T6ibEkAUs8CLTWKtBXuvFrxOUNZJAX063lwEa4yFXmVXf5RvhDu2WvfO4UQmnFXdDwiacJzTEWCfWFHJsay2qdw/0",
                        url: url
                    };

                    var contents = [item];

                    wx.replyNewsMessage(req, res, contents);
                }

                function handleLsHumanService(){
                    wx.replyTextMessage(req, res, "很高兴为您服务，您可以通过以下方式联系我们。\n" +
                    "客服电话" +
                    "025-89630351  " +
                    "025-89630350\n" +
                    "客服微信号 13951605707\n" +
                    "客服QQ 1994714502");
                }
            }

            function handleView(){
                res.send("");
            }

            function handleOrder(){
                var order_id = req.weixin.order_id;
                var open_id = req.weixin.fan_open_id;
                var condition = {
                    open_id: open_id
                };


                dbHelper.queryData("weixin_store_recharge", condition, function(err, result){
                    if(err){
                        console.log(err);
                        return;
                    }

                    var url = "billing/rechargeFromWeixin/" + result[0].enterprise_id + "?order_id=" + order_id;

                    httpHelper.putResource(url, {}, function(err,body){
                        if (err) {
                            console.log(err);
                            return;
                        }

                        res.send("")
                    });

                });


            }
        }
    }
}
