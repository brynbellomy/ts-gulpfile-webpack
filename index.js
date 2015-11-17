"use strict";

var gulp = require('gulp')
var gutil = require('gulp-util')
var webpack = require('webpack')
var WebpackDevServer = require('webpack-dev-server')
var assign = require('object-assign')

require('ts-gulpfile-typescript')


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

exports.devServer = (opts) => {
    const options = {
        mangle: opts.mangle || false,
        debug: opts.debug || true,
        sourcemaps: opts.sourcemaps || true,
        webpackConfig: opts.webpackConfig || {},
    }

    return (callback) => {
        // modify some webpack config options
        var myConfig = assign({}, options.webpackConfig)
        if (options.sourcemaps) {
            myConfig.devtool = 'sourcemap'
        }
        if (options.debug) {
            myConfig.debug = true
        }

        // Start a webpack-dev-server
        new WebpackDevServer(webpack(myConfig), {
            quiet: false,
            noInfo: false,
            publicPath: 'http://localhost:8001/' + myConfig.output.publicPath,
            filename: "all-ts.js",
            stats: { colors: true }
        }).listen(8001, 'localhost', err => {
            if(err) throw new gutil.PluginError('webpack-dev-server', err)
            gutil.log('[webpack-dev-server]', 'http://localhost:8001/webpack-dev-server/index.html')
        })
    }
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



//     // Build and watch cycle
//     // Advantage: No server required, can run app from filesystem
//     // Disadvantage: Requests are not blocked until bundle is available; can serve an old app on refresh.
//     gulp.task('webpack:watch:dev', ['webpack:build:dev'], exports.watchDev)
//     gulp.task('webpack:build:prod', ['ts:check-tsconfig'], exports.buildProd)

//     gulp.task('webpack:build:dev', exports.buildDev)

//     gulp.task('webpack:dev-server', callback => {
//         // modify some webpack config options
//         var myConfig = assign({}, options.webpackConfig)
//         myConfig.devtool = 'sourcemap'
//         myConfig.debug = true

//         // Start a webpack-dev-server
//         new WebpackDevServer(webpack(myConfig), {
//             publicPath: '/' + myConfig.output.publicPath,
//             stats: { colors: true }
//         }).listen(8001, 'localhost', err => {
//             if(err) throw new gutil.PluginError('webpack-dev-server', err)
//             gutil.log('[webpack-dev-server]', 'http://localhost:8001/webpack-dev-server/index.html')
//         })
//     })