using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Students.Request;

public class UpdateStudentRequest
{
    [Range(0, 1_000_000, ErrorMessage = "Balance must be between 0 and 1 000 000")]
    public decimal? Balance { get; set; }

    public DateTime? EnrolledAt { get; set; }
}