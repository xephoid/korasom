// const path = require('path');
// const CopyWebpackPlugin = require('copy-webpack-plugin');

// module.exports = {
//   entry: './app/client/index.js',
//   output: {
//     path: path.resolve(__dirname, './app/build'),
//     filename: 'app.js'
//   },

  
//   module: {
//     loaders: [
//       {
//         test: /\.js$/,
//         exclude: /(node_modules|bower_components)/,
//         loader: 'babel-loader',
//         query: {
//           presets: ['es2015', 'env', 'react'],
//         }
//       }
//     ],
//     // rules: [
//     //   { test: /\.json$/, use: 'json-loader' },
      
//     //   {
//     //    test: /\.css$/,
//     //    use: [ 'style-loader', 'css-loader' ]
//     //   }
//     // ]
//   }
// }

const path = require('path');

module.exports = {
  entry: './app/client/index.js',
  output: {
    path: path.resolve(__dirname, './app/build'),
    filename: 'app.js',
  },
  module: {
    rules: [
      {
        loader: 'babel-loader',
        query: {
          presets: ['env', 'react', 'stage-1'],
        },
        test: /\.js$/,
        exclude: /node_modules/,
      },
      { test: /\.json$/,
        use: [
          { loader: 'json-loader' },
        ]
      },
      {
        test: /\.css$/,
        use: [ 
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ]
      }
    ],
    // rules: [
      // { test: /\.json$/,
      //   use: [
      //     { loader: 'json-loader' },
      //   ]
      // },
      // {
      //   test: /\.css$/,
      //   use: [ 
      //     { loader: 'style-loader' },
      //     { loader: 'css-loader' },
      //   ]
      // }
    // ]
  },
};
