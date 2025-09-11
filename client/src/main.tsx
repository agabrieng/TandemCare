console.log("Main.tsx carregando...");

const rootElement = document.getElementById("root");
console.log("Root element found:", rootElement);

if (rootElement) {
  rootElement.innerHTML = `
    <div style="
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      background: #f3f4f6; 
      font-family: system-ui, -apple-system, sans-serif;
      color: #111827;
      text-align: center;
      padding: 2rem;
    ">
      <div>
        <div style="
          width: 64px; 
          height: 64px; 
          background: #8b5cf6; 
          border-radius: 16px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          margin: 0 auto 1rem;
          color: white;
          font-size: 32px;
          font-weight: bold;
        ">F</div>
        <h1 style="font-size: 2.5rem; font-weight: bold; margin: 0 0 1rem;">FinanceKids</h1>
        <p style="font-size: 1.2rem; color: #6b7280; margin: 0 0 2rem;">Teste Direto - JavaScript Funcionando!</p>
        <button 
          onclick="alert('JavaScript está funcionando perfeitamente!')" 
          style="
            background: #8b5cf6; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            font-size: 1rem; 
            cursor: pointer;
            transition: background 0.2s;
          "
          onmouseover="this.style.background='#7c3aed'" 
          onmouseout="this.style.background='#8b5cf6'"
        >
          Clique para Testar
        </button>
      </div>
    </div>
  `;
} else {
  console.error("Root element não encontrado!");
}

console.log("Main.tsx executado completamente!");
