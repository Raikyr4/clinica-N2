# Documentacao detalhada do projeto Clinica N2-2

## 1. Visao geral

O projeto **Clinica N2-2** e um prototipo academico web desenvolvido para atender a atividade de Interface Homem-Computador e modelagem do caso de uso **CSU1 - Agendar Consulta**.

O sistema simula o atendimento online de uma clinica medica. Um interessado acessa o site da clinica e agenda uma consulta para si ou para outra pessoa sob sua responsabilidade. O foco do projeto nao e criar um sistema clinico real completo, mas representar de forma funcional o fluxo descrito nos documentos da atividade.

O projeto implementa:

- site web para entrada no fluxo;
- wizard de agendamento;
- selecao de modalidade particular ou convenio;
- filtro por plano de saude;
- escolha de especialidade;
- escolha de medico ou sem preferencia;
- exibicao das tres primeiras agendas disponiveis;
- opcao de pedir mais horarios;
- opcao de lista de espera;
- busca de paciente por nome e nome da mae;
- cadastro de paciente na primeira consulta;
- confirmacao do agendamento;
- emissao de comprovante;
- API REST em .NET 8;
- banco PostgreSQL com Dapper/Npgsql.

## 2. Documentos usados como base

Foram considerados dois documentos na pasta raiz do projeto:

- `T2-Definicao do problema.pdf`
- `T2-Modelo-Analise-Agendar-Consulta-WEB.pdf`

O primeiro documento descreve o problema da clinica e os principais requisitos funcionais e nao funcionais.

O segundo documento detalha:

- descricao essencial resumida do caso de uso;
- descricao essencial expandida;
- cenario principal de sucesso;
- cenarios alternativos;
- modelo conceitual de dados;
- entidades e relacionamentos;
- contratos de operacao.

## 3. Objetivo do sistema

O objetivo do sistema e permitir que um interessado realize o agendamento de uma consulta medica pela web.

Durante o fluxo, o sistema deve:

1. receber modalidade da consulta;
2. receber plano de saude quando a consulta for por convenio;
3. exibir especialidades disponiveis;
4. exibir medicos que atendem os criterios;
5. permitir escolha de medico ou ausencia de preferencia;
6. exibir agendas livres;
7. registrar opcao de agenda;
8. localizar ou cadastrar paciente;
9. confirmar consulta;
10. registrar consulta com situacao `Agendada`;
11. emitir comprovante.

## 4. Stack tecnologica

### Front-end

- React 18
- Vite 5
- TypeScript
- React Router
- Axios
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- componentes derivados do padrao SafeCare/shadcn

### Back-end

- .NET 8
- ASP.NET Core Web API
- Dapper
- Npgsql
- PostgreSQL
- Swagger/OpenAPI

### Banco de dados

- PostgreSQL local
- banco configurado: `postgres`
- usuario: `postgres`
- senha: `110903`

## 5. Estrutura do projeto

```text
clinica-N2-2/
  back-end/
    ClinicaN2.Api/
      Application/
        DTOs/
        Services/
      Controllers/
      Infrastructure/
        Database/
        Repositories/
      Program.cs
      appsettings.json
    Scripts/
      database.sql
  front-end/
    src/
      components/
      context/
      pages/
      services/
      types/
    vite.config.ts
    package.json
  docs/
    documentacao-detalhada-projeto.md
  diagramas/
  README.md
  docker-compose.yml
```

## 6. Arquitetura geral

O projeto usa arquitetura simples, adequada para prototipo academico.

### Front-end

O front-end usa um fluxo por etapas, centralizado em `AgendamentoContext`.

Fluxo principal:

```text
LandingPage
  -> Agendamento
    -> Modalidade
    -> Especialidade
    -> Medico
    -> Agenda
    -> Paciente
    -> Confirmacao
    -> Comprovante
```

Estado principal:

- etapa atual;
- modalidade;
- plano de saude;
- especialidade;
- medico;
- indicador de sem preferencia por medico;
- agenda escolhida;
- identificador da opcao de agenda;
- paciente selecionado;
- comprovante.

