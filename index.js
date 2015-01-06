'use strict';
var transform = require('parallel-transform'),
	cpus = require('os').cpus().length,
	mnfy = require('mnfy/master'),
	uglify = require('uglify-js'),
	merge = require('deepmerge'),
	PluginError = require('gulp-util/lib/PluginError'),
	applySourceMap = require('vinyl-sourcemaps-apply'),
	reSourceMapComment = /\n\/\/# sourceMappingURL=.+?$/,
	pluginName = 'gulp-uglify';

mnfy.fork();
mnfy.fork();
mnfy.fork();
mnfy.fork();

function minify(file, options, callback) {
	try {
		mnfy.js(String(file.contents)).then(function (res) {
			file.contents = new Buffer(res.code.replace(reSourceMapComment, ''));
			if (file.sourceMap) {
				applySourceMap(file, res.map);
			}
			return callback(null, file);
		});
	} catch (e) {
		return callback(createError(file, e));
	}
}

function setup(opts) {
	var options = merge(opts || {}, {
		fromString: true,
		output: {}
	});

	if (options.preserveComments === 'all') {
		options.output.comments = true;
	} else if (options.preserveComments === 'some') {
		// preserve comments with directives or that start with a bang (!)
		options.output.comments = /^!|@preserve|@license|@cc_on/i;
	} else if (typeof options.preserveComments === 'function') {
		options.output.comments = options.preserveComments;
	}

	return options;
}

function createError(file, err) {
	if (typeof err === 'string') {
		return new PluginError(pluginName, file.path + ': ' + err, {
			fileName: file.path,
			showStack: false
		});
	}

	var msg = err.message || err.msg || /* istanbul ignore next */ 'unspecified error';

	return new PluginError(pluginName, file.path + ': ' + msg, {
		fileName: file.path,
		lineNumber: err.line,
		stack: err.stack,
		showStack: false
	});
}

module.exports = function(opt) {
	function uglify(file, callback) {
		var options = setup(opt);

		if (file.isNull()) {
			return callback(null, file);
		}

		if (file.isStream()) {
			return callback(createError(file, 'Streaming not supported'));
		}

		if (file.sourceMap) {
			options.outSourceMap = file.relative;
			options.inSourceMap = file.sourceMap.mappings !== '' ? file.sourceMap : undefined;
		}

		minify(file, options, callback);
	}

	var stream = transform(cpus, uglify);
	stream.on('end', function() {
		mnfy.kill();
	});
	return stream;
};
