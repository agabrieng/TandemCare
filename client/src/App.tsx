function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">FinanceKids</h1>
        <p className="text-xl text-muted-foreground mb-4">Gestão Financeira para Filhos</p>
        <p className="text-lg text-muted-foreground">Teste básico - React funcionando!</p>
        <button 
          onClick={() => alert('React está funcionando!')}
          className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Testar JavaScript
        </button>
      </div>
    </div>
  );
}

export default App;