### Back-end

O back-end usa fluxo:

```text
Controller -> Service -> Repository -> PostgreSQL
```

Camadas:

- **Controllers:** expoem rotas REST.
- **Services:** aplicam regras de negocio.
- **Repositories:** usam Dapper diretamente para executar SQL.
- **Database:** fabrica conexoes Npgsql.

## 7. Modelo de dados

### 7.1 Especialidades medicas

Tabela: `especialidades_medicas`

Representa as especialidades atendidas pela clinica.

Campos principais:

- `codigo`
- `nome`

Exemplos:

- Cardiologia
- Dermatologia
- Pediatria
- Ortopedia
- Clinica Geral

### 7.2 Medicos

Tabela: `medicos`

Representa os profissionais da clinica.

Campos principais:

- `crm`
- `nome`
- `email`
- `endereco`
- `telefone`

### 7.3 Medico-especialidade

Tabela: `medico_especialidade`

Representa o relacionamento entre medico e especialidade.

Um medico pode atender mais de uma especialidade. Uma especialidade pode ser atendida por varios medicos.

Campos:

- `crm_medico`
- `cod_especialidade`

### 7.4 Planos de saude

Tabela: `planos_saude`

Representa convenios aceitos pela clinica.

Campos:

- `codigo`
- `nome`

### 7.5 Agenda de atendimento

Tabela: `agenda_atendimento`

Representa dias e horarios semanais em que um medico atende uma especialidade.

Campos:

- `id`
- `identificacao`
- `dia`
- `hora`
- `minuto`
- `crm_medico`
- `cod_especialidade`

Dias permitidos:

- segunda
- terca
- quarta
- quinta
- sexta
- sabado

### 7.6 Agenda-plano

Tabela: `agenda_plano`

Representa quais planos de saude sao aceitos em cada horario de agenda.

Campos:

- `agenda_id`
- `cod_plano_saude`

Regra:

- se consulta for particular, qualquer agenda cadastrada pode ser exibida;
- se consulta for por convenio, agenda precisa aceitar o plano escolhido.

### 7.7 Pacientes

Tabela: `pacientes`

Representa pessoas atendidas pela clinica.

Campos principais:

- `codigo`
- `nome`
- `data_nasc`
- `sexo`
- `endereco`
- `telefone`
- `email`
- `cpf`
- `nome_responsavel`
- `grau_parentesco`
- `telefone_responsavel`
- `nome_mae`

Regras:

- paciente maior de idade precisa informar CPF;
- paciente menor de idade precisa informar responsavel, parentesco e telefone do responsavel.

### 7.8 Paciente-plano

Tabela: `paciente_plano`

Representa quais planos cobrem um paciente.

Campos:

- `cod_paciente`
- `cod_plano_saude`
- `numero_carteirinha`

### 7.9 Opcoes de agendamento

Tabela: `opcoes_agendamento`

Essa tabela registra a opcao escolhida pelo interessado antes da confirmacao final.

Ela foi adicionada para representar melhor o contrato de operacao `registrarOpcaoAgenda`, descrito nos documentos.

Campos:

- `id`
- `crm_medico`
- `cod_especialidade`
- `data`
- `horario`
- `criada_em`
- `expira_em`
- `usada`

Regra:

- ao escolher uma agenda, o sistema registra uma opcao temporaria;
- ao confirmar a consulta, o sistema valida se a opcao ainda existe, nao expirou e nao foi usada;
- depois da confirmacao, a opcao e marcada como usada.

### 7.10 Consultas

Tabela: `consultas`

Representa uma consulta efetivamente agendada.

Campos:

- `codigo`
- `data`
- `horario`
- `situacao`
- `tipo`
- `crm_medico`
- `cod_especialidade`
- `cod_paciente`
- `criada_em`

Situacoes:

- `0`: Agendada
- `1`: Confirmada
- `2`: Cancelada
- `3`: Realizada

Tipos:

- `P`: Particular
- `C`: Convenio

