var	uglify = require('uglify-js');
var merge = require('deepmerge');
var File = require('vinyl');

module.exports = function(fileData, options) {
	var file = new File({
		cwd: fileData.cwd,
		base: fileData.base,
		path: fileData.path,
		contents: new Buffer(fileData.contents)
	});
	options = merge(options || {}, {
		output: {}
	});

	try {
		return uglify.minify(file.path, options).code;
	} catch (e) {
		console.log('error:');
		console.log(e);
		return null;
	}
};
