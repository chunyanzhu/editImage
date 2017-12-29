var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
var glob = require('glob');
require('babel-polyfill');

var port = 80;
var nodeEnv = process.env.NODE_ENV;


var pluginArray = [
    new ExtractTextPlugin("css/[name].bundle.css"),
    new webpack.optimize.CommonsChunkPlugin({
        name: "commons",
        filename: "js/commons.bundle.js"
    }),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.ProvidePlugin({
        $:  'jquery',
        jQuery: 'jquery'
    }),
    new HtmlWebpackHarddiskPlugin({
        outputPath: path.resolve(__dirname, 'dist')
    })
];

/*if(nodeEnv == 'ONLINE' || nodeEnv == 'TEST' || nodeEnv == 'PRE'){
    pluginArray.push(
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    )
}*/
var entry = {
    commons: ['./src/css/common.less','jquery', 'babel-polyfill']
};

var files = glob.sync(path.join(__dirname + '/src/html/**.html'));

files.forEach(function(file){
    var entryName = path.basename(file, '.html');
    pluginArray.push(
        new HtmlWebpackPlugin({
            filename: './views/' + entryName + '.html',
            template: file,
            chunksSortMode: 'none',
            chunks: ['commons', entryName],
            inject: true,
            minify: false,
            alwaysWriteToDisk: true
        })
    );
    entry[entryName] = './src/pages/' + entryName + '/main.js'
});



var  __PUBLICPATH__ = '/dist/',
     __PATH__ = path.join(__dirname, './dist/');

var config = {
    stats: {
        color: true,
        chunks: false,
        children: false,
        inline: true
    },
    entry: entry,
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel'
        }, {
            test: /\.vue$/,
            loader: 'vue',
        },
        {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract("style", "css", "prefix"),
            exclude: /fonts\/.*?\.css$/
        },
        {
            test: /fonts\/.*?\.css$/,
            loaders: ["file-loader?name=/css/fonts/[name].[ext]"]
        },
        {
            test: /\.(png|jpg|jpeg|gif)$/,
            loaders: ['file-loader?name=/images/[name].[ext]']
        }, {
            test: /\.less$/,
            loader: ExtractTextPlugin.extract("style","font-family-unescape!css!less")
        }, {
            test: /\.html$/,
            loader: 'html'
        }, {
           test: /\.(woff2|woff|ttf|TTF|eot|svg|otf)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
           loaders: ["file-loader?name=/css/fonts/[name].[ext]"]
        }
        ]
    },
    output: {
        publicPath: __PUBLICPATH__,
        path:  __PATH__,
        filename: "js/[name].bundle.js"//上线加版本号
    },
    vue: {
        loaders: {
            css: ExtractTextPlugin.extract('css'),
            less: ExtractTextPlugin.extract('css!less')
        }
    },
    plugins: pluginArray,
    devServer: {
        stats: {
            color: true,
            chunks: false,
            children: false,
            inline: true
        },
        host: '0.0.0.0',
        port: port,
        changeOrigin: true,
        proxy: {
            

        }
    },
    resolve: {
        alias: {
            vue: (nodeEnv == 'TEST' || nodeEnv == 'ONLINE' || nodeEnv == 'PRE') ? 'vue/dist/vue.min.js' : 'vue/dist/vue.js'
        }
    }
};

module.exports = config;
