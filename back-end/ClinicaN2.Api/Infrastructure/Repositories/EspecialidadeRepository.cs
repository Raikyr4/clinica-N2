using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Infrastructure.Database;
using Dapper;

namespace ClinicaN2.Api.Infrastructure.Repositories;

public sealed class EspecialidadeRepository(IDbConnectionFactory connectionFactory)
{
    public async Task<IReadOnlyList<EspecialidadeDto>> ListarAsync(string modalidade, int? codPlanoSaude, CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();
        var sql = modalidade == "C"
            ? """
              select distinct e.codigo::int as Codigo, e.nome as Nome
              from especialidades_medicas e
              join agenda_atendimento a on a.cod_especialidade = e.codigo
              join agenda_plano ap on ap.agenda_id = a.id
              where ap.cod_plano_saude = @CodPlanoSaude
              order by e.nome
              """
            : """
              select distinct e.codigo::int as Codigo, e.nome as Nome
              from especialidades_medicas e
              join medico_especialidade me on me.cod_especialidade = e.codigo
              order by e.nome
              """;

        var command = new CommandDefinition(sql, new { CodPlanoSaude = codPlanoSaude }, cancellationToken: cancellationToken);
        var rows = await connection.QueryAsync<EspecialidadeDto>(command);
        return rows.AsList();
    }
}
