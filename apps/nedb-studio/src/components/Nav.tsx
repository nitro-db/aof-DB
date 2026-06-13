import React from "react";
import { Link, useIsActive } from "@interchained/portal-react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/studio", label: "Studio" },
  { href: "/about", label: "About" },
  { href: "/docs", label: "Docs" },
];

function NavLink({ href, label }: { href: string; label: string }): React.ReactElement {
  const active = useIsActive(href);
  return (
    <Link
      href={href}
      className={
        "rounded-md px-3 py-1.5 text-sm transition " +
        (active ? "bg-white/10 text-white" : "text-slate-400 hover:text-white")
      }
    >
      {label}
    </Link>
  );
}

export function Nav(): React.ReactElement {
  return (
    <header className="glass sticky top-0 z-50 border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-accent-glow">◆</span>
          <span>NEDB Studio</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.href} {...l} />
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="https://www.npmjs.com/package/nedb-engine"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden font-mono text-xs text-slate-400 hover:text-white sm:inline"
          >
            nedb-engine
          </a>
          <a
            href="https://github.com/Eth-Interchained/nedb"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
