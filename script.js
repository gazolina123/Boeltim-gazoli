// CONFIGURAÇÃO FIXA DO ALUNO
const CONFIG_ALUNO = {
  turma: "8A",
  numeroChamada: 31,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Variável para armazenar o PIN em memória durante a sessão
let pinSessao = "";

// Dados brutos das 15 disciplinas do 8º Ano (Fallback local)
let dadosDisciplinas = [
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

let modoEdicao = false;

// Função para normalizar qualquer formato de nota LEGADO para a escala de 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  let strValor = String(valor).replace(",", ".");
  let numero = parseFloat(strValor);

  if (isNaN(numero) || numero < 0 || numero > 100) {
    return null;
  }

  if (numero > 10 && numero <= 100) {
    numero = numero / 10;
  }

  return numero;
}

// Função para formatar exibição das notas no HTML (sempre padronizado com vírgula)
function formatarExibicaoNota(nota) {
  let notaNormal = normalizarNota(nota);
  if (notaNormal === null) return "—";
  return notaNormal.toFixed(1).replace(".", ",");
}

// Formatador exclusivo para preencher o campo de input na edição (ex: 77 vira 7.7)
function formatarNotaParaInput(nota) {
  let notaNormal = normalizarNota(nota);
  if (notaNormal === null) return "";
  return notaNormal.toString().replace(".", ",");
}

// Validar valor digitado no modo edição (Nota: 0 a 10, ponto/vírgula ou vazio)
function validarNotaEditada(valor) {
  if (valor === "" || valor === null || valor === undefined) return { valido: true, valor: null };
  let str = String(valor).trim().replace(",", ".");
  let num = Number(str);
  if (isNaN(num) || num < 0 || num > 10) {
    return { valido: false, valor: null };
  }
  return { valido: true, valor: num };
}

// Validar faltas no modo edição (Inteiro >= 0)
function validarFaltaEditada(valor) {
  if (valor === "" || valor === null || valor === undefined) return { valido: false, valor: null };
  let str = String(valor).trim();
  if (!/^\d+$/.test(str)) {
    return { valido: false, valor: null };
  }
  let num = parseInt(str, 10);
  if (isNaN(num) || num < 0) {
    return { valido: false, valor: null };
  }
  return { valido: true, valor: num };
}

// Fazer login e abrir o boletim via API
async function fazerLogin() {
  const inputPin = document.getElementById("input-pin");
  const msgLogin = document.getElementById("mensagem-login");
  const pinDigitado = inputPin.value.trim();

  if (!pinDigitado) {
    msgLogin.textContent = "Digite o PIN para acessar.";
    msgLogin.className = "mensagem-status erro";
    return;
  }

  msgLogin.textContent = "Conectando...";
  msgLogin.className = "mensagem-status info";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      msgLogin.textContent = "Turma, chamada ou PIN inválidos.";
      msgLogin.className = "mensagem-status erro";
      return;
    }

    if (resposta.status === 429) {
      msgLogin.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      msgLogin.className = "mensagem-status erro";
      return;
    }

    if (!resposta.ok) {
      msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
      msgLogin.className = "mensagem-status erro";
      return;
    }

    const json = await resposta.json();
    
    // Sucesso no Login: guardar PIN em memória e limpar campo
    pinSessao = pinDigitado;
    inputPin.value = "";

    // Se existirem dados na API, substituir integralmente os dados locais
    if (json.dados && Array.isArray(json.dados.disciplinas) && json.dados.disciplinas.length > 0) {
      dadosDisciplinas = json.dados.disciplinas;
    }

    // Ocultar login e exibir o boletim
    document.getElementById("area-login").style.display = "none";
    document.getElementById("conteudo-boletim").style.display = "block";

    renderizarBoletim();

  } catch (erro) {
    msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    msgLogin.className = "mensagem-status erro";
  }
}

