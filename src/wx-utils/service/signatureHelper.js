var tokenHelper = require("./access_token_helper");
var jsSHA = require("jssha");
var urllib = require("urllib");

exports.signature = signature;

function signature(req, res, next){

    var appId = req.body.appId;
    var originUrl = req.body.url;

    tokenHelper.refreshAccessToken(appId, function(err, access_token){

        var url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=" + access_token + "&type=jsapi";

        var options = {
            method: "GET",
            dataType: "json"
        };

        urllib.request(url, options, function(err, body, resp){

            if(err){
                next(err);
                return;
            }

            if(body.errcode){
                next(body);
                return;
            }

            var js_ticket = body.ticket;

            var ret = {
                jsapi_ticket: js_ticket,
                nonceStr: "q2XFkAiqofKmi1Y2",
                timestamp: 1421670369,
                url: originUrl
            };

            var string = raw(ret);
            var shaObj = new jsSHA(string, 'TEXT');
            var sign = shaObj.getHash('SHA-1', 'HEX');

            res.send({sign:sign});

            function raw(args) {
                var keys = Object.keys(args);
                keys = keys.sort()
                var newArgs = {};
                keys.forEach(function (key) {
                    newArgs[key.toLowerCase()] = args[key];
                });

                var string = '';
                for (var k in newArgs) {
                    string += '&' + k + '=' + newArgs[k];
                }
                string = string.substr(1);
                return string;
            }
        });
    });
}