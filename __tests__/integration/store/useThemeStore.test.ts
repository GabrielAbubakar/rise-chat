import { useThemeStore } from '@/store/useThemeStore';

describe('useThemeStore integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    useThemeStore.setState({
      themePreference: 'system',
      primaryColor: 'green',
      appIcon: 'green',
    });
  });

  it('initializes with default values', () => {
    const state = useThemeStore.getState();
    expect(state.themePreference).toBe('system');
    expect(state.primaryColor).toBe('green');
    expect(state.appIcon).toBe('green');
  });

  it('updates theme preference correctly', () => {
    useThemeStore.getState().setThemePreference('dark');
    expect(useThemeStore.getState().themePreference).toBe('dark');

    useThemeStore.getState().setThemePreference('light');
    expect(useThemeStore.getState().themePreference).toBe('light');
  });

  it('updates primary color correctly', () => {
    useThemeStore.getState().setPrimaryColor('blue');
    expect(useThemeStore.getState().primaryColor).toBe('blue');
  });

  it('updates app icon correctly', () => {
    useThemeStore.getState().setAppIcon('blue');
    expect(useThemeStore.getState().appIcon).toBe('blue');
  });
});