// Alternar entre exibição normal e modo de edição
function alternarModoEdicao() {
  modoEdicao = !modoEdicao;
  const btn = document.getElementById("btn-alternar-edicao");
  const painel = document.getElementById("painel-edicao");
  const msgEdicao = document.getElementById("mensagem-edicao");

  if (modoEdicao) {
    btn.textContent = "Cancelar edição";
    painel.style.display = "flex";
    msgEdicao.textContent = "";
  } else {
    btn.textContent = "Alterar dados";
    painel.style.display = "none";
  }

  renderizarBoletim();
}

// Salvar as alterações feitas na API
async function salvarAlteracoes() {
  const msgEdicao = document.getElementById("mensagem-edicao");
  let existeErro = false;
  const novasDisciplinas = [];

  // Percorrer as linhas da tabela e validar as entradas
  dadosDisciplinas.forEach((item, index) => {
    const inputTri1 = document.getElementById(`nota-1-${index}`);
    const inputTri2 = document.getElementById(`nota-2-${index}`);
    const inputTri3 = document.getElementById(`nota-3-${index}`);
    const inputFalta1 = document.getElementById(`falta-1-${index}`);
    const inputFalta2 = document.getElementById(`falta-2-${index}`);
    const inputFalta3 = document.getElementById(`falta-3-${index}`);

    const res1 = validarNotaEditada(inputTri1.value);
    const res2 = validarNotaEditada(inputTri2.value);
    const res3 = validarNotaEditada(inputTri3.value);

    const fRes1 = validarFaltaEditada(inputFalta1.value);
    const fRes2 = validarFaltaEditada(inputFalta2.value);
    const fRes3 = validarFaltaEditada(inputFalta3.value);

    // Destacar campos inválidos
    inputTri1.classList.toggle("invalido", !res1.valido);
    inputTri2.classList.toggle("invalido", !res2.valido);
    inputTri3.classList.toggle("invalido", !res3.valido);
    inputFalta1.classList.toggle("invalido", !fRes1.valido);
    inputFalta2.classList.toggle("invalido", !fRes2.valido);
    inputFalta3.classList.toggle("invalido", !fRes3.valido);

    if (!res1.valido || !res2.valido || !res3.valido || !fRes1.valido || !fRes2.valido || !fRes3.valido) {
      existeErro = true;
    } else {
      novasDisciplinas.push({
        disciplina: item.disciplina,
        tri1: res1.valor,
        tri2: res2.valor,
        tri3: res3.valor,
        faltas: [fRes1.valor, fRes2.valor, fRes3.valor]
      });
    }
  });

  if (existeErro) {
    msgEdicao.textContent = "Existem campos com valores inválidos. Verifique os destaques em vermelho.";
    msgEdicao.className = "mensagem-status erro";
    return;
  }

  msgEdicao.textContent = "Salvando...";
  msgEdicao.className = "mensagem-status info";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novasDisciplinas
        }
      })
    });

    if (!resposta.ok) {
      msgEdicao.textContent = "Erro ao salvar dados no servidor. Tente novamente.";
      msgEdicao.className = "mensagem-status erro";
      return;
    }

    // Atualiza os dados locais com os novos dados válidos
    dadosDisciplinas = novasDisciplinas;
    modoEdicao = false;
    document.getElementById("btn-alternar-edicao").textContent = "Alterar dados";
    document.getElementById("painel-edicao").style.display = "none";
    
    renderizarBoletim();
    alert("Dados salvos com sucesso.");

  } catch (erro) {
    msgEdicao.textContent = "Erro ao salvar dados. Verifique sua conexão e tente novamente.";
    msgEdicao.className = "mensagem-status erro";
  }
}

