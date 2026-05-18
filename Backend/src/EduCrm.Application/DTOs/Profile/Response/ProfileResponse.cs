namespace EduCrm.Application.DTOs.Profile.Response;

public class ProfileResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? TelegramUsername { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? GithubUrl { get; set; }
    public string? AboutMe { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}