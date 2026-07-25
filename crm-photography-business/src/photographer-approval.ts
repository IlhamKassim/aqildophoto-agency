export interface PhotographerApprovalCheck {
  isApproved(photographerId: string): boolean;
}
