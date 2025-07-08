# 🧪 Testing Guide for BLE Audio Sim

This guide covers the comprehensive testing setup and best practices for the BLE Audio Sim React Native app.

## 📋 Table of Contents

1. [Testing Setup](#testing-setup)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Testing Patterns](#testing-patterns)
6. [Mocking Guidelines](#mocking-guidelines)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## 🛠️ Testing Setup

### Dependencies

The following testing dependencies are configured in `package.json`:

```json
{
  "devDependencies": {
    "@testing-library/react-native": "^12.7.2",
    "@testing-library/jest-native": "^5.4.3", 
    "@testing-library/user-event": "^14.5.2",
    "jest": "^29.7.0",
    "jest-expo": "~53.0.0",
    "react-test-renderer": "19.0.0"
  }
}
```

### Jest Configuration

Jest is configured in `package.json` with the following settings:

```json
{
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ],
    "setupFilesAfterEnv": ["<rootDir>/jest-setup.js"],
    "collectCoverageFrom": [
      "**/*.{js,jsx,ts,tsx}",
      "!**/coverage/**",
      "!**/node_modules/**",
      "!**/babel.config.js",
      "!**/expo-env.d.ts",
      "!**/.expo/**"
    ],
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/$1"
    }
  }
}
```

### Setup File

The `jest-setup.js` file configures:
- React Native Testing Library matchers
- Mock implementations for Expo modules
- Mock implementations for the custom BLE module
- Global test configurations

## 🧪 Test Types

### 1. Unit Tests
- **Location**: `__tests__/*.test.tsx`
- **Purpose**: Test individual components and functions
- **Example**: `App.test.tsx`, `ExpoDosmonoBle.test.ts`

### 2. Integration Tests
- **Location**: `__tests__/integration.test.tsx`
- **Purpose**: Test complete user workflows and component interactions
- **Example**: Device connection flow, recording workflow

### 3. Component Tests
- **Focus**: UI rendering, user interactions, state changes
- **Tools**: React Native Testing Library, user-event

### 4. Module Tests
- **Focus**: Custom native module functionality
- **Tools**: Jest mocks, TypeScript types

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests
npm test
# or
yarn test

# Run tests in watch mode
npm run test:watch
# or
yarn test:watch

# Run tests with coverage
npm run test:coverage
# or
yarn test:coverage

# Debug tests
npm run test:debug
# or
yarn test:debug
```

### Running Specific Tests

```bash
# Run specific test file
npm test App.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="Device Connection"

# Run tests in a specific directory
npm test __tests__/
```

## ✍️ Writing Tests

### Test Structure

Follow the **Arrange-Act-Assert** pattern:

```typescript
describe('Component or Function Name', () => {
  beforeEach(() => {
    // Arrange: Setup mocks and initial state
    jest.clearAllMocks();
  });

  it('should describe what it tests', async () => {
    // Arrange: Setup test data
    const mockData = { /* test data */ };
    
    // Act: Perform the action being tested
    render(<Component />);
    await user.press(screen.getByText('Button'));
    
    // Assert: Verify the outcome
    expect(screen.getByText('Expected Result')).toBeOnTheScreen();
  });
});
```

### Testing User Interactions

```typescript
import { userEvent } from '@testing-library/user-event';

const user = userEvent.setup();

// Press a button
await user.press(screen.getByText('Submit'));

// Type in a text input
await user.type(screen.getByLabelText('Username'), 'testuser');

// Clear input
await user.clear(screen.getByLabelText('Username'));
```

### Testing Async Operations

```typescript
// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText('Loading complete')).toBeOnTheScreen();
});

// Wait for element to disappear
await waitFor(() => {
  expect(screen.queryByText('Loading...')).not.toBeOnTheScreen();
});

