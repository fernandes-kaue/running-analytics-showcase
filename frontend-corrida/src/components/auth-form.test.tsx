import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth-form";

const router = { replace: vi.fn(), refresh: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={String(href)} {...props}>{children}</a> }));

describe("AuthForm", () => {
  beforeEach(() => { vi.restoreAllMocks(); router.replace.mockReset(); router.refresh.mockReset(); });

  it("impede cadastro com senhas diferentes e preserva os valores", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<AuthForm mode="cadastro" />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome"), "Kauê");
    await user.type(screen.getByLabelText("Email"), "kaue@example.com");
    await user.type(screen.getByLabelText("Senha", { exact: true }), "senha-segura");
    await user.type(screen.getByLabelText("Confirme a senha"), "outra-senha");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(await screen.findByText("As senhas precisam ser iguais.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email")).toHaveValue("kaue@example.com");
  });

  it("envia confirmação e navega depois do cadastro", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ usuario: { id: "1", nome: "Kauê", email: "kaue@example.com" } }), { status: 201, headers: { "Content-Type": "application/json" } }));
    render(<AuthForm mode="cadastro" />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome"), "Kauê");
    await user.type(screen.getByLabelText("Email"), "kaue@example.com");
    await user.type(screen.getByLabelText("Senha", { exact: true }), "senha-segura");
    await user.type(screen.getByLabelText("Confirme a senha"), "senha-segura");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.confirmar_senha).toBe("senha-segura");
  });

  it("mostra credenciais inválidas sem recarregar a tela", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "Email ou senha inválidos." }), { status: 401, headers: { "Content-Type": "application/json" } }));
    render(<AuthForm mode="entrar" />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "kaue@example.com");
    await user.type(screen.getByLabelText("Senha"), "senha-incorreta");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email ou senha inválidos.");
    expect(router.replace).not.toHaveBeenCalled();
  });
});
