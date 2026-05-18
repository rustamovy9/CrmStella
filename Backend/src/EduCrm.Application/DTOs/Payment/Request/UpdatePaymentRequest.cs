using System.ComponentModel.DataAnnotations;
using EduCrm.Domain.Enums;

namespace EduCrm.Application.DTOs.Payment.Request;

public class UpdatePaymentRequest
{
    [Range(0.01, 999999999.99, ErrorMessage = "Amount must be greater than 0")]
    public decimal? Amount { get; set; }

    [EnumDataType(typeof(PaymentType), ErrorMessage = "Invalid PaymentType value")]
    public PaymentType? Type { get; set; }

    [EnumDataType(typeof(PaymentMethod), ErrorMessage = "Invalid PaymentMethod value")]
    public PaymentMethod? Method { get; set; }

    public DateTime? DueDate { get; set; }

    [MaxLength(500, ErrorMessage = "Note cannot exceed 500 characters")]
    public string? Note { get; set; }
}