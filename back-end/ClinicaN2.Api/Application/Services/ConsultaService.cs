using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Infrastructure.Repositories;

namespace ClinicaN2.Api.Application.Services;

public sealed class ConsultaService(ConsultaRepository repository)
{
    public async Task<RegistrarOpcaoResponse> RegistrarOpcaoAsync(RegistrarOpcaoRequest request, CancellationToken cancellationToken)
    {
        if (request.CrmMedico <= 0 || request.CodEspecialidade <= 0)
            throw new ArgumentException("Medico e especialidade devem ser informados.");

        var livre = await repository.HorarioLivreAsync(
            request.CrmMedico,
            request.CodEspecialidade,
            request.Data,
            request.Horario,
            cancellationToken);

        if (!livre)
            throw new InvalidOperationException("Este horario acabou de ser ocupado. Escolha outro horario.");

        var opcaoId = await repository.RegistrarOpcaoAsync(request, cancellationToken);
        return new RegistrarOpcaoResponse(opcaoId, "Opcao de agenda registrada temporariamente.");
    }

    public async Task<ComprovanteAgendamentoDto> ConfirmarAsync(ConfirmarConsultaRequest request, CancellationToken cancellationToken)
    {
        if (request.Tipo is not ("P" or "C"))
            throw new ArgumentException("Tipo de consulta deve ser P ou C.");

        var livre = await repository.HorarioLivreAsync(
            request.CrmMedico,
            request.CodEspecialidade,
            request.Data,
            request.Horario,
            cancellationToken);

        if (!livre)
            throw new InvalidOperationException("Este horario acabou de ser ocupado. Escolha outro horario.");

        return await repository.ConfirmarAsync(request, cancellationToken);
    }
}
