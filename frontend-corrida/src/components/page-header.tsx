import Link from "next/link";
import { Icon } from "@/components/icons";

export function PageHeader({ eyebrow, title, description, action, href }: { eyebrow: string; title: string; description: string; action?: string; href?: string }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action && href ? <Link className="button button-primary" href={href}><Icon name="plus" width={18} height={18} />{action}</Link> : null}
    </header>
  );
}
