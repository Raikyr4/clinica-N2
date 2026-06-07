using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaN2.Api.Controllers;

[ApiController]
[Route("api/pacientes")]
public sealed class PacientesController(PacienteService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Buscar([FromQuery] string nome, [FromQuery] string nomeMae, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await service.BuscarAsync(nome, nomeMae, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new ErroResponse(ex.Message));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErroResponse(ex.Message));
        }
    }

    [HttpPost]
    public async Task<IActionResult> Cadastrar(CadastrarPacienteRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var paciente = await service.CadastrarAsync(request, cancellationToken);
            return Created($"/api/pacientes?nome={paciente.Nome}&nomeMae={paciente.NomeMae}", paciente);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErroResponse(ex.Message));
        }
    }
}
