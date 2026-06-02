namespace EduCrm.Application.DTOs.Lead.Request;

public class CreateLeadRequest
{
    public string FullName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? Email { get; set; }
    public int Source { get; set; }
    public int? InterestedCourseId { get; set; }
    public string? Notes { get; set; }
}