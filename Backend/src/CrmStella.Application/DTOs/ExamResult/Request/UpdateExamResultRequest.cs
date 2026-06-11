using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.ExamResult.Request;

public class UpdateExamResultRequest
{
    [Range(0, 100, ErrorMessage = "Score must be between 0 and 100")]
    public decimal? Score { get; set; }

    [MaxLength(1000, ErrorMessage = "Comment must be at most 1000 characters")]
    public string? Comment { get; set; }
}