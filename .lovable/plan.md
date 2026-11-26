# Finish LCU monitoring access

## Goal
Make the existing LCU dashboard the home screen, with email/password sign-in as its only access flow and simulated telemetry clearly distinguished from live hardware.

## Work
- Replace the home placeholder with the existing six-section monitoring console and provide page-specific metadata.
- Preserve the existing email/password-only sign-in and simulated readings; keep the dashboard behind the signed-in state.
- Verify the home screen, section navigation, event search/filter, sign-in states, and diagnostics; update the project roadmap.

## Technical details
- Keep all monitoring sections in the existing console on `/` and use the browser-safe telemetry module.
- No new tables, server functions, account creation, or profile fields are needed.