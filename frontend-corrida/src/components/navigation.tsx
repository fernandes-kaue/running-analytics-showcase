"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Resumo", icon: "dashboard" },
  { href: "/atividades", label: "Atividades", icon: "activity" },
  { href: "/tenis", label: "Tênis", icon: "shoe" },
  { href: "/provas", label: "Provas", icon: "race" },
];

function active(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const content = links.map((link) => (
    <li key={link.href}>
      <Link className={`nav-link${active(pathname, link.href) ? " active" : ""}`} href={link.href} aria-current={active(pathname, link.href) ? "page" : undefined}>
        <Icon className="nav-icon" name={link.icon} />
        <span>{link.label}</span>
      </Link>
    </li>
  ));
  return mobile ? <ul className="mobile-nav" aria-label="Navegação principal">{content}</ul> : <ul className="nav-list">{content}</ul>;
}
