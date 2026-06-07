using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaN2.Api.Controllers;

[ApiController]
[Route("api/lista-espera")]
public sealed class ListaEsperaController(ListaEsperaService service) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Incluir(ListaEsperaRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await service.IncluirAsync(request, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErroResponse(ex.Message));
        }
    }
}
