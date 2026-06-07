const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  ExternalHyperlink, TabStopType, TabStopPosition, UnderlineType, ImageRun,
} = require("docx");
const fs = require("fs");
const path = require("path");

const DIAG_DIR = path.join(__dirname, "diagramas");

function img(filename, widthPx, heightPx) {
  const buf = fs.readFileSync(path.join(DIAG_DIR, filename));
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new ImageRun({
      type: "png",
      data: buf,
      transformation: { width: widthPx, height: heightPx },
      altText: { title: filename, description: filename, name: filename },
    })],
    spacing: { before: 120, after: 120 },
  });
}

function imgCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, font: FONT, size: 20, italics: true, color: COLOR_GRAY })],
    spacing: { before: 60, after: 240 },
  });
}

// ─── helpers ────────────────────────────────────────────────────────────────

const FONT = "Arial";
const COLOR_PRIMARY = "1B4E8A";
const COLOR_SECTION = "2E74B5";
const COLOR_GRAY = "595959";
const COLOR_LIGHT = "D6E4F7";

function h(text, lvl, opts = {}) {
  return new Paragraph({
    heading: lvl,
    children: [new TextRun({ text, font: FONT, bold: true, ...opts })],
    spacing: { before: 240, after: 120 },
  });
}

function p(text, opts = {}) {
  const runs = Array.isArray(text)
    ? text
    : [new TextRun({ text, font: FONT, size: 24, ...opts })];
  return new Paragraph({
    children: runs,
    spacing: { before: 120, after: 120 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function pb() {
  return new Paragraph({ children: [new PageBreak()] });
}

function bold(text) {
  return new TextRun({ text, font: FONT, size: 24, bold: true });
}

function normal(text) {
  return new TextRun({ text, font: FONT, size: 24 });
}

function item(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, font: FONT, size: 24 })],
    spacing: { before: 60, after: 60 },
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text, font: FONT, size: 24 })],
    spacing: { before: 60, after: 60 },
  });
}

function numbered2(text) {
  return new Paragraph({
    numbering: { reference: "numbers2", level: 0 },
    children: [new TextRun({ text, font: FONT, size: 24 })],
    spacing: { before: 60, after: 60 },
  });
}

function space(lines = 1) {
  return new Paragraph({
    children: [new TextRun({ text: "", font: FONT })],
    spacing: { before: 0, after: lines * 120 },
  });
}

// ─── table helpers ──────────────────────────────────────────────────────────

const B = { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" };
const BORDERS = { top: B, bottom: B, left: B, right: B };

function headerCell(text, width, span = 1) {
  return new TableCell({
    columnSpan: span,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: COLOR_LIGHT, type: ShadingType.CLEAR },
    borders: BORDERS,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, font: FONT, bold: true, size: 20 })],
    })],
  });
}

function dataCell(text, width, span = 1, centered = false) {
  return new TableCell({
    columnSpan: span,
    width: { size: width, type: WidthType.DXA },
    borders: BORDERS,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text, font: FONT, size: 20 })],
    })],
  });
}

// ─── cover ──────────────────────────────────────────────────────────────────

function coverPage() {
  return [
    space(2),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "PONTIFÍCIA UNIVERSIDADE CATÓLICA DE GOIÁS", font: FONT, bold: true, size: 24 })],
      spacing: { before: 0, after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Escola Politécnica e de Artes", font: FONT, size: 24 })],
      spacing: { before: 0, after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Curso de Bacharelado em Ciência da Computação", font: FONT, size: 24 })],
      spacing: { before: 0, after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Disciplina: Interação Homem-Computador", font: FONT, size: 24 })],
      spacing: { before: 0, after: 240 },
    }),
    space(4),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "ANÁLISE E DESIGN DE INTERFACE", font: FONT, bold: true, size: 36, color: COLOR_PRIMARY })],
      spacing: { before: 0, after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Clínica SafeCare — Sistema de Agendamento de Consulta WEB", font: FONT, bold: true, size: 28, color: COLOR_SECTION })],
      spacing: { before: 0, after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Caso de Uso CSU1 — Agendar Consulta WEB", font: FONT, size: 24, color: COLOR_GRAY })],
      spacing: { before: 0, after: 480 },
    }),
    space(4),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "RAIKY PREZOTTO PEREIRA SAHB NOVAES", font: FONT, bold: true, size: 24 })],
      spacing: { before: 0, after: 240 },
    }),
    space(6),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "GOIÂNIA-GO", font: FONT, size: 24 })],
      spacing: { before: 0, after: 60 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "2026", font: FONT, size: 24 })],
    }),
  ];
}

// ─── resumo ─────────────────────────────────────────────────────────────────

function resumoPage() {
  return [
    pb(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "RESUMO", font: FONT, bold: true, size: 28 })],
      spacing: { before: 0, after: 240 },
    }),
    p("Este documento apresenta a análise da Interface Homem-Computador (IHC) do protótipo web da Clínica SafeCare, com foco no caso de uso CSU1 — Agendar Consulta WEB. A interface foi construída como uma aplicação React com sete etapas sequenciais: seleção da modalidade de atendimento, escolha da especialidade, seleção do médico, escolha de data e horário, identificação do paciente, revisão dos dados e emissão do comprovante. O trabalho inclui a descrição estrutural e comportamental da interface, o leiaute das telas, o fluxo de navegação, os cenários alternativos, a relação da interface com o modelo de análise e a avaliação do atendimento aos princípios fundamentais de IHC. O protótipo tem finalidade acadêmica e demonstra como uma interface web pode guiar o funcionário de clínica na execução de um agendamento de forma eficiente, com feedback adequado, prevenção de erros e suporte a cenários alternativos como lista de espera e cadastro de novo paciente."),
    space(2),
    p([bold("Palavras-chave: \"), normal(\"IHC, agendamento de consulta, interface web, usabilidade, caso de uso, protótipo, React, Clínica SafeCare.")]),
  ];
}

// ─── lista de figuras ────────────────────────────────────────────────────────

function listaFigurasPage() {
  return [
    pb(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "LISTA DE FIGURAS", font: FONT, bold: true, size: 28 })],
      spacing: { before: 0, after: 240 },
    }),
    ...[
      "Figura 1 — Tela inicial da Clínica SafeCare (landing page)",
      "Figura 2 — Etapa 1: Seleção da modalidade de atendimento",
      "Figura 3 — Etapa 2: Escolha da especialidade médica",
      "Figura 4 — Etapa 3: Seleção do médico",
      "Figura 5 — Etapa 4: Escolha de data e horário disponível",
      "Figura 6 — Etapa 5: Identificação do paciente",
      "Figura 7 — Etapa 6: Revisão dos dados da consulta",
      "Figura 8 — Etapa 7: Comprovante de agendamento",
      "Figura 9 — Tela de lista de espera: busca de paciente",
      "Figura 10 — Tela de lista de espera: confirmação",
      "Figura 11 — Tela de lista de espera: comprovante com posição na fila",
      "Figura 12 — Modal de cadastro de novo paciente",
      "Figura 13 — Estado: nenhum horário disponível",
      "Figura 14 — Diagrama de fluxo principal (CSU1)",
      "Figura 15 — Diagrama de cenários alternativos",
      "Figura 16 — Mapa de navegação geral das telas",
      "Figura 17 — Diagrama do modelo de análise (classes de domínio)",
    ].map((label, i) =>
      new Paragraph({
        children: [
          new TextRun({ text: label, font: FONT, size: 22 }),
          new TextRun({ text: "\t" + String(i + 10), font: FONT, size: 22 }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { before: 60, after: 60 },
      })
    ),
  ];
}

// ─── lista de tabelas ────────────────────────────────────────────────────────

