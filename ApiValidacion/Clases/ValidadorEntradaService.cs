namespace ValidacionEventos.Logica;

using ValidacionEventos.Data;
using ValidacionEventos.Dominio;

public class ValidadorEntradaService
{
    private readonly IValidacionCompraRepository _compraRepository;
    private readonly IValidacionEventoRepository _eventoRepository;
    private readonly Func<DateTime> _ahora;

    public ValidadorEntradaService(IValidacionCompraRepository compraRepository, IValidacionEventoRepository eventoRepository, Func<DateTime>? ahora = null)
    {
        _compraRepository = compraRepository ?? throw new ArgumentNullException(nameof(compraRepository));
        _eventoRepository = eventoRepository ?? throw new ArgumentNullException(nameof(eventoRepository));
        _ahora = ahora ?? (() => DateTime.Now);
    }

    public ResultadoValidacion ValidarEntrada(string? codigo, Guid idEvento)
    {
        if (idEvento == Guid.Empty)
        {
            return new ResultadoValidacion(false, EstadoValidacion.EventoIncorrecto, "Debe especificarse el evento que se está controlando para realizar la validación.");
        }

        if (string.IsNullOrWhiteSpace(codigo))
        {
            return new ResultadoValidacion(false, EstadoValidacion.NoExiste, "El código de la entrada no puede estar vacío.");
        }

        string codigoBuscado = codigo.Trim().ToUpperInvariant();

        var compras = _compraRepository.ObtenerCompras();
        Entrada? entrada = compras
            .SelectMany(c => c.Entradas)
            .FirstOrDefault(e => string.Equals(e.Codigo, codigoBuscado, StringComparison.OrdinalIgnoreCase));

        if (entrada == null)
        {
            return new ResultadoValidacion(false, EstadoValidacion.NoExiste, $"La entrada con código '{codigoBuscado}' no existe en el sistema.", codigoBuscado);
        }

        string nombreEvento = entrada.NombreEvento;
        string nombreModalidad = entrada.NombreModalidad;

        if (entrada.IdEvento != idEvento)
        {
            return new ResultadoValidacion(false, EstadoValidacion.EventoIncorrecto, $"La entrada no corresponde a este evento (es para '{nombreEvento}').", codigoBuscado, nombreEvento, nombreModalidad);
        }

        if (entrada.Cancelada)
        {
            return new ResultadoValidacion(false, EstadoValidacion.Cancelada, $"La entrada '{codigoBuscado}' fue cancelada por el comprador.", codigoBuscado, nombreEvento, nombreModalidad);
        }

        var evento = _eventoRepository.ObtenerPorId(entrada.IdEvento);
        if (evento != null && evento.Cancelado)
        {
            return new ResultadoValidacion(false, EstadoValidacion.EventoCancelado, $"El evento '{nombreEvento}' fue cancelado. Ingreso denegado.", codigoBuscado, nombreEvento, nombreModalidad);
        }

        if (entrada.Usada)
        {
            return new ResultadoValidacion(false, EstadoValidacion.YaFueUsada, $"La entrada ya fue utilizada el {entrada.FechaUso:dd/MM/yyyy HH:mm:ss}.", codigoBuscado, nombreEvento, nombreModalidad, entrada.FechaUso);
        }

        DateTime ahora = _ahora();
        entrada.MarcarComoUsada(ahora);
        _compraRepository.GuardarCompras(compras);

        return new ResultadoValidacion(true, EstadoValidacion.Valida, $"Ingreso autorizado para '{nombreEvento}' — Modalidad: {nombreModalidad}.", codigoBuscado, nombreEvento, nombreModalidad, ahora);
    }
}
