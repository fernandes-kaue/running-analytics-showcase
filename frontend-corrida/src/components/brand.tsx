import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="Running — página inicial">
      <span className="brand-mark" aria-hidden="true">RN</span>
      Running
    </Link>
  );
}
