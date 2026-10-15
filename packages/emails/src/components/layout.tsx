import { Body, Head, Html, Preview } from 'react-email';
import { Children, isValidElement, type ReactNode } from 'react';
import { layout, light, space } from '../tokens';
import { EmailFooter } from './footer';
import { GhostClose, GhostOpen, Mso, MsoHead } from './mso';
import { tableProps } from './primitives';
import { baseCss, cls, darkCss, fontCss, useEmailAssets, useForcedTheme, type Theme } from './theme';

export type EmailLayoutProps = {
  /** Inbox preview line. Required: without it clients show the first body text. */
  preheader: string;
  /** `auto` follows the reader's system (default). The gallery forces `light`/`dark`. */
  theme?: Theme;
  /** Document title; some clients show it in a browser tab when the email is opened alone. */
  title?: string;
  lang?: string;
  children: ReactNode;
};

/**
 * html, head and body; the colour-scheme metas and dark CSS; a warm desk with
 * one letter sheet on it, 600px max and fluid below. An <EmailFooter> passed
 * as a child is lifted out of the sheet and set quietly on the desk beneath it.
 */
export function EmailLayout({ preheader, theme: themeProp = 'auto', title, lang = 'en', children }: EmailLayoutProps) {
  const theme = useForcedTheme() ?? themeProp;
  const assets = useEmailAssets();
  const all = Children.toArray(children);
  const footers = all.filter((c) => isValidElement(c) && c.type === EmailFooter);
  const sheet = all.filter((c) => !(isValidElement(c) && c.type === EmailFooter));
  const scheme = theme === 'auto' ? 'light dark' : theme === 'dark' ? 'dark' : 'light only';

  return (
    <Html
      lang={lang}
      dir="ltr"
      {...{
        'xmlns:o': 'urn:schemas-microsoft-com:office:office',
        // VML namespaces for the Outlook pill button (actions.tsx).
        'xmlns:v': 'urn:schemas-microsoft-com:vml',
        'xmlns:w': 'urn:schemas-microsoft-com:office:word',
      }}
    >
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
        <meta name="color-scheme" content={scheme} />
        <meta name="supported-color-schemes" content={scheme} />
        {title ? <title>{title}</title> : null}
        <MsoHead />
        <style dangerouslySetInnerHTML={{ __html: baseCss() }} />
        {theme !== 'light' ? <style dangerouslySetInnerHTML={{ __html: darkCss(theme) }} /> : null}
        {assets.webFonts ? <Mso html={`<!--[if !mso]><!--><style>${fontCss()}</style><!--<![endif]-->`} /> : null}
      </Head>
      <Body id="body" className={cls.desk} style={{ margin: 0, padding: 0, backgroundColor: light.desk }}>
        <Preview className={cls.preheader}>{preheader}</Preview>
        <table {...tableProps} className={cls.desk} bgcolor={light.desk} style={{ backgroundColor: light.desk }}>
          <tbody>
            <tr>
              <td align="center" className={cls.gutter} style={{ padding: `${space[8]}px ${layout.gutterMobile}px ${space[10]}px` }}>
                <GhostOpen width={layout.maxWidth} />
                <table
                  {...tableProps}
                  className={cls.sheet}
                  bgcolor={light.sheet}
                  style={{
                    maxWidth: layout.maxWidth,
                    backgroundColor: light.sheet,
                    border: `1px solid ${light.line}`,
                    borderRadius: layout.radius,
                    borderCollapse: 'separate',
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        className={cls.pad}
                        align="left"
                        style={{ padding: `${layout.pad}px ${layout.padMobile}px ${space[8]}px`, textAlign: 'left' }}
                      >
                        {sheet}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {footers.length ? (
                  <table {...tableProps} style={{ maxWidth: layout.maxWidth }}>
                    <tbody>
                      <tr>
                        <td className={cls.pad} style={{ padding: `${space[6]}px ${layout.padMobile}px 0`, textAlign: 'left' }}>
                          {footers}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : null}
                <GhostClose />
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}
