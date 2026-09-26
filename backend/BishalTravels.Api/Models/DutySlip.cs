using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BishalTravels.Api.Models;

[Table("duty_slips")]
public class DutySlip
{
    [Key]
    [MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string DutySlipNo { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Date { get; set; } = string.Empty; // YYYY-MM-DD

    [Required]
    [MaxLength(50)]
    public string VehicleId { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string ClientId { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Route { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string DriverName { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal StartKm { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal EndKm { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalKm { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? GarageOutKm { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? GarageInKm { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? GarageKm { get; set; }

    [Required]
    [MaxLength(20)]
    public string StartTime { get; set; } = string.Empty; // HH:mm

    [Required]
    [MaxLength(20)]
    public string EndTime { get; set; } = string.Empty;   // HH:mm

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalHours { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ExtraHours { get; set; }

    [MaxLength(100)]
    public string? ExtraDuty { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? ExtraDutyCharges { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal NightCharges { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ParkingCharges { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TollCharges { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DriverBatta { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal FuelCharges { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal OtherExpenses { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(50)]
    public string? InvoiceId { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Pending"; // Pending, Billed

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [System.Text.Json.Serialization.JsonIgnore]
    public Vehicle? Vehicle { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public Client? Client { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public Invoice? Invoice { get; set; }
}
