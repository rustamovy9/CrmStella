using CrmStella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrmStella.Infrastructure.Persistence.Configurations;

public class VerificationCodeConfiguration : IEntityTypeConfiguration<VerificationCode>
{
    public void Configure(EntityTypeBuilder<VerificationCode> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.CodeHash)
            .HasMaxLength(512)
            .IsRequired();

        builder.Property(x => x.Type)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(x => x.Expiration)
            .IsRequired();

        builder.Property(x => x.IsUsed)
            .IsRequired();

        builder.Property(x => x.Attempts)
            .IsRequired();

        builder.Property(x => x.MaxAttempts)
            .IsRequired();

        builder.HasOne(x => x.User)
            .WithMany(x => x.VerificationCodes)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.Expiration);
    }
}