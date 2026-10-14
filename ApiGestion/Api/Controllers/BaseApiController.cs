using GestionEventos.Api.DTOs;
using GestionEventos.Logica.Excepciones;
using Microsoft.AspNetCore.Mvc;

namespace GestionEventos.Api.Controllers;

[ApiController]
public abstract class BaseApiController : ControllerBase
{    protected string? ObtenerDni()
    {
        if (Request.Headers.TryGetValue("X-Dni", out var headerDni) && !string.IsNullOrWhiteSpace(headerDni))
        {
            return headerDni.ToString().Trim();
        }

        if (Request.Query.TryGetValue("dni", out var queryDni) && !string.IsNullOrWhiteSpace(queryDni))
        {
            return queryDni.ToString().Trim();
        }

        return null;
    }
    protected IActionResult Ejecutar(Func<IActionResult> accion)
    {
        try
        {
            return accion();
        }
        catch (AccesoDenegadoException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ErrorResponse(ex.Message));
        }
        catch (EntidadNoEncontradaException ex)
        {
            return NotFound(new ErrorResponse(ex.Message));
        }
        catch (ReglaNegocioException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new ErrorResponse("Error inesperado: " + ex.Message));
        }
    }
}
