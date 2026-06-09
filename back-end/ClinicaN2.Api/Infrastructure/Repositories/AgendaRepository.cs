using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Infrastructure.Database;
using Dapper;

namespace ClinicaN2.Api.Infrastructure.Repositories;

public sealed class AgendaRepository(IDbConnectionFactory connectionFactory)
{
    public async Task<IReadOnlyList<AgendaDisponivelDto>> ListarPorMedicoAsync(
        int crm,
        int codEspecialidade,
        int? codPlanoSaude,
        int offset,
        CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();
        var sql = BaseSql("a.crm_medico = @CrmMedico");
        var command = new CommandDefinition(
            sql,
            new { CrmMedico = crm, CodEspecialidade = codEspecialidade, CodPlanoSaude = codPlanoSaude, OffsetRows = Math.Max(offset, 0) * 3 },
            cancellationToken: cancellationToken);
        var rows = await connection.QueryAsync<AgendaDisponivelDto>(command);
        return rows.AsList();
    }

    public async Task<IReadOnlyList<AgendaDisponivelDto>> ListarPorEspecialidadeAsync(
        int codEspecialidade,
        int? codPlanoSaude,
        int offset,
        CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();
        var sql = BaseSql("1 = 1");
        var command = new CommandDefinition(
            sql,
            new { CodEspecialidade = codEspecialidade, CodPlanoSaude = codPlanoSaude, OffsetRows = Math.Max(offset, 0) * 3 },
            cancellationToken: cancellationToken);
        var rows = await connection.QueryAsync<AgendaDisponivelDto>(command);
        return rows.AsList();
    }

    private static string BaseSql(string medicoWhere) =>
        $$"""
          with dias as (
              select d::date as data,
                     case extract(isodow from d)::int
                       when 1 then 'segunda'
                       when 2 then 'terca'
                       when 3 then 'quarta'
                       when 4 then 'quinta'
                       when 5 then 'sexta'
                       when 6 then 'sabado'
                       else 'domingo'
                     end as dia
              from generate_series(current_date, current_date + interval '90 days', interval '1 day') d
          ),
          vagas as (
              select
                  a.crm_medico::int as CrmMedico,
                  m.nome as NomeMedico,
                  a.cod_especialidade::int as CodEspecialidade,
                  e.nome as NomeEspecialidade,
                  to_char(d.data, 'YYYY-MM-DD') as Data,
                  to_char(make_time(a.hora::int, a.minuto::int, 0), 'HH24:MI:SS') as Horario,
                  d.data as data_ordem,
                  make_time(a.hora::int, a.minuto::int, 0) as hora_ordem
              from dias d
              join agenda_atendimento a on a.dia = d.dia
              join medicos m on m.crm = a.crm_medico
              join especialidades_medicas e on e.codigo = a.cod_especialidade
              where a.cod_especialidade = @CodEspecialidade
                and ({{medicoWhere}})
                and (@CodPlanoSaude is null or exists (
                    select 1 from agenda_plano ap
                    where ap.agenda_id = a.id and ap.cod_plano_saude = @CodPlanoSaude
                ))
                and (d.data > current_date or make_time(a.hora::int, a.minuto::int, 0) > current_time)
                and not exists (
                    select 1 from consultas c
                    where c.crm_medico = a.crm_medico
                      and c.cod_especialidade = a.cod_especialidade
                      and c.data = d.data
                      and c.horario = make_time(a.hora::int, a.minuto::int, 0)
                      and c.situacao in (0, 1)
                )
          )
          select CrmMedico, NomeMedico, CodEspecialidade, NomeEspecialidade, Data, Horario
          from vagas
          order by data_ordem, hora_ordem, NomeMedico
          limit 3 offset @OffsetRows
          """;
}
