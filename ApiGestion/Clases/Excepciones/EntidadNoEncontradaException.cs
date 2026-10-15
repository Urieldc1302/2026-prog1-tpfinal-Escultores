namespace GestionEventos.Logica.Excepciones;

public class EntidadNoEncontradaException : DominioException
{
    public EntidadNoEncontradaException(string mensaje) : base(mensaje) { }
}
