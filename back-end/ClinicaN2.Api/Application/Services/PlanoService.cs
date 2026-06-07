using ClinicaN2.Api.Infrastructure.Repositories;

namespace ClinicaN2.Api.Application.Services;

public sealed class PlanoService(PlanoRepository repository)
{
    public Task<IReadOnlyList<DTOs.PlanoSaudeDto>> ListarAsync(CancellationToken cancellationToken) =>
        repository.ListarAsync(cancellationToken);
}
