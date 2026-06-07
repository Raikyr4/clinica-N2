using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Infrastructure.Repositories;

namespace ClinicaN2.Api.Application.Services;

public sealed class ListaEsperaService(ListaEsperaRepository repository)
{
    public async Task<ListaEsperaResponse> IncluirAsync(ListaEsperaRequest request, CancellationToken cancellationToken)
    {
        if (request.CodPaciente <= 0)
            throw new ArgumentException("Selecione um paciente antes de entrar na lista de espera.");

        var posicao = await repository.IncluirAsync(
            request.CodPaciente,
            request.CrmMedico,
            request.CodEspecialidade,
            cancellationToken);

        return new ListaEsperaResponse(posicao);
    }
}
