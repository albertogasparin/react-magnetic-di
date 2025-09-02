/* eslint-env jest */
const babel = require('@babel/core');
const plugin = require('../index');
const fs = require('fs');
const { PACKAGE_NAME } = require('../constants');

const hop = (o, key) => Object.hasOwnProperty.call(o, key);

class Benchmark {
  constructor({
    now = () => process.hrtime(),
    diff = (start) => {
      const delta = process.hrtime(start);
      return delta[0] * 1e3 + delta[1] / 1e6;
    },
  } = {}) {
    this.events = {};
    this.visits = {};
    this.results = {};
    this.now = now;
    this.diff = diff;
  }
  push(name) {
    if (!hop(this.events, name)) {
      this.events[name] = [];
      this.visits[name] = 0;
    }
    this.events[name].push(this.now());
    this.visits[name]++;
  }
  pop(name) {
    if (hop(this.events, name) && this.events[name].length > 0) {
      const start = this.events[name].shift();
      const delta = this.diff(start);

      if (!hop(this.results, name)) {
        this.results[name] = {
          aggregate: 0,
          values: [],
        };
      }

      this.results[name].aggregate += delta;
      this.results[name].values.push(delta);
    }
  }
}
let code;
// beforeEach(() => {
code = fs.readFileSync(__dirname + '/fixtures/large-fixture.mjs').toString();
// });

// test('performance', () => {
const b = new Benchmark();

babel.transformSync(code, {
  presets: [],
  plugins: [[plugin, { enabledEnvs: [undefined], globals: ['window'] }]],
  babelrc: false,
  configFile: false,
  sourceType: 'module',
  caller: { name: 'tests', supportsStaticESM: true },
  wrapPluginVisitorMethod(pluginAlias, visitorType, callback) {
    return function (...args) {
      b.push(pluginAlias);
      callback.call(this, ...args);
      b.pop(pluginAlias);
    };
  },
});

console.log('Time:', b.results[PACKAGE_NAME].aggregate.toFixed(3), 'ms');
// });