function listaTabelasPage() {
  return [
    pb(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "LISTA DE TABELAS", font: FONT, bold: true, size: 28 })],
      spacing: { before: 0, after: 240 },
    }),
    ...[
      "Tabela 1 — Relação da interface com o modelo de análise",
      "Tabela 2 — Desvios e cenários alternativos",
      "Tabela 3 — Rastreabilidade dos requisitos do caso de uso",
      "Tabela 4 — Checklist de atendimento aos princípios de IHC",
    ].map((label, i) =>
      new Paragraph({
        children: [
          new TextRun({ text: label, font: FONT, size: 22 }),
          new TextRun({ text: "\t" + String(i + 7), font: FONT, size: 22 }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { before: 60, after: 60 },
      })
    ),
  ];
}

// ─── sumário ─────────────────────────────────────────────────────────────────

function sumarioPage() {
  const entries = [
    { lvl: 1, text: "1. Introdução", pg: 1 },
    { lvl: 1, text: "2. Objetivo", pg: 1 },
    { lvl: 1, text: "3. Escopo do trabalho", pg: 2 },
    { lvl: 1, text: "4. Base documental utilizada", pg: 2 },
    { lvl: 2, text: "4.1 Definição do problema e requisitos", pg: 2 },
    { lvl: 2, text: "4.2 Modelo de análise do caso de uso", pg: 2 },
    { lvl: 2, text: "4.3 Materiais de usabilidade e princípios de IHC", pg: 2 },
    { lvl: 1, text: "5. Fundamentação de IHC aplicada ao projeto", pg: 3 },
    { lvl: 2, text: "5.1 Consistência", pg: 3 },
    { lvl: 2, text: "5.2 Feedback informativo", pg: 3 },
    { lvl: 2, text: "5.3 Prevenção de erros", pg: 4 },
    { lvl: 2, text: "5.4 Recuperação de erros", pg: 4 },
    { lvl: 2, text: "5.5 Controle e liberdade do usuário", pg: 4 },
    { lvl: 2, text: "5.6 Simplicidade e clareza", pg: 5 },
    { lvl: 2, text: "5.7 Redução da carga de memória", pg: 5 },
    { lvl: 2, text: "5.8 Acessibilidade e ergonomia", pg: 5 },
    { lvl: 2, text: "5.9 Eficiência e eficácia", pg: 5 },
    { lvl: 1, text: "6. Perfil do usuário e contexto de uso", pg: 6 },
    { lvl: 1, text: "7. Descrição geral do protótipo", pg: 6 },
    { lvl: 1, text: "8. Relação da interface com o modelo de análise", pg: 7 },
    { lvl: 1, text: "9. Mapa de navegação das telas", pg: 8 },
    { lvl: 2, text: "9.1 Fluxo principal", pg: 8 },
    { lvl: 2, text: "9.2 Desvios e cenários alternativos", pg: 9 },
    { lvl: 1, text: "10. Descrição estrutural da IHC — leiaute das telas", pg: 9 },
    { lvl: 2, text: "10.1 Tela inicial / landing page", pg: 9 },
    { lvl: 2, text: "10.2 Etapa 1 — Seleção de modalidade", pg: 10 },
    { lvl: 2, text: "10.3 Etapa 2 — Escolha da especialidade", pg: 11 },
    { lvl: 2, text: "10.4 Etapa 3 — Seleção do médico", pg: 12 },
    { lvl: 2, text: "10.5 Etapa 4 — Escolha de data e horário", pg: 13 },
    { lvl: 2, text: "10.6 Etapa 5 — Identificação do paciente", pg: 14 },
    { lvl: 2, text: "10.7 Etapa 6 — Revisão dos dados", pg: 15 },
    { lvl: 2, text: "10.8 Etapa 7 — Comprovante de agendamento", pg: 16 },
    { lvl: 2, text: "10.9 Tela de lista de espera — busca de paciente", pg: 17 },
    { lvl: 2, text: "10.10 Tela de lista de espera — confirmação", pg: 18 },
    { lvl: 2, text: "10.11 Tela de lista de espera — comprovante", pg: 18 },
    { lvl: 2, text: "10.12 Modal de cadastro de novo paciente", pg: 19 },
    { lvl: 2, text: "10.13 Estado: nenhum horário disponível", pg: 20 },
    { lvl: 1, text: "11. Leiaute do comprovante", pg: 21 },
    { lvl: 1, text: "12. Descrição comportamental da IHC — caso de uso concreto", pg: 22 },
    { lvl: 2, text: "12.1 Identificação do caso de uso", pg: 22 },
    { lvl: 2, text: "12.2 Pré-condições", pg: 22 },
    { lvl: 2, text: "12.3 Garantias de sucesso / pós-condições", pg: 23 },
    { lvl: 2, text: "12.4 Fluxo principal concreto", pg: 23 },
    { lvl: 1, text: "13. Fluxos alternativos concretos", pg: 26 },
    { lvl: 2, text: "A1 — Usuário sem preferência de médico", pg: 26 },
    { lvl: 2, text: "A2 — Ver outros horários (cenário 7a)", pg: 27 },
    { lvl: 2, text: "A3 — Entrar na lista de espera (cenário 7b)", pg: 28 },
    { lvl: 2, text: "A4 — Paciente não encontrado — cadastro (cenário 10a)", pg: 29 },
    { lvl: 2, text: "A5 — Horário fica indisponível após seleção", pg: 30 },
    { lvl: 1, text: "14. Rastreabilidade dos requisitos", pg: 31 },
    { lvl: 1, text: "15. Checklist de atendimento aos princípios de IHC", pg: 32 },
    { lvl: 1, text: "Referências", pg: 33 },
  ];

  return [
    pb(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "SUMÁRIO", font: FONT, bold: true, size: 28 })],
      spacing: { before: 0, after: 240 },
    }),
    ...entries.map(({ lvl, text, pg }) =>
      new Paragraph({
        children: [
          new TextRun({ text: " ".repeat(lvl === 2 ? 4 : 0) + text, font: FONT, size: lvl === 1 ? 22 : 20, bold: lvl === 1 }),
          new TextRun({ text: "\t" + String(pg), font: FONT, size: lvl === 1 ? 22 : 20 }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { before: lvl === 1 ? 120 : 60, after: lvl === 1 ? 60 : 40 },
      })
    ),
  ];
}

// ─── section 1: introdução ───────────────────────────────────────────────────

function sec1() {
  return [
    pb(),
    h("1. Introdução", HeadingLevel.HEADING_1),
    p("Este documento apresenta a análise da Interface Homem-Computador (IHC) do sistema de agendamento de consultas médicas da Clínica SafeCare. O sistema foi desenvolvido como aplicação web e abrange o caso de uso CSU1 — Agendar Consulta WEB — junto ao caso de uso complementar CSU-LE — Incluir Paciente em Lista de Espera."),
    p("A interface foi construída com React, Vite e TypeScript, utilizando a biblioteca de componentes shadcn/ui e TanStack Query para comunicação com o back-end. O back-end é implementado em .NET 8 com banco de dados PostgreSQL, consumindo a API para listar especialidades, médicos, agendas disponíveis, registrar consultas e incluir pacientes na lista de espera."),
    p("O protótipo tem finalidade acadêmica e busca demonstrar, por meio das telas, como uma interface web pode guiar o funcionário de uma clínica médica durante a execução de um agendamento, com atenção especial à organização visual, ao feedback, à prevenção de erros e ao suporte a cenários alternativos."),
  ];
}

// ─── section 2: objetivo ─────────────────────────────────────────────────────

function sec2() {
  return [
    h("2. Objetivo", HeadingLevel.HEADING_1),
    p("O objetivo deste documento é descrever a estrutura visual e o comportamento da interface durante a execução do agendamento de consulta no sistema da Clínica SafeCare. A descrição serve como base para o trabalho acadêmico de IHC e também como roteiro para captura de prints das telas."),
    p("O documento identifica as telas existentes, os componentes visuais relevantes, os estados que representam cada etapa do wizard de agendamento, os fluxos alternativos (lista de espera, cadastro de paciente, mais horários), as mensagens de feedback e as evidências visuais necessárias para demonstrar o funcionamento do protótipo."),
  ];
}

