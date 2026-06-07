using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Infrastructure.Database;
using Dapper;

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
        var command = new CommandDefinition(sql, new { CrmMedico = crmMedico, CodEspecialidade = codEspecialidade, Data = data, Horario = horario }, cancellationToken: cancellationToken);
        return await connection.ExecuteScalarAsync<bool>(command);
    }

    public async Task<ComprovanteAgendamentoDto> ConfirmarAsync(ConfirmarConsultaRequest request, CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();
        const string sql = """
            insert into consultas (data, horario, situacao, tipo, crm_medico, cod_especialidade, cod_paciente)
            values (@Data, @Horario, 0, @Tipo, @CrmMedico, @CodEspecialidade, @CodPaciente)
            returning codigo
            """;
        var codigo = await connection.ExecuteScalarAsync<long>(new CommandDefinition(sql, request, cancellationToken: cancellationToken));
        return await ObterComprovanteAsync(codigo, cancellationToken) ?? throw new InvalidOperationException("Consulta nao encontrada.");
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
}
