# Cenarios de teste com banco populado

Este arquivo lista os dados e cenarios para testar o prototipo **Clinica N2-2** no caso de uso **CSU1 - Agendar Consulta WEB**.

## 1. Como preparar o banco

Execute primeiro o script de criacao das tabelas:

```bash
psql -h localhost -p 5432 -U postgres -d postgres -f back-end/Scripts/database.sql
```

Depois execute o script completo de populacao para testes:

```bash
psql -h localhost -p 5432 -U postgres -d postgres -f back-end/Scripts/seed-test-data.sql
```

Dados do banco local usados no projeto:

- Host: `localhost`
- Porta: `5432`
- Banco: `postgres`
- Usuario: `postgres`
- Senha: `110903`

Observacao: `seed-test-data.sql` limpa os dados das tabelas do prototipo e insere uma massa nova. Use apenas em ambiente local de teste.

## 2. Dados cadastrados

### Planos de saude

| Codigo | Plano | Uso no teste |
|---:|---|---|
| 1 | Unimed | Convenio com especialidades disponiveis |
| 2 | Amil | Convenio com especialidades disponiveis |
| 3 | Bradesco Saude | Convenio com especialidades disponiveis |
| 4 | Plano Sem Cobertura | Cenario sem especialidades disponiveis |

### Especialidades

| Codigo | Especialidade | Observacao |
|---:|---|---|
| 1 | Cardiologia | Principal para fluxo de sucesso e lista de espera |
| 2 | Dermatologia | Fluxo por convenio e lista de espera com medico especifico |
| 3 | Pediatria | Paciente menor de idade |
| 4 | Ortopedia | Fluxo alternativo por convenio |
| 5 | Clinica Geral | Fluxo particular simples |
| 6 | Geriatria | Especialidade com agendas ocupadas para testar ausencia de horarios |

### Medicos

| CRM | Medico | Especialidades |
|---:|---|---|
| 1234567 | Dra. Ana Martins | Cardiologia, Clinica Geral |
| 2345678 | Dr. Bruno Lima | Dermatologia |
| 3456789 | Dra. Carla Souza | Pediatria |
| 4567890 | Dr. Diego Ramos | Ortopedia, Clinica Geral |
| 5678901 | Dra. Helena Costa | Geriatria |
| 6789012 | Dr. Felipe Rocha | Cardiologia |

### Pacientes

| Codigo | Paciente | Nome da mae | Uso no teste |
|---:|---|---|---|
| 1 | Maria Oliveira | Joana Oliveira | Paciente adulto com Unimed |
| 2 | Joao Pereira | Lucia Pereira | Paciente adulto particular |
| 3 | Pedro Santos | Fernanda Santos | Paciente menor de idade com responsavel e Amil |
| 4 | Ana Convenio | Marta Convenio | Paciente adulto com Bradesco Saude |
| 5 | Julia Espera | Helena Espera | Paciente ja usado na lista de espera |

## 3. Cenarios que voce precisa testar

### Cenario 1 - Fluxo principal com consulta particular

Objetivo: validar o caminho principal do CSU1.

Use:

- Modalidade: `Consulta particular`
- Especialidade: `Cardiologia`
- Medico: `Dra. Ana Martins` ou `Dr. Felipe Rocha`
- Agenda: qualquer horario exibido
- Paciente: `Joao Pereira`
- Nome da mae: `Lucia Pereira`

Resultado esperado:

- Sistema registra a consulta.
- Tela de comprovante aparece com situacao `Agendada`.

### Cenario 2 - Fluxo principal sem preferencia de medico

Objetivo: validar alternativa em que o interessado nao escolhe medico especifico.

Use:

- Modalidade: `Consulta particular`
- Especialidade: `Cardiologia`
- Na tela de medico: `Ver horarios disponiveis` em `Sem preferencia por medico`
- Agenda: qualquer horario exibido
- Paciente: `Maria Oliveira`
- Nome da mae: `Joana Oliveira`

Resultado esperado:

- Sistema mostra horarios de medicos diferentes da especialidade.
- Consulta e confirmada normalmente.

### Cenario 3 - Consulta por convenio com plano Unimed

Objetivo: validar selecao de convenio e filtro por plano.

Use:

- Modalidade: `Consulta por convenio`
- Plano: `Unimed`
- Especialidade: `Cardiologia`, `Dermatologia` ou `Pediatria`
- Medico: qualquer medico exibido
- Paciente: `Maria Oliveira`
- Nome da mae: `Joana Oliveira`

Resultado esperado:

- Sistema lista apenas especialidades/medicos com agenda aceita pela Unimed.
- Comprovante exibe modalidade `Convenio`.

### Cenario 4 - Consulta por convenio com paciente menor de idade

Objetivo: validar paciente com responsavel cadastrado.

Use:

- Modalidade: `Consulta por convenio`
- Plano: `Amil`
- Especialidade: `Pediatria`
- Medico: `Dra. Carla Souza`
- Paciente: `Pedro Santos`
- Nome da mae: `Fernanda Santos`

Resultado esperado:

- Paciente aparece com dados de cadastro.
- Consulta e confirmada normalmente.

### Cenario 5 - Ver outros horarios

Objetivo: validar cenario alternativo 7a do documento da atividade.

Use:

- Modalidade: `Consulta particular`
- Especialidade: `Cardiologia`
- Medico: `Dra. Ana Martins` ou `Sem preferencia`
- Na tela de agenda: clique em `Ver outros horarios`

Resultado esperado:

