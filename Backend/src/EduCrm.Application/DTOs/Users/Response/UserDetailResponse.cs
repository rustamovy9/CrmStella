namespace EduCrm.Application.DTOs.Users.Response;

public class UserDetailResponse
{
    public int Id { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = null!;
    public bool IsActive { get; set; }
    public bool IsPasswordSet { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Profile
    public string? AvatarUrl { get; set; }
    public string? TelegramUsername { get; set; }
    public string? GithubUrl { get; set; }
    public string? AboutMe { get; set; }
}