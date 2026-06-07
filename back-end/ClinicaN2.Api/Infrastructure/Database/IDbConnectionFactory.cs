using System.Data;

namespace ClinicaN2.Api.Infrastructure.Database;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}
