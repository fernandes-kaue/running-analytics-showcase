import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";

export function EmptyState({ title, description, action, href, icon = "spark" }: { title: string; description: string; action?: string; href?: string; icon?: IconName }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon name={icon} width={22} height={22} /></span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && href ? <Link className="button button-primary" href={href}><Icon name="plus" width={18} height={18} />{action}</Link> : null}
    </div>
  );
}