Indice importante:

```sql
create unique index ux_consultas_horario_ocupado
on consultas (data, horario, crm_medico, cod_especialidade)
where situacao in (0, 1);
```

Esse indice evita duas consultas agendadas ou confirmadas no mesmo horario, medico e especialidade.

### 7.11 Lista de espera

Tabela: `lista_espera`

Representa pacientes aguardando vaga para uma especialidade e, opcionalmente, medico.

Campos:

- `id`
- `cod_paciente`
- `crm_medico`
- `cod_especialidade`
- `posicao`
- `criada_em`

## 8. Script de banco de dados

O script atualizado fica em:

```text
back-end/Scripts/database.sql
```

Ele cria:

- tabelas;
- constraints;
- relacionamentos;
- indice unico de horario ocupado;
- dados de teste.

Como executar:

```bash
psql -U postgres -h localhost -p 5432 -d postgres -f back-end/Scripts/database.sql
```

Observacao:

- o script derruba tabelas existentes com `drop table if exists`;
- depois recria tudo;
- depois insere seeds;
- use com cuidado se houver dados reais.

## 9. APIs implementadas

### 9.1 Listar planos

```http
GET /api/planos
```

Responsabilidade:

- listar planos de saude cadastrados.

Resposta:

```json
[
  {
    "codigo": 1,
    "nome": "Unimed"
  }
]
```

### 9.2 Listar especialidades

```http
GET /api/especialidades?modalidade=P
GET /api/especialidades?modalidade=C&codPlanoSaude=1
```

Responsabilidade:

- listar especialidades disponiveis conforme modalidade;
- se modalidade for convenio, filtrar por plano.

Regras:

- particular: especialidades com agenda cadastrada;
- convenio: especialidades com agenda que aceita o plano.

### 9.3 Listar medicos

```http
GET /api/medicos?modalidade=P&codEspecialidade=1
GET /api/medicos?modalidade=C&codEspecialidade=1&codPlanoSaude=1
```

Responsabilidade:

- listar medicos que atendem a especialidade e modalidade informadas.

Regras:

- particular: medico precisa ter agenda na especialidade;
- convenio: medico precisa ter agenda na especialidade aceitando o plano.

### 9.4 Listar agendas por medico

```http
GET /api/agendas/medico/{crm}?codEspecialidade=1&offset=0
```

Responsabilidade:

- obter as tres primeiras agendas livres do medico escolhido.

Regras:

- calcula datas futuras com base em agenda semanal;
- ignora horarios passados;
- ignora consultas com situacao `0` ou `1`;
- retorna tres opcoes;
- `offset` permite buscar proximas tres opcoes.

### 9.5 Listar agendas por especialidade

```http
GET /api/agendas/especialidade/{codEspecialidade}?offset=0
```

Responsabilidade:

- obter agendas livres da especialidade independentemente do medico.

Uso:

- cenario alternativo em que interessado nao tem medico de preferencia.

### 9.6 Registrar opcao de agenda

```http
POST /api/consultas/registrar-opcao
```

Request:

```json
{
  "crmMedico": 1234567,
  "codEspecialidade": 1,
  "data": "2026-06-08",
  "horario": "08:00:00"
}
```

Responsabilidade:

- validar se horario esta livre;
- registrar opcao temporaria;
- devolver `opcaoAgendamentoId`.

Response:

```json
{
  "opcaoAgendamentoId": "uuid",
  "mensagem": "Opcao de agenda registrada temporariamente."
}
```

### 9.7 Buscar pacientes

```http
GET /api/pacientes?nome=Maria&nomeMae=Joana
```

Responsabilidade:

- buscar pacientes por nome e nome da mae;
- retornar dados completos para confirmacao.

Campos retornados:

- codigo;
- nome;
- nome da mae;
- nascimento;
- sexo;
- endereco;
- telefone;
- email;
- CPF;
- responsavel;
- parentesco;
- telefone do responsavel;
- plano.

### 9.8 Cadastrar paciente

