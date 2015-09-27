module.exports = gruntConfig;

function gruntConfig(grunt) {
  var
    pkg = grunt.file.readJSON('package.json'),
    tasks = require('./tasks/grunt'),
    gruntInitConfig;

  gruntInitConfig = {
    // Set these to the appropriate directories
    srcPath: 'src',
    distPath: 'dist'
  };

  for (var task in tasks) {
    gruntInitConfig[task] = tasks[task];
  }

  grunt.initConfig(gruntInitConfig);

  for (var dep in pkg.devDependencies) {
    if (dep !== 'grunt' && !dep.indexOf('grunt')) {
      grunt.loadNpmTasks(dep);
    }
  }

  grunt.registerTask('build', [
    'clean',
    'babel'
  ]);

  grunt.registerTask('build:watch', [
    'build',
    'watch'
  ]);

  grunt.registerTask('test', [
    //'jshint',
    'mocha_istanbul:test'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);

}