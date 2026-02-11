const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const pkg = require('./package.json');

const banner = `/*! text-to-speech-tts v${pkg.version} | GPL-3.0+ | https://atlasaidev.com/ */`;

// Plugin: auto-generate text-to-speech-tts.esm.js after build
class GenerateESMPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('GenerateESMPlugin', () => {
      const esm = [
        banner,
        `import './text-to-speech-tts.min.js';`,
        `export default self.AtlasVoice;`,
        '',
      ].join('\n');
      fs.writeFileSync(path.resolve(__dirname, 'text-to-speech-tts.esm.js'), esm);
    });
  }
}

module.exports = {
  mode: 'production',
  entry: './text-to-speech-tts.js',
  output: {
    path: path.resolve(__dirname),
    filename: 'text-to-speech-tts.min.js',
    library: {
      name: 'AtlasVoice',
      type: 'umd',
    },
    globalObject: 'typeof self !== "undefined" ? self : this'
  },
  plugins: [
    new webpack.BannerPlugin({ banner, raw: true }),
    new GenerateESMPlugin(),
  ],
};
