using CrmStella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrmStella.Infrastructure.Persistence.Configurations;

public class LeadActivityConfiguration : IEntityTypeConfiguration<LeadActivity>
{
    public void Configure(EntityTypeBuilder<LeadActivity> builder)
    {
        builder.ToTable("LeadActivities");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Type)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(a => a.CreatedAt)
            .IsRequired();

        builder.HasIndex(a => a.LeadId);
        builder.HasIndex(a => a.CreatedAt);

        builder.HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}