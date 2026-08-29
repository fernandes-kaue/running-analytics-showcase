import type { SVGProps } from "react";

export type IconName = "dashboard" | "activity" | "shoe" | "race" | "plus" | "edit" | "trash" | "arrow" | "logout" | "spark";

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props} {...common}>
      {name === "dashboard" && <><path d="M4 4h6v6H4zM14 4h6v9h-6zM4 14h6v6H4zM14 17h6v3h-6z" /></>}
      {name === "activity" && <><path d="M3 13h4l2.2-6 4.2 11 2.2-5H21" /></>}
      {name === "shoe" && <><path d="M3.5 15.5c2.4 0 4.2-.7 5.5-2.2l2-2.3c.6 2.3 2.5 3.8 5.8 4.4l3.7.7v2.4h-17z" /><path d="M8.7 13.6 6.4 9.2M12.8 13.3l1-2.1" /></>}
      {name === "race" && <><path d="M6 21V4m0 1h11l-2 3 2 3H6" /></>}
      {name === "plus" && <><path d="M12 5v14M5 12h14" /></>}
      {name === "edit" && <><path d="m4 20 4.2-1 10-10-3.2-3.2-10 10zM13.8 7l3.2 3.2" /></>}
      {name === "trash" && <><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" /></>}
      {name === "arrow" && <><path d="M5 12h14m-5-5 5 5-5 5" /></>}
      {name === "logout" && <><path d="M10 5H5v14h5m3-4 4-3-4-3m4 3H9" /></>}
      {name === "spark" && <><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4z" /></>}
    </svg>
  );
}
