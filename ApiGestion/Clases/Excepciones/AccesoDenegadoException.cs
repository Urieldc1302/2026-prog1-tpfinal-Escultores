namespace GestionEventos.Logica.Excepciones;

public class AccesoDenegadoException : DominioException
{
    public AccesoDenegadoException(string mensaje) : base(mensaje) { }
}
