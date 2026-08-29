export default function Loading() {
  return (
    <div className="loading-stack" aria-busy="true" aria-label="Carregando conteúdo">
      <div className="skeleton loading-line">Carregando</div>
      <div className="grid-metrics">
        {Array.from({ length: 4 }, (_, index) => <div className="skeleton loading-card" key={index}>Carregando</div>)}
      </div>
      <div className="skeleton" style={{ height: "20rem" }}>Carregando</div>
    </div>
  );
}
