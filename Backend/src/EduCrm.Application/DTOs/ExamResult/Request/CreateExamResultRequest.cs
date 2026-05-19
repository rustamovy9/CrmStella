using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.ExamResult.Request;

public class CreateExamResultRequest
{
    [Required(ErrorMessage = "ExamId is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid ExamId")]
    public int ExamId { get; set; }

    [Required(ErrorMessage = "StudentId is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid StudentId")]
    public int StudentId { get; set; }

    [Required(ErrorMessage = "Score is required")]
    [Range(0, 100, ErrorMessage = "Score must be between 0 and 100")]
    public decimal Score { get; set; }

    [MaxLength(1000, ErrorMessage = "Comment must be at most 1000 characters")]
    public string? Comment { get; set; }
}