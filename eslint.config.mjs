import { FlatCompat } from '@eslint/eslintrc';
import { fixupConfigRules } from '@eslint/compat';
import js from '@eslint/js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default fixupConfigRules(
  compat.config({
    extends: ['expo'],
    plugins: ['import'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@features/*/*/*'],
              message: 'Import from the feature domain barrel file (e.g., @features/auth/components) instead of deep internal files.',
            },
            {
              group: ['@features/auth', '@features/chats', '@features/onboarding', '@features/settings'],
              message: 'Import from specific feature domains (e.g., @features/auth/api) instead of the root feature barrel file.',
            }
          ]
        }
      ]
    },
    overrides: [
      {
        files: ['src/features/**/*', 'src/core/**/*', 'src/shared/**/*', 'src/store/**/*'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  group: ['@features/*'],
                  message: 'Strict FSD: This layer is forbidden from importing features to prevent import cycles and tight coupling. Lift shared logic to @shared or @store, or compose features at the @app layer.',
                },
                {
                  group: ['../*/api', '../*/components', '../*/screens', '../*/slices', '../*/schema', '../../features/*'],
                  message: 'Strict FSD: Cross-feature relative imports are banned.',
                }
              ]
            }
          ]
        }
      }
    ]
  })
);