- Sistema carrega outro conjunto de horarios.
- Usuario continua na tela de agenda e pode escolher um novo horario.

### Cenario 6 - Entrar na lista de espera porque nenhum horario agrada

Objetivo: validar cenario alternativo 7b.

Use:

- Modalidade: `Consulta particular`
- Especialidade: `Cardiologia`
- Medico: `Sem preferencia`
- Na tela de agenda: clique em `Nenhum horario me agrada - lista de espera`
- Paciente: `Maria Oliveira`
- Nome da mae: `Joana Oliveira`

Resultado esperado:

- Sistema abre tela de lista de espera.
- Ao confirmar, paciente entra na fila de Cardiologia.
- Como ja existem duas pessoas na fila de Cardiologia, a proxima posicao esperada e `3`.

### Cenario 7 - Lista de espera com medico especifico

Objetivo: validar lista de espera vinculada a um medico especifico.

Use:

- Modalidade: `Consulta particular`
- Especialidade: `Dermatologia`
- Medico: `Dr. Bruno Lima`
- Na tela de agenda: clique em `Nenhum horario me agrada - lista de espera`
- Paciente: `Ana Convenio`
- Nome da mae: `Marta Convenio`

Resultado esperado:

- Sistema registra lista de espera para Dermatologia com medico especifico.

### Cenario 8 - Paciente nao encontrado

Objetivo: validar recuperacao de erro na busca de paciente.

Use na etapa de paciente:

- Nome do paciente: `Paciente Inexistente`
- Nome da mae: `Mae Inexistente`

Resultado esperado:

- Sistema mostra mensagem `Paciente nao encontrado`.
- Usuario pode corrigir o nome ou cadastrar novo paciente.

### Cenario 9 - Cadastro de novo paciente

Objetivo: validar cenario de primeira consulta.

Use:

- Faca qualquer fluxo ate a etapa de paciente.
- Clique em `Novo paciente` ou `Primeira consulta - cadastrar paciente`.
- Dados sugeridos:
  - Nome: `Carlos Novo`
  - Nome da mae: `Regina Novo`
  - Data de nascimento: `1990-04-10`
  - Sexo: `M`
  - Endereco: `Rua Teste, 123`
  - Telefone: `62933332222`
  - Email: `carlos.novo@email.com`
  - CPF: `11122233344`

Resultado esperado:

- Sistema cria paciente.
- Paciente criado fica selecionado no fluxo.
- Usuario consegue confirmar consulta.

### Cenario 10 - Nenhuma especialidade encontrada para o plano

Objetivo: validar estado vazio na etapa de especialidade.

Use:

- Modalidade: `Consulta por convenio`
- Plano: `Plano Sem Cobertura`

Resultado esperado:

- Sistema mostra `Nenhuma especialidade encontrada`.
- Usuario pode voltar para escolher outra modalidade ou plano.

### Cenario 11 - Nenhum horario disponivel

Objetivo: validar estado em que ha medico/especialidade, mas todas as agendas estao ocupadas.

Use:

- Modalidade: `Consulta particular`
- Especialidade: `Geriatria`
- Medico: `Dra. Helena Costa`

Resultado esperado:

- Sistema chega na tela de agenda.
- Mensagem esperada: `Nenhum horario disponivel`.
- Usuario pode voltar para escolher outro medico ou entrar na lista de espera.

### Cenario 12 - Horario ocupado por outro usuario

Objetivo: validar concorrencia e recuperacao quando um horario e ocupado entre a selecao e a confirmacao.

Use duas abas do navegador:

1. Aba A:
   - Modalidade: particular
   - Especialidade: Cardiologia
   - Escolha um horario.
   - Pare na tela de confirmacao.
2. Aba B:
   - Repita o mesmo caminho.
   - Escolha exatamente o mesmo horario.
   - Confirme a consulta primeiro.
3. Volte para Aba A:
   - Tente confirmar a consulta.

Resultado esperado:

- Aba B conclui com sucesso.
- Aba A recebe erro informando que o horario acabou de ser ocupado.
- Usuario pode corrigir e escolher outro horario.

### Cenario 13 - Desistir/cancelar o fluxo

Objetivo: validar controle e liberdade do usuario.

Use:

- Inicie qualquer agendamento.
- Em uma etapa intermediaria, use a acao de desistir/voltar ao inicio, quando disponivel.

Resultado esperado:

- Sistema encerra o fluxo atual.
- Usuario nao fica preso na tela.
- Pode iniciar novo agendamento.

## 4. Consultas SQL uteis para conferir os testes

Ver consultas registradas:

```sql
select c.codigo,
       c.data,
       c.horario,
       c.situacao,
       c.tipo,
       p.nome as paciente,
       m.nome as medico,
       e.nome as especialidade
from consultas c
join pacientes p on p.codigo = c.cod_paciente
join medicos m on m.crm = c.crm_medico
join especialidades_medicas e on e.codigo = c.cod_especialidade
order by c.codigo desc;
```

Ver lista de espera:

```sql
select le.id,
       le.posicao,
       p.nome as paciente,
       e.nome as especialidade,
       coalesce(m.nome, 'Sem preferencia') as medico
from lista_espera le
join pacientes p on p.codigo = le.cod_paciente
join especialidades_medicas e on e.codigo = le.cod_especialidade
left join medicos m on m.crm = le.crm_medico
order by e.nome, le.posicao;
```

Ver opcoes temporarias de agenda:

```sql
select *
from opcoes_agendamento
order by criada_em desc;
```
