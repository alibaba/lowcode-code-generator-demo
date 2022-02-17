const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = ({ onGetWebpackConfig }) => {
  onGetWebpackConfig((config) => {
    config.resolve.plugin('tsconfigpaths').use(TsconfigPathsPlugin, [
      {
        configFile: './tsconfig.json',
      },
    ]);

    config.merge({
      entry: {
        index: require.resolve('./src/demo/index.tsx'),
      },
    });

    config.plugin('index').use(HtmlWebpackPlugin, [
      {
        inject: false,
        templateParameters: {},
        template: require.resolve('./public/index.html'),
        filename: 'index.html',
      },
    ]);

    config.plugins.delete('hot');
    config.devServer.hot(false);
  });
};
