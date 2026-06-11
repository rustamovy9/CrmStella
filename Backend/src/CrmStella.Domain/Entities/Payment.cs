using CrmStella.Domain.Enums;

namespace CrmStella.Domain.Entities;

public class Payment
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public int? GroupId { get; set; }

    public decimal Amount { get; set; }
    public PaymentType Type { get; set; } = PaymentType.Income;
    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;

    public DateTime Date { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }

    public bool IsConfirmed { get; set; } = false;
    public string? Note { get; set; }
    public string? ReceiptUrl { get; set; }

    public int? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Student Student { get; set; } = null!;
    public Group Group { get; set; } = null!;
    public User? CreatedByUser { get; set; }
}