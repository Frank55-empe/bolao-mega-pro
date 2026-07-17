/**
 * BOLÃO DA MEGA PRO — Backend (Google Apps Script)
 * ---------------------------------------------------------------
 * Como implantar:
 * 1. Abra sua planilha Google Sheets (pode ser uma em branco).
 * 2. Extensões > Apps Script. Apague o conteúdo padrão e cole este arquivo.
 * 3. Rode a função `configurarSenhaAdmin` UMA VEZ pelo editor (selecione a
 *    função no topo, clique em Executar) para definir a senha do painel.
 * 4. Implantar > Nova implantação > tipo "App da Web".
 *    - Executar como: Eu (seu e-mail)
 *    - Quem pode acessar: Qualquer pessoa
 * 5. Copie a URL gerada (termina em /exec) e cole em VITE_API_URL no .env
 *    do frontend.
 * 6. Na primeira chamada, as abas (CONFIG, CONCURSOS, PARTICIPANTES,
 *    APOSTAS, PAGAMENTOS, LOGS, ESTATISTICAS) são criadas automaticamente.
 *
 * Sobre CORS: o frontend manda POST com Content-Type "text/plain" de
 * propósito — isso faz o navegador tratar a chamada como "requisição
 * simples" e pular o preflight (OPTIONS), que o Apps Script não sabe
 * responder. Não mude o Content-Type no frontend sem entender essa parte.
 */

// ============================================================
// CONSTANTES
// ============================================================

const ABA = {
  CONFIG: 'CONFIG',
  CONCURSOS: 'CONCURSOS',
  PARTICIPANTES: 'PARTICIPANTES',
  APOSTAS: 'APOSTAS',
  PAGAMENTOS: 'PAGAMENTOS',
  LOGS: 'LOGS',
  ESTATISTICAS: 'ESTATISTICAS',
};

const CABECALHOS = {
  CONCURSOS: ['ID', 'Nome', 'Numero', 'ValorAposta', 'PremioEstimado', 'DataLimite', 'Status'],
  PARTICIPANTES: ['ID', 'Nome', 'NomeExibicao', 'WhatsApp', 'Cidade', 'Estado', 'CPF', 'Data', 'Hora'],
  APOSTAS: ['ID', 'IDParticipante', 'ConcursoID', 'Numeros', 'Quantidade', 'Valor', 'Status', 'Protocolo', 'Data', 'Hora', 'IP', 'Navegador'],
  PAGAMENTOS: ['ID', 'IDAposta', 'PIX', 'Status', 'Comprovante', 'Data', 'Hora'],
  LOGS: ['Data', 'Hora', 'Acao', 'Detalhe', 'Usuario'],
};

const TOKEN_VALIDADE_SEGUNDOS = 6 * 60 * 60; // 6 horas de sessão de admin

// ============================================================
// ROTEAMENTO PRINCIPAL
// ============================================================

function doGet(e) {
  try {
    garantirAbas();
    const endpoint = e.parameter.endpoint;
    const params = e.parameter;

    switch (endpoint) {
      case 'concursos':
        return json({ ok: true, data: listarConcursos() });
      case 'concursos/ativo':
        return json({ ok: true, data: obterConcursoAtivo() });
      case 'participantes':
        if (!autenticado(params.adminToken)) return json({ ok: false, error: 'Não autorizado.' });
        return json({ ok: true, data: listarApostasComParticipantes() });
      case 'participantes/buscar':
        return json({ ok: true, data: buscarParticipantePorWhatsapp(params.whatsapp) });
      case 'apostas/consulta':
        return json({ ok: true, data: consultarApostasPorWhatsapp(params.whatsapp) });
      case 'dashboard':
        if (!autenticado(params.adminToken)) return json({ ok: false, error: 'Não autorizado.' });
        return json({ ok: true, data: montarDashboard() });
      case 'config':
        return json({ ok: true, data: obterConfig() });
      default:
        return json({ ok: false, error: 'Endpoint GET não encontrado: ' + endpoint });
    }
  } catch (err) {
    registrarLog('ERRO_GET', String(err), '-');
    return json({ ok: false, error: 'Erro interno: ' + err });
  }
}

