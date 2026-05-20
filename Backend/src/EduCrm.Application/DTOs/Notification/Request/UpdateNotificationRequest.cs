using System.ComponentModel.DataAnnotations;
using EduCrm.Domain.Enums;

namespace EduCrm.Application.DTOs.Notification.Request;

public class UpdateNotificationRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Id must be a positive integer")]
    public int Id { get; set; }

    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string? Title { get; set; }

    [MaxLength(2000, ErrorMessage = "Message cannot exceed 2000 characters")]
    public string? Message { get; set; }

    [EnumDataType(typeof(NotificationType), ErrorMessage = "Invalid NotificationType value")]
    public NotificationType? Type { get; set; }
}