namespace CrmStella.Application.DTOs.Notification.Response;

public class NotificationResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string Type { get; set; } = null!;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}