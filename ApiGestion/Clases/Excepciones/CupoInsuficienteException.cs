namespace GestionEventos.Logica.Excepciones;

public class CupoInsuficienteException : ReglaNegocioException
{
    public CupoInsuficienteException(string mensaje) : base(mensaje) { }
}
