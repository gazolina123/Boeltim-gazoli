// Dados brutos das 15 disciplinas do 8º Ano
const dadosDisciplinas = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// NOTA SOBRE FREQUÊNCIA: O valor de 92% é apenas FICTÍCIO/DEMONSTRATIVO para esta primeira versão.

// Função para normalizar qualquer formato de nota para a escala de 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null; // Nota não lançada
  }

  // Converter vírgula decimal para ponto (ex: "7,8" vira "7.8")
  let strValor = String(valor).replace(",", ".");
  let numero = parseFloat(strValor);

  // Verificar se o valor é numérico e válido
  if (isNaN(numero) || numero < 0 || numero > 100) {
    return null; // Valor inválido
  }

  // Ajustar valores acima de 10 (ex: 82 vira 8.2; 100 vira 10.0)
  if (numero > 10 && numero <= 100) {
    numero = numero / 10;
  }

  return numero;
}

// Função para formatar exibição das notas no HTML
function formatarExibicaoNota(nota) {
  if (nota === null) return "—";
  return nota.toFixed(1).replace(".", ",");
}

// Inicialização e preenchimento automático da página
function renderizarBoletim() {
  const tabelaCorpo = document.getElementById("tabela-corpo");
  tabelaCorpo.innerHTML = ""; // Limpa a tabela

  let somaMedias = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let contadorBomDesempenho = 0;
  let contadorAtencao = 0;

  dadosDisciplinas.forEach(item => {
    // Normalizar notas dos 3 trimestres
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Calcular soma das faltas
    const totalFaltasDisciplina = item.faltas.reduce((a, b) => a + b, 0);
    totalFaltasGeral += totalFaltasDisciplina;

    // Calcular média ignorando notas ausentes/nulas
    const notasValidas = [n1, n2, n3].filter(n => n !== null);
    let media = null;
    let situacaoTexto = "Nota ainda não disponível";
    let situacaoClasse = "situacao-indisponivel";

    if (notasValidas.length > 0) {
      const soma = notasValidas.reduce((a, b) => a + b, 0);
      media = soma / notasValidas.length;
      
      somaMedias += media;
      qtdDisciplinasComMedia++;

      if (media >= 6.0) {
        situacaoTexto = "Bom desempenho";
        situacaoClasse = "situacao-bom";
        contadorBomDesempenho++;
      } else {
        situacaoTexto = "Atenção";
        situacaoClasse = "situacao-atencao";
        contadorAtencao++;
      }
    }

    // Criar a linha na tabela HTML
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td>${formatarExibicaoNota(n1)}</td>
      <td>${formatarExibicaoNota(n2)}</td>
      <td>${formatarExibicaoNota(n3)}</td>
      <td><strong>${formatarExibicaoNota(media)}</strong></td>
      <td>${totalFaltasDisciplina}</td>
      <td class="${situacaoClasse}">${situacaoTexto}</td>
    `;
    tabelaCorpo.appendChild(tr);
  });

  // Atualizar Cards de Resumo
  const mediaGeralGeral = qtdDisciplinasComMedia > 0 ? (somaMedias / qtdDisciplinasComMedia) : null;
  document.getElementById("media-geral").textContent = formatarExibicaoNota(mediaGeralGeral);
  document.getElementById("total-faltas").textContent = totalFaltasGeral;
  document.getElementById("bom-desempenho").textContent = contadorBomDesempenho;
  document.getElementById("atencao").textContent = contadorAtencao;
}

// Executar o renderizador ao carregar a página
document.addEventListener("DOMContentLoaded", renderizarBoletim);