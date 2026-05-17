using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Group.Request;

public class CreateGroupRequest
{
    [Required(ErrorMessage = "Name is required")]
    [MaxLength(150, ErrorMessage = "Name must be at most 150 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "CourseId is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid CourseId")]
    public int CourseId { get; set; }

    [Required(ErrorMessage = "MentorId is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid MentorId")]
    public int MentorId { get; set; }

    [Required(ErrorMessage = "StartDate is required")]
    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [Range(1, 100, ErrorMessage = "MaxStudents must be between 1 and 100")]
    public int MaxStudents { get; set; } = 15;
}