function doPost(e) {
  try {
    garantirAbas();
    const corpo = JSON.parse(e.postData.contents);
    const endpoint = corpo.endpoint;
    const metodo = corpo._metodo || 'POST'; // simula PUT/DELETE, já que o navegador só manda GET/POST facilmente

    switch (endpoint) {
      case 'login':
        return json(login(corpo.senha));

      case 'participantes':
        return json(criarParticipante(corpo));

      case 'apostas':
        return json(criarAposta(corpo));

      case 'pagamentos':
        return json(confirmarPagamento(corpo));

      case 'concursos': {
        if (!autenticado(corpo.adminToken)) return json({ ok: false, error: 'Não autorizado.' });
        if (metodo === 'PUT') return json(editarConcurso(corpo));
        if (metodo === 'DELETE') return json(excluirConcurso(corpo.id));
        return json(criarConcurso(corpo));
      }

      case 'apostas_status': // usado internamente pelo PUT de /apostas
        if (!autenticado(corpo.adminToken)) return json({ ok: false, error: 'Não autorizado.' });
        return json(alterarStatusAposta(corpo.id, corpo.status));

      default:
        // /apostas com _metodo PUT vem pelo mesmo endpoint "apostas"
        if (endpoint === 'apostas' && metodo === 'PUT') {
          if (!autenticado(corpo.adminToken)) return json({ ok: false, error: 'Não autorizado.' });
          return json(alterarStatusAposta(corpo.id, corpo.status));
        }
        return json({ ok: false, error: 'Endpoint POST não encontrado: ' + endpoint });
    }
  } catch (err) {
    registrarLog('ERRO_POST', String(err), '-');
    return json({ ok: false, error: 'Erro interno: ' + err });
  }
}

// Alguns navegadores/ambientes ainda mandam OPTIONS antes; respondemos vazio por segurança.
function doOptions() {
  return ContentService.createTextOutput('');
}

// ============================================================
// SETUP DAS ABAS
// ============================================================

function garantirAbas() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(ABA).forEach((chave) => {
    const nome = ABA[chave];
    let aba = planilha.getSheetByName(nome);
    if (!aba) {
      aba = planilha.insertSheet(nome);
      const cabecalho = CABECALHOS[nome];
      if (cabecalho) {
        aba.appendRow(cabecalho);
        aba.getRange(1, 1, 1, cabecalho.length).setFontWeight('bold').setBackground('#16a34a').setFontColor('#ffffff');
        aba.setFrozenRows(1);
      }
    }
  });

  const configAba = planilha.getSheetByName(ABA.CONFIG);
  if (configAba.getLastRow() === 0) {
    configAba.appendRow(['Chave', 'Valor']);
    configAba.appendRow(['nomeBolao', 'Bolão da Mega PRO']);
    configAba.appendRow(['senhaAdminHash', '']);
  }
}

/**
 * Rode esta função UMA VEZ manualmente pelo editor do Apps Script para
 * definir (ou trocar) a senha do painel administrativo.
 */
function configurarSenhaAdmin() {
  const novaSenha = 'troque-esta-senha'; // <-- EDITE AQUI antes de rodar
  garantirAbas();
  const hash = gerarHash(novaSenha);
  definirConfig('senhaAdminHash', hash);
  Logger.log('Senha de admin configurada com sucesso.');
}

// ============================================================
// AUTENTICAÇÃO DE ADMIN
// ============================================================

function gerarHash(texto) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto);
  return bytes.map((b) => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
}

function login(senha) {
  const hashArmazenado = obterConfig().senhaAdminHash;
  if (!hashArmazenado) {
    return { ok: false, error: 'Nenhuma senha configurada. Rode configurarSenhaAdmin() no editor.' };
  }
  if (gerarHash(senha || '') !== hashArmazenado) {
    registrarLog('LOGIN_FALHOU', '-', '-');
    return { ok: false, error: 'Senha incorreta.' };
  }
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('admin_' + token, 'valido', TOKEN_VALIDADE_SEGUNDOS);
  registrarLog('LOGIN_OK', '-', '-');
  return { ok: true, data: { token: token } };
}

function autenticado(token) {
  if (!token) return false;
  return CacheService.getScriptCache().get('admin_' + token) === 'valido';
}

// ============================================================
// CONFIG
// ============================================================

function obterConfig() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.CONFIG);
  const linhas = aba.getDataRange().getValues();
  const config = {};
  for (let i = 1; i < linhas.length; i++) {
    config[linhas[i][0]] = linhas[i][1];
  }
  return config;
}

function definirConfig(chave, valor) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.CONFIG);
  const linhas = aba.getDataRange().getValues();
  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i][0] === chave) {
      aba.getRange(i + 1, 2).setValue(valor);
      return;
    }
  }
  aba.appendRow([chave, valor]);
}

