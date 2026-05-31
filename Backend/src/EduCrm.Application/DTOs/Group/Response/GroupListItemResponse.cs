namespace EduCrm.Application.DTOs.Group.Response;

public class GroupListItemResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;

    public int MentorUserId { get; set; }
    public int MentorId { get; set; }
    public string MentorName { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public int MaxStudents { get; set; }
    public int ActiveStudentsCount { get; set; }
    public int FreeSlots { get; set; }

    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}