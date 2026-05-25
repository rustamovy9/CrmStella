namespace EduCrm.Application.DTOs.Mentor.Response;

public class MentorListItemResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Specialization { get; set; }
    public int? ExperienceYears { get; set; }
    public bool IsActive { get; set; }
    public string? AvatarUrl { get; set; }
}