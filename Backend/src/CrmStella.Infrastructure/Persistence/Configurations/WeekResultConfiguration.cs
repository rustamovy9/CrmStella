using CrmStella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrmStella.Infrastructure.Persistence.Configurations;

public class WeekResultConfiguration : IEntityTypeConfiguration<WeekResult>
{
    public void Configure(EntityTypeBuilder<WeekResult> builder)
    {
        builder.ToTable("WeekResults");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.WeekNumber)
            .IsRequired();

        builder.Property(x => x.LessonAverageScore)
            .HasPrecision(5, 2);

        builder.Property(x => x.HomeworkAverageScore)
            .HasPrecision(5, 2);

        builder.Property(x => x.AttendanceScore)
            .HasPrecision(5, 2);

        builder.Property(x => x.BonusScore)
            .HasPrecision(5, 2);

        builder.Property(x => x.ExamScore)
            .HasPrecision(5, 2);

        builder.Property(x => x.TotalScore)
            .HasPrecision(5, 2);

        builder.Property(x => x.MentorComment)
            .HasMaxLength(1000);

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.UpdatedAt);

        builder.HasOne(x => x.Student)
            .WithMany(s => s.WeekResults)
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Group)
            .WithMany()
            .HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.StudentId, x.GroupId, x.WeekNumber })
            .IsUnique();
    }
}