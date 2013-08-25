module.exports = function(grunt) {

	var site = grunt.option('site') || '/var/www/dev-traductor/htdocs';
	console.log(site);
	
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: ';'
			},
			prod: {
				src: ['src/js/libs/pouchdb.js', 'src/js/libs/l10n.js', 'src/js/libs/traductor.js'],
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
					cache: [ 'js/app.js' ],
					network: ['*', 'http://*', 'https://*'],
					verbose: true,
					timestamp: true,
					hash: true,
					master: ['index.html']
				},
				src: [
					'out/index.html',
					'out/js/*.js',
					'out/style/*.css'
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
				expand: true, cwd: 'src/', src: ['js/libs/jquery-1.9.1.min.js', 'js/libs/html5shiv.js', 'favicon.ico', 'l10n', 'style'], dest: 'out'
			},	
			prod: {
				expand: true, cwd: 'out/', src: ['**'], dest: site				
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
        
	grunt.registerTask('default', ['jshint', 'copy:dev', 'targethtml:dev']);
	grunt.registerTask('dev', ['jshint', 'copy:dev', 'targethtml:dev']);
	grunt.registerTask('prod', ['jshint', 'concat:prod', 'uglify:prod', 'targethtml:prod', 'copy:extra', 'manifest']);
	grunt.registerTask('sitedev', ['jshint', 'copy:dev', 'targethtml:dev', 'copy:sitedev']);
	grunt.registerTask('siteprod', ['jshint', 'concat:prod', 'uglify:prod', 'targethtml:prod', 'copy:extra', 'manifest', 'copy:prod']);

	grunt.registerTask('check', ['jshint']);

};
