using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Infrastructure.Repositories;

namespace ClinicaN2.Api.Application.Services;

public sealed class MedicoService(MedicoRepository repository)
{
    public Task<IReadOnlyList<MedicoDto>> ListarAsync(string modalidade, int codEspecialidade, int? codPlanoSaude, CancellationToken cancellationToken)
    {
        if (codEspecialidade <= 0)
            throw new ArgumentException("Informe uma especialidade valida.");

        if (modalidade == "C" && codPlanoSaude is null)
            throw new ArgumentException("Informe o plano de saude para consulta por convenio.");

        return repository.ListarAsync(modalidade, codEspecialidade, codPlanoSaude, cancellationToken);
    }
}
