using EduCrm.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduCrm.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Amount)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(x => x.Type)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(x => x.Method)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(x => x.Note)
            .HasMaxLength(1000);

        builder.Property(x => x.ReceiptUrl)
            .HasMaxLength(500);

        builder.Property(x => x.Date)
            .IsRequired();

        builder.Property(x => x.IsConfirmed)
            .IsRequired();

        builder.HasOne(x => x.Student)
            .WithMany(x => x.Payments)
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Group)
            .WithMany(x => x.Payments)
            .HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.CreatedByUser)
            .WithMany()
            .HasForeignKey(x => x.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.StudentId);
        builder.HasIndex(x => x.GroupId);
        builder.HasIndex(x => x.Date);
    }
}