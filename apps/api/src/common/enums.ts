// ============================================================================
// TorxOS — Enums Centrais de Domínio
// ============================================================================

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  ATTENDANT = "ATTENDANT",
  TECHNICIAN = "TECHNICIAN",
  FINANCIAL = "FINANCIAL",
}

export enum OsStatus {
  TRIAGE = "TRIAGE",
  ANALYSIS = "ANALYSIS",
  AWAITING_APPROVAL = "AWAITING_APPROVAL",
  APPROVED = "APPROVED",
  IN_MAINTENANCE = "IN_MAINTENANCE",
  AWAITING_PARTS = "AWAITING_PARTS",
  QUALITY_CHECK = "QUALITY_CHECK",
  READY_FOR_PICKUP = "READY_FOR_PICKUP",
  DELIVERED = "DELIVERED",
  CANCELED = "CANCELED",
}

export enum TransactionType {
  RECEIVABLE = "RECEIVABLE",
  PAYABLE = "PAYABLE",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  SETTLED = "SETTLED",
  PARTIALLY_SETTLED = "PARTIALLY_SETTLED",
  CANCELLED = "CANCELLED",
}
