module.exports = function (grunt) {

    var sourceDir = "src";// 源码目录
    var frontDir = "frontend";// 前端目录
    var serverDir = "webapps";// 后端目录
    var distDir = "dist";// 最终交付目录

    // 从src拷贝到部署目录时，去掉中间的static路径
    function clipStaticPath(dest, src){
        var arr = src.split("/");
        arr.splice(1, 1);
        var splicePath = arr.join("/");
        return dest + "/" + splicePath;
    }

    var thirdJSFiles = {};

    thirdJSFiles[frontDir + "/3rd-lib/wechat-global.min.js"] = [
        sourceDir + "/3rd-lib/*.js",
        sourceDir + "/resource/*.js"
    ];

    var globalCSSFiles = {};
    globalCSSFiles[frontDir + "/resource/css/wechat.min.css"] = [sourceDir + "/resource/css/*.css"];

    grunt.initConfig({

        uglify: {
            build: {
                options: {
                    mangle: true
                },
                files: [
                    {
                        expand: true,
                        flatten: false,
                        cwd: sourceDir,
                        src: ["**/static/**/*.js"],
                        filter: "isFile",
                        dest: frontDir,
                        ext: ".min.js",
                        rename: clipStaticPath
                    }
                ]
            },
            thirdjs: {
                options: {
                    mangle: true
                },
                files: thirdJSFiles
            }
        },
        cssmin: {
            global: {
                files: globalCSSFiles
            },
            build: {
                files: [
                    {
                        expand: true,
                        flatten: false,
                        cwd: sourceDir,
                        src: ["**/static/css/**/*.css"],
                        dest: frontDir,
                        ext: ".min.css",
                        rename: clipStaticPath
                    }
                ]
            }
        },
        copy: {
            frontend: {
                files: [
                    {
                        expand: true,
                        flatten: false,
                        cwd: sourceDir,
                        src: ['resource/**/*.jpg', 'resource/**/*.png'],
                        filter: 'isFile',
                        dest: frontDir
                    }
                ]
            },
            server: {
                files: [
                    {
                        expand: true,
                        flatten: false,
                        cwd: sourceDir,
                        src: ['**/*', '!**/test/**/*', '!**/static/**/*', "!3rd-lib/**/*", "!resource/**/*"],
                        filter: 'isFile',
                        dest: serverDir
                    }
                ]
            },
            dist: {
                files: [
                    {
                        expand: true,
                        flatten: false,
                        src: ['conf/**/*', frontDir + '/**/*', serverDir + '/**/*', 'package.json'],
                        dest: distDir
                    }
                ]
            }
        },
        mkdir: {
            build: {
                options: {
                    mode: 0777,
                    create: [distDir + '/logs', distDir + '/public']
                }
            }
        },
        clean: {
            build: [frontDir, serverDir]
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['uglify', 'cssmin', 'copy', 'mkdir', 'clean']);
};