# Settings

ITIL practices: Service Integration and Management support, User Experience governance.

## Navigation Structure

- Route: `/settings`
- Implemented tabs: Notification Preferences, Webhooks
- Recommended additional tabs: Profile, Localization, API Tokens, Security

## Menus

- Header menu:
  - Save all
  - Revert unsaved changes
  - Import/export settings
  - Validate configuration
- Notification preference menu:
  - Presets (minimal/standard/high-alert)
  - Channel toggles
  - Quiet hours
  - Digest frequency
- Webhook row action menu:
  - Edit webhook
  - Test webhook
  - Disable/enable
  - Rotate secret
  - Delete webhook
- Bulk action menu (webhooks):
  - Bulk enable/disable
  - Bulk test
  - Bulk delete
  - Bulk export
- Detail action menu:
  - View delivery logs
  - Retry failed deliveries
  - Add endpoint override

## Required UI Elements

- Preference matrix (event type x channel x priority).
- Quiet-hours and digest schedule controls.
- Webhook registry: endpoint, events, active state, last success/failure, failure count.
- Webhook editor: URL, secret, signature method, retry policy, timeout.
- Webhook test result panel with response code and payload preview.

## Required Features

- Per-user and role-default preference inheritance.
- Retry/backoff + dead-letter handling for webhook failures.
- Signature verification for outbound event security.
- Full settings-change audit trail.
- Safe rollout controls (test mode, staged activation).

## KPIs

- Notification preference adoption, webhook delivery success rate, settings rollback rate.
