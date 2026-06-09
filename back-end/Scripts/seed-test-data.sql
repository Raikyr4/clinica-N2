-- Script de populacao para testes do caso de uso CSU1 - Agendar Consulta WEB.
-- Use depois de executar back-end/Scripts/database.sql.
--
-- Banco local usado no projeto:
--   host: localhost
--   porta: 5432
--   banco: postgres
--   usuario: postgres
--   senha: 110903
--
-- Este script limpa os dados das tabelas do prototipo e insere uma massa
-- completa para testar fluxo principal, convenio, lista de espera,
-- paciente nao encontrado, cadastro de paciente e ausencia de horarios.

begin;

truncate table
    lista_espera,
    consultas,
    opcoes_agendamento,
    paciente_plano,
    pacientes,
    agenda_plano,
    agenda_atendimento,
    medico_especialidade,
    planos_saude,
    medicos,
    especialidades_medicas
restart identity cascade;

insert into especialidades_medicas (codigo, nome) values
    (1, 'Cardiologia'),
    (2, 'Dermatologia'),
    (3, 'Pediatria'),
    (4, 'Ortopedia'),
    (5, 'Clinica Geral'),
    (6, 'Geriatria');

insert into medicos (crm, nome, email, endereco, telefone) values
    (1234567, 'Dra. Ana Martins', 'ana.martins@clinican2.com', 'Rua Central, 100', '62999990001'),
    (2345678, 'Dr. Bruno Lima', 'bruno.lima@clinican2.com', 'Rua Central, 100', '62999990002'),
    (3456789, 'Dra. Carla Souza', 'carla.souza@clinican2.com', 'Rua Central, 100', '62999990003'),
    (4567890, 'Dr. Diego Ramos', 'diego.ramos@clinican2.com', 'Rua Central, 100', '62999990004'),
    (5678901, 'Dra. Helena Costa', 'helena.costa@clinican2.com', 'Rua Central, 100', '62999990005'),
    (6789012, 'Dr. Felipe Rocha', 'felipe.rocha@clinican2.com', 'Rua Central, 100', '62999990006');

insert into medico_especialidade (crm_medico, cod_especialidade) values
    (1234567, 1),
    (1234567, 5),
    (2345678, 2),
    (3456789, 3),
    (4567890, 4),
    (4567890, 5),
    (5678901, 6),
    (6789012, 1);

insert into planos_saude (codigo, nome) values
    (1, 'Unimed'),
    (2, 'Amil'),
    (3, 'Bradesco Saude'),
    (4, 'Plano Sem Cobertura');

insert into agenda_atendimento
    (identificacao, dia, hora, minuto, crm_medico, cod_especialidade)
values
    ('A1', 'segunda', 8, 0, 1234567, 1),
    ('A2', 'segunda', 9, 0, 1234567, 1),
    ('A3', 'quarta', 14, 0, 1234567, 1),
    ('A4', 'terca', 10, 0, 1234567, 5),
    ('B1', 'terca', 8, 30, 2345678, 2),
    ('B2', 'quinta', 15, 0, 2345678, 2),
    ('C1', 'segunda', 13, 0, 3456789, 3),
    ('C2', 'sexta', 9, 30, 3456789, 3),
    ('D1', 'quarta', 8, 0, 4567890, 4),
    ('D2', 'sexta', 16, 0, 4567890, 5),
    ('E1', 'segunda', 7, 0, 5678901, 6),
    ('F1', 'terca', 11, 0, 6789012, 1),
    ('F2', 'quinta', 16, 0, 6789012, 1);

-- Planos aceitos por agenda. O plano 4 fica propositalmente sem cobertura
-- para testar o cenario "nenhuma especialidade encontrada".
insert into agenda_plano (agenda_id, cod_plano_saude)
select id, 1
from agenda_atendimento
where crm_medico in (1234567, 2345678, 3456789, 6789012);

insert into agenda_plano (agenda_id, cod_plano_saude)
select id, 2
from agenda_atendimento
where crm_medico in (1234567, 3456789, 4567890);

insert into agenda_plano (agenda_id, cod_plano_saude)
select id, 3
from agenda_atendimento
where crm_medico in (2345678, 4567890, 6789012);

insert into pacientes
    (codigo, nome, data_nasc, sexo, endereco, telefone, email, cpf, nome_mae)
values
    (1, 'Maria Oliveira', '1998-05-12', 'F', 'Rua das Flores, 10', '62988887777', 'maria@email.com', '12345678901', 'Joana Oliveira'),
    (2, 'Joao Pereira', '1985-11-03', 'M', 'Av. Brasil, 200', '62977776666', 'joao@email.com', '98765432100', 'Lucia Pereira'),
    (4, 'Ana Convenio', '1992-02-18', 'F', 'Rua dos Ipes, 300', '62955554444', 'ana.convenio@email.com', '45678912300', 'Marta Convenio'),
    (5, 'Julia Espera', '1979-09-25', 'F', 'Rua Oeste, 90', '62944443333', 'julia.espera@email.com', '32165498700', 'Helena Espera');

insert into pacientes
    (codigo, nome, data_nasc, sexo, endereco, telefone, nome_responsavel, grau_parentesco, telefone_responsavel, nome_mae)
values
    (3, 'Pedro Santos', '2015-07-20', 'M', 'Rua Norte, 45', '62966665555', 'Carlos Santos', 'Pai', '62966660000', 'Fernanda Santos');

insert into paciente_plano (cod_paciente, cod_plano_saude, numero_carteirinha) values
    (1, 1, 'UNI-000123'),
    (3, 2, 'AMI-000456'),
    (4, 3, 'BRA-000789');

-- Lista de espera pre-populada para demonstrar posicao de fila.
insert into lista_espera (cod_paciente, crm_medico, cod_especialidade, posicao) values
    (5, null, 1, 1),
    (2, null, 1, 2),
    (1, 2345678, 2, 1);

-- Bloqueia todos os horarios de Geriatria nos proximos 90 dias.
-- Assim a especialidade e o medico aparecem, mas a etapa de agenda mostra
-- "Nenhum horario disponivel".
insert into consultas
    (data, horario, situacao, tipo, crm_medico, cod_especialidade, cod_paciente)
select
    d::date,
    time '07:00',
    0,
    'P',
    5678901,
    6,
    2
from generate_series(current_date, current_date + interval '90 days', interval '1 day') as d
where extract(isodow from d)::int = 1;

select setval(pg_get_serial_sequence('pacientes', 'codigo'), (select max(codigo) from pacientes));
select setval(pg_get_serial_sequence('consultas', 'codigo'), (select coalesce(max(codigo), 1) from consultas));
select setval(pg_get_serial_sequence('lista_espera', 'id'), (select coalesce(max(id), 1) from lista_espera));

commit;

-- Conferencias rapidas:
-- select * from especialidades_medicas order by codigo;
-- select * from planos_saude order by codigo;
-- select codigo, nome, nome_mae from pacientes order by codigo;
-- select * from lista_espera order by cod_especialidade, posicao;
