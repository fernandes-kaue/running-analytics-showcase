import Link from "next/link";

export default function NotFound() {
  return <main className="error-page"><div><p className="eyebrow">404</p><h1>Esta página não foi encontrada.</h1><p>O endereço pode estar incorreto ou o registro não está disponível para sua conta.</p><Link className="button button-primary" href="/">Voltar ao resumo</Link></div></main>;
}
