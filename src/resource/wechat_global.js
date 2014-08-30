var g_env = {
    security_code_url: "http://192.168.1.117:3000/svc/getCode/",
    check_code_url: "http://192.168.1.117:3000/svc/checkCode/",
    binding_url: "http://192.168.1.117:5000/svc/wsite/"
};

bindReady(function () {
    var windowH = window.innerHeight;
    var menuH = document.getElementById("menu").clientHeight;
    document.getElementById("content").style.height = (windowH - menuH) + "px";
});

function bindReady(callback) {
    // Mozilla, Opera and webkit nightlies currently support this event
    if (document.addEventListener) {
        // Use the handy event callback
        document.addEventListener("DOMContentLoaded", function () {
            document.removeEventListener("DOMContentLoaded", null, false);
            callback();
        }, false);

        // If IE event model is used
    }
    else if (document.attachEvent) {
        // ensure firing before onload,
        // maybe late but safe also for iframes
        document.attachEvent("onreadystatechange", function () {
            if (document.readyState === "complete") {
                document.detachEvent("onreadystatechange", null);
                callback();
            }
        });

        // If IE and not an iframe
        // continually check to see if the document is ready
        if (document.documentElement.doScroll && window == window.top) {
            (function () {
                try {
                    // If IE is used, use the trick by Diego Perini
                    // http://javascript.nwbox.com/IEContentLoaded/
                    document.documentElement.doScroll("left");
                }
                catch (error) {
                    callback();
                }
                // and execute any waiting functions
            })();
        }
    }
}