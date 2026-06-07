# Clinica N2-2

Protótipo acadêmico para o caso de uso **CSU1 - Agendar Consulta** de uma clínica médica.

## Stack

- Front-end: React 18, Vite 5, TypeScript, React Router, Axios, React Hook Form e Zod.
- Back-end: .NET 8 Web API, Dapper, Npgsql, PostgreSQL e Swagger.

## Como preparar o banco local

1. Conecte no banco local `postgres`.
2. Execute o script:

```text
back-end/Scripts/database.sql
```

O script cria as tabelas dentro do banco `postgres` e insere dados de teste para especialidades, médicos, planos, agendas e pacientes.

## Connection string

Arquivo:

```text
back-end/ClinicaN2.Api/appsettings.json
```

Valor padrão:

```text
Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=110903
```

## Rodar o back-end

```bash
cd back-end/ClinicaN2.Api
dotnet run --urls http://localhost:5156
```

Swagger:

```text
http://localhost:5156/swagger
```

## Rodar o front-end

```bash
cd front-end
npm install
npm run dev
```

Front-end:

```text
http://localhost:5173
```

## Fluxo principal

1. Escolher modalidade: particular ou convênio.
2. Escolher plano, quando a modalidade for convênio.
3. Escolher especialidade.
4. Escolher médico ou seguir sem preferência.
5. Escolher uma das três primeiras agendas disponíveis.
6. Buscar paciente por nome e nome da mãe.
7. Cadastrar paciente, se necessário.
8. Revisar dados.
9. Confirmar consulta.
10. Visualizar comprovante.

## Dados para teste

Planos:

- Unimed
- Amil
- Bradesco Saúde

Pacientes:

- Maria Oliveira / mãe: Joana Oliveira
- João Pereira / mãe: Lucia Pereira
- Pedro Santos / mãe: Fernanda Santos

Médicos:

- Dra. Ana Martins, CRM 1234567, Cardiologia e Clínica Geral
- Dr. Bruno Lima, CRM 2345678, Dermatologia
- Dra. Carla Souza, CRM 3456789, Pediatria
- Dr. Diego Ramos, CRM 4567890, Ortopedia e Clínica Geral

## Observação acadêmica

O protótipo simula o processo de agendamento para fins de estudo de Interface Homem-Computador e engenharia de requisitos. Não há autenticação nem integração real com sistemas externos de planos de saúde.