```http
POST /api/pacientes
```

Responsabilidade:

- cadastrar paciente quando for primeiro agendamento;
- gerar codigo sequencial;
- validar regras de maior/menor de idade;
- associar plano quando informado.

### 9.9 Confirmar consulta

```http
POST /api/consultas/confirmar
```

Request:

```json
{
  "crmMedico": 1234567,
  "codEspecialidade": 1,
  "data": "2026-06-08",
  "horario": "08:00:00",
  "codPaciente": 1,
  "tipo": "P",
  "codPlanoSaude": null,
  "opcaoAgendamentoId": "uuid"
}
```

Responsabilidade:

- validar tipo da consulta;
- validar opcao de agenda;
- confirmar que horario ainda esta livre;
- inserir consulta;
- marcar situacao como `0` (`Agendada`);
- marcar opcao como usada;
- retornar comprovante.

### 9.10 Incluir lista de espera

```http
POST /api/lista-espera
```

Responsabilidade:

- inserir paciente na lista de espera;
- calcular posicao com `max(posicao) + 1`;
- permitir lista por medico especifico ou sem preferencia.

## 10. Caso de uso principal CSU1 - Agendar Consulta

### Nome

CSU1 - Agendar Consulta

### Ator principal

Interessado.

O interessado pode ser:

- o proprio paciente;
- outra pessoa agendando para alguem sob sua responsabilidade.

### Pre-condicoes

- site da clinica disponivel;
- especialidades cadastradas;
- medicos cadastrados;
- relacao medico-especialidade cadastrada;
- agendas semanais cadastradas;
- planos aceitos por agenda cadastrados;
- banco PostgreSQL em execucao;
- API disponivel.

### Pos-condicoes

- consulta registrada na tabela `consultas`;
- consulta com situacao `0` (`Agendada`);
- consulta vinculada a medico, especialidade e paciente;
- comprovante exibido ao interessado.

### Fluxo principal concreto

1. Interessado acessa pagina inicial da clinica.
2. Sistema exibe botao `Agendar consulta`.
3. Interessado inicia agendamento.
4. Sistema abre fluxo por etapas.
5. Interessado escolhe modalidade:
   - particular;
   - convenio.
6. Se convenio, interessado escolhe plano de saude.
7. Sistema busca especialidades disponiveis.
8. Sistema exibe cards de especialidades.
9. Interessado escolhe especialidade.
10. Sistema busca medicos que atendem os criterios.
11. Sistema exibe medicos com CRM e nome.
12. Interessado escolhe medico.
13. Sistema busca tres primeiras agendas livres daquele medico.
14. Sistema exibe data, horario, medico e especialidade.
15. Interessado escolhe uma agenda.
16. Sistema registra opcao temporaria de agenda.
17. Sistema solicita dados do paciente.
18. Interessado informa nome e nome da mae.
19. Sistema busca pacientes.
20. Sistema exibe dados completos dos pacientes encontrados.
21. Interessado seleciona paciente correto.
22. Sistema exibe resumo do agendamento.
23. Interessado confirma consulta.
24. Sistema valida opcao de agenda.
25. Sistema verifica se horario continua livre.
26. Sistema registra consulta.
27. Sistema define situacao `Agendada`.
28. Sistema exibe comprovante.

## 11. Fluxos alternativos

### FA1 - Consulta por plano de saude

Condicao:

- interessado escolhe modalidade convenio.

Fluxo:

1. Sistema exibe lista de planos.
2. Interessado escolhe plano.
3. Sistema busca especialidades aceitas pelo plano.
4. Fluxo volta para escolha de especialidade.

Implementacao:

- `Etapa1Modalidade`
- `GET /api/planos`
- `GET /api/especialidades?modalidade=C&codPlanoSaude=...`

### FA2 - Consulta particular

Condicao:

- interessado escolhe modalidade particular.

Fluxo:

1. Sistema nao solicita plano.
2. Sistema busca especialidades com agenda cadastrada.
3. Fluxo segue para escolha de especialidade.

Implementacao:

