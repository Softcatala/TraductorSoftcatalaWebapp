module.exports = function(grunt) {

	var site = grunt.option('site') || '/var/www/dev-traductor/htdocs';
	var version = grunt.option('ver') || "0.3.1.0";
	console.log("HTDOCS: "+site);
	console.log("VERSION: "+version);

	
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		replace: {
			prod: {
				options: {
					variables: {
						'version': version
					},
					prefix: '@@'
				},
				files: [
					{ expand: true, flatten: true, src: ['manifest.webapp'], dest: 'out/' }
				]
			},
			crx: {
				options: {
					variables: {
						'version': version
					},
					prefix: '@@'
				},
				files: [
					{ expand: true, flatten: true, src: ['manifest.json'], dest: 'out/' }
				]
			}
		},
		concat: {
			options: {
				separator: ';'
			},
			dev: {
				src: ['src/js/libs/pouchdb.js', 'src/js/libs/l10n.js', 'src/js/traductor.js'],
				dest: 'build/js/app.js'				
			},
			prod: {
				src: ['src/js/libs/pouchdb.js', 'src/js/libs/l10n.js', 'src/js/traductor.js'],
				dest: 'out/js/app.js'
			}
		},
		uglify: {
			prod: {
				files: {
					'out/js/app.js': ['<%= concat.prod.dest %>']
				}
			}
		},
		targethtml: {
			dev: {
				files: {
					'build/index.html': 'src/index.html'
				}
			},
			prod: {
				files: {
					'out/index.html': 'src/index.html'
				}				
			}			
		},
		jshint: {
			files: ['Gruntfile.js', 'src/js/*.js'],
			options: {
				// Ignore
				'-W069': true,
				// options here to override JSHint defaults
				globals: {
					jQuery: true,
					console: true,
					module: true,
					document: true
				}
			}
		},
		manifest: {
			generate: {
				options: {
					basePath: 'out',
					network: ['*', 'http://*', 'https://*'],
					verbose: true,
					timestamp: true,
					hash: true,
					master: ['index.html']
				},
				src: [
					'index.html',
					'favicon.ico',
					'js/*.js',
					'js/libs/*js',
					'style/*.css',
					'style/images/*',
					'l10n/*',
					'img/icons/*',
					'img/*.*'
				],
				dest: 'out/manifest.appcache'
			}
		},
		copy: {
			dev: {
				expand: true, cwd: 'src/', src: ['**'], dest: 'build'
			},
			sitedev: {
				expand: true, cwd: 'build/', src: ['**'], dest: site
			},
			extra: {
				expand: true, cwd: 'src/', src: ['js/libs/jquery-1.9.1.min.js', 'js/libs/html5shiv.js', 'favicon.ico', 'l10n/*', 'style/**', 'img/**'], dest: 'out'
			},	
			prod: {
				expand: true, cwd: 'out/', src: ['**'], dest: site
			}
		},
		clean: {
				dev: ['build'],
				prod: ['out'],
				all: ['build', 'out'],
		},
		crx: {
			hostedPackage: {
				"src": "out/",
				"dest": "softcatala.crx",
				"baseURL": "https://traductor.softcatala.org/",
				"exclude": [ ".git", ".svn" ],
				"privateKey": "~/.ssh/softcatala.pem",
				"options": {
					"maxBuffer": 3000 * 1024 //build extension with a weight up to 3MB
				}
			}
		},
		compress: {
			zip: {
				options: {
					archive: './softcatala.zip',
					mode: 'zip'
				},
				files: [
					{ expand: true, cwd: 'out/', src: ['**'] }
				]
			}
		}	
	});
	
	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-targethtml');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-manifest');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-replace');
	grunt.loadNpmTasks('grunt-crx');
	grunt.loadNpmTasks('grunt-contrib-compress');
	
	grunt.registerTask('dev', ['jshint', 'clean:dev', 'copy:dev', 'targethtml:dev']);
	grunt.registerTask('default', 'dev');
	grunt.registerTask('prod', ['jshint', 'clean:prod', 'replace:prod', 'concat:prod', 'uglify:prod', 'targethtml:prod', 'copy:extra', 'manifest']);
	grunt.registerTask('sitedev', ['dev', 'copy:sitedev']);
	grunt.registerTask('siteprod', ['prod', 'copy:prod']);
	grunt.registerTask('clear', ['clean:all']);

	grunt.registerTask('check', ['jshint']);
	grunt.registerTask('crxbuild', ['jshint', 'clean:prod', 'replace:crx', 'concat:prod', 'uglify:prod', 'targethtml:prod', 'copy:extra', 'manifest', 'crx:hostedPackage'] );
	grunt.registerTask('zip', ['jshint', 'clean:prod', 'replace:crx', 'concat:prod', 'uglify:prod', 'targethtml:prod', 'copy:extra', 'manifest', 'compress:zip'] );
};
