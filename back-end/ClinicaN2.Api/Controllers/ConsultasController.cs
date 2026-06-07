using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaN2.Api.Controllers;

[ApiController]
[Route("api/consultas")]
public sealed class ConsultasController(ConsultaService service) : ControllerBase
{
    [HttpPost("registrar-opcao")]
    public async Task<IActionResult> RegistrarOpcao(RegistrarOpcaoRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await service.RegistrarOpcaoAsync(request, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ErroResponse(ex.Message));
        }
    }

    [HttpPost("confirmar")]
    public async Task<IActionResult> Confirmar(ConfirmarConsultaRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await service.ConfirmarAsync(request, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErroResponse(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ErroResponse(ex.Message));
        }
    }
}
