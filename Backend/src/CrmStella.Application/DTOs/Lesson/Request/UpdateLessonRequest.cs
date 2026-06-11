using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.Lesson.Request;

public class UpdateLessonRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Id must be a positive integer")]
    public int Id { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "GroupId must be a positive integer")]
    public int GroupId { get; set; }

    [Required]
    [Range(1, 53, ErrorMessage = "WeekNumber must be between 1 and 53")]
    public int WeekNumber { get; set; }

    [Required]
    [Range(0, int.MaxValue, ErrorMessage = "OrderIndex must be a positive integer")]
    public int OrderIndex { get; set; }

    [Required]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = null!;

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    [Required] public DateTime LessonDate { get; set; }

    [Required] public TimeSpan StartTime { get; set; }

    [Required] public TimeSpan EndTime { get; set; }

    public bool IsCompleted { get; set; }
}