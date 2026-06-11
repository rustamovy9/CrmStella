using CrmStella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrmStella.Infrastructure.Persistence.Configurations;

public class LessonConfiguration : IEntityTypeConfiguration<Lesson>
{
    public void Configure(EntityTypeBuilder<Lesson> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(1000);

        builder.Property(x => x.WeekNumber)
            .IsRequired();

        builder.Property(x => x.OrderIndex)
            .IsRequired();

        builder.Property(x => x.IsCompleted)
            .IsRequired();

        builder.Property(x => x.LessonDate)
            .IsRequired();

        builder.Property(x => x.StartTime)
            .IsRequired();

        builder.Property(x => x.EndTime)
            .IsRequired();

        builder.HasOne(x => x.Group)
            .WithMany(x => x.Lessons)
            .HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.GroupId, x.WeekNumber });
        builder.HasIndex(x => new { x.GroupId, x.LessonDate });
    }
}