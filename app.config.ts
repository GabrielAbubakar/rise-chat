import { ExpoConfig, ConfigContext } from 'expo/config';

type AppEnvironment = 'development' | 'preview' | 'production';

const getEnvironment = (): AppEnvironment => {
  const env = process.env.APP_ENV || process.env.EAS_BUILD_PROFILE;
  if (env === 'production') return 'production';
  if (env === 'preview') return 'preview';
  return 'development';
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = getEnvironment();

  const getAppName = (): string => {
    switch (env) {
      case 'development':
        return 'Rise Chat (Development)';
      case 'preview':
        return 'Rise Chat (Preview)';
      case 'production':
      default:
        return 'Rise Chat';
    }
  };

  const getPackageAndBundleId = (): string => {
    switch (env) {
      case 'development':
        return 'com.gabrielabubakar.risechat.dev';
      case 'preview':
        return 'com.gabrielabubakar.risechat.preview';
      case 'production':
      default:
        return 'com.gabrielabubakar.risechat';
    }
  };

  const getScheme = (): string => {
    switch (env) {
      case 'development':
        return 'risechat.dev';
      case 'preview':
        return 'risechat.preview';
      case 'production':
      default:
        return 'risechat';
    }
  };

  return {
    ...config,
    name: getAppName(),
    slug: 'rise-chat',
    scheme: getScheme(),
    ios: {
      ...config.ios,
      bundleIdentifier: getPackageAndBundleId(),
    },
    android: {
      ...config.android,
      package: getPackageAndBundleId(),
    },
    extra: {
      ...config.extra,
      appEnv: env,
    },
  };
};
