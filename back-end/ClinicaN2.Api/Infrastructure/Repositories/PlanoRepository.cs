using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Infrastructure.Database;
using Dapper;

namespace ClinicaN2.Api.Infrastructure.Repositories;

public sealed class PlanoRepository(IDbConnectionFactory connectionFactory)
{
    public async Task<IReadOnlyList<PlanoSaudeDto>> ListarAsync(CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();
        const string sql = "select codigo::int as Codigo, nome as Nome from planos_saude order by nome";
        var command = new CommandDefinition(sql, cancellationToken: cancellationToken);
        var rows = await connection.QueryAsync<PlanoSaudeDto>(command);
        return rows.AsList();
    }
}
