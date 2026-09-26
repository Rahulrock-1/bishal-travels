using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BishalTravels.Api.Models;

[Table("invoices")]
public class Invoice
{
    [Key]
    [MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string InvoiceNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string InvoiceDate { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string DueDate { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string BillingMonth { get; set; } = string.Empty; // e.g. "August 2026"

    [Required]
    [MaxLength(50)]
    public string ClientId { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string ClientSnapshotJson { get; set; } = "{}";

    [MaxLength(100)]
    public string ContractRefNo { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string AttachedDutySlipIdsJson { get; set; } = "[]";

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }

    [Required]
    [MaxLength(30)]
    public string TaxType { get; set; } = "GST_5"; // GST_5, GST_12, GST_18, GST_28, NON_GST

    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxRate { get; set; } = 5.0m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Cgst { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Sgst { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Igst { get; set; }

    public bool IsInterstate { get; set; } = false;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Discount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal AdvanceReceived { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TdsRate { get; set; } // e.g. 1% or 2%

    [Column(TypeName = "decimal(18,2)")]
    public decimal TdsAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal GrandTotal { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal NetPayable { get; set; }

    [Required]
    [MaxLength(500)]
    public string AmountInWords { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string BankDetailsJson { get; set; } = "{}";

    [MaxLength(100)]
    public string TradeLicenseNo { get; set; } = string.Empty;

    [MaxLength(50)]
    public string CompanyGstin { get; set; } = string.Empty;

    [MaxLength(50)]
    public string CompanyPan { get; set; } = string.Empty;

    [MaxLength(50)]
    public string CompanyPhone { get; set; } = string.Empty;

    [MaxLength(100)]
    public string CompanyEmail { get; set; } = string.Empty;

    [MaxLength(500)]
    public string CompanyAddress { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Draft"; // Draft, Sent, Paid, Partially Paid, Overdue

    [Column(TypeName = "text")]
    public string Notes { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string TermsJson { get; set; } = "[]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Client? Client { get; set; }
    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();

    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<DutySlip> AttachedDutySlips { get; set; } = new List<DutySlip>();
}