// Test promises
await expect(asyncFunction()).resolves.toBe(expectedValue);
await expect(asyncFunction()).rejects.toThrow('Error message');
```

## 🎭 Testing Patterns

### 1. Testing Component Rendering

```typescript
it('renders main UI elements correctly', () => {
  render(<App />);
  
  expect(screen.getByText('BLE Audio Sim')).toBeOnTheScreen();
  expect(screen.getByText('Device Scanning')).toBeOnTheScreen();
  expect(screen.getByText('Activity Log')).toBeOnTheScreen();
});
```

### 2. Testing User Interactions

```typescript
it('starts device scan when button is pressed', async () => {
  render(<App />);
  
  const startScanButton = screen.getByText('Start Scan');
  await user.press(startScanButton);
  
  expect(mockBleModule.startDeviceSearch).toHaveBeenCalled();
});
```

### 3. Testing State Changes

```typescript
it('shows recording controls when device is connected', () => {
  render(<App />);
  
  // Simulate connection event
  const connectCallback = mockBleModule.addEventListener.mock.calls
    .find(call => call[0] === 'onConnectSuccess')?.[1];
  connectCallback?.({ mac: '00:11:22:33:44:55' });
  
  expect(screen.getByText('Recording Controls')).toBeOnTheScreen();
});
```

### 4. Testing Error Handling

```typescript
it('handles connection failure gracefully', async () => {
  mockBleModule.connectDevice.mockRejectedValue(new Error('Connection failed'));
  
  render(<App />);
  
  await user.press(screen.getByText('Connect'));
  
  await waitFor(() => {
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to connect to device');
  });
});
```

## 🎭 Mocking Guidelines

### 1. External Dependencies

```typescript
// Mock React Native modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: { alert: jest.fn() },
}));

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));
```

### 2. Custom Modules

```typescript
// Mock the entire custom module
jest.mock('./modules/expo-dosmono-ble', () => ({
  dosmonoBle: {
    initialize: jest.fn(),
    startDeviceSearch: jest.fn(),
    // ... other methods
  },
}));
```

### 3. Partial Mocking

```typescript
// Keep some functionality, mock others
jest.mock('./utils/helpers', () => ({
  ...jest.requireActual('./utils/helpers'),
  dangerousFunction: jest.fn(),
}));
```

## 📚 Best Practices

### 1. Test Organization

- **Group related tests** using `describe` blocks
- **Use descriptive test names** that explain the expected behavior
- **Keep tests focused** on a single piece of functionality

### 2. Test Data

- **Use realistic test data** that resembles production data
- **Create test fixtures** for commonly used data
- **Avoid hardcoded values** when possible

### 3. Assertions

- **Be specific** with assertions
- **Test both positive and negative cases**
- **Assert on user-visible behavior**, not implementation details

### 4. Mocking Strategy

- **Mock external dependencies** to isolate units under test
- **Don't mock what you're testing**
- **Keep mocks simple** and focused

### 5. Test Maintenance

- **Update tests** when requirements change
- **Remove obsolete tests**
- **Refactor tests** when code is refactored

## 🔧 Custom Test Utilities

### Test Helpers

```typescript
// Custom render function with providers
export function renderWithProviders(
  component: React.ReactElement,
  options?: RenderOptions
) {
  return render(component, {
    wrapper: ({ children }) => (
      <Provider store={store}>
        {children}
      </Provider>
    ),
    ...options,
  });
}

// Mock BLE event simulation
export function simulateBleEvent(
  eventName: keyof DosmonoBleEventMap,
  data: any
) {
  const callback = mockDosmonoBle.addEventListener.mock.calls
    .find(call => call[0] === eventName)?.[1];
  callback?.(data);
}
```

### Test Data Factories

```typescript
export const createMockDevice = (overrides: Partial<DosmonoDevice> = {}) => ({
  name: 'Test Device',
  mac: '00:11:22:33:44:55',
  rssi: -45,
  ...overrides,
});

export const createMockFileInfo = (overrides: Partial<FileInfo> = {}) => ({
  fileName: 'test.wav',
  fileSize: 1024,
  createTime: '2023-12-01T12:00:00Z',
  ...overrides,
});
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors
- Ensure all dependencies are installed: `npm install`
- Check `moduleNameMapper` in Jest config
- Verify import paths are correct

#### 2. Async test failures
- Use `waitFor` for async operations
- Enable fake timers: `jest.useFakeTimers()`
- Increase timeout if needed: `jest.setTimeout(10000)`

#### 3. Mock not working
- Ensure mock is defined before import
- Check mock return values and implementations
- Clear mocks between tests: `jest.clearAllMocks()`

#### 4. React Native component issues
- Check if component needs to be mocked
- Verify React Native Testing Library version compatibility
- Use proper queries: `getByText`, `getByRole`, etc.

### Debug Tips

1. **Use `screen.debug()`** to see rendered output
2. **Add console.log** in tests to understand flow
3. **Check mock call history** with `expect().toHaveBeenCalledWith()`
4. **Use `--verbose` flag** for detailed test output

### Performance Tips

1. **Mock heavy dependencies** to speed up tests
2. **Use `jest.mock()` at module level** for better performance
3. **Avoid unnecessary `async/await`** for synchronous operations
4. **Clean up** properly in `afterEach` hooks

## 📊 Coverage Goals

Maintain the following coverage targets:

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

Run coverage reports regularly:

```bash
npm run test:coverage
```

View coverage report at `coverage/lcov-report/index.html`

## 🔄 Continuous Integration

For CI/CD pipelines, use:

```bash
# Run tests without watch mode
npm test -- --watchAll=false

# Generate coverage and fail if below threshold
npm test -- --coverage --coverageThreshold='{"global":{"statements":80,"branches":75,"functions":80,"lines":80}}'
```

## 📝 Test Checklist

Before submitting code, ensure:

- [ ] All tests pass
- [ ] New features have corresponding tests
- [ ] Edge cases are covered
- [ ] Error scenarios are tested
- [ ] Mocks are appropriate and minimal
- [ ] Tests are readable and maintainable
- [ ] Coverage thresholds are met
- [ ] No console errors in tests

---

## 📞 Support

For testing questions or issues:

1. Check this documentation first
2. Review existing test files for examples
3. Consult React Native Testing Library docs
4. Check Jest documentation for advanced features

Happy testing! 🎉 