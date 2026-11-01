export { EmailLayout, type EmailLayoutProps } from './layout';
export { EmailHeader, LOGO, LOGO_CID, logoSrc, type EmailHeaderProps } from './header';
export { EmailFooter, type EmailFooterProps } from './footer';
export { Heading, Paragraph, Note, Signature, Divider, type NoteProps, type ParagraphProps } from './text';
export {
  Button,
  CodeBox,
  KeyFacts,
  LinkFallback,
  vmlButton,
  type ButtonProps,
  type CodeBoxProps,
  type KeyFact,
  type KeyFactsProps,
  type LinkFallbackProps,
} from './actions';
export { Letter, type LetterAction, type LetterProps } from './letter';
export { Block, tableProps } from './primitives';
export { DEFAULT_ASSETS, EmailAssetsProvider, EmailThemeProvider, type EmailAssets, type LogoMode, type Theme } from './theme';
export { renderEmail, renderEmailText, type RenderOptions } from './render';
