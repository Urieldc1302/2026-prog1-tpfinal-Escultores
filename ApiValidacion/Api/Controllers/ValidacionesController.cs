using Microsoft.AspNetCore.Mvc;
using ValidacionEventos.Api.DTOs;
using ValidacionEventos.Logica;

namespace ValidacionEventos.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ValidacionesController : ControllerBase
{
    private readonly ValidadorEntradaService _validador;

    public ValidacionesController(ValidadorEntradaService validador)
    {
        _validador = validador;
    }

    [HttpPost]
    public IActionResult Validar([FromBody] ValidarEntradaRequest request)
    {
        try
        {
            var resultado = _validador.ValidarEntrada(request.Codigo, request.IdEvento!.Value);
            var respuesta = resultado.AResponse();

            if (resultado.Exitoso)
            {
                return Ok(respuesta);
            }

            if (resultado.Estado == EstadoValidacion.NoExiste)
            {
                return NotFound(respuesta);
            }

            return BadRequest(respuesta);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ValidacionResponse(false, "Error", "Error inesperado: " + ex.Message, null, null, null, null));
        }
    }
}
