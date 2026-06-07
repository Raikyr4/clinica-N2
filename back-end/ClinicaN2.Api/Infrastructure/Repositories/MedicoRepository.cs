using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Infrastructure.Database;
using Dapper;

namespace ClinicaN2.Api.Infrastructure.Repositories;

public sealed class MedicoRepository(IDbConnectionFactory connectionFactory)
{
    public async Task<IReadOnlyList<MedicoDto>> ListarAsync(
        string modalidade,
        int codEspecialidade,
        int? codPlanoSaude,
        CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();
        var sql = modalidade == "C"
            ? """
              select distinct m.crm::int as Crm, m.nome as Nome, m.email as Email, m.telefone as Telefone
              from medicos m
              join agenda_atendimento a on a.crm_medico = m.crm
              join agenda_plano ap on ap.agenda_id = a.id
              where a.cod_especialidade = @CodEspecialidade
                and ap.cod_plano_saude = @CodPlanoSaude
              order by m.nome
              """
            : """
              select distinct m.crm::int as Crm, m.nome as Nome, m.email as Email, m.telefone as Telefone
              from medicos m
              join medico_especialidade me on me.crm_medico = m.crm
              where me.cod_especialidade = @CodEspecialidade
              order by m.nome
              """;

        var command = new CommandDefinition(sql, new { CodEspecialidade = codEspecialidade, CodPlanoSaude = codPlanoSaude }, cancellationToken: cancellationToken);
        var rows = await connection.QueryAsync<MedicoDto>(command);
        return rows.AsList();
    }
}
