namespace CrmStella.Application.DTOs.Student.Response;

public class StudentListItemResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public bool IsActive { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime EnrolledAt { get; set; }
}