// ============================================================
// CONCURSOS
// ============================================================

function listarConcursos() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.CONCURSOS);
  const linhas = aba.getDataRange().getValues();
  const resultado = [];
  for (let i = 1; i < linhas.length; i++) {
    const l = linhas[i];
    if (!l[0]) continue;
    resultado.push(linhaParaConcurso(l));
  }
  return resultado;
}

function linhaParaConcurso(l) {
  return {
    id: l[0],
    nome: l[1],
    numero: l[2],
    valorAposta: l[3],
    premioEstimado: l[4],
    dataLimite: l[5] instanceof Date ? l[5].toISOString() : l[5],
    status: l[6],
  };
}

function obterConcursoAtivo() {
  const concursos = listarConcursos().filter((c) => c.status === 'ABERTO');
  if (concursos.length === 0) return null;
  // Considera o último criado como o vigente.
  const ativo = concursos[concursos.length - 1];
  ativo.qtdParticipantes = contarApostasDoConcurso(ativo.id);
  return ativo;
}

function contarApostasDoConcurso(concursoId) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.APOSTAS);
  const linhas = aba.getDataRange().getValues();
  let total = 0;
  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i][2] === concursoId) total++;
  }
  return total;
}

function criarConcurso(dados) {
  if (!dados.nome || !dados.dataLimite) return { ok: false, error: 'Nome e data limite são obrigatórios.' };
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.CONCURSOS);
  const id = 'C' + Utilities.getUuid().slice(0, 8);
  aba.appendRow([
    id,
    dados.nome,
    dados.numero || 0,
    dados.valorAposta || 5,
    dados.premioEstimado || 0,
    new Date(dados.dataLimite),
    'ABERTO',
  ]);
  registrarLog('CONCURSO_CRIADO', id, '-');
  return { ok: true, data: { id: id } };
}

function editarConcurso(dados) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.CONCURSOS);
  const linhas = aba.getDataRange().getValues();
  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i][0] === dados.id) {
      const linha = i + 1;
      if (dados.nome !== undefined) aba.getRange(linha, 2).setValue(dados.nome);
      if (dados.numero !== undefined) aba.getRange(linha, 3).setValue(dados.numero);
      if (dados.valorAposta !== undefined) aba.getRange(linha, 4).setValue(dados.valorAposta);
      if (dados.premioEstimado !== undefined) aba.getRange(linha, 5).setValue(dados.premioEstimado);
      if (dados.dataLimite !== undefined) aba.getRange(linha, 6).setValue(new Date(dados.dataLimite));
      if (dados.status !== undefined) aba.getRange(linha, 7).setValue(dados.status);
      registrarLog('CONCURSO_EDITADO', dados.id, '-');
      return { ok: true, data: { id: dados.id } };
    }
  }
  return { ok: false, error: 'Concurso não encontrado.' };
}

function excluirConcurso(id) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.CONCURSOS);
  const linhas = aba.getDataRange().getValues();
  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i][0] === id) {
      aba.deleteRow(i + 1);
      registrarLog('CONCURSO_EXCLUIDO', id, '-');
      return { ok: true };
    }
  }
  return { ok: false, error: 'Concurso não encontrado.' };
}

// ============================================================
// PARTICIPANTES
// ============================================================

function criarParticipante(dados) {
  if (!dados.nome || !dados.whatsapp) return { ok: false, error: 'Nome e WhatsApp são obrigatórios.' };

  const whatsappLimpo = String(dados.whatsapp).replace(/\D/g, '');
  const existente = buscarParticipantePorWhatsappBruto(whatsappLimpo);
  if (existente) {
    return { ok: true, data: { id: existente.id } }; // participante recorrente: reaproveita o cadastro
  }

  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.PARTICIPANTES);
  const id = 'P' + Utilities.getUuid().slice(0, 8);
  const agora = new Date();
  aba.appendRow([
    id,
    dados.nome,
    dados.nomeExibicao || dados.nome,
    whatsappLimpo,
    dados.cidade || '',
    dados.estado || '',
    dados.cpf || '',
    Utilities.formatDate(agora, Session.getScriptTimeZone(), 'dd/MM/yyyy'),
    Utilities.formatDate(agora, Session.getScriptTimeZone(), 'HH:mm'),
  ]);
  registrarLog('PARTICIPANTE_CRIADO', id, whatsappLimpo);
  return { ok: true, data: { id: id } };
}

