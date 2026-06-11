using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.Users.Request;

public class UpdateUserRequest
{
    [Required(ErrorMessage = "First name is required")]
    [MinLength(2, ErrorMessage = "First name must be at least 2 characters")]
    [MaxLength(50, ErrorMessage = "First name must not exceed 50 characters")]
    public string FirstName { get; set; } = null!;

    [Required(ErrorMessage = "Last name is required")]
    [MinLength(2, ErrorMessage = "Last name must be at least 2 characters")]
    [MaxLength(50, ErrorMessage = "Last name must not exceed 50 characters")]
    public string LastName { get; set; } = null!;

    [Phone(ErrorMessage = "Invalid phone number format")]
    public string? PhoneNumber { get; set; }
}