// Renderização dos cards e da tabela
function renderizarBoletim() {
  const tabelaCorpo = document.getElementById("tabela-corpo");
  tabelaCorpo.innerHTML = ""; // Limpa a tabela

  let somaMedias = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let contadorBomDesempenho = 0;
  let contadorAtencao = 0;

  dadosDisciplinas.forEach((item, index) => {
    // Tratamento de faltas
    let faltasArr = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const totalFaltasDisciplina = faltasArr.reduce((a, b) => (a || 0) + (b || 0), 0);
    totalFaltasGeral += totalFaltasDisciplina;

    // Se estiver em MODO DE EDIÇÃO
    if (modoEdicao) {
      const tr = document.createElement("tr");

      const valTri1 = formatarNotaParaInput(item.tri1);
      const valTri2 = formatarNotaParaInput(item.tri2);
      const valTri3 = formatarNotaParaInput(item.tri3);

      const f1 = faltasArr[0] !== undefined ? faltasArr[0] : 0;
      const f2 = faltasArr[1] !== undefined ? faltasArr[1] : 0;
      const f3 = faltasArr[2] !== undefined ? faltasArr[2] : 0;

      const tdDisc = document.createElement("td");
      const strong = document.createElement("strong");
      strong.textContent = item.disciplina;
      tdDisc.appendChild(strong);

      tr.appendChild(tdDisc);
      tr.innerHTML += `
        <td><input type="text" id="nota-1-${index}" class="input-nota" value="${valTri1}"></td>
        <td><input type="text" id="nota-2-${index}" class="input-nota" value="${valTri2}"></td>
        <td><input type="text" id="nota-3-${index}" class="input-nota" value="${valTri3}"></td>
        <td>—</td>
        <td>
          <div style="display:flex; gap:2px;">
            <input type="text" id="falta-1-${index}" class="input-falta" value="${f1}" title="Faltas 1º Tri">
            <input type="text" id="falta-2-${index}" class="input-falta" value="${f2}" title="Faltas 2º Tri">
            <input type="text" id="falta-3-${index}" class="input-falta" value="${f3}" title="Faltas 3º Tri">
          </div>
        </td>
        <td class="situacao-indisponivel">Editando...</td>
      `;
      tabelaCorpo.appendChild(tr);

    } else {
      // MODO DE EXIBIÇÃO NORMAL
      const n1 = normalizarNota(item.tri1);
      const n2 = normalizarNota(item.tri2);
      const n3 = normalizarNota(item.tri3);

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

      const tr = document.createElement("tr");

      const tdDisc = document.createElement("td");
      const strong = document.createElement("strong");
      strong.textContent = item.disciplina;
      tdDisc.appendChild(strong);

      const tdTri1 = document.createElement("td");
      tdTri1.textContent = formatarExibicaoNota(n1);

      const tdTri2 = document.createElement("td");
      tdTri2.textContent = formatarExibicaoNota(n2);

      const tdTri3 = document.createElement("td");
      tdTri3.textContent = formatarExibicaoNota(n3);

      const tdMedia = document.createElement("td");
      const strongMedia = document.createElement("strong");
      strongMedia.textContent = formatarExibicaoNota(media);
      tdMedia.appendChild(strongMedia);

      const tdFaltas = document.createElement("td");
      tdFaltas.textContent = totalFaltasDisciplina;

      const tdSit = document.createElement("td");
      tdSit.className = situacaoClasse;
      tdSit.textContent = situacaoTexto;

      tr.appendChild(tdDisc);
      tr.appendChild(tdTri1);
      tr.appendChild(tdTri2);
      tr.appendChild(tdTri3);
      tr.appendChild(tdMedia);
      tr.appendChild(tdFaltas);
      tr.appendChild(tdSit);

      tabelaCorpo.appendChild(tr);
    }
  });

  // Atualizar Cards de Resumo
  const mediaGeralGeral = qtdDisciplinasComMedia > 0 ? (somaMedias / qtdDisciplinasComMedia) : null;
  document.getElementById("media-geral").textContent = formatarExibicaoNota(mediaGeralGeral);
  document.getElementById("total-faltas").textContent = totalFaltasGeral;
  document.getElementById("bom-desempenho").textContent = contadorBomDesempenho;
  document.getElementById("atencao").textContent = contadorAtencao;
}

// Adicionar evento para tecla Enter no input do PIN
document.addEventListener("DOMContentLoaded", () => {
  const inputPin = document.getElementById("input-pin");
  if (inputPin) {
    inputPin.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        fazerLogin();
      }
    });
  }
});