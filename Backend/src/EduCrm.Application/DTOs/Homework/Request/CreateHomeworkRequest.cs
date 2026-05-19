using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Homework.Request;

public class CreateHomeworkRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "LessonId must be a positive integer")]
    public int LessonId { get; set; }

    [Required]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = null!;

    [Required]
    [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string Description { get; set; } = null!;

    [MaxLength(500, ErrorMessage = "FileUrl cannot exceed 500 characters")]
    public string? FileUrl { get; set; }
    
    [Required]
    public DateTime Deadline { get; set; }

    [Range(1, 100, ErrorMessage = "MaxScore must be between 1 and 100")]
    public int MaxScore { get; set; } = 100;

    public bool IsActive { get; set; } = true;
}