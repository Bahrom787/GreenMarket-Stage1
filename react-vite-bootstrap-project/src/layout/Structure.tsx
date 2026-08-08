import { type HTMLAttributes, type ReactNode } from 'react';
import '@/layout/layout.css';

interface WithChildren {
  children: ReactNode;
}

/** Root container for a full screen: sets base background and min-height. */
export function Screen({ children, className, ...rest }: WithChildren & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['gm-screen', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}

/** Centers and constrains content width, with responsive side padding. */
export function Page({ children, className, ...rest }: WithChildren & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['gm-page', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

/** Sticky top bar. Typically holds navigation title and primary actions. */
export function Header({ children, className, ...rest }: HeaderProps) {
  return (
    <header className={['gm-header', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </header>
  );
}

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function Footer({ children, className, ...rest }: FooterProps) {
  return (
    <footer className={['gm-footer', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </footer>
  );
}

/** Main scrollable content area between Header and Footer. */
export function Content({ children, className, ...rest }: WithChildren & HTMLAttributes<HTMLDivElement>) {
  return (
    <main className={['gm-content', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </main>
  );
}

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

/** A distinct content block within a page, separated by a hairline rule. */
export function Section({ children, className, ...rest }: SectionProps) {
  return (
    <section className={['gm-section', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </section>
  );
}
