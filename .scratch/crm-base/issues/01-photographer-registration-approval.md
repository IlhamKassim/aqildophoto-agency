# 01 — Photographer registration & approval

**What to build:** A prospective Photographer can submit a profile for review. Agency staff can Approve or Reject it. The resulting Photographer Status gates everything a Photographer can do elsewhere in the system.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] A Photographer can register with a profile, creating a Photographer record with Photographer Status = Pending
- [ ] Agency staff can approve a Pending Photographer, transitioning their status to Approved
- [ ] Agency staff can reject a Pending Photographer, transitioning their status to Rejected
- [ ] Only Photographers with Photographer Status = Approved are treated as eligible to act as a Photographer elsewhere in the system (enforced as a business-rule boundary, not a UI check)
- [ ] A Rejected Photographer's record cannot silently flip to Approved without a fresh review action
