using System.ComponentModel.DataAnnotations;
using CrmStella.Domain.Enums;

namespace CrmStella.Application.DTOs.Notification.Request;

public class CreateNotificationRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "UserId must be a positive integer")]
    public int UserId { get; set; }

    [Required]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = null!;

    [Required]
    [MaxLength(2000, ErrorMessage = "Message cannot exceed 2000 characters")]
    public string Message { get; set; } = null!;

    [EnumDataType(typeof(NotificationType), ErrorMessage = "Invalid NotificationType value")]
    public NotificationType Type { get; set; } = NotificationType.Info;
}