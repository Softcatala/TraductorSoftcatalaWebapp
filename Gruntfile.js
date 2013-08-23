module.exports = function(grunt) {

	var site = grunt.option('site') || '/var/www/dev-traductor.softcatala.org';
	console.log(site);
	
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: ';'
			},
			dist: {
				src: ['src/js/*.js'],
				dest: 'build/js/main.js'
			}
		},
		uglify: {
			dev: {
				files: {
					'build/js/main.min.js': ['<%= concat.dist.dest %>']
				}
			},
			prod: {
				files: {
					'out/js/main.min.js': ['<%= concat.dist.dest %>']
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
					cache: ['index.html', 'js/main.min.js', 'css/main.css'],
					network: ['http://*', 'https://*'],
					preferOnline: true,
					verbose: true,
					timestamp: true,
					hash: true,
					master: ['index.html']
				},
				src: [
					'out/index.html',
					'out/js/*.min.js',
					'out/css/*.css'
				],
				dest: 'out/manifest.appcache'
			}
		},
		copy: {
			dev: {
				expand: true, cwd: 'build/', src: ['**'], dest: site
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
        
	grunt.registerTask('default', ['jshint', 'concat', 'uglify:dev', 'targethtml:dev']);
	grunt.registerTask('prod', ['jshint', 'concat', 'uglify:prod', 'targethtml:prod', 'manifest']);
	grunt.registerTask('sitedev', ['jshint', 'concat', 'uglify:dev', 'targethtml:dev', 'copy:dev']);
	grunt.registerTask('siteprod', ['jshint', 'concat', 'uglify:prod', 'targethtml:prod', 'manifest', 'copy:prod']);

	grunt.registerTask('check', ['jshint']);

};
