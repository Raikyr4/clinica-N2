using ClinicaN2.Api.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaN2.Api.Controllers;

[ApiController]
[Route("api/planos")]
public sealed class PlanosController(PlanoService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar(CancellationToken cancellationToken) =>
        Ok(await service.ListarAsync(cancellationToken));
}
