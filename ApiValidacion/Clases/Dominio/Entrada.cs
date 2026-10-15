namespace ValidacionEventos.Dominio;

using Newtonsoft.Json;
using ValidacionEventos.Logica.Excepciones;

public class Entrada
{
    [JsonProperty] public string Codigo { get; private set; } = string.Empty;
    [JsonProperty] public Guid IdEvento { get; private set; }
    [JsonProperty] public string NombreEvento { get; private set; } = string.Empty;
    [JsonProperty] public Guid IdModalidad { get; private set; }
    [JsonProperty] public string NombreModalidad { get; private set; } = string.Empty;
    [JsonProperty] public Guid IdCompra { get; private set; }
    [JsonProperty] public decimal PrecioUnitario { get; private set; }
    [JsonProperty] public bool Usada { get; private set; }
    [JsonProperty] public DateTime? FechaUso { get; private set; }
    [JsonProperty] public bool Cancelada { get; private set; }

    public Entrada()
    {
    }

    public Entrada(string codigo, Guid idEvento, string nombreEvento, Guid idModalidad, string nombreModalidad, Guid idCompra, decimal precioUnitario)
    {
        Codigo = codigo.Trim().ToUpperInvariant();
        IdEvento = idEvento;
        NombreEvento = nombreEvento;
        IdModalidad = idModalidad;
        NombreModalidad = nombreModalidad;
        IdCompra = idCompra;
        PrecioUnitario = precioUnitario;
        Usada = false;
        FechaUso = null;
        Cancelada = false;
    }

    public void MarcarComoUsada(DateTime fecha)
    {
        if (Cancelada)
        {
            throw new ReglaNegocioException("No se puede marcar como usada una entrada cancelada.");
        }

        if (Usada)
        {
            throw new ReglaNegocioException("La entrada ya ha sido utilizada.");
        }

        Usada = true;
        FechaUso = fecha;
    }
}
