var gulp = require('gulp')
var gutil = require('gulp-util')
var webpack = require('webpack')
var WebpackDevServer = require('webpack-dev-server')
var webpackConfig = require('../webpack.config.js')


// Build and watch cycle
// Advantage: No server required, can run app from filesystem
// Disadvantage: Requests are not blocked until bundle is available,
//               can serve an old app on refresh
gulp.task('webpack:watch-dev', ['webpack:build-dev'], () => {
    gulp.watch(['src/**/*'], ['webpack:build-dev'])
})



gulp.task('webpack:build', done => {
    // modify some webpack config options
    var myConfig = Object.create(webpackConfig)
    myConfig.plugins = (myConfig.plugins || []).concat(
        new webpack.SourceMapDevToolPlugin({
            // // asset matching
            // test: string | RegExp | Array,
            // include: string | RegExp | Array,
            // exclude: string | RegExp | Array,

            // // file and reference
            // filename: string,
            // append: bool | string,

            // // sources naming
            // moduleFilenameTemplate: string,
            // fallbackModuleFilenameTemplate: string,

            // // quality/performance
            // module: bool,
            // columns: bool,
            // lineToLine: bool | object
          }),
        new webpack.DefinePlugin({
            'process.env': {
                // This has effect on the react lib size
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin()
    )

    // run webpack
    webpack(myConfig, function(err, stats) {
        if(err) throw new gutil.PluginError('webpack:build', err)

        gutil.log('[webpack:build]', stats.toString({ colors: true }))
        done()
    })
})


// modify some webpack config options
var myDevConfig = Object.create(webpackConfig)
myDevConfig.devtool = 'sourcemap'
myDevConfig.debug = true

// create a single instance of the compiler to allow caching
var devCompiler = webpack(myDevConfig)



gulp.task('webpack:build-dev', callback => {
    // run webpack
    devCompiler.run((err, stats) => {
        if (err) throw new gutil.PluginError('webpack:build-dev', err)

        gutil.log('[webpack:build-dev]', stats.toString({ colors: true }))
        callback()
    })
})



gulp.task('webpack:dev-server', callback => {
    // modify some webpack config options
    var myConfig = Object.create(webpackConfig)
    myConfig.devtool = 'sourcemap'
    myConfig.debug = true

    // Start a webpack-dev-server
    new WebpackDevServer(webpack(myConfig), {
        publicPath: '/' + myConfig.output.publicPath,
        stats: {
            colors: true
        }
    }).listen(8001, 'localhost', err => {
        if(err) throw new gutil.PluginError('webpack-dev-server', err)
        gutil.log('[webpack-dev-server]', 'http://localhost:8001/webpack-dev-server/index.html')
    })
})