using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.Course.Request;

public class UpdateCourseRequest
{
    [MaxLength(150, ErrorMessage = "Name must be at most 150 characters")]
    public string? Name { get; set; }

    [MaxLength(1000, ErrorMessage = "Description must be at most 1000 characters")]
    public string? Description { get; set; }

    [Range(0, 1_000_000, ErrorMessage = "Price must be between 0 and 1 000 000")]
    public decimal? Price { get; set; }

    [MaxLength(500, ErrorMessage = "IconUrl must be at most 500 characters")]
    public string? IconUrl { get; set; }

    [Range(1, 520, ErrorMessage = "Duration must be between 1 and 520 weeks")]
    public int? DurationWeeks { get; set; }
}