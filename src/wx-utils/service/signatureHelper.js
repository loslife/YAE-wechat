var tokenHelper = require("./access_token_helper");
var jsSHA = require("jssha");
var urllib = require("urllib");

exports.signature = signature;

function signature(req, res, next){

    var appId = req.body.appId;
    var originUrl = req.body.url;
    tokenHelper.getTokenByAppId(appId, function(err, access_token, js_ticket, old_timestamp){
        var now_timestamp = parseInt(new Date().getTime() / 1000);
        if((now_timestamp-parseInt(old_timestamp))>=7100){
            tokenHelper.refreshAccessToken(appId, function(err, access_token, jsapi_ticket){

                var ret = {
                    jsapi_ticket: jsapi_ticket,
                    nonceStr: "q2XFkAiqofKmi1Y2",
                    timestamp: 1421670369,
                    url: originUrl
                };

                var string = raw(ret);
                var shaObj = new jsSHA(string, 'TEXT');
                var sign = shaObj.getHash('SHA-1', 'HEX');

                res.send({sign:sign});

            });
        }
        else{

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
        }
    });
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
}