// ─── section 3: escopo ───────────────────────────────────────────────────────

function sec3() {
  return [
    h("3. Escopo do trabalho", HeadingLevel.HEADING_1),
    p("O escopo deste trabalho abrange:"),
    item("Análise e descrição do caso de uso principal CSU1 — Agendar Consulta WEB, com sete etapas sequenciais;"),
    item("Análise do caso de uso complementar CSU-LE — Incluir Paciente em Lista de Espera;"),
    item("Descrição dos cenários alternativos previstos no modelo de análise: ver mais horários (7a), lista de espera (7b) e cadastro de novo paciente (10a);"),
    item("Mapeamento da interface com os elementos do modelo de análise (classes de domínio, fronteiras e controles);"),
    item("Avaliação do atendimento aos princípios de IHC na interface implementada;"),
    item("Descrição estrutural (leiaute) e comportamental (caso de uso concreto) da interface;"),
    item("Rastreabilidade dos requisitos funcionais para os elementos de interface."),
    space(),
    p("O documento não abrange outros casos de uso do sistema (por exemplo, cadastro de médicos, gestão de agenda pela clínica ou relatórios gerenciais)."),
  ];
}

// ─── section 4: base documental ──────────────────────────────────────────────

function sec4() {
  return [
    h("4. Base documental utilizada", HeadingLevel.HEADING_1),
    h("4.1 Definição do problema e requisitos", HeadingLevel.HEADING_2),
    p("O documento \"T2-Definição do problema.pdf\" descreve o contexto da Clínica SafeCare, os atores envolvidos (Funcionário, Paciente, Médico, Sistema de Convênio) e os requisitos funcionais do sistema. O caso de uso CSU1 exige que o funcionário possa agendar consultas por modalidade (particular ou convênio), escolhendo especialidade, médico, data e horário, e identificando o paciente. O sistema deve verificar disponibilidade em tempo real e emitir comprovante após confirmação."),
    h("4.2 Modelo de análise do caso de uso", HeadingLevel.HEADING_2),
    p("O documento \"T2-Modelo-Análise-Agendar-Consulta-WEB.pdf\" apresenta o modelo de análise em UML, com classes de domínio (Paciente, Médico, EspecialidadeMedica, AgendaAtendimento, Consulta, PlanoSaude, ListaEspera), classes de fronteira (telas da interface) e classes de controle (regras de negócio e fluxo de navegação). O modelo também descreve os cenários alternativos: 7a (ver mais horários), 7b (lista de espera) e 10a (cadastro de novo paciente)."),
    h("4.3 Materiais de usabilidade e princípios de IHC", HeadingLevel.HEADING_2),
    p("A fundamentação teórica baseia-se nos princípios de usabilidade de Jakob Nielsen (10 heurísticas), nos critérios ergônomicos de Bastien & Scapin e nos princípios de design de interação de Don Norman. Também foram consultadas as Diretrizes de Acessibilidade para Conteúdo Web (WCAG 2.1)."),
  ];
}

// ─── section 5: fundamentação IHC ────────────────────────────────────────────

function sec5() {
  return [
    pb(),
    h("5. Fundamentação de IHC aplicada ao projeto", HeadingLevel.HEADING_1),

    h("5.1 Consistência", HeadingLevel.HEADING_2),
    p("A interface mantém padrões visuais e terminológicos consistentes em todas as sete etapas do agendamento. O botão primário de avanço sempre aparece à direita, com cor azul primária. O botão \"Voltar\" sempre aparece à esquerda no cabeçalho do card. O indicador de progresso (Stepper) permanece visível em todas as etapas, mostrando a etapa atual e as anteriores já concluídas. Os rótulos das etapas são consistentes entre o Stepper e o título do card."),

    h("5.2 Feedback informativo", HeadingLevel.HEADING_2),
    p("O sistema apresenta feedback em todos os momentos críticos:"),
    item("Indicador de carregamento (spinner) ao consultar especialidades, médicos e agendas disponíveis;"),
    item("Toast de erro quando um horário selecionado não está mais disponível;"),
    item("Toast de erro quando a busca de paciente falha ou retorna sem resultados;"),
    item("Comprovante detalhado após confirmação do agendamento, com todos os dados da consulta;"),
    item("Posição na fila exibida em destaque após inclusão na lista de espera."),

    h("5.3 Prevenção de erros", HeadingLevel.HEADING_2),
    p("A interface limita as escolhas e orienta o usuário antes de cada ação:"),
    item("O botão de busca de paciente fica desabilitado enquanto os campos de nome e nome da mãe não estão preenchidos;"),
    item("A lista de especialidades já filtra apenas as disponíveis para a modalidade selecionada;"),
    item("A lista de agendas mostra apenas horários disponíveis, sem permitir seleção de horários já ocupados;"),
    item("A etapa de confirmação apresenta resumo completo antes de finalizar, permitindo que o funcionário revise todos os dados;"),
    item("O campo de data de nascimento no cadastro de paciente usa máscara de entrada."),

    h("5.4 Recuperação de erros", HeadingLevel.HEADING_2),
    p("Quando ocorre um erro, o sistema oferece caminhos de recuperação claros:"),
    item("Se um horário fica indisponível após a seleção, o toast de erro orienta o usuário e ele permanece na etapa de agenda para escolher outro;"),
    item("Se o paciente não é encontrado, o sistema oferece o botão \"Cadastrar novo paciente\", sem perda do contexto da lista de espera;"),
    item("O botão \"Corrigir paciente\" na etapa de confirmação da lista de espera permite voltar sem perda dos dados;"),
    item("O botão \"Voltar\" em qualquer etapa do agendamento desfaz apenas a última seleção, mantendo as anteriores."),

    h("5.5 Controle e liberdade do usuário", HeadingLevel.HEADING_2),
    p("O usuário mantém controle total sobre o fluxo:"),
    item("O botão \"Voltar\" está disponível em todas as etapas após a primeira;"),
    item("O botão \"Novo agendamento\" no cabeçalho permite reiniciar o fluxo a qualquer momento, com confirmação implícita pelo próprio clique;"),
    item("O usuário pode optar por não ter preferência de médico na etapa 3, pulando diretamente para a seleção de horários;"),
    item("O usuário pode sair para a lista de espera a qualquer momento na etapa de agenda, seja quando não há horários ou quando nenhum agrada."),

    h("5.6 Simplicidade e clareza", HeadingLevel.HEADING_2),
    p("Cada etapa possui uma única intenção. A etapa 1 solicita apenas a modalidade. A etapa 2 apresenta apenas as especialidades disponíveis. A etapa 4 mostra até três opções de horário, evitando sobrecarga de opções. Títulos e subtítulos são curtos e diretos, em português claro sem jargão técnico."),

    h("5.7 Redução da carga de memória", HeadingLevel.HEADING_2),
    p("A interface exibe o indicador de progresso (Stepper) com os nomes das etapas em todas as telas, eliminando a necessidade de o usuário memorizar em qual etapa está. O resumo de dados na etapa de confirmação (etapa 6) reapresenta todas as seleções feitas, dispensando que o usuário lembre do que escolheu nas etapas anteriores. O comprovante contém todas as informações relevantes da consulta agendada."),

    h("5.8 Acessibilidade e ergonomia", HeadingLevel.HEADING_2),
    p("A interface utiliza alto contraste entre texto e fundo (cinza escuro sobre branco / branco sobre azul primário). Áreas de clique (botões e cards) possuem tamanho adequado para uso em tela touch. Inputs possuem rótulos explícitos (labels) associados. Os estados de foco seguem as convengões do navegador para acessibilidade por teclado. As mensagens de erro usam toasts com contraste adequado."),

    h("5.9 Eficiência e eficácia", HeadingLevel.HEADING_2),
    p("O fluxo de agendamento foi projetado para ser concluído em sete etapas lineares, sem necessidade de navegar entre páginas diferentes. A busca de paciente por nome e nome da mãe é a forma mais rápida de identificação. A opção \"sem preferência de médico\" permite pular a etapa 3 em essência (o usuário ainda escolhe, mas com menos críterios). A página inicial (landing page) dá acesso direto ao agendamento com um único clique."),
  ];
}

