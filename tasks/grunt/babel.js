module.exports = {
  options: {
    sourceMap: false
  },

  dist: {
    files: [{
      expand: true,
      cwd: '<%= srcPath %>',
      src: ['**/*.js'],
      dest: '<%= distPath %>/',
      ext: '.js'
    }],
    options: {
      optional: ['es7.objectRestSpread']
    }
  }
};