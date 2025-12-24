import '@testing-library/jest-dom';

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
