-- Execute este script conectado ao banco local "postgres".
-- Usuario: postgres
-- Senha: 110903

drop table if exists lista_espera cascade;
drop table if exists consultas cascade;
drop table if exists opcoes_agendamento cascade;
drop table if exists paciente_plano cascade;
drop table if exists pacientes cascade;
drop table if exists agenda_plano cascade;
drop table if exists agenda_atendimento cascade;
drop table if exists medico_especialidade cascade;
drop table if exists planos_saude cascade;
drop table if exists medicos cascade;
drop table if exists especialidades_medicas cascade;

create table especialidades_medicas (
    codigo numeric(2,0) primary key check (codigo > 0),
    nome varchar(50) not null unique
);

create table medicos (
    crm numeric(7,0) primary key check (crm > 0),
    nome varchar(50) not null,
    email varchar(100),
    endereco varchar(150),
    telefone varchar(20)
);

create table medico_especialidade (
    crm_medico numeric(7,0) not null references medicos(crm),
    cod_especialidade numeric(2,0) not null references especialidades_medicas(codigo),
    primary key (crm_medico, cod_especialidade)
);

create table planos_saude (
    codigo numeric(2,0) primary key check (codigo > 0),
    nome varchar(50) not null unique
);

create table agenda_atendimento (
    id serial primary key,
    identificacao varchar(2) not null,
    dia varchar(7) not null check (dia in ('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado')),
    hora numeric(2,0) not null check (hora >= 7 and hora <= 19),
    minuto numeric(2,0) not null check (minuto >= 0 and minuto < 60),
    crm_medico numeric(7,0) not null,
    cod_especialidade numeric(2,0) not null,
    foreign key (crm_medico, cod_especialidade)
        references medico_especialidade(crm_medico, cod_especialidade),
    unique (identificacao, dia, hora, minuto, crm_medico, cod_especialidade)
);

create table agenda_plano (
    agenda_id int not null references agenda_atendimento(id) on delete cascade,
    cod_plano_saude numeric(2,0) not null references planos_saude(codigo),
    primary key (agenda_id, cod_plano_saude)
);

create table pacientes (
    codigo serial primary key,
    nome varchar(50) not null,
    data_nasc date not null,
    sexo char(1) not null check (sexo in ('F', 'M')),
    endereco varchar(100) not null,
    telefone varchar(11) not null,
    email varchar(40),
    cpf varchar(11),
    nome_responsavel varchar(50),
    grau_parentesco varchar(30),
    telefone_responsavel varchar(11),
    nome_mae varchar(50) not null
);

create table paciente_plano (
    cod_paciente int not null references pacientes(codigo) on delete cascade,
    cod_plano_saude numeric(2,0) not null references planos_saude(codigo),
    numero_carteirinha varchar(30),
    primary key (cod_paciente, cod_plano_saude)
);

create table opcoes_agendamento (
    id uuid primary key,
    crm_medico numeric(7,0) not null,
    cod_especialidade numeric(2,0) not null,
    data date not null,
    horario time not null,
    criada_em timestamp not null default now(),
    expira_em timestamp not null,
    usada boolean not null default false,
    foreign key (crm_medico, cod_especialidade)
        references medico_especialidade(crm_medico, cod_especialidade)
);

create table consultas (
    codigo bigserial primary key,
    data date not null,
    horario time not null,
    situacao numeric(1,0) not null check (situacao in (0, 1, 2, 3)),
    tipo char(1) not null check (tipo in ('C', 'P')),
    crm_medico numeric(7,0) not null references medicos(crm),
    cod_especialidade numeric(2,0) not null references especialidades_medicas(codigo),
    cod_paciente int not null references pacientes(codigo),
    criada_em timestamp not null default now()
);

create unique index ux_consultas_horario_ocupado
on consultas (data, horario, crm_medico, cod_especialidade)
where situacao in (0, 1);

create table lista_espera (
    id bigserial primary key,
    cod_paciente int not null references pacientes(codigo),
    crm_medico numeric(7,0) null references medicos(crm),
    cod_especialidade numeric(2,0) not null references especialidades_medicas(codigo),
    posicao int not null,
    criada_em timestamp not null default now()
);

insert into especialidades_medicas (codigo, nome) values
    (1, 'Cardiologia'),
    (2, 'Dermatologia'),
    (3, 'Pediatria'),
    (4, 'Ortopedia'),
    (5, 'Clinica Geral');

insert into medicos (crm, nome, email, endereco, telefone) values
    (1234567, 'Dra. Ana Martins', 'ana.martins@clinican2.com', 'Rua Central, 100', '62999990001'),
    (2345678, 'Dr. Bruno Lima', 'bruno.lima@clinican2.com', 'Rua Central, 100', '62999990002'),
    (3456789, 'Dra. Carla Souza', 'carla.souza@clinican2.com', 'Rua Central, 100', '62999990003'),
    (4567890, 'Dr. Diego Ramos', 'diego.ramos@clinican2.com', 'Rua Central, 100', '62999990004');

insert into medico_especialidade (crm_medico, cod_especialidade) values
    (1234567, 1),
    (1234567, 5),
    (2345678, 2),
    (3456789, 3),
    (4567890, 4),
    (4567890, 5);

insert into planos_saude (codigo, nome) values
    (1, 'Unimed'),
    (2, 'Amil'),
    (3, 'Bradesco Saude');

insert into agenda_atendimento (identificacao, dia, hora, minuto, crm_medico, cod_especialidade) values
    ('A1', 'segunda', 8, 0, 1234567, 1),
    ('A2', 'segunda', 9, 0, 1234567, 1),
    ('A3', 'quarta', 14, 0, 1234567, 1),
    ('A4', 'terca', 10, 0, 1234567, 5),
    ('B1', 'terca', 8, 30, 2345678, 2),
    ('B2', 'quinta', 15, 0, 2345678, 2),
    ('C1', 'segunda', 13, 0, 3456789, 3),
    ('C2', 'sexta', 9, 30, 3456789, 3),
    ('D1', 'quarta', 8, 0, 4567890, 4),
    ('D2', 'sexta', 16, 0, 4567890, 5);

insert into agenda_plano (agenda_id, cod_plano_saude)
select id, 1 from agenda_atendimento where crm_medico in (1234567, 2345678, 3456789);

insert into agenda_plano (agenda_id, cod_plano_saude)
select id, 2 from agenda_atendimento where crm_medico in (1234567, 4567890);

insert into agenda_plano (agenda_id, cod_plano_saude)
select id, 3 from agenda_atendimento where crm_medico in (2345678, 4567890);

insert into pacientes
    (nome, data_nasc, sexo, endereco, telefone, email, cpf, nome_mae)
values
    ('Maria Oliveira', '1998-05-12', 'F', 'Rua das Flores, 10', '62988887777', 'maria@email.com', '12345678901', 'Joana Oliveira'),
    ('Joao Pereira', '1985-11-03', 'M', 'Av. Brasil, 200', '62977776666', 'joao@email.com', '98765432100', 'Lucia Pereira');

insert into pacientes
    (nome, data_nasc, sexo, endereco, telefone, nome_responsavel, grau_parentesco, telefone_responsavel, nome_mae)
values
    ('Pedro Santos', '2015-07-20', 'M', 'Rua Norte, 45', '62966665555', 'Carlos Santos', 'Pai', '62966660000', 'Fernanda Santos');

insert into paciente_plano (cod_paciente, cod_plano_saude, numero_carteirinha) values
    (1, 1, 'UNI-000123'),
    (3, 2, 'AMI-000456');
