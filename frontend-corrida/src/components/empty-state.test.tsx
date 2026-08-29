import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "@/components/empty-state";

vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={String(href)} {...props}>{children}</a> }));

describe("EmptyState", () => {
  it("orienta o próximo passo com link acessível", () => {
    render(<EmptyState title="Nenhum tênis" description="Cadastre o equipamento." action="Adicionar tênis" href="/tenis/novo" icon="shoe" />);
    expect(screen.getByRole("heading", { name: "Nenhum tênis" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /adicionar tênis/i })).toHaveAttribute("href", "/tenis/novo");
  });
});
