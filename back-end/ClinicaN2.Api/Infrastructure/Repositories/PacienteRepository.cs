using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Infrastructure.Database;
using Dapper;

namespace ClinicaN2.Api.Infrastructure.Repositories;

public sealed class PacienteRepository(IDbConnectionFactory connectionFactory)
{
    public async Task<IReadOnlyList<PacienteDto>> BuscarAsync(string nome, string nomeMae, CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();
        const string sql = """
            select p.codigo as Codigo,
                   p.nome as Nome,
                   p.nome_mae as NomeMae,
                   to_char(p.data_nasc, 'YYYY-MM-DD') as DataNasc,
                   p.sexo as Sexo,
                   p.endereco as Endereco,
                   p.telefone as Telefone,
                   p.email as Email,
                   p.cpf as Cpf,
                   p.nome_responsavel as NomeResponsavel,
                   p.grau_parentesco as GrauParentesco,
                   p.telefone_responsavel as TelefoneResponsavel,
                   ps.nome as PlanoSaude
            from pacientes p
            left join paciente_plano pp on pp.cod_paciente = p.codigo
            left join planos_saude ps on ps.codigo = pp.cod_plano_saude
            where lower(p.nome) like lower(@Nome)
              and lower(p.nome_mae) like lower(@NomeMae)
            order by p.nome
            """;
        var command = new CommandDefinition(sql, new { Nome = $"%{nome}%", NomeMae = $"%{nomeMae}%" }, cancellationToken: cancellationToken);
        var rows = await connection.QueryAsync<PacienteDto>(command);
        return rows.AsList();
    }

    public async Task<PacienteDto> CadastrarAsync(CadastrarPacienteRequest request, CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        const string insertPaciente = """
            insert into pacientes
                (nome, data_nasc, sexo, endereco, telefone, email, cpf, nome_responsavel, grau_parentesco, telefone_responsavel, nome_mae)
            values
                (@Nome, @DataNasc, @Sexo, @Endereco, @Telefone, @Email, @Cpf, @NomeResponsavel, @GrauParentesco, @TelefoneResponsavel, @NomeMae)
            returning codigo
            """;

        var codigo = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(insertPaciente, request, transaction, cancellationToken: cancellationToken));

        if (request.CodPlanoSaude is not null)
        {
            const string insertPlano = """
                insert into paciente_plano (cod_paciente, cod_plano_saude, numero_carteirinha)
                values (@Codigo, @CodPlanoSaude, @NumeroCarteirinha)
                """;
            await connection.ExecuteAsync(new CommandDefinition(
                insertPlano,
                new { Codigo = codigo, request.CodPlanoSaude, request.NumeroCarteirinha },
                transaction,
                cancellationToken: cancellationToken));
        }

        transaction.Commit();
        var criado = await BuscarPorCodigoAsync(codigo, cancellationToken);
        return criado!;
    }

    public async Task<PacienteDto?> BuscarPorCodigoAsync(int codigo, CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();
        const string sql = """
            select p.codigo as Codigo,
                   p.nome as Nome,
                   p.nome_mae as NomeMae,
                   to_char(p.data_nasc, 'YYYY-MM-DD') as DataNasc,
                   p.sexo as Sexo,
                   p.endereco as Endereco,
                   p.telefone as Telefone,
                   p.email as Email,
                   p.cpf as Cpf,
                   p.nome_responsavel as NomeResponsavel,
                   p.grau_parentesco as GrauParentesco,
                   p.telefone_responsavel as TelefoneResponsavel,
                   ps.nome as PlanoSaude
            from pacientes p
            left join paciente_plano pp on pp.cod_paciente = p.codigo
            left join planos_saude ps on ps.codigo = pp.cod_plano_saude
            where p.codigo = @Codigo
            """;
        var command = new CommandDefinition(sql, new { Codigo = codigo }, cancellationToken: cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<PacienteDto>(command);
    }
}
