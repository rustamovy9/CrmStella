using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.WeekResult.Request;

public class UpdateWeekResultRequest
{
    [Range(0, 20)] public decimal? BonusScore { get; set; }

    [Range(0, 100)] public decimal? ExamScore { get; set; }

    public string? MentorComment { get; set; }
}