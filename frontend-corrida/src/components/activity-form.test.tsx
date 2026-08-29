import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActivityForm } from "@/components/activity-form";
import type { Tenis } from "@/lib/types";

const router = { push: vi.fn(), refresh: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={String(href)} {...props}>{children}</a> }));

const shoe: Tenis = { id: "shoe-1", modelo: "Pegasus 41", km_limite: 700, km_acumulada: 0, percentual_uso: 0 };

describe("ActivityForm", () => {
  beforeEach(() => { vi.restoreAllMocks(); router.push.mockReset(); router.refresh.mockReset(); });

  it("exige duração positiva antes de chamar a API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<ActivityForm shoes={[shoe]} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Distância"), "5");
    await user.selectOptions(screen.getByLabelText("Tênis usado"), "shoe-1");
    await user.click(screen.getByRole("button", { name: "Registrar atividade" }));
    expect(await screen.findByText("Informe uma duração maior que zero.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("converte horas, minutos e segundos para o contrato da API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "activity-1" }), { status: 201, headers: { "Content-Type": "application/json" } }));
    render(<ActivityForm shoes={[shoe]} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Distância"), "5");
    await user.clear(screen.getByLabelText("Minutos"));
    await user.type(screen.getByLabelText("Minutos"), "29");
    await user.type(screen.getByLabelText("Segundos"), "30");
    await user.selectOptions(screen.getByLabelText("Tênis usado"), "shoe-1");
    await user.click(screen.getByRole("button", { name: "Registrar atividade" }));
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.duracao_segundos).toBe(1770);
    expect(body.tenis_id).toBe("shoe-1");
  });
});
