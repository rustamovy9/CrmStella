namespace EduCrm.Application.DTOs.Auth.Response;

public class UserInfoResponse
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = null!;
    public string? AvatarUrl { get; set; }
}