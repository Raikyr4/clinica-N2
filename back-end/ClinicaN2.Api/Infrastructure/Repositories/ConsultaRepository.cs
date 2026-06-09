using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Infrastructure.Database;
using Dapper;
using Npgsql;

namespace ClinicaN2.Api.Infrastructure.Repositories;

public sealed class ConsultaRepository(IDbConnectionFactory connectionFactory)
{
    public async Task<bool> HorarioLivreAsync(
        int crmMedico,
        int codEspecialidade,
        DateOnly data,
        TimeOnly horario,
        CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();
        const string sql = """
            select not exists (
                select 1 from consultas
                where crm_medico = @CrmMedico
                  and cod_especialidade = @CodEspecialidade
                  and data = @Data
                  and horario = @Horario
                  and situacao in (0, 1)
            )
            """;
        var command = new CommandDefinition(
            sql,
            new
            {
                CrmMedico = crmMedico,
                CodEspecialidade = codEspecialidade,
                Data = data.ToDateTime(TimeOnly.MinValue),
                Horario = horario.ToTimeSpan()
            },
            cancellationToken: cancellationToken);
        return await connection.ExecuteScalarAsync<bool>(command);
    }

    public async Task<Guid> RegistrarOpcaoAsync(RegistrarOpcaoRequest request, CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();
        var id = Guid.NewGuid();
        const string sql = """
            insert into opcoes_agendamento
                (id, crm_medico, cod_especialidade, data, horario, expira_em)
            values
                (@Id, @CrmMedico, @CodEspecialidade, @Data, @Horario, now() + interval '20 minutes')
            returning id
            """;
        var command = new CommandDefinition(sql, CriarParametrosOpcao(id, request), cancellationToken: cancellationToken);
        return await connection.ExecuteScalarAsync<Guid>(command);
    }

    public async Task<ComprovanteAgendamentoDto> ConfirmarAsync(ConfirmarConsultaRequest request, CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            if (request.OpcaoAgendamentoId is not null)
            {
                const string validarOpcao = """
                    select exists (
                        select 1
                        from opcoes_agendamento
                        where id = @OpcaoAgendamentoId
                          and crm_medico = @CrmMedico
                          and cod_especialidade = @CodEspecialidade
                          and data = @Data
                          and horario = @Horario
                          and usada = false
                          and expira_em > now()
                    )
                    """;
                var opcaoValida = await connection.ExecuteScalarAsync<bool>(
                    new CommandDefinition(validarOpcao, CriarParametrosConfirmacao(request), transaction, cancellationToken: cancellationToken));

                if (!opcaoValida)
                    throw new InvalidOperationException("Opcao de agenda expirada ou invalida. Escolha o horario novamente.");
            }

            const string inserirConsulta = """
                insert into consultas (data, horario, situacao, tipo, crm_medico, cod_especialidade, cod_paciente)
                values (@Data, @Horario, 0, @Tipo, @CrmMedico, @CodEspecialidade, @CodPaciente)
                returning codigo
                """;
            var codigo = await connection.ExecuteScalarAsync<long>(
                new CommandDefinition(inserirConsulta, CriarParametrosConfirmacao(request), transaction, cancellationToken: cancellationToken));

            if (request.OpcaoAgendamentoId is not null)
            {
                const string usarOpcao = """
                    update opcoes_agendamento
                    set usada = true
                    where id = @OpcaoAgendamentoId
                    """;
                await connection.ExecuteAsync(
                    new CommandDefinition(usarOpcao, new { request.OpcaoAgendamentoId }, transaction, cancellationToken: cancellationToken));
            }

            transaction.Commit();
            return await ObterComprovanteAsync(codigo, cancellationToken) ?? throw new InvalidOperationException("Consulta nao encontrada.");
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            transaction.Rollback();
            throw new InvalidOperationException("Este horario acabou de ser ocupado. Escolha outro horario.");
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<ComprovanteAgendamentoDto?> ObterComprovanteAsync(long codigo, CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();
        const string sql = """
            select c.codigo as Codigo,
                   to_char(c.data, 'YYYY-MM-DD') as Data,
                   to_char(c.horario, 'HH24:MI:SS') as Horario,
                   c.crm_medico::int as CrmMedico,
                   m.nome as NomeMedico,
                   e.nome as NomeEspecialidade,
                   c.cod_paciente::int as CodPaciente,
                   p.nome as NomePaciente,
                   case c.situacao
                       when 0 then 'Agendada'
                       when 1 then 'Confirmada'
                       when 2 then 'Cancelada'
                       when 3 then 'Realizada'
                   end as Situacao,
                   case c.tipo when 'C' then 'Convenio' else 'Particular' end as Modalidade,
                   ps.nome as PlanoSaude
            from consultas c
            join medicos m on m.crm = c.crm_medico
            join especialidades_medicas e on e.codigo = c.cod_especialidade
            join pacientes p on p.codigo = c.cod_paciente
            left join paciente_plano pp on pp.cod_paciente = p.codigo
            left join planos_saude ps on ps.codigo = pp.cod_plano_saude
            where c.codigo = @Codigo
            """;
        var command = new CommandDefinition(sql, new { Codigo = codigo }, cancellationToken: cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<ComprovanteAgendamentoDto>(command);
    }

    private static object CriarParametrosOpcao(Guid id, RegistrarOpcaoRequest request) => new
    {
        Id = id,
        request.CrmMedico,
        request.CodEspecialidade,
        Data = request.Data.ToDateTime(TimeOnly.MinValue),
        Horario = request.Horario.ToTimeSpan()
    };

    private static object CriarParametrosConfirmacao(ConfirmarConsultaRequest request) => new
    {
        request.CrmMedico,
        request.CodEspecialidade,
        Data = request.Data.ToDateTime(TimeOnly.MinValue),
        Horario = request.Horario.ToTimeSpan(),
        request.CodPaciente,
        request.Tipo,
        request.CodPlanoSaude,
        request.OpcaoAgendamentoId
    };
}
