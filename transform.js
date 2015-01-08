module.exports = function(data) {
  return require('uglify-js').minify(data.string, data.options).code;
};
