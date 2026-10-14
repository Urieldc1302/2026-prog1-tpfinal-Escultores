namespace GestionEventos.Api.DTOs;

public record AccionResponse<T>(string Mensaje, T Resultado);
