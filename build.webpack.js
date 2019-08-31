const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: "production",
    entry: {
        'OverlayEditor': './src/OverlayEditor-entry.js',
        'OverlayRenderer': './src/OverlayRenderer-entry.js',
        'overlay': './src/overlay.js',
        'htmlelement': './src/htmlelement.js'
    },
    output: {
        path: path.resolve(__dirname, './build'),
        filename: '[name].js'
    },
    optimization: { minimize: false },
    externals: {
        "react": "React",
        "react-dom": "ReactDOM"
    },
    plugins: [
        new CopyPlugin([
            { from: 'html/index.html', to: 'index.html' },
            { from: 'html/LocalStorageDAL.js', to: 'LocalStorageDAL.js' },
            { from: 'node_modules/react/umd/react.development.js', to: 'react.js' },
            { from: 'node_modules/react-dom/umd/react-dom.development.js', to: 'react-dom.js' }
        ])
    ],
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env'
                        ],
                        plugins: [
                            "@babel/plugin-transform-react-jsx",
                            "@babel/plugin-proposal-class-properties",
                            "@babel/plugin-proposal-object-rest-spread"
                        ]
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.scss$/,
                use: [
                    { loader: 'style-loader' },
                    { loader: 'css-loader' },
                    { loader: 'sass-loader', options: { sourceMap: true } }
                ]
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                  {
                    loader: 'file-loader',
                    options: {
                      name: '[name].[ext]',
                      outputPath: 'fonts/'
                    }
                  }
                ]
              }
        ]
    }
}