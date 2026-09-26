using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BishalTravels.Api.Models;

[Table("invoice_items")]
public class InvoiceItem
{
    [Key]
    [MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string InvoiceId { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? VehicleRegNo { get; set; }

    [MaxLength(100)]
    public string? VehicleModel { get; set; }

    [Required]
    [MaxLength(50)]
    public string BillingType { get; set; } = "DutySlipAggregated"; // DutySlipAggregated, MonthlyPackage, PerKm, Custom

    [Column(TypeName = "decimal(18,2)")]
    public decimal BasePackageAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalRunKm { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal RatePerKm { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal KmCharges { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ExtraKm { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ExtraKmRate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ExtraKmCharges { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ExtraHours { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ExtraHourRate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ExtraHourCharges { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal NightCharges { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ParkingCharges { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TollCharges { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DriverAllowance { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal OtherCharges { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    // Navigation property
    [System.Text.Json.Serialization.JsonIgnore]
    public Invoice? Invoice { get; set; }
}
