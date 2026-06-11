namespace CrmStella.Application.DTOs.Users.Response;

public class UserDetailResponse
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsPasswordSet { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public string? AvatarUrl { get; set; }
    public string? AboutMe { get; set; }
    public string? TelegramUsername { get; set; }
    public string? GithubUrl { get; set; }

    public int? StudentId { get; set; } // ID из таблицы Students
    public int? MentorId { get; set; } // ID из таблицы Mentors

    public decimal? Balance { get; set; }
    public DateTime? EnrolledAt { get; set; }

    public string? Specialization { get; set; }
    public int? ExperienceYears { get; set; }
    public DateTime? HireDate { get; set; }
}