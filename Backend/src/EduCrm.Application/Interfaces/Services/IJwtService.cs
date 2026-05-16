using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Services;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    int? GetUserIdFromToken(string accessToken);
}