using System.ComponentModel.DataAnnotations;
using EduCrm.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace EduCrm.Application.DTOs.Payment.Request;

public class CreatePaymentRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "StudentId must be a positive integer")]
    public int StudentId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "GroupId must be a positive integer")]
    public int GroupId { get; set; }

    [Required]
    [Range(0.01, 999999999.99, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }

    [Required]
    [EnumDataType(typeof(PaymentType), ErrorMessage = "Invalid PaymentType value")]
    public PaymentType Type { get; set; } = PaymentType.Payment;

    [Required]
    [EnumDataType(typeof(PaymentMethod), ErrorMessage = "Invalid PaymentMethod value")]
    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;

    public DateTime? DueDate { get; set; }

    [MaxLength(500, ErrorMessage = "Note cannot exceed 500 characters")]
    public string? Note { get; set; }

    /// <summary>
    ///     Optional receipt file (image or PDF). Stored via FileStorage.
    /// </summary>
    public IFormFile? Receipt { get; set; }
}