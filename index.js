"use strict";

var gulp = require('gulp')
var gutil = require('gulp-util')
var webpack = require('webpack')
var WebpackDevServer = require('webpack-dev-server')
var assign = require('object-assign')
var path = require('path')


exports.buildDev = (taskName, opts) => {
    const options = {
        sourcemaps: opts.sourcemaps || true,
        debug: opts.debug || true,
        webpackConfig: opts.webpackConfig || {},
        watch: opts.watch || false,
    }

    const compiler = createDevCompiler(options)
    return (done) => { runCompiler(compiler, taskName, options, done) }
}

exports.watchDev = (taskName, opts) => {
    console.log(opts.paths)
    console.log(opts.tasks)
    return () => { gulp.watch(opts.paths, opts.tasks) }
}

exports.buildProd = (taskName, opts) => {
    const options = {
        mangle: opts.mangle || false,
        sourcemaps: opts.sourcemaps || false,
        webpackConfig: opts.webpackConfig || {},
    }
    const compiler = createProdCompiler(options)

    return (done) => {
        runCompiler(compiler, taskName, options, done)
    }
}

exports.devServer = (webpackConfig) => {
    webpackConfig = webpackConfig || {}
    webpackConfig.debug = true
    webpackConfig.devtool = 'sourcemap'

    const devServerOptions = (webpackConfig.tsGulpfile || {}).devServer || {}
    const host = devServerOptions.host || 'localhost'
    const port = devServerOptions.port || 8001

    const compiler = webpack(webpackConfig)
    const server = new WebpackDevServer(compiler, devServerOptions)

    server.listen(port, host, err => {
        if(err) throw new gutil.PluginError('webpack-dev-server', err)
        gutil.log('[webpack-dev-server]', path.join(`http://${host}:${port}`, 'webpack-dev-server/index.html'))
    })
}

function runCompiler(compiler, taskName, options, done) {
    compiler.run((err, stats) => {
        if (err) throw new gutil.PluginError(taskName, err)

        gutil.log('['+taskName+']', stats.toString({ colors: true }))
        done()
    })
}

function createDevCompiler(options) {
    // modify some webpack config options
    var myDevConfig = assign({}, options.webpackConfig)

    if (options.sourcemaps) {
        myDevConfig.devtool = 'sourcemap'
    }

    if (options.debug) {
        myDevConfig.debug = true
    }

    if (options.watch) {
        myDevConfig.watch = true
    }

    // create a single instance of the compiler to allow caching
    return webpack(myDevConfig)
}

function createProdCompiler(options) {
    var myConfig = assign({}, options.webpackConfig)

    if (options.watch) {
        myConfig.watch = true
    }

    myConfig.plugins = (myConfig.plugins || []).concat(
        new webpack.DefinePlugin({
            'process.env': {
                // This has effect on the react lib size
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({sourceMap: options.sourcemaps, mangle: options.mangle})
    )

    // run webpack
    return webpack(myConfig)
}