- `Etapa1Modalidade`
- `GET /api/especialidades?modalidade=P`

### FA3 - Nao ha medicos nos criterios

Condicao:

- consulta de medicos retorna lista vazia.

Fluxo:

1. Sistema exibe mensagem informando que nao ha medicos.
2. Usuario pode voltar e alterar especialidade, modalidade ou plano.

Implementacao:

- `Etapa3Medico`

### FA4 - Interessado sem preferencia por medico

Condicao:

- interessado seleciona opcao `Sem preferencia por medico`.

Fluxo:

1. Sistema busca agendas da especialidade independentemente do medico.
2. Sistema exibe tres primeiras agendas livres.
3. Fluxo segue para escolha da agenda.

Implementacao:

- `Etapa3Medico`
- `GET /api/agendas/especialidade/{codEspecialidade}`

### FA5 - Interessado pede mais opcoes

Condicao:

- interessado nao gostou das tres primeiras agendas.

Fluxo:

1. Interessado clica `Ver outros horarios`.
2. Sistema incrementa `offset`.
3. Sistema busca proximas tres agendas livres.

Implementacao:

- `Etapa4Agenda`
- parametro `offset`

### FA6 - Interessado entra em lista de espera

Condicao:

- interessado nao gostou dos horarios ou nao ha horarios disponiveis.

Fluxo:

1. Interessado escolhe lista de espera.
2. Sistema abre pagina de lista de espera.
3. Interessado busca ou cadastra paciente.
4. Sistema confirma inclusao.
5. Sistema mostra posicao na fila.

Implementacao:

- `Etapa4Agenda`
- `ListaEsperaPage`
- `POST /api/lista-espera`

### FA7 - Paciente nao encontrado

Condicao:

- busca por nome e nome da mae nao retorna paciente.

Fluxo:

1. Sistema exibe mensagem `Paciente nao encontrado`.
2. Sistema oferece:
   - corrigir nome;
   - cadastrar paciente para primeira consulta.
3. Se cadastrar, sistema abre modal de cadastro.
4. Depois do cadastro, paciente segue para confirmacao.

Implementacao:

- `Etapa5Paciente`
- `ModalCadastro`
- `CadastrarPacienteForm`

### FA8 - Paciente menor de idade

Condicao:

- data de nascimento indica idade menor que 18 anos.

Fluxo:

1. Sistema exige dados do responsavel.
2. Sistema valida nome do responsavel, grau de parentesco e telefone.
3. Sistema cadastra paciente com responsavel.

Implementacao:

- `CadastrarPacienteForm`
- `PacienteService.ValidarPaciente`

### FA9 - Horario ocupado antes da confirmacao

Condicao:

- outro agendamento ocupou o horario antes da confirmacao.

Fluxo:

1. Sistema identifica conflito.
2. Sistema retorna mensagem amigavel.
3. Interessado deve escolher outro horario.

Implementacao:

- `ConsultaService`
- `ConsultaRepository`
- indice `ux_consultas_horario_ocupado`

### FA10 - Interessado desiste do agendamento

Condicao:

- interessado clica `Desistir`.

Fluxo:

1. Sistema pede confirmacao.
2. Se confirmado, sistema encerra caso de uso.
3. Usuario volta ao inicio.

Implementacao:

- `AgendamentoPage`

## 12. Telas implementadas

### 12.1 Landing page

Objetivo:

- apresentar a clinica;
- oferecer entrada para agendamento.

Acao principal:

- `Agendar consulta`.

### 12.2 Modalidade

Objetivo:

- escolher particular ou convenio.

Entradas:

- modalidade;
- plano de saude, quando convenio.

Saida:

- modalidade salva no estado.

### 12.3 Especialidade

Objetivo:

- escolher especialidade medica.

Dados exibidos:

- nome da especialidade.

Cenario alternativo:

- nenhuma especialidade encontrada.

### 12.4 Medico

Objetivo:

- escolher medico ou sem preferencia.

Dados exibidos:

- nome;
- CRM;
- email quando existe.

