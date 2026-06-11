using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.Auth.Request;

public class RegisterRequest
{
    [Required(ErrorMessage = "First name is required")]
    [MinLength(2, ErrorMessage = "First name must be at least 2 characters")]
    [MaxLength(50, ErrorMessage = "First name must not exceed 50 characters")]
    public string FirstName { get; set; } = null!;

    [Required(ErrorMessage = "Last name is required")]
    [MinLength(2, ErrorMessage = "First name must be at least 2 characters")]
    [MaxLength(50, ErrorMessage = "First name must not exceed 50 characters")]
    public string LastName { get; set; } = null!;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(200, ErrorMessage = "Email must not exceed 200 characters")]
    public string Email { get; set; } = null!;

    [Phone(ErrorMessage = "Invalid phone number format")]
    public string? PhoneNumber { get; set; }

    [Range(1, 3, ErrorMessage = "Invalid role")]
    public int RoleId { get; set; }
}