namespace BishalTravels.Api.Security;

public interface IJwtTokenGenerator
{
    string GenerateToken(int userId, string email, string name, string role);
}
