namespace ValidacionEventos.Data;

using Newtonsoft.Json;
using ValidacionEventos.Dominio;

public class ValidacionCompraRepository : IValidacionCompraRepository
{
    private readonly string _rutaArchivo;
    private static readonly object Bloqueo = new();

    public ValidacionCompraRepository(string? rutaArchivo = null)
    {
        _rutaArchivo = rutaArchivo ?? DataPathHelper.ObtenerRuta("compras.json");
    }

    public List<Compra> ObtenerCompras()
    {
        lock (Bloqueo)
        {
            if (!File.Exists(_rutaArchivo))
            {
                return new List<Compra>();
            }

            string json = File.ReadAllText(_rutaArchivo);
            if (string.IsNullOrWhiteSpace(json))
            {
                return new List<Compra>();
            }

            return JsonConvert.DeserializeObject<List<Compra>>(json) ?? new List<Compra>();
        }
    }

    public void GuardarCompras(List<Compra> compras)
    {
        lock (Bloqueo)
        {
            string? directorio = Path.GetDirectoryName(_rutaArchivo);
            if (!string.IsNullOrEmpty(directorio) && !Directory.Exists(directorio))
            {
                Directory.CreateDirectory(directorio);
            }

            File.WriteAllText(_rutaArchivo, JsonConvert.SerializeObject(compras, Formatting.Indented));
        }
    }
}
