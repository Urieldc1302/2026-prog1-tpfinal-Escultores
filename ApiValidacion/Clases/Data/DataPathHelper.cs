namespace ValidacionEventos.Data;

public static class DataPathHelper
{
    public static string ObtenerRuta(string nombreArchivo)
    {
        string? carpetaData = BuscarCarpetaData(Directory.GetCurrentDirectory())
                              ?? BuscarCarpetaData(AppContext.BaseDirectory);

        if (carpetaData == null)
        {
            throw new DirectoryNotFoundException(
                "No se encontró la carpeta 'data' subiendo desde '" + Directory.GetCurrentDirectory() +
                "'. Lance la API desde dentro del repositorio (ver README).");
        }

        return Path.Combine(carpetaData, nombreArchivo);
    }

    private static string? BuscarCarpetaData(string directorioInicial)
    {
        DirectoryInfo? directorio = new DirectoryInfo(directorioInicial);

        while (directorio != null)
        {
            string candidata = Path.Combine(directorio.FullName, "data");
            if (Directory.Exists(candidata))
            {
                return candidata;
            }

            directorio = directorio.Parent;
        }

        return null;
    }
}