// ─── section 6: perfil usuario ───────────────────────────────────────────────

function sec6() {
  return [
    pb(),
    h("6. Perfil do usuário e contexto de uso", HeadingLevel.HEADING_1),
    p("O usuário primário do sistema é o funcionário da Clínica SafeCare responsável pela recepção e pelo agendamento de consultas. Esse usuário possui experiência moderada com sistemas web, utiliza o sistema durante o horário de atendimento da clínica e pode estar atendendo o paciente presencialmente enquanto opera o sistema."),
    p("Por esse motivo, a interface precisa ser ágil, clara e previsível. O funcionário não deve precisar ler manuais para completar um agendamento. O fluxo deve ser autoexplicativo, com títulos que descrevem a ação esperada em cada etapa. Erros devem ser resolvidos localmente, sem perda de dados já inseridos."),
    p("O contexto de uso inclui:"),
    item("Computador desktop ou notebook com monitor de tamanho médio (1366×768 ou superior);"),
    item("Conexão com a intranet da clínica ou internet;"),
    item("Uso paralelo com atendimento ao paciente presencial ou telefônico;"),
    item("Possível interrupção durante o agendamento (chamada telefônica, dúvida do paciente)."),
    space(),
    p("O usuário secundário é o médico ou gestor que pode visualizar os agendamentos e a lista de espera, mas esse perfil não é coberto pela interface analisada neste documento."),
  ];
}

// ─── section 7: descrição geral do protótipo ─────────────────────────────────

function sec7() {
  return [
    h("7. Descrição geral do protótipo", HeadingLevel.HEADING_1),
    p("Foi desenvolvido um protótipo funcional de interface web para simular o fluxo de agendamento de consultas médicas na Clínica SafeCare. A aplicação é acessada via navegador web e consome uma API REST implementada em .NET 8 com banco de dados PostgreSQL."),
    p("A interface é organizada em duas páginas principais:"),
    item("Página inicial (landing page): apresenta a clínica, as especialidades disponíveis e um botão de acesso direto ao agendamento;"),
    item("Página de agendamento: wizard com sete etapas sequenciais, controladas por um gerenciador de estado (React Reducer)."),
    space(),
    p("O fluxo principal do agendamento é:"),
    numbered("Seleção da modalidade: particular ou convênio (com seleção do plano de saúde);"),
    numbered("Escolha da especialidade médica disponível para a modalidade selecionada;"),
    numbered("Seleção do médico ou opção \"sem preferência\";"),
    numbered("Escolha do horário disponível (até três opções, com paginação);"),
    numbered("Identificação do paciente por busca (nome + nome da mãe) ou cadastro;"),
    numbered("Revisão de todos os dados do agendamento;"),
    numbered("Emissão do comprovante de agendamento."),
    space(),
    p("A interface consome a API do back-end para listar especialidades, médicos, agendas disponíveis, buscar pacientes, registrar a opção de horário e confirmar o agendamento. As respostas da API orientam a navegação e exibem feedback ao usuário."),
  ];
}

// ─── section 8: relação interface × modelo ────────────────────────────────────

function sec8() {
  const W = 9360;
  const cols = [2000, 2800, 2800, 1760];

  // Domain model diagram placed before table
  const diagrama = [
    img("modelo-dominio.png", 580, 380),
    imgCaption("Figura 17 — Diagrama do modelo de análise (classes de domínio)"),
  ];

  const rows = [
    ["Etapa/Tela\", \"Classe de Fronteira (Interface)\", \"Classe de Domínio\", \"Classe de Controle"],
    ["Landing page\", \"LandingPage\", \"—\", \"—"],
    ["Etapa 1 — Modalidade\", \"Etapa1Modalidade\", \"PlanoSaude\", \"AgendamentoContext"],
    ["Etapa 2 — Especialidade\", \"Etapa2Especialidade\", \"EspecialidadeMedica\", \"AgendamentoContext"],
    ["Etapa 3 — Médico\", \"Etapa3Medico\", \"Medico, MedicoEspecialidade\", \"AgendamentoContext"],
    ["Etapa 4 — Agenda\", \"Etapa4Agenda / AgendaCard\", \"AgendaAtendimento\", \"agendaService, consultaService"],
    ["Etapa 5 — Paciente\", \"Etapa5Paciente / PacienteCard\", \"Paciente\", \"pacienteService"],
    ["Etapa 6 — Confirmação\", \"Etapa6Confirmacao\", \"Consulta (a criar)\", \"consultaService"],
    ["Etapa 7 — Comprovante\", \"Comprovante\", \"ComprovanteAgendamento\", \"AgendamentoContext"],
    ["Lista de espera — Busca\", \"ListaEsperaPage (BUSCAR)\", \"Paciente\", \"pacienteService"],
    ["Lista de espera — Confirm.\", \"ListaEsperaPage (CONFIRMAR)\", \"ListaEspera\", \"listaEsperaService"],
    ["Lista de espera — Comprov.\", \"ListaEsperaPage (COMPROVANTE)\", \"ListaEspera\", \"listaEsperaService"],
    ["Modal cadastro paciente\", \"ModalCadastro\", \"Paciente\", \"pacienteService"],
  ];

  return [
    pb(),
    h("8. Relação da interface com o modelo de análise", HeadingLevel.HEADING_1),
    p("A tabela a seguir mapeia cada tela/etapa da interface para os elementos correspondentes no modelo de análise UML: classes de fronteira (camada de apresentação), classes de domínio (entidades) e classes de controle (regras de negócio e serviços)."),
    ...diagrama,
    space(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Tabela 1 — Relação da interface com o modelo de análise", font: FONT, size: 20, italics: true })],
      spacing: { before: 60, after: 120 },
    }),
    new Table({
      width: { size: W, type: WidthType.DXA },
      columnWidths: cols,
      rows: rows.map((row, ri) =>
        new TableRow({
          tableHeader: ri === 0,
          children: row.map((cell, ci) =>
            ri === 0 ? headerCell(cell, cols[ci]) : dataCell(cell, cols[ci])
          ),
        })
      ),
    }),
  ];
}

// ─── section 9: mapa navegação ───────────────────────────────────────────────

