using EduCrm.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduCrm.Infrastructure.Persistence.Configurations;

public class ExamConfiguration : IEntityTypeConfiguration<Exam>
{
    public void Configure(EntityTypeBuilder<Exam> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(1000);

        builder.Property(x => x.PassScore)
            .HasPrecision(5, 2)
            .IsRequired();

        builder.Property(x => x.MaxScore)
            .HasPrecision(5, 2)
            .IsRequired();

        builder.Property(x => x.ExamDate)
            .IsRequired();

        builder.Property(x => x.StartTime);

        builder.Property(x => x.EndTime);

        builder.HasOne(x => x.Group)
            .WithMany(x => x.Exams)
            .HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.CreatedByMentor)
            .WithMany()
            .HasForeignKey(x => x.CreatedByMentorId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.GroupId);
        builder.HasIndex(x => x.ExamDate);
    }
}