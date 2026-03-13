import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getAppName = () => {
  if (IS_DEV) return 'SpotsApp (Dev)';
  if (IS_PREVIEW) return 'SpotsApp (QA)';
  return 'SpotsApp';
};

const getBundleId = () => {
  if (IS_DEV) return 'com.spotsapp.dev';
  if (IS_PREVIEW) return 'com.spotsapp.preview';
  return 'com.spotsapp.app';
};

const getScheme = () => {
  if (IS_DEV) return 'spotsapp-dev';
  if (IS_PREVIEW) return 'spotsapp-preview';
  return 'spotsapp';
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: 'spotsapp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: getScheme(),
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: getBundleId(),
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0284C7',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    package: getBundleId(),
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#0284C7',
      },
    ],
    '@react-native-community/datetimepicker',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