function buscarParticipantePorWhatsappBruto(whatsappLimpo) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.PARTICIPANTES);
  const linhas = aba.getDataRange().getValues();
  for (let i = 1; i < linhas.length; i++) {
    if (String(linhas[i][3]).replace(/\D/g, '') === whatsappLimpo) {
      return {
        id: linhas[i][0],
        nome: linhas[i][1],
        nomeExibicao: linhas[i][2],
        whatsapp: linhas[i][3],
        cidade: linhas[i][4],
        estado: linhas[i][5],
      };
    }
  }
  return null;
}

function buscarParticipantePorWhatsapp(whatsapp) {
  return buscarParticipantePorWhatsappBruto(String(whatsapp || '').replace(/\D/g, ''));
}

// ============================================================
// APOSTAS
// ============================================================

function criarAposta(dados) {
  if (!dados.idParticipante || !dados.concursoId || !Array.isArray(dados.numeros)) {
    return { ok: false, error: 'Dados incompletos para registrar a aposta.' };
  }
  if (dados.numeros.length < 6 || dados.numeros.length > 15) {
    return { ok: false, error: 'A aposta deve ter entre 6 e 15 números.' };
  }
  if (new Set(dados.numeros).size !== dados.numeros.length) {
    return { ok: false, error: 'Números repetidos na aposta.' };
  }

  // Trava de segurança: impede duplicar a MESMA combinação de números,
  // pelo mesmo participante, no mesmo concurso (evita clique duplo / reenvio).
  const numerosOrdenados = [...dados.numeros].sort((a, b) => a - b).join(',');
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.APOSTAS);
  const linhas = aba.getDataRange().getValues();
  for (let i = 1; i < linhas.length; i++) {
    const mesmoParticipante = linhas[i][1] === dados.idParticipante;
    const mesmoConcurso = linhas[i][2] === dados.concursoId;
    const mesmosNumeros = String(linhas[i][3]) === numerosOrdenados;
    if (mesmoParticipante && mesmoConcurso && mesmosNumeros) {
      return { ok: false, error: 'Você já registrou essa combinação de números neste concurso.' };
    }
  }

  // Checa se o concurso ainda está aberto e dentro do prazo.
  const concurso = listarConcursos().find((c) => c.id === dados.concursoId);
  if (!concurso) return { ok: false, error: 'Concurso não encontrado.' };
  if (concurso.status !== 'ABERTO') return { ok: false, error: 'Este concurso já está encerrado.' };
  if (new Date() >= new Date(concurso.dataLimite)) {
    return { ok: false, error: 'O prazo para apostar neste concurso já passou.' };
  }

  const id = 'A' + Utilities.getUuid().slice(0, 8);
  const agora = new Date();
  const protocolo = dados.protocolo || ('MEGA-' + Utilities.getUuid().slice(0, 6).toUpperCase());

  aba.appendRow([
    id,
    dados.idParticipante,
    dados.concursoId,
    numerosOrdenados,
    dados.numeros.length,
    dados.valor || 0,
    dados.status || 'AGUARDANDO CONFERENCIA',
    protocolo,
    Utilities.formatDate(agora, Session.getScriptTimeZone(), 'dd/MM/yyyy'),
    Utilities.formatDate(agora, Session.getScriptTimeZone(), 'HH:mm'),
    '-',
    '-',
  ]);
  registrarLog('APOSTA_CRIADA', id, dados.idParticipante);
  return { ok: true, data: { id: id, protocolo: protocolo } };
}

function linhaParaAposta(l) {
  return {
    id: l[0],
    idParticipante: l[1],
    concursoId: l[2],
    numeros: String(l[3]).split(',').map(Number),
    quantidade: l[4],
    valor: l[5],
    status: l[6],
    protocolo: l[7],
    data: l[8],
    hora: l[9],
  };
}

function consultarApostasPorWhatsapp(whatsapp) {
  const participante = buscarParticipantePorWhatsapp(whatsapp);
  if (!participante) return [];

  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.APOSTAS);
  const linhas = aba.getDataRange().getValues();
  const resultado = [];
  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i][1] === participante.id) resultado.push(linhaParaAposta(linhas[i]));
  }
  return resultado.reverse();
}

function alterarStatusAposta(id, novoStatus) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.APOSTAS);
  const linhas = aba.getDataRange().getValues();
  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i][0] === id) {
      aba.getRange(i + 1, 7).setValue(novoStatus);
      registrarLog('STATUS_ALTERADO', id + ' -> ' + novoStatus, '-');
      return { ok: true };
    }
  }
  return { ok: false, error: 'Aposta não encontrada.' };
}

