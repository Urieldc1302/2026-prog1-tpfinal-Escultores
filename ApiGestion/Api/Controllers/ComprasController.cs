using GestionEventos.Api.DTOs;
using GestionEventos.Logica;
using Microsoft.AspNetCore.Mvc;

namespace GestionEventos.Api.Controllers;

[Route("api/[controller]")]
public class ComprasController : BaseApiController
{
    private readonly CompraService _compraService;

    public ComprasController(CompraService compraService)
    {
        _compraService = compraService;
    }

    [HttpPost]
    public IActionResult RegistrarCompra([FromBody] CompraRequest request)
    {
        return Ejecutar(() =>
        {
            var compra = _compraService.RealizarCompra(ObtenerDni(), request.IdEvento!.Value, request.IdModalidad!.Value, request.Cantidad);
            return StatusCode(StatusCodes.Status201Created, compra.AResponse());
        });
    }

    [HttpGet("{id:guid}")]
    public IActionResult ObtenerPorId(Guid id)
    {
        return Ejecutar(() => Ok(_compraService.ObtenerPorId(id, ObtenerDni()).AResponse()));
    }

    [HttpGet]
    public IActionResult ObtenerCompras()
    {
        return Ejecutar(() => Ok(_compraService.ObtenerComprasVisibles(ObtenerDni()).Select(c => c.AResponse()).ToList()));
    }
}
