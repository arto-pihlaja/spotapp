module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Replace import.meta.env.MODE with process.env.NODE_ENV
      // Needed because Zustand v5 uses import.meta.env which Metro doesn't support
      ['transform-import-meta', {}],
    ],
  };
};
