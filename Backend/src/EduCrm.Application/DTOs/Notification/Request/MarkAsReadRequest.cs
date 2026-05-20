using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Notification.Request;

public class MarkAsReadRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Id must be a positive integer")]
    public int Id { get; set; }
}