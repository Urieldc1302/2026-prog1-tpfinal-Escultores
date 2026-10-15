namespace GestionEventos.Logica.Excepciones;

public class ReglaNegocioException : DominioException
{
    public ReglaNegocioException(string mensaje) : base(mensaje) { }
}
