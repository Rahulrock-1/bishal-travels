using Microsoft.EntityFrameworkCore;
using BishalTravels.Api.Models;

namespace BishalTravels.Api.Data;

public class BishalTravelsDbContext : DbContext
{
    public BishalTravelsDbContext(DbContextOptions<BishalTravelsDbContext> options)
        : base(options)
    {
    }

    public DbSet<CompanyProfile> CompanyProfiles => Set<CompanyProfile>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<DutySlip> DutySlips => Set<DutySlip>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Vehicle Configuration
        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasIndex(v => v.RegNumber).IsUnique();
        });

        // Client Configuration
        modelBuilder.Entity<Client>(entity =>
        {
            entity.HasIndex(c => c.Gstin);
        });

        // Duty Slip Configuration
        modelBuilder.Entity<DutySlip>(entity =>
        {
            entity.HasIndex(d => d.DutySlipNo);
            entity.HasIndex(d => new { d.VehicleId, d.Date });
            entity.HasIndex(d => d.Status);
            entity.HasIndex(d => d.Date);

            entity.HasOne(d => d.Vehicle)
                .WithMany(v => v.DutySlips)
                .HasForeignKey(d => d.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.Client)
                .WithMany(c => c.DutySlips)
                .HasForeignKey(d => d.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.Invoice)
                .WithMany(i => i.AttachedDutySlips)
                .HasForeignKey(d => d.InvoiceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Invoice Configuration
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasIndex(i => i.InvoiceNumber).IsUnique();
            entity.HasIndex(i => i.BillingMonth);
            entity.HasIndex(i => i.Status);

            entity.HasOne(i => i.Client)
                .WithMany(c => c.Invoices)
                .HasForeignKey(i => i.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(i => i.Items)
                .WithOne(item => item.Invoice)
                .HasForeignKey(item => item.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // User Configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
        });

        // PostgreSQL Snake-Case Convention Mapping
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (!string.IsNullOrEmpty(tableName))
            {
                entity.SetTableName(ToSnakeCase(tableName));
            }

            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.Name));
            }

            foreach (var key in entity.GetKeys())
            {
                var keyName = key.GetName();
                if (!string.IsNullOrEmpty(keyName))
                    key.SetName(ToSnakeCase(keyName));
            }

            foreach (var key in entity.GetForeignKeys())
            {
                var constraintName = key.GetConstraintName();
                if (!string.IsNullOrEmpty(constraintName))
                    key.SetConstraintName(ToSnakeCase(constraintName));
            }

            foreach (var index in entity.GetIndexes())
            {
                var indexName = index.GetDatabaseName();
                if (!string.IsNullOrEmpty(indexName))
                    index.SetDatabaseName(ToSnakeCase(indexName));
            }
        }
    }

    private static string ToSnakeCase(string input)
    {
        if (string.IsNullOrEmpty(input)) return input;
        return System.Text.RegularExpressions.Regex.Replace(
            input,
            @"([a-z0-9])([A-Z])",
            "$1_$2"
        ).ToLowerInvariant();
    }
}
