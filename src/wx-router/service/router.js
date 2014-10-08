exports.route = route;

function route(req, res, next){

    var code = req.query["code"];

    console.log(code);
    res.send("ok");
}