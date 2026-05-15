namespace EduCrm.Domain.Entities;

public class Profile
{
    public int Id { get; set; }
    public int UserId { get; set; }

    public string? AvatarUrl { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? TelegramUsername { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? GithubUrl { get; set; }
    public string? AboutMe { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User User { get; set; } = null!;
}