function sec9() {
  return [
    pb(),
    h("9. Mapa de navegação das telas", HeadingLevel.HEADING_1),
    h("9.1 Fluxo principal", HeadingLevel.HEADING_2),
    p("O diagrama abaixo representa o fluxo principal de navegação do caso de uso CSU1 — Agendar Consulta WEB. O usuário segue sete etapas sequenciais, do acesso à página de agendamento até a emissão do comprovante."),
    img("mapa-navegacao.png", 580, 220),
    imgCaption("Figura 16 — Mapa de navegação geral das telas"),
    img("fluxo-principal.png", 580, 420),
    imgCaption("Figura 14 — Diagrama de fluxo principal (CSU1)"),
    p("O fluxo em texto:"),
    item('Início: landing page → botão [Agendar consulta] → página de agendamento;'),
    item('Etapa 1 (MODALIDADE): funcionário seleciona Particular ou Convênio (com plano de saúde);'),
    item('Etapa 2 (ESPECIALIDADE): sistema lista especialidades filtradas pela modalidade;'),
    item('Etapa 3 (MÉDICO): sistema lista médicos da especialidade ou opção Sem preferência;'),
    item("Etapa 4 (AGENDA): sistema mostra até 3 horários disponíveis; funcionário seleciona um;"),
    item("Etapa 5 (PACIENTE): funcionário busca paciente por nome + nome da mãe;"),
    item("Etapa 6 (CONFIRMAÇÃO): funcionário revisa todos os dados e confirma;"),
    item("Etapa 7 (COMPROVANTE): sistema exibe comprovante com código da consulta."),

    h("9.2 Desvios e cenários alternativos", HeadingLevel.HEADING_2),
    img("cenarios-alternativos.png", 580, 400),
    imgCaption("Figura 15 — Diagrama de cenários alternativos"),

    // Table of alternative scenarios
    (() => {
      const W2 = 9360;
      const cols2 = [1400, 2200, 2800, 2960];
      const rows2 = [
        ["ID\", \"Gatilho\", \"Caminho alternativo\", \"Retorno ao fluxo principal"],
        ["A1\", \"Médico sem preferência\", \"Etapa 3: funcionário clica \"Seguir sem preferência\"\", \"Etapa 4 com busca por especialidade (não por médico)"],
        ["A2 (7a)\", \"Ver mais horários\", \"Etapa 4: botão \"Ver outros horários\" incrementa offset\", \"Etapa 4 com novos horários"],
        ["A3 (7b)\", \"Nenhum horário agrada\", \"Etapa 4: botão \"Lista de espera\" → página CSU-LE\", \"Comprovante da lista de espera (fluxo independente)"],
        ["A4 (10a)\", \"Paciente não encontrado\", \"Etapa 5: botão \"Cadastrar novo paciente\" → Modal\", \"Etapa 5 com novo paciente já selecionado"],
        ["A5\", \"Horário fica indisponível\", \"Etapa 4 após seleção: toast de erro\", \"Etapa 4 para nova seleção"],
      ];
      return new Table({
        width: { size: W2, type: WidthType.DXA },
        columnWidths: cols2,
        rows: rows2.map((row, ri) =>
          new TableRow({
            tableHeader: ri === 0,
            children: row.map((cell, ci) =>
              ri === 0 ? headerCell(cell, cols2[ci]) : dataCell(cell, cols2[ci])
            ),
          })
        ),
      });
    })(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Tabela 2 — Desvios e cenários alternativos", font: FONT, size: 20, italics: true })],
      spacing: { before: 120, after: 120 },
    }),
  ];
}

// ─── section 10: leiaute das telas ───────────────────────────────────────────

function screenSection(num, title, figNum, desc, components) {
  return [
    h(`10.${num} ${title}`, HeadingLevel.HEADING_2),
    p(desc),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `[Figura ${figNum} — ${title}]`, font: FONT, size: 22, italics: true, color: COLOR_GRAY })],
      spacing: { before: 120, after: 60 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "◀ Inserir print/captura da tela aqui ▶\", font: FONT, size: 22, bold: true, color: \"888888" })],
      spacing: { before: 0, after: 180 },
    }),
    p([bold("Componentes: ")]),
    ...components.map(c => item(c)),
    space(),
  ];
}

function sec10() {
  return [
    pb(),
    h("10. Descrição estrutural da IHC — leiaute das telas", HeadingLevel.HEADING_1),
    p("Esta seção descreve cada tela do protótipo, seus componentes visuais e sua função dentro do fluxo de agendamento."),

    ...screenSection(1, "Tela inicial / landing page", 1,
      "A landing page apresenta a Clínica SafeCare e dá acesso direto ao agendamento. É a primeira tela que o funcionário vê ao acessar o sistema. Ela contextualiza o sistema e orienta o acesso rápido ao fluxo principal.",
      [
        "Barra de navegação: logo Heart + \"Clínica SafeCare\" + botão primário \"Agendar consulta\";",
        "Seção hero: título em destaque, subtexto e dois botões de CTA (agendar e lista de espera);",
        "Grade de especialidades: chips de acesso rápido às especialidades;",
        "Seção \"Como funciona\": 4 passos visuais do processo;",
        "Cards de recursos: 6 cards com diferenciais da clínica;",
        "Seção de métricas: +1.200 atendimentos/mês, +50 médicos, 98% satisfação;",
        "Depoimentos de pacientes: 3 cards com avaliações 5 estrelas;",
        "FAQ: 5 perguntas frequentes sobre o agendamento;",
        "Rodapé: contato (telefone, e-mail, endereço), links e selos LGPD/CFM.",
      ]
    ),

    ...screenSection(2, "Etapa 1 — Seleção de modalidade", 2,
      "Primeira etapa do wizard de agendamento. O funcionário escolhe se a consulta será particular ou por convênio. Essa escolha determina quais especialidades e planos serão apresentados nas etapas seguintes.",
      [
        "Cabeçalho com logo, nome da clínica, botão \"Novo agendamento\" e subtítulo CSU1;",
        "Stepper horizontal: 6 etapas, primeira ativa (MODALIDADE);",
        "Card principal: título \"Como deseja agendar?\";",
        "Botão card grande \"Particular\" (sem plano de saúde);",
        "Botão card grande \"Convênio\": ao selecionar, exibe dropdown de planos de saúde;",
        "Botão \"Prosseguir\" desabilitado até seleção completa.",
      ]
    ),

    ...screenSection(3, "Etapa 2 — Escolha da especialidade", 3,
      "Segunda etapa do wizard. O sistema lista as especialidades médicas disponíveis para a modalidade selecionada. O funcionário seleciona a especialidade desejada.",
      [
        "Stepper: etapa ESPECIALIDADE ativa;",
        "Botão \"Voltar\" no cabeçalho do card;",
        "Título: \"Escolha a especialidade\";",
        "Grade de cards de especialidade: ícone + nome (ex.: Cardiologia, Dermatologia, Ortopedia...);",
        "Estado de carregamento: spinner enquanto a API é consultada;",
        "Estado vazio: mensagem se não há especialidades disponíveis para a modalidade.",
      ]
    ),

    ...screenSection(4, "Etapa 3 — Seleção do médico", 4,
      "Terceira etapa do wizard. O sistema lista os médicos disponíveis para a especialidade e modalidade selecionadas. O funcionário pode selecionar um médico específico ou optar por \"sem preferência\".",
      [
        "Stepper: etapa MÉDICO ativa;",
        "Botão \"Voltar\";",
        "Título: \"Escolha o médico\";",
        "Cards de médico: foto (avatar), nome, CRM e botão \"Selecionar\";",
        "Botão \"Seguir sem preferência\" em destaque separado para cenário A1;",
        "Estado de carregamento: spinner.",
      ]
    ),

    ...screenSection(5, "Etapa 4 — Escolha de data e horário", 5,
      "Quarta etapa do wizard. O sistema apresenta até três horários disponíveis para a especialidade e médico selecionados. O funcionário seleciona um horário ou solicita mais opções.",
      [
        "Stepper: etapa AGENDA ativa;",
        "Botão \"Voltar\";",
        "Título: \"Escolha data e horário\";",
        "Até 3 cards AgendaCard: data formatada, horário, nome do médico e botão \"Selecionar\";",
        "Separador visual;",
        "Botão \"Nenhum horário me agrada — lista de espera\" (cenário 7b);",
        "Botão \"Ver outros horários\" (cenário 7a, incrementa offset da busca);",
        "Estado vazio: quando não há horários, exibe botões \"Voltar\" e \"Entrar na lista de espera\".",
      ]
    ),

    ...screenSection(6, "Etapa 5 — Identificação do paciente", 6,
      "Quinta etapa do wizard. O funcionário busca o paciente pelo nome e nome da mãe. O sistema retorna a lista de pacientes encontrados. O funcionário seleciona o correto ou cadastra um novo paciente.",
      [
        "Stepper: etapa PACIENTE ativa;",
        "Botão \"Voltar\";",
        "Título: \"Identifique o paciente\";",
        "Formulário de busca: campo \"Nome do paciente\" + campo \"Nome da mãe\" + botão \"Buscar\";",
        "Botão \"Buscar\" desabilitado se campos vazios; spinner durante a busca;",
        "Lista de PacienteCard após busca: nome, data de nascimento, telefone e botão \"Selecionar\";",
        "Linha com botão \"Cadastrar novo paciente\" (abre ModalCadastro);",
        "Toast de erro se não encontrado.",
      ]
    ),

    ...screenSection(7, "Etapa 6 — Revisão dos dados", 7,
      "Sexta etapa do wizard. O sistema exibe um resumo completo de todos os dados da consulta para revisão antes da confirmação final.",
      [
        "Stepper: etapa CONFIRMAÇÃO ativa;",
        "Botão \"Voltar\";",
        "Título: \"Revise os dados\";",
        "Grade de cards resumo: Modalidade, Especialidade, Médico, Data, Horário, Paciente, Código, Data de nascimento;",
        "Botão primário \"Confirmar agendamento\" em destaque;",
        "Spinner durante o envio da requisição de confirmação.",
      ]
    ),

    ...screenSection(8, "Etapa 7 — Comprovante de agendamento", 8,
      "Sétima e última etapa do wizard. Após a confirmação bem-sucedida, o sistema exibe o comprovante com todos os dados da consulta agendada.",
      [
        "Título: \"Agendamento concluído\";",
        "Comprovante formatado: código da consulta, data e horário, nome do médico, especialidade, modalidade, dados do paciente;",
        "Estilo visual de comprovante (fonte monoespaçada, borda, separadores);",
        "Botão \"Fazer novo agendamento\" para reiniciar o fluxo.",
      ]
    ),

    ...screenSection(9, "Tela de lista de espera — busca de paciente", 9,
      "Tela do caso de uso CSU-LE. Acessada quando o funcionário clica em \"Lista de espera\" na etapa 4. Exibe as informações da especialidade e médico vindas por parâmetros de URL.",
      [
        "Cabeçalho com botão \"Voltar\" (historico do navegador);",
        "Card de resumo da consulta: especialidade e médico (ou \"Sem preferência\") + aviso de notificação quando surgir vaga;",
        "Card de busca: título \"Identificar o paciente\";",
        "Formulário: campo nome + campo nome da mãe + botão \"Buscar\";",
        "Botão \"Cadastrar novo paciente\";",
        "Lista de PacienteCard após busca.",
      ]
    ),

    ...screenSection(10, "Tela de lista de espera — confirmação", 10,
      "Segunda etapa da lista de espera. Exibe resumo dos dados do paciente e da especialidade para revisão antes de confirmar a inclusão na fila.",
      [
        "Título: \"Confirmar inclusão na lista de espera\";",
        "Grade de resumo: Paciente, Código, Nascimento, Telefone, Especialidade, Médico;",
        "Botão \"Corrigir paciente\" (volta para busca);",
        "Botão primário \"Confirmar lista de espera\".",
      ]
    ),

    ...screenSection(11, "Tela de lista de espera — comprovante", 11,
      "Terceira etapa da lista de espera. Exibe confirmação visual e a posição do paciente na fila de espera.",
      [
        "Ícone de check em verde + título de sucesso;",
        "Destaque visual da posição na fila (número grande em verde);",
        "Grade de dados: Paciente, Código, Especialidade, Médico, Telefone de contato, Status;",
        "Botões: \"Novo agendamento\" e \"Voltar ao início\".",
      ]
    ),

    ...screenSection(12, "Modal de cadastro de novo paciente", 12,
      "Modal (diálogo) exibido sobre a tela atual quando o funcionário aciona o cadastro de novo paciente. Permite inserir os dados básicos sem sair do fluxo principal.",
      [
        "Modal sobreposto com título \"Cadastrar paciente\";",
        "Campos: nome completo, nome da mãe, data de nascimento, telefone, e-mail;",
        "Botão \"Cadastrar\" (submete e seleciona automaticamente o novo paciente);",
        "Botão \"Cancelar\" fecha o modal.",
      ]
    ),

    ...screenSection(13, "Estado: nenhum horário disponível", 13,
      "Estado especial da etapa 4 quando não há agendas disponíveis para os critérios selecionados nas próximas semanas.",
      [
        "Ícone CalendarX em cinza;",
        "Título: \"Nenhum horário disponível\";",
        "Mensagem explicativa orientando as opções;",
        "Botão \"Escolher outro médico\" (volta para etapa 3);",
        "Botão \"Entrar na lista de espera\".",
      ]
    ),
  ];
}

