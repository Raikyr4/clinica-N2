# Clinica N2-2

ProtÃ³tipo acadÃªmico para o caso de uso **CSU1 - Agendar Consulta** de uma clÃ­nica mÃ©dica.

## Documentacao completa

A documentacao detalhada do projeto, casos de uso, fluxos alternativos, arquitetura, banco, APIs e testes esta em:

```text
docs/documentacao-detalhada-projeto.md
```

## Stack

- Front-end: React 18, Vite 5, TypeScript, React Router, Axios, React Hook Form e Zod.
- Back-end: .NET 8 Web API, Dapper, Npgsql, PostgreSQL e Swagger.

## Como preparar o banco local

1. Conecte no banco local `postgres`.
2. Execute o script:

```text
back-end/Scripts/database.sql
```

O script cria as tabelas dentro do banco `postgres` e insere dados de teste para especialidades, mÃ©dicos, planos, agendas e pacientes.

O script tambem cria `opcoes_agendamento` e o indice `ux_consultas_horario_ocupado`, usados para registrar a opcao escolhida antes da confirmacao e impedir dois agendamentos ativos no mesmo horario.

## Connection string

Arquivo:

```text
back-end/ClinicaN2.Api/appsettings.json
```

Valor padrÃ£o:

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

1. Escolher modalidade: particular ou convÃªnio.
2. Escolher plano, quando a modalidade for convÃªnio.
3. Escolher especialidade.
4. Escolher mÃ©dico ou seguir sem preferÃªncia.
5. Escolher uma das trÃªs primeiras agendas disponÃ­veis.
6. Buscar paciente por nome e nome da mÃ£e.
7. Cadastrar paciente, se necessÃ¡rio.
8. Revisar dados.
9. Confirmar consulta.
10. Visualizar comprovante.

## Dados para teste

Planos:

- Unimed
- Amil
- Bradesco SaÃºde

Pacientes:

- Maria Oliveira / mÃ£e: Joana Oliveira
- JoÃ£o Pereira / mÃ£e: Lucia Pereira
- Pedro Santos / mÃ£e: Fernanda Santos

MÃ©dicos:

- Dra. Ana Martins, CRM 1234567, Cardiologia e ClÃ­nica Geral
- Dr. Bruno Lima, CRM 2345678, Dermatologia
- Dra. Carla Souza, CRM 3456789, Pediatria
- Dr. Diego Ramos, CRM 4567890, Ortopedia e ClÃ­nica Geral

## ObservaÃ§Ã£o acadÃªmica

O protÃ³tipo simula o processo de agendamento para fins de estudo de Interface Homem-Computador e engenharia de requisitos. NÃ£o hÃ¡ autenticaÃ§Ã£o nem integraÃ§Ã£o real com sistemas externos de planos de saÃºde.

