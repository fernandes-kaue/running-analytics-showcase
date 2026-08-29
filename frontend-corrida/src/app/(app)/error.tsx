"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="error-page" role="alert">
      <div>
        <p className="eyebrow">Erro ao carregar</p>
        <h2>O servidor não respondeu como esperado.</h2>
        <p>Seus dados permanecem salvos. Verifique a conexão e tente carregar esta página novamente.</p>
        <button className="button button-primary" type="button" onClick={reset}>Tentar novamente</button>
      </div>
    </div>
  );
}
