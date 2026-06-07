using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Infrastructure.Repositories;

namespace ClinicaN2.Api.Application.Services;

public sealed class AgendaService(AgendaRepository repository)
{
    public Task<IReadOnlyList<AgendaDisponivelDto>> ListarPorMedicoAsync(
        int crm,
        int codEspecialidade,
        int? codPlanoSaude,
        int offset,
        CancellationToken cancellationToken)
    {
        if (crm <= 0)
            throw new ArgumentException("Informe um CRM valido.");

        return repository.ListarPorMedicoAsync(crm, codEspecialidade, codPlanoSaude, offset, cancellationToken);
    }

    public Task<IReadOnlyList<AgendaDisponivelDto>> ListarPorEspecialidadeAsync(
        int codEspecialidade,
        int? codPlanoSaude,
        int offset,
        CancellationToken cancellationToken)
    {
        if (codEspecialidade <= 0)
            throw new ArgumentException("Informe uma especialidade valida.");

        return repository.ListarPorEspecialidadeAsync(codEspecialidade, codPlanoSaude, offset, cancellationToken);
    }
}
