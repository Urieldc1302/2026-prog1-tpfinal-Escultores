using ValidacionEventos.Data;
using ValidacionEventos.Dominio;

namespace Testing;

public class CompraRepositorioFalso : IValidacionCompraRepository
{
    public List<Compra> Compras { get; set; } = new List<Compra>();
    public int VecesGuardado { get; private set; }

    public List<Compra> ObtenerCompras() => Compras;

    public void GuardarCompras(List<Compra> compras)
    {
        Compras = compras;
        VecesGuardado++;
    }
}

public class EventoRepositorioFalso : IValidacionEventoRepository
{
    public List<Evento> Eventos { get; set; } = new List<Evento>();

    public List<Evento> ObtenerEventos() => Eventos;

    public Evento? ObtenerPorId(Guid id) => Eventos.FirstOrDefault(e => e.Id == id);
}
