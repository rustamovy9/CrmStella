using CrmStella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrmStella.Infrastructure.Persistence.Configurations;

public class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.MaxStudents)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(x => x.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.HasOne(x => x.Course)
            .WithMany(x => x.Groups)
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Mentor)
            .WithMany(x => x.Groups)
            .HasForeignKey(x => x.MentorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.CourseId);

        builder.HasIndex(x => x.MentorId);
    }
}