// ─── section 11: leiaute comprovante ─────────────────────────────────────────

function sec11() {
  return [
    pb(),
    h("11. Leiaute do comprovante", HeadingLevel.HEADING_1),
    p("O comprovante de agendamento é exibido na etapa 7 do wizard. Ele apresenta todas as informações relevantes da consulta de forma estruturada e legível, com estilo visual que remete a um comprovante impresso (fonte monoespaçada, código de identificação, linhas separadoras)."),
    space(),
    p("Estrutura do comprovante:"),
    item("Cabeçalho: logo da clínica + nome \"Clínica SafeCare\" + texto \"Comprovante de Agendamento\";"),
    item("Código da consulta: código único gerado pelo back-end;"),
    item("Data e horário da consulta: formatados em português (ex.: \"quinta-feira, 15 de junho de 2026 às 14:30\");"),
    item("Especialidade médica;"),
    item("Nome do médico e CRM;"),
    item("Modalidade: particular ou convênio (com nome do plano);"),
    item("Dados do paciente: nome completo, código, data de nascimento, telefone;"),
    item("Rodapé do comprovante: endereço e telefone da clínica;"),
    item("Botão \"Fazer novo agendamento\" após o comprovante."),
    space(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "[Figura 8 — Etapa 7: Comprovante de agendamento]", font: FONT, size: 22, italics: true, color: COLOR_GRAY })],
      spacing: { before: 120, after: 60 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Inserir print/captura do comprovante aqui", font: FONT, size: 20, color: COLOR_GRAY })],
      spacing: { before: 0, after: 240 },
    }),
  ];
}

// ─── section 12: caso de uso concreto ────────────────────────────────────────

