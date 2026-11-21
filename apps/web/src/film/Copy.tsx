'use client';
/**
 * Owner: coordinator. Shared typographic building blocks for scenes, so every
 * scene sets type the same way. Scenes may wrap these in motion elements.
 */
import type { CSSProperties, ReactNode } from 'react';
import styles from './Copy.module.css';

export function Dateline({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p className={styles.dateline} style={style}>{children}</p>;
}
export function Headline({ children, as: Tag = 'h2', style }: { children: ReactNode; as?: 'h1' | 'h2'; style?: CSSProperties }) {
  return <Tag className={styles.headline} style={style}>{children}</Tag>;
}
export function Support({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p className={styles.support} style={style}>{children}</p>;
}
