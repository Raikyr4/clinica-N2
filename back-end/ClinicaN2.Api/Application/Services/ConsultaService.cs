using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Infrastructure.Repositories;

namespace ClinicaN2.Api.Application.Services;

public sealed class ConsultaService(ConsultaRepository repository)
{
    public async Task RegistrarOpcaoAsync(RegistrarOpcaoRequest request, CancellationToken cancellationToken)
    {
        var livre = await repository.HorarioLivreAsync(
            request.CrmMedico,
            request.CodEspecialidade,
            request.Data,
            request.Horario,
            cancellationToken);

        if (!livre)
            throw new InvalidOperationException("Este horario acabou de ser ocupado. Escolha outro horario.");
    }

    public async Task<ComprovanteAgendamentoDto> ConfirmarAsync(ConfirmarConsultaRequest request, CancellationToken cancellationToken)
    {
        if (request.Tipo is not ("P" or "C"))
            throw new ArgumentException("Tipo de consulta deve ser P ou C.");

        await RegistrarOpcaoAsync(
            new RegistrarOpcaoRequest(request.CrmMedico, request.CodEspecialidade, request.Data, request.Horario),
            cancellationToken);

        return await repository.ConfirmarAsync(request, cancellationToken);
    }
}
