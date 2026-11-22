/**
 * Render a React Native element to static markup (react-native-web through react-dom/server) for component tests
 * (BL-278). Accessibility props land as aria-* attributes and roles, which is what the assertions read.
 * Use only inside test/component/*.test.tsx (vitest.component.config.ts supplies the alias and the native stand-ins).
 */
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export const renderMarkup = (el: ReactElement): string => renderToStaticMarkup(el);
