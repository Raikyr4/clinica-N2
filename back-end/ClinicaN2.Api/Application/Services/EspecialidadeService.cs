using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Infrastructure.Repositories;

namespace ClinicaN2.Api.Application.Services;

public sealed class EspecialidadeService(EspecialidadeRepository repository)
{
    public Task<IReadOnlyList<EspecialidadeDto>> ListarAsync(string modalidade, int? codPlanoSaude, CancellationToken cancellationToken)
    {
        if (modalidade == "C" && codPlanoSaude is null)
            throw new ArgumentException("Informe o plano de saude para consulta por convenio.");

        return repository.ListarAsync(modalidade, codPlanoSaude, cancellationToken);
    }
}
