using CrmStella.Domain.Entities;

namespace CrmStella.Application.Interfaces.Services;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    int? GetUserIdFromToken(string accessToken);
}