using EduCrm.Domain.Enums;

namespace EduCrm.Domain.Entities;

public class Lead
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? Email { get; set; }
    public LeadSource Source { get; set; }
    public LeadStatus Status { get; set; } = LeadStatus.New;
    public int? InterestedCourseId { get; set; }
    public Course? InterestedCourse { get; set; }
    public int? AssignedManagerId { get; set; }   
    public User? AssignedManager { get; set; }
    public string? Notes { get; set; }
    public DateTime? NextFollowUpAt { get; set; }
    public int? ConvertedToStudentId { get; set; } 
    public string? LostReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public List<LeadActivity> Activities { get; set; } = new();
}