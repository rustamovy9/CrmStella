using CrmStella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrmStella.Infrastructure.Persistence.Configurations;

public class MentorConfiguration : IEntityTypeConfiguration<Mentor>
{
    public void Configure(EntityTypeBuilder<Mentor> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Specialization)
            .HasMaxLength(200);

        builder.Property(x => x.IsActive)
            .HasDefaultValue(true);

        builder.Property(x => x.HireDate)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasOne(x => x.User)
            .WithOne(x => x.Mentor)
            .HasForeignKey<Mentor>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}