Cenario alternativo:

- nenhum medico atende criterios.

### 12.5 Agenda

Objetivo:

- escolher data e horario.

Dados exibidos:

- medico;
- especialidade;
- data;
- horario.

Acoes:

- escolher horario;
- ver outros horarios;
- entrar em lista de espera;
- voltar.

### 12.6 Paciente

Objetivo:

- identificar paciente.

Entradas:

- nome do paciente;
- nome da mae.

Dados exibidos:

- codigo;
- nome;
- nome da mae;
- nascimento;
- sexo;
- telefone;
- CPF;
- endereco;
- plano;
- responsavel se menor.

Cenario alternativo:

- paciente nao encontrado.

### 12.7 Cadastro de paciente

Objetivo:

- registrar novo paciente na primeira consulta.

Campos:

- nome;
- nome da mae;
- nascimento;
- sexo;
- endereco;
- telefone;
- email;
- CPF;
- responsavel;
- parentesco;
- telefone do responsavel;
- plano;
- carteirinha.

Validacoes:

- maior de idade precisa CPF;
- menor precisa responsavel.

### 12.8 Confirmacao

Objetivo:

- revisar dados antes de salvar consulta.

Dados exibidos:

- paciente;
- mae;
- medico;
- especialidade;
- data;
- horario;
- modalidade;
- plano.

Acao:

- confirmar consulta.

### 12.9 Comprovante

Objetivo:

- confirmar sucesso e apresentar dados finais.

Dados exibidos:

- numero;
- situacao;
- data;
- horario;
- paciente;
- medico;
- CRM;
- especialidade;
- modalidade;
- plano.

### 12.10 Lista de espera

Objetivo:

- registrar paciente na fila quando horarios nao satisfazem ou nao existem.

Fluxo:

- identifica especialidade e medico;
- busca/cadastra paciente;
- confirma inclusao;
- mostra posicao na fila.

## 13. Requisitos atendidos

| Requisito | Status | Implementacao |
|---|---|---|
| Plataforma web | Atendido | React + Vite |
| API REST | Atendido | ASP.NET Core Web API |
| PostgreSQL | Atendido | `database.sql` |
| Dapper/Npgsql | Atendido | repositories |
| Escolher modalidade | Atendido | `Etapa1Modalidade` |
| Informar plano | Atendido | `Etapa1Modalidade` |
| Exibir especialidades | Atendido | `Etapa2Especialidade` |
| Exibir medicos | Atendido | `Etapa3Medico` |
| Sem preferencia por medico | Atendido | `Etapa3Medico` |
| Exibir 3 agendas | Atendido | `AgendaRepository` |
| Ver proximas 3 agendas | Atendido | `offset` |
| Registrar opcao de agenda | Atendido | `opcoes_agendamento` |
| Buscar paciente | Atendido | `GET /api/pacientes` |
| Exibir dados completos paciente | Atendido | `PacienteCard` |
| Cadastrar paciente | Atendido | `POST /api/pacientes` |
| Validar menor de idade | Atendido | front + back |
| Confirmar consulta | Atendido | `POST /api/consultas/confirmar` |
| Gerar codigo consulta | Atendido | `bigserial` |
| Situacao Agendada | Atendido | `situacao = 0` |
| Comprovante | Atendido | `Comprovante` |
| Lista de espera | Atendido | `POST /api/lista-espera` |
| Concorrencia basica de horario | Atendido | indice unico parcial |

## 14. Dados de teste

### Planos

- Unimed
- Amil
- Bradesco Saude

### Pacientes

Paciente adulto:

- nome: `Maria Oliveira`
- mae: `Joana Oliveira`
- CPF: `12345678901`
- plano: Unimed

Paciente adulto:

- nome: `Joao Pereira`
- mae: `Lucia Pereira`
- CPF: `98765432100`

Paciente menor:

- nome: `Pedro Santos`
- mae: `Fernanda Santos`
- responsavel: `Carlos Santos`
- plano: Amil

### Medicos

