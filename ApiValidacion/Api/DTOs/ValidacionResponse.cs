namespace ValidacionEventos.Api.DTOs;

public record ValidacionResponse(
    bool Exitoso,
    string Estado,
    string Mensaje,
    string? Codigo,
    string? NombreEvento,
    string? NombreModalidad,
    DateTime? FechaUso);
