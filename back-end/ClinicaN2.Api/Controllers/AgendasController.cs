using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaN2.Api.Controllers;

[ApiController]
[Route("api/agendas")]
public sealed class AgendasController(AgendaService service) : ControllerBase
{
    [HttpGet("medico/{crm:int}")]
    public async Task<IActionResult> ListarPorMedico(
        int crm,
        [FromQuery] int codEspecialidade,
        [FromQuery] int? codPlanoSaude = null,
        [FromQuery] int offset = 0,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.ListarPorMedicoAsync(crm, codEspecialidade, codPlanoSaude, offset, cancellationToken));
        }
        catch (Exception ex) when (ex is ArgumentException)
        {
            return BadRequest(new ErroResponse(ex.Message));
        }
    }

    [HttpGet("especialidade/{codEspecialidade:int}")]
    public async Task<IActionResult> ListarPorEspecialidade(
        int codEspecialidade,
        [FromQuery] int? codPlanoSaude = null,
        [FromQuery] int offset = 0,
        CancellationToken cancellationToken = default) =>
        Ok(await service.ListarPorEspecialidadeAsync(codEspecialidade, codPlanoSaude, offset, cancellationToken));
}