/** Junta apostas com dados do participante, para a tela admin de Participantes. */
function listarApostasComParticipantes() {
  const abaApostas = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.APOSTAS);
  const abaParticipantes = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.PARTICIPANTES);

  const mapaParticipantes = {};
  const linhasParticipantes = abaParticipantes.getDataRange().getValues();
  for (let i = 1; i < linhasParticipantes.length; i++) {
    const l = linhasParticipantes[i];
    mapaParticipantes[l[0]] = { nome: l[1], nomeExibicao: l[2], whatsapp: l[3], cidade: l[4], estado: l[5] };
  }

  const linhasApostas = abaApostas.getDataRange().getValues();
  const resultado = [];
  for (let i = 1; i < linhasApostas.length; i++) {
    const aposta = linhaParaAposta(linhasApostas[i]);
    const participante = mapaParticipantes[aposta.idParticipante] || {};
    resultado.push(Object.assign({}, aposta, { participante: participante }));
  }
  return resultado.reverse();
}

// ============================================================
// PAGAMENTOS
// ============================================================

function confirmarPagamento(dados) {
  if (!dados.idAposta) return { ok: false, error: 'ID da aposta é obrigatório.' };

  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.PAGAMENTOS);
  const id = 'PG' + Utilities.getUuid().slice(0, 8);
  const agora = new Date();
  aba.appendRow([
    id,
    dados.idAposta,
    dados.pix || '-',
    'AGUARDANDO CONFERENCIA',
    dados.comprovanteUrl || '',
    Utilities.formatDate(agora, Session.getScriptTimeZone(), 'dd/MM/yyyy'),
    Utilities.formatDate(agora, Session.getScriptTimeZone(), 'HH:mm'),
  ]);
  registrarLog('PAGAMENTO_REGISTRADO', dados.idAposta, '-');
  return { ok: true, data: { id: id } };
}

// ============================================================
// DASHBOARD
// ============================================================

function montarDashboard() {
  const apostas = listarApostasComParticipantes();

  let valorArrecadado = 0;
  let totalPago = 0;
  let totalPendente = 0;
  const porCidadeMapa = {};
  const porEstadoMapa = {};
  const porDiaMapa = {};
  const participantesUnicos = new Set();

  apostas.forEach((a) => {
    participantesUnicos.add(a.idParticipante);
    if (a.status === 'PAGO') {
      valorArrecadado += Number(a.valor) || 0;
      totalPago += Number(a.valor) || 0;
    } else if (a.status === 'AGUARDANDO CONFERENCIA' || a.status === 'PENDENTE') {
      totalPendente += Number(a.valor) || 0;
    }

    const cidade = a.participante.cidade || 'Não informado';
    porCidadeMapa[cidade] = (porCidadeMapa[cidade] || 0) + 1;

    const estado = a.participante.estado || '-';
    porEstadoMapa[estado] = (porEstadoMapa[estado] || 0) + 1;

    porDiaMapa[a.data] = (porDiaMapa[a.data] || 0) + 1;
  });

  const paraArray = (mapa, chaveNome) =>
    Object.keys(mapa).map((k) => ({ [chaveNome]: k, total: mapa[k] }));

  return {
    totalParticipantes: participantesUnicos.size,
    valorArrecadado: valorArrecadado,
    valorLiquido: valorArrecadado * 0.9, // 10% reservado para custos administrativos; ajuste como preferir
    valorPremio: valorArrecadado * 0.9,
    totalPago: totalPago,
    totalPendente: totalPendente,
    porCidade: paraArray(porCidadeMapa, 'cidade').sort((a, b) => b.total - a.total).slice(0, 8),
    porEstado: paraArray(porEstadoMapa, 'estado'),
    porDia: paraArray(porDiaMapa, 'dia'),
  };
}

// ============================================================
// LOGS / AUDITORIA
// ============================================================

function registrarLog(acao, detalhe, usuario) {
  try {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA.LOGS);
    const agora = new Date();
    aba.appendRow([
      Utilities.formatDate(agora, Session.getScriptTimeZone(), 'dd/MM/yyyy'),
      Utilities.formatDate(agora, Session.getScriptTimeZone(), 'HH:mm:ss'),
      acao,
      detalhe,
      usuario,
    ]);
  } catch (err) {
    // Nunca deixar uma falha de log quebrar a requisição principal.
  }
}

// ============================================================
// HELPER DE RESPOSTA
// ============================================================

function json(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
