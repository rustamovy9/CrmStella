namespace EduCrm.Application.DTOs.Mentor.Request;

public class MentorQueryRequest
{
    public string? Search { get; set; }
    public string? Specialization { get; set; }
    public bool? IsActive { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}