function sec12() {
  return [
    pb(),
    h("12. Descrição comportamental da IHC — caso de uso concreto", HeadingLevel.HEADING_1),
    h("12.1 Identificação do caso de uso", HeadingLevel.HEADING_2),
    p([bold("Nome: \"), normal(\"Agendar Consulta WEB")]),
    p([bold("Código: \"), normal(\"CSU1")]),
    p([bold("Ator primário: \"), normal(\"Funcionário da clínica")]),
    p([bold("Atores secundários: \"), normal(\"Sistema de convênio (consulta de elegibilidade via API)")]),
    p([bold("Descrição resumida: \"), normal(\"O funcionário agenda uma consulta para um paciente existente, selecionando modalidade, especialidade, médico, data e horário, e identificando o paciente.")]),

    h("12.2 Pré-condições", HeadingLevel.HEADING_2),
    item("O funcionário está autenticado no sistema;"),
    item("Existe ao menos uma especialidade cadastrada e um médico com agenda aberta;"),
    item("O paciente a ser agendado já está cadastrado no sistema ou será cadastrado durante o fluxo."),

    h("12.3 Garantias de sucesso / pós-condições", HeadingLevel.HEADING_2),
    item("A consulta é registrada no banco de dados com status \"Agendada\";"),
    item("O horário selecionado fica bloqueado para outros agendamentos;"),
    item("O comprovante é exibido ao funcionário com código, data, horário, médico e dados do paciente."),

    h("12.4 Fluxo principal concreto", HeadingLevel.HEADING_2),
    p([bold("Contexto: \"), normal(\"A funcionária Maria acessa o sistema da Clínica SafeCare para agendar uma consulta de cardiologia para o paciente João Silva, que deseja atendimento particular com o Dr. Carlos Mendes na próxima semana.")]),
    space(),

    numbered2("Maria acessa a aplicação web da Clínica SafeCare. A landing page é exibida com o botão \"Agendar consulta\" em destaque na barra de navegação e na seção hero."),
    numbered2("Maria clica em \"Agendar consulta\". O sistema navega para a página de agendamento, exibindo a Etapa 1 (Modalidade). O Stepper mostra seis etapas, sendo a primeira ativa."),
    numbered2("Maria seleciona \"Particular\". O card de \"Particular\" recebe estado visual ativo (borda colorida, ícone de confirmação). O sistema habilita o botão \"Prosseguir\". Maria clica em \"Prosseguir\"."),
    numbered2("O sistema navega para a Etapa 2 (Especialidade). Exibe spinner enquanto consulta a API. A lista de especialidades é carregada. Maria clica em \"Cardiologia\"."),
    numbered2("O sistema navega para a Etapa 3 (Médico). Carrega a lista de cardiologistas disponíveis para atendimento particular. Maria visualiza o card do Dr. Carlos Mendes (CRM 12345) e clica em \"Selecionar\"."),
    numbered2("O sistema navega para a Etapa 4 (Agenda). Exibe spinner enquanto consulta as agendas disponíveis. Três horários são apresentados em cards: terça 10 de junho às 09:00, qui 12 de junho às 14:30 e sex 13 de junho às 11:00. Maria clica em \"Selecionar\" no card de quinta, 12 de junho às 14:30."),
    numbered2("O sistema chama a API para registrar a opção de horário (reserva temporária). Retorno de sucesso. O sistema navega para a Etapa 5 (Paciente)."),
    numbered2("Maria digita \"João Silva\" no campo \"Nome do paciente\" e \"Maria Silva\" no campo \"Nome da mãe\". Clica em \"Buscar\"."),
    numbered2("O sistema exibe um PacienteCard com os dados de João Silva (código 1042, 15/03/1985, fone (62) 9-8765-4321). Maria clica em \"Selecionar\"."),
    numbered2("O sistema navega para a Etapa 6 (Confirmação). Maria revisa todos os dados: Modalidade: Particular | Especialidade: Cardiologia | Médico: Dr. Carlos Mendes | Data: 12/06/2026 14:30 | Paciente: João Silva (1042)."),
    numbered2("Maria clica em \"Confirmar agendamento\". O botão exibe spinner. O sistema envia a requisição de confirmação ao back-end."),
    numbered2("O back-end registra a consulta e retorna os dados do comprovante. O sistema navega para a Etapa 7 (Comprovante). O comprovante exibe o código da consulta (ex.: CON-20260612-0042), data, horário, médico, especialidade, modalidade e dados do paciente."),
    numbered2("Maria informa os dados do comprovante ao paciente. O agendamento está concluído."),
  ];
}

// ─── section 13: fluxos alternativos ────────────────────────────────────────

function sec13() {
  return [
    pb(),
    h("13. Fluxos alternativos concretos", HeadingLevel.HEADING_1),

    h("A1 — Usuário sem preferência de médico", HeadingLevel.HEADING_2),
    p([bold("Contexto: \"), normal(\"O paciente não tem preferência por um médico específico. Quer o primeiro horário disponível em dermatologia, qualquer profissional.")]),
    p("Fluxo: nas etapas 1 e 2, o funcionário seleciona modalidade e especialidade normalmente. Na Etapa 3 (Médico), em vez de selecionar um médico, o funcionário clica no botão \"Seguir sem preferência de médico\". O sistema registra \"semPreferenciaMedico = true\" e navega diretamente para a Etapa 4. Na Etapa 4, a busca de horários é feita por especialidade (não por médico), podendo retornar horários de diferentes profissionais. O restante do fluxo é idêntico ao principal."),

    h("A2 — Ver outros horários (cenário 7a)", HeadingLevel.HEADING_2),
    p([bold("Contexto: \"), normal(\"Os três horários apresentados na Etapa 4 não são convenientes. O funcionário precisa ver mais opções.")]),
    p("Fluxo: na Etapa 4, o funcionário clica em \"Ver outros horários\". O sistema incrementa o \"offsetAgenda\" (de 0 para 1, de 1 para 2 etc.) e realiza nova consulta à API com o novo offset. Três novos horários são apresentados. O funcionário pode continuar clicando até encontrar um horário conveniente ou até a API retornar lista vazia (estado \"nenhum horário disponível\")."),

    h("A3 — Entrar na lista de espera (cenário 7b)", HeadingLevel.HEADING_2),
    p([bold("Contexto: \"), normal(\"O paciente não tem horário conveniente e deseja ser avisado quando surgir uma vaga.")]),
    p("Fluxo: na Etapa 4 (com ou sem horários disponíveis), o funcionário clica em \"Lista de espera\". O sistema navega para a página de lista de espera (CSU-LE), passando por parâmetros de URL: código da especialidade, nome da especialidade, CRM do médico (se houver preferência) e nome do médico. Na página de lista de espera, o funcionário busca e seleciona o paciente (ou cadastra um novo). Após confirmação, o sistema inclui o paciente na fila e exibe a posição na fila em destaque visual."),

    h("A4 — Paciente não encontrado — cadastro (cenário 10a)", HeadingLevel.HEADING_2),
    p([bold("Contexto: \"), normal(\"O paciente que deseja agendar ainda não está cadastrado no sistema da clínica.")]),
    p("Fluxo: na Etapa 5 (Paciente), o funcionário digita nome e nome da mãe e clica em \"Buscar\". O sistema retorna lista vazia e exibe toast \"Paciente não encontrado\". O funcionário clica em \"Cadastrar novo paciente\". O modal de cadastro é exibido sobre a tela atual. O funcionário preenche os dados (nome, nome da mãe, data de nascimento, telefone, e-mail) e clica em \"Cadastrar\". O sistema cadastra o paciente via API e o seleciona automaticamente. O modal fecha. O sistema navega para a Etapa 6 com o novo paciente já selecionado, sem perda do contexto (especialidade, médico, horário mantidos)."),

    h("A5 — Horário fica indisponível após seleção", HeadingLevel.HEADING_2),
    p([bold("Contexto: \"), normal(\"Entre o momento em que o funcionário visualizou o horário e o momento em que clicou em \"Selecionar\", outro agendamento ocupou aquele horário.")]),
    p("Fluxo: na Etapa 4, o funcionário clica em \"Selecionar\" em um AgendaCard. O sistema chama a API \"registrarOpcao\". A API retorna erro (horário já ocupado). O sistema exibe toast de erro \"Horário indisponível\" com descrição do motivo. O usuário permanece na Etapa 4 e pode selecionar outro horário ou clicar em \"Ver outros horários\"."),
  ];
}

// ─── section 14: rastreabilidade ─────────────────────────────────────────────

