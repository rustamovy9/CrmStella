using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Exam.Request;

public class UpdateExamRequest
{
    [MaxLength(200, ErrorMessage = "Title must be at most 200 characters")]
    public string? Title { get; set; }

    [MaxLength(2000, ErrorMessage = "Description must be at most 2000 characters")]
    public string? Description { get; set; }

    public DateTime? ExamDate { get; set; }

    [Range(1, 100, ErrorMessage = "MaxScore must be between 1 and 100")]
    public decimal? MaxScore { get; set; }

    [Range(1, 100, ErrorMessage = "PassScore must be between 1 and 100")]
    public decimal? PassScore { get; set; }
}