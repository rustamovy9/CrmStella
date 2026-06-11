namespace CrmStella.Application.DTOs.Lead.Response;

public class LeadResponse
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? Email { get; set; }
    public string Source { get; set; } = "";
    public string Status { get; set; } = "";
    public int? InterestedCourseId { get; set; }
    public string? InterestedCourseName { get; set; }
    public int? AssignedManagerId { get; set; }
    public string? AssignedManagerName { get; set; }
    public string? Notes { get; set; }
    public DateTime? NextFollowUpAt { get; set; }
    public int? ConvertedToStudentId { get; set; }
    public string? LostReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}