jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('expo-file-system', () => {
  class MockFile {
    constructor(...parts) {
      this.uri = parts
        .map((part) => {
          if (typeof part === 'string') return part;
          if (part && typeof part.uri === 'string') return part.uri;
          return String(part);
        })
        .join('/');
      this._content = '';
    }

    create() {}

    async write(content) {
      this._content = String(content);
    }

    writeSync(content) {
      this._content = String(content);
    }

    async text() {
      return this._content;
    }
  }

  return {
    File: MockFile,
    Directory: class MockDirectory {},
    Paths: {
      cache: { uri: 'file:///mock-cache' },
      document: { uri: 'file:///mock-document' },
      bundle: { uri: 'file:///mock-bundle' },
    },
  };
});

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => ({ canceled: true, assets: null })),
}));