function sec14() {
  const W = 9360;
  const cols = [2000, 3200, 2400, 1760];
  const rows = [
    ["Requisito\", \"Elemento de interface\", \"Etapa/Tela\", \"Tipo"],
    ["RF-01: Selecionar modalidade\", \"Etapa1Modalidade (cards de opção + dropdown de plano)\", \"Etapa 1\", \"Funcional"],
    ["RF-02: Listar especialidades por modalidade\", \"Etapa2Especialidade (grade de cards, spinner)\", \"Etapa 2\", \"Funcional"],
    ["RF-03: Listar médicos por especialidade\", \"Etapa3Medico (cards de médico, botão sem preferência)\", \"Etapa 3\", \"Funcional"],
    ["RF-04: Listar horários disponíveis\", \"Etapa4Agenda (AgendaCard, paginação por offset)\", \"Etapa 4\", \"Funcional"],
    ["RF-05: Registrar opção de horário\", \"AgendaCard (botão Selecionar + tratamento de erro)\", \"Etapa 4\", \"Funcional"],
    ["RF-06: Buscar paciente\", \"Etapa5Paciente (formulário + PacienteCard)\", \"Etapa 5\", \"Funcional"],
    ["RF-07: Cadastrar novo paciente\", \"ModalCadastro (formulário completo)\", \"Etapa 5\", \"Funcional"],
    ["RF-08: Confirmar agendamento\", \"Etapa6Confirmacao (resumo + botão confirmar)\", \"Etapa 6\", \"Funcional"],
    ["RF-09: Emitir comprovante\", \"Comprovante (todos os dados + código)\", \"Etapa 7\", \"Funcional"],
    ["RF-10: Incluir em lista de espera\", \"ListaEsperaPage (busca, confirmação, comprovante)\", \"CSU-LE\", \"Funcional"],
    ["RNF-01: Feedback de carregamento\", \"LoadingSpinner em todas as etapas com chamada API\", \"Todas\", \"Não-funcional"],
    ["RNF-02: Feedback de erro\", \"Toast de erro (horário, busca, confirmação)\", \"Todas\", \"Não-funcional"],
    ["RNF-03: Navegação reversível\", \"Botão \"Voltar\" no card header de cada etapa\", \"Todas\", \"Não-funcional"],
    ["RNF-04: Progresso visível\", \"Componente Stepper em todas as etapas\", \"Todas\", \"Não-funcional"],
  ];

  return [
    pb(),
    h("14. Rastreabilidade dos requisitos", HeadingLevel.HEADING_1),
    p("A tabela a seguir mapeia os requisitos funcionais e não-funcionais do caso de uso CSU1 aos elementos de interface que os implementam."),
    space(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Tabela 3 — Rastreabilidade dos requisitos do caso de uso", font: FONT, size: 20, italics: true })],
      spacing: { before: 60, after: 120 },
    }),
    new Table({
      width: { size: W, type: WidthType.DXA },
      columnWidths: cols,
      rows: rows.map((row, ri) =>
        new TableRow({
          tableHeader: ri === 0,
          children: row.map((cell, ci) =>
            ri === 0 ? headerCell(cell, cols[ci]) : dataCell(cell, cols[ci])
          ),
        })
      ),
    }),
  ];
}

// ─── section 15: checklist IHC ───────────────────────────────────────────────

function sec15() {
  const W = 9360;
  const cols = [2400, 4000, 1680, 1280];
  const rows = [
    ["Princípio de IHC\", \"Evidência na interface\", \"Atende?\", \"Grau"],
    ["Consistência\", \"Padrão visual, botões e nomenclatura uniformes em todas as etapas\", \"Sim\", \"Total"],
    ["Feedback informativo\", \"Spinner, toast de erro, comprovante, posição na fila\", \"Sim\", \"Total"],
    ["Prevenção de erros\", \"Campos obrigatórios, botões desabilitados, listas filtradas\", \"Sim\", \"Total"],
    ["Recuperação de erros\", \"Toast com orientação, botões de corrigição, retorno à etapa\", \"Sim\", \"Total"],
    ["Controle e liberdade\", \"Botão Voltar, reiniciar, opções alternativas (espera, mais horários)\", \"Sim\", \"Total"],
    ["Simplicidade e clareza\", \"Uma intenção por etapa, rótulos diretos em português\", \"Sim\", \"Total"],
    ["Redução da carga de memória\", \"Stepper sempre visível, resumo na confirmação, comprovante completo\", \"Sim\", \"Total"],
    ["Acessibilidade e ergonomia\", \"Labels explícitos, alto contraste, áreas de clique adequadas\", \"Sim\", \"Parcial"],
    ["Eficiência e eficácia\", \"Fluxo linear de 7 etapas, busca rápida, acesso direto da landing page\", \"Sim\", \"Total"],
  ];

  return [
    pb(),
    h("15. Checklist de atendimento aos princípios de IHC", HeadingLevel.HEADING_1),
    p("A tabela a seguir avalia o atendimento de cada princípio de IHC analisado na seção 5 em relação à interface implementada."),
    space(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Tabela 4 — Checklist de atendimento aos princípios de IHC", font: FONT, size: 20, italics: true })],
      spacing: { before: 60, after: 120 },
    }),
    new Table({
      width: { size: W, type: WidthType.DXA },
      columnWidths: cols,
      rows: rows.map((row, ri) =>
        new TableRow({
          tableHeader: ri === 0,
          children: row.map((cell, ci) =>
            ri === 0 ? headerCell(cell, cols[ci]) : dataCell(cell, cols[ci], 1, ci >= 2)
          ),
        })
      ),
    }),
    space(2),
    p([bold("Nota: \"), normal(\"\"Parcial\" indica que o princípio é atendido mas pode ser ampliado. Por exemplo, acessibilidade pode incluir suporte a leitores de tela e verificação formal WCAG.")]),
  ];
}

// ─── references ──────────────────────────────────────────────────────────────

function references() {
  return [
    pb(),
    h("Referências", HeadingLevel.HEADING_1),
    p("NIELSEN, Jakob. \"10 Usability Heuristics for User Interface Design.\" Nielsen Norman Group, 1994. Disponível em: https://www.nngroup.com/articles/ten-usability-heuristics/. Acesso em: 2 jun. 2026."),
    p("NORMAN, Donald A. \"The Design of Everyday Things.\" Revised and Expanded Edition. Basic Books, 2013."),
    p("BASTIEN, J. M. C.; SCAPIN, D. L. \"Ergonomic criteria for the evaluation of human-computer interfaces.\" INRIA Technical Report, n. 156, 1993."),
    p("W3C. \"Web Content Accessibility Guidelines (WCAG) 2.1.\" W3C Recommendation, 2018. Disponível em: https://www.w3.org/TR/WCAG21/. Acesso em: 2 jun. 2026."),
    p("LARMAN, Craig. \"Utilizando UML e Padrões: Uma Introdução à Análise e ao Projeto Orientados a Objetos e ao Desenvolvimento Iterativo.\" 3. ed. Bookman, 2007."),
  ];
}

// ─── main document ───────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "numbers2",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: FONT, size: 24 } },
    },
    paragraphStyles: [
      {
        id: "Heading1\", name: \"Heading 1\", basedOn: \"Normal\", next: \"Normal", quickFormat: true,
        run: { size: 32, bold: true, font: FONT, color: COLOR_PRIMARY },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 },
      },
      {
        id: "Heading2\", name: \"Heading 2\", basedOn: \"Normal\", next: \"Normal", quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: COLOR_SECTION },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1701, right: 1134, bottom: 1701, left: 1701 }, // 3cm top/left/bottom, 2cm right
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Clínica SafeCare — Análise de IHC — CSU1 Agendar Consulta WEB", font: FONT, size: 18, color: COLOR_GRAY }),
                new TextRun({ children: ["\t", PageNumber.CURRENT], font: FONT, size: 18 }),
              ],
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } },
            }),
          ],
        }),
      },
      children: [
        ...coverPage(),
        ...resumoPage(),
        ...listaFigurasPage(),
        ...listaTabelasPage(),
        ...sumarioPage(),
        ...sec1(),
        ...sec2(),
        ...sec3(),
        ...sec4(),
        ...sec5(),
        ...sec6(),
        ...sec7(),
        ...sec8(),
        ...sec9(),
        ...sec10(),
        ...sec11(),
        ...sec12(),
        ...sec13(),
        ...sec14(),
        ...sec15(),
        ...references(),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("Relatorio_IHC_Agendar_Consulta_WEB.docx", buf);
  console.log("Document created: Relatorio_IHC_Agendar_Consulta_WEB.docx");
});
