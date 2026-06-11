using CrmStella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrmStella.Infrastructure.Persistence.Configurations;

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Balance)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.IsActive)
            .HasDefaultValue(true);

        builder.Property(x => x.EnrolledAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasOne(x => x.User)
            .WithOne(x => x.Student)
            .HasForeignKey<Student>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}