- `1234567` - Dra. Ana Martins - Cardiologia e Clinica Geral
- `2345678` - Dr. Bruno Lima - Dermatologia
- `3456789` - Dra. Carla Souza - Pediatria
- `4567890` - Dr. Diego Ramos - Ortopedia e Clinica Geral

## 15. Como executar

### 15.1 Banco

```bash
psql -U postgres -h localhost -p 5432 -d postgres -f back-end/Scripts/database.sql
```

### 15.2 Back-end

```bash
cd back-end/ClinicaN2.Api
dotnet run --urls http://127.0.0.1:5156
```

Swagger:

```text
http://127.0.0.1:5156/swagger
```

### 15.3 Front-end

```bash
cd front-end
npm install
npm run dev
```

URL:

```text
http://localhost:5173
```

## 16. Como testar o fluxo principal

1. Abrir `http://localhost:5173`.
2. Clicar `Agendar consulta`.
3. Escolher `Consulta particular`.
4. Escolher `Cardiologia`.
5. Escolher `Dra. Ana Martins`.
6. Escolher um horario.
7. Buscar paciente:
   - nome: `Maria Oliveira`
   - mae: `Joana Oliveira`
8. Selecionar paciente.
9. Conferir dados.
10. Confirmar consulta.
11. Ver comprovante.

## 17. Como testar cenarios alternativos

### Convenio

1. Escolher `Consulta por convenio`.
2. Selecionar `Unimed`.
3. Seguir fluxo normal.

### Sem preferencia por medico

1. Escolher modalidade.
2. Escolher especialidade.
3. Clicar `Sem preferencia por medico`.
4. Sistema mostra agendas de qualquer medico da especialidade.

### Ver outros horarios

1. Chegar na tela de agenda.
2. Clicar `Ver outros horarios`.
3. Sistema busca proximas tres agendas.

### Lista de espera

1. Chegar na tela de agenda.
2. Clicar `Nenhum horario me agrada - lista de espera`.
3. Buscar paciente.
4. Confirmar inclusao.
5. Ver posicao na fila.

### Paciente nao encontrado

1. Buscar paciente com nome inexistente.
2. Sistema mostra mensagem.
3. Escolher corrigir nome ou cadastrar novo paciente.

### Paciente menor de idade

1. Cadastrar paciente com data de nascimento menor que 18 anos.
2. Sistema exige responsavel, parentesco e telefone.

### Desistencia

1. Em qualquer etapa antes do comprovante, clicar `Desistir`.
2. Confirmar desistir.
3. Sistema volta ao inicio.

## 18. Observacoes de implementacao

O projeto foi criado para atender a atividade academica, portanto algumas decisoes sao intencionais:

- nao existe autenticacao;
- nao existe painel administrativo completo;
- a confirmacao duas horas antes da consulta foi descrita no problema, mas nao faz parte do CSU1 principal implementado;
- realizacao da consulta e prontuario medico nao fazem parte do caso de uso de agendamento;
- pagamento da consulta tambem nao faz parte deste fluxo;
- integracao com operadora de plano de saude e simulada por tabelas locais.

## 19. Pontos de atencao

- Sempre parar processo antigo do back antes de rodar nova versao.
- Se Visual Studio estiver em debug, ele pode travar DLLs em `bin/Debug`.
- Se mudar estrutura de banco, executar novamente `database.sql`.
- O script atual apaga e recria tabelas.
- Para dados reais, seria necessario migration incremental.

## 20. Conclusao

O projeto implementa o caso de uso **CSU1 - Agendar Consulta** com fluxo completo e aderente aos documentos da atividade.

O sistema contempla:

- fluxo principal;
- principais cenarios alternativos;
- modelo de dados;
- contratos de operacao;
- cadastro de paciente;
- lista de espera;
- comprovante;
- regras de modalidade e plano;
- controle basico de conflito de horario.

Assim, o prototipo pode ser usado para demonstracao academica, captura de telas, apresentacao do caso de uso e validacao visual do processo de agendamento.
