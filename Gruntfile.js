module.exports = function (grunt) {

    var sourceDir = "src";// 源码目录
    var frontDir = "frontend";// 前端目录
    var serverDir = "webapps";// 后端目录
    var distDir = "YAE-wechat";// 最终交付目录

    grunt.initConfig({

        copy: {
            frontend: {
                files: [
                    {
                        expand: true,
                        flatten: false,
                        cwd: sourceDir,
                        src: ['**/static/**/*'],
                        filter: 'isFile',
                        dest: frontDir,
                        rename: function (dest, src) {
                            var arr = src.split("/");
                            arr.splice(1, 1);// 去掉中间的static
                            var splicePath = arr.join("/");
                            return dest + "/" + splicePath;
                        }
                    },
                    {
                        expand: true,
                        flatten: false,
                        cwd: sourceDir,
                        src: ['3rd-lib/**/*', '!3rd-lib/META-INF.json'],
                        filter: 'isFile',
                        dest: frontDir
                    },
                    {
                        expand: true,
                        flatten: false,
                        cwd: sourceDir,
                        src: ['resource/**/*', '!resource/META-INF.json'],
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
                        src: ['**/*', '!**/test/**/*', '!**/static/**/*', "!3rd-lib/**/*"],
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
                        src: ['bin/**/*', 'conf/**/*', frontDir + '/**/*', 'lib/**/*', serverDir + '/**/*', 'package.json'],
                        dest: distDir
                    }
                ]
            }
        },
        mkdir: {
            build: {
                options: {
                    mode: 0777,
                    create: [distDir + '/logs']
                }
            }
        },
        clean: {
            build: [frontDir, serverDir]
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['copy', 'mkdir', 'clean']);
};