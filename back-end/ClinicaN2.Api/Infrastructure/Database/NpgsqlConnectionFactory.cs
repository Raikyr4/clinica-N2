using System.Data;
using Npgsql;

namespace ClinicaN2.Api.Infrastructure.Database;

public sealed class NpgsqlConnectionFactory(IConfiguration configuration) : IDbConnectionFactory
{
    public IDbConnection CreateConnection()
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string DefaultConnection nao configurada.");

        return new NpgsqlConnection(connectionString);
    }
}
