using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BishalTravels.Api.Models;

[Table("vehicles")]
public class Vehicle
{
    [Key]
    [MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string RegNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Model { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = "Sedan";

    [Required]
    [MaxLength(30)]
    public string FuelType { get; set; } = "Diesel";

    [Required]
    [MaxLength(100)]
    public string DriverName { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string DriverPhone { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? DefaultDailyKm { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? DefaultDailyHours { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal BaseMonthlyRate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal RatePerKm { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal RatePerHour { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? GarageRatePerKm { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal NightChargeRate { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Active"; // Active, Maintenance, Inactive

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<DutySlip> DutySlips { get; set; } = new List<DutySlip>();
}
