/**
 * 全局使用session，只对会员模块进行拦截
 *
 * 如果session中不包含member_id，则跳转到会员登录页面；否则允许操作
 *
 * 当直接通过浏览器打开微站，访问msite.yilos.com/code/member，就会跳转到登陆页面
 * 如果从微信公众号跳转过来，会带上m_id，则此middleware会将member_id放到session中，就不需要再登陆了
 * 如果后续从乐斯app跳转过来，也只需要带上m_id，则与从微信跳转过来具有一样的效果
 */
module.exports = function(req, res, next){

    var member_id = req.query["m_id"];

    if(member_id){
        req.session.member_id = member_id;
    }

    next();
};