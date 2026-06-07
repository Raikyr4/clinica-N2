using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaN2.Api.Controllers;

[ApiController]
[Route("api/especialidades")]
public sealed class EspecialidadesController(EspecialidadeService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string modalidade = "P", [FromQuery] int? codPlanoSaude = null, CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.ListarAsync(modalidade, codPlanoSaude, cancellationToken));
        }
        catch (Exception ex) when (ex is ArgumentException)
        {
            return BadRequest(new ErroResponse(ex.Message));
        }
    }
}
