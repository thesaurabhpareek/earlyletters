import type { CSSProperties, ReactNode } from 'react';
import { space } from '../tokens';

/** Presentation table attributes every layout table carries. */
export const tableProps = {
  role: 'presentation',
  cellPadding: 0,
  cellSpacing: 0,
  border: 0,
  width: '100%',
} as const;

/** One vertical block of the sheet. Tables, so Outlook keeps the spacing. */
export function Block({
  children,
  bottom = space[6],
  top = 0,
  style,
}: {
  children: ReactNode;
  bottom?: number;
  top?: number;
  style?: CSSProperties;
}) {
  return (
    <table {...tableProps}>
      <tbody>
        <tr>
          <td style={{ paddingTop: top, paddingBottom: bottom, ...style }}>{children}</td>
        </tr>
      </tbody>
    </table>
  );
}


/**
 * `bgcolor` attribute for <td>. React renders it, but its types only allow it
 * on <table>. The attribute is what Outlook on Windows reliably paints.
 */
export const bgcolor = (color: string) => ({ bgcolor: color }) as Record<string, string>;
