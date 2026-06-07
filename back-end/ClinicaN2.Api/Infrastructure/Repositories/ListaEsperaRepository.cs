using ClinicaN2.Api.Infrastructure.Database;
using Dapper;

namespace ClinicaN2.Api.Infrastructure.Repositories;

public sealed class ListaEsperaRepository(IDbConnectionFactory connectionFactory)
{
    public async Task<int> IncluirAsync(int codPaciente, int crmMedico, int codEspecialidade, CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();
        const string sql = """
            with proxima as (
                select coalesce(max(posicao), 0) + 1 as posicao
                from lista_espera
                where cod_especialidade = @CodEspecialidade
                  and (@CrmMedico = 0 or crm_medico = @CrmMedico)
            )
            insert into lista_espera (cod_paciente, crm_medico, cod_especialidade, posicao)
            select @CodPaciente, nullif(@CrmMedico, 0), @CodEspecialidade, posicao
            from proxima
            returning posicao
            """;
        var command = new CommandDefinition(sql, new { CodPaciente = codPaciente, CrmMedico = crmMedico, CodEspecialidade = codEspecialidade }, cancellationToken: cancellationToken);
        return await connection.ExecuteScalarAsync<int>(command);
    }
}
