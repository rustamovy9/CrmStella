namespace EduCrm.Application.DTOs.Auth.Response;

public class AuthResponse
{
    public string AccessToken { get; set; } = null!;
    public string RefreshToken { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public UserInfoResponse User { get; set; } = null!;
}