using CrmStella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrmStella.Infrastructure.Persistence.Configurations;

public class LeadConfiguration : IEntityTypeConfiguration<Lead>
{
    public void Configure(EntityTypeBuilder<Lead> builder)
    {
        builder.ToTable("Leads");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.FullName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(l => l.Phone)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(l => l.Email)
            .HasMaxLength(200);

        builder.Property(l => l.Source)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(l => l.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(l => l.Notes)
            .HasMaxLength(2000);

        builder.Property(l => l.LostReason)
            .HasMaxLength(500);

        builder.Property(l => l.CreatedAt)
            .IsRequired();

        // Индексы — ускоряют фильтры
        builder.HasIndex(l => l.Phone);
        builder.HasIndex(l => l.Status);
        builder.HasIndex(l => l.AssignedManagerId);

        // Связи
        builder.HasOne(l => l.InterestedCourse)
            .WithMany()
            .HasForeignKey(l => l.InterestedCourseId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(l => l.AssignedManager)
            .WithMany()
            .HasForeignKey(l => l.AssignedManagerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(l => l.Activities)
            .WithOne(a => a.Lead)
            .HasForeignKey(a => a.LeadId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}