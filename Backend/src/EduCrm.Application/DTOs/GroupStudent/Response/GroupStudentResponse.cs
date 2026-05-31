namespace EduCrm.Application.DTOs.GroupStudent.Response;

public class GroupStudentResponse
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;

    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;

    public DateTime JoinedAt { get; set; }
    public DateTime? LeftAt { get; set; }
    public bool IsActive { get; set; }
    public bool IsTransferred { get; set; }
    public string? RemoveReason { get; set; }
}