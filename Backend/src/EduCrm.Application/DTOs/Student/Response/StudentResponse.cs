namespace EduCrm.Application.DTOs.Student.Response;

public class StudentResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string? ImageUrl { get; set; }

    public decimal Balance { get; set; }
    public bool IsActive { get; set; }
    public DateTime EnrolledAt { get; set; }

    public int GroupsCount { get; set; }
}