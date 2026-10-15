namespace GestionEventos.Logica.Excepciones;

public abstract class DominioException : Exception
{
    protected DominioException(string mensaje) : base(mensaje) { }
}
