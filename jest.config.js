module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|nativewind|react-native-svg|@shopify/react-native-skia|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@gorhom/bottom-sheet|@legendapp/list|react-native-keyboard-controller)',
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/android/', '<rootDir>/ios/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@core$': '<rootDir>/src/core',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@features$': '<rootDir>/src/features',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@shared$': '<rootDir>/src/shared',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@store$': '<rootDir>/src/store',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@services$': '<rootDir>/src/services',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@types$': '<rootDir>/src/types',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
};

