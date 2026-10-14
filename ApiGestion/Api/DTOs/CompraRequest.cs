using System.ComponentModel.DataAnnotations;

namespace GestionEventos.Api.DTOs;

public class CompraRequest
{
    [Required(ErrorMessage = "El evento es obligatorio.")]
    public Guid? IdEvento { get; set; }

    [Required(ErrorMessage = "La modalidad es obligatoria.")]
    public Guid? IdModalidad { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a cero.")]
    public int Cantidad { get; set; }
}
