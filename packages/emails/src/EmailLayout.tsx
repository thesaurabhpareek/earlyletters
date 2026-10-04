import { brand } from "@scribe/brand";
import { emails } from "@scribe/content";
import type { CSSProperties } from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";
import type { EmailDoc } from "./docs";
import { fill } from "./fill";
import { cls, darkCss, light, sans, serif } from "./theme";

/**
 * The one layout every email uses. Text only: no images (so no tracking pixel can hide in one),
 * no remote fonts, no tracked links. One action at most, as a bulletproof button with the raw
 * link underneath for clients that block buttons.
 */
const c = emails.common;

const para: CSSProperties = {
  fontFamily: sans,
  fontSize: 16,
  lineHeight: "25px",
  color: light.text,
  margin: "0 0 16px",
};
const quiet: CSSProperties = {
  fontFamily: sans,
  fontSize: 14,
  lineHeight: "21px",
  color: light.muted,
  margin: "0 0 12px",
};
const foot: CSSProperties = {
  fontFamily: sans,
  fontSize: 13,
  lineHeight: "19px",
  color: light.muted,
  margin: "0 0 6px",
};
const link: CSSProperties = {
  color: light.accent,
  textDecoration: "underline",
};

export function EmailLayout({ doc }: { doc: EmailDoc }) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <title>{doc.subject}</title>
        <style dangerouslySetInnerHTML={{ __html: darkCss }} />
      </Head>
      {/* The subject is the <title>; the preview is only the inbox snippet. */}
      <Preview useTitleTag={false}>{doc.preview}</Preview>
      {/* Body copies its inline style onto an inner cell the dark stylesheet cannot reach, so the
          page colour lives on a classed wrapper instead (and on <body> through the stylesheet). */}
      <Body className={cls.body} style={{ margin: 0, padding: 0 }}>
        <Section
          className={cls.body}
          style={{ backgroundColor: light.bg, padding: "32px 0" }}
        >
          <Container
            style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}
          >
            <Text
              className={cls.text}
              style={{
                fontFamily: serif,
                fontSize: 20,
                lineHeight: "26px",
                color: light.text,
                margin: "0 0 20px 4px",
              }}
            >
              {fill(c.wordmark)}
            </Text>

            <Section
              className={cls.card}
              style={{
                backgroundColor: light.card,
                border: `1px solid ${light.line}`,
                borderRadius: 14,
                padding: "32px 28px 20px",
              }}
            >
              <Heading
                as="h1"
                className={cls.text}
                style={{
                  fontFamily: serif,
                  fontWeight: 500,
                  fontSize: 26,
                  lineHeight: "33px",
                  color: light.text,
                  margin: "0 0 18px",
                }}
              >
                {doc.heading}
              </Heading>

              {doc.paragraphs.map((p) => (
                <Text key={p} className={cls.text} style={para}>
                  {p}
                </Text>
              ))}

              {doc.action && (
                <Section style={{ margin: "8px 0 20px" }}>
                  <Button
                    href={doc.action.url}
                    className={cls.button}
                    style={{
                      backgroundColor: light.accent,
                      color: light.onAccent,
                      borderRadius: 999,
                      padding: "14px 28px",
                      fontFamily: sans,
                      fontSize: 16,
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    {doc.action.label}
                  </Button>
                  {doc.actionNote && (
                    <Text
                      className={cls.muted}
                      style={{ ...quiet, margin: "14px 0 0" }}
                    >
                      {doc.actionNote}
                    </Text>
                  )}
                  <Text
                    className={cls.muted}
                    style={{ ...quiet, margin: "14px 0 0" }}
                  >
                    {c.linkHelp}
                  </Text>
                  <Text
                    className={cls.muted}
                    style={{
                      ...quiet,
                      wordBreak: "break-all",
                      margin: "4px 0 0",
                    }}
                  >
                    <Link
                      className={cls.link}
                      href={doc.action.url}
                      style={link}
                    >
                      {doc.action.url}
                    </Link>
                  </Text>
                </Section>
              )}

              {doc.notes.map((n) => (
                <Text key={n} className={cls.muted} style={quiet}>
                  {n}
                </Text>
              ))}
              {doc.reference && (
                <Text className={cls.muted} style={quiet}>
                  {doc.reference}
                </Text>
              )}
            </Section>

            <Section style={{ padding: "20px 4px 0" }}>
              <Text className={cls.muted} style={foot}>
                {doc.footer}
              </Text>
              {doc.footer !== fill(c.footerContact) && (
                <Text className={cls.muted} style={foot}>
                  {fill(c.footerContact)}
                </Text>
              )}
              <Text className={cls.muted} style={foot}>
                <Link
                  className={cls.link}
                  href={brand.web.privacy}
                  style={link}
                >
                  {c.privacyLink}
                </Link>
                {"\u00a0\u00a0\u00b7\u00a0\u00a0"}
                <Link className={cls.link} href={brand.web.terms} style={link}>
                  {c.termsLink}
                </Link>
              </Text>
              <Text
                className={cls.muted}
                style={{
                  ...foot,
                  fontFamily: serif,
                  fontStyle: "italic",
                  marginTop: 12,
                }}
              >
                {c.tagline}
              </Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}
