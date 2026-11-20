# Research notes, 20 Nov 2026 (read this session)

1. Apple App Review Guidelines, developer.apple.com/app-store/review/guidelines/ (read 20 Nov 2026 through a summarising fetch; first 100,000 of 121,052 characters; no "last updated" date in the returned text):
   - 4.5.4 is about Push Notifications: not required for the app to function; not for sensitive personal or confidential information; no promotions or direct marketing without explicit opt-in consent and an in-app opt-out. It names push, not local notifications; whether reviewers apply it to local notifications is not settled by the text.
   - 5.1.1(i): privacy policy link in App Store Connect and in the app; must say what is collected, third-party protection, retention and deletion, how to revoke consent.
   - 5.1.1(iv): respect permission settings; offer alternatives when consent is declined.
   - 5.1.1(v): if no significant account-based features, allow use without login; account creation requires in-app account deletion.
   - 2.1(a): final versions; placeholder text and other temporary content scrubbed before submission; demo account and back end on if the app has a login. The words "coming soon" do not appear.
   - 2.5.19: no hidden, dormant or undocumented features.
   - 5.1.4(a): care with kids' data (COPPA, GDPR); apps intended primarily for kids avoid third-party analytics and advertising. Rest of 5.1.4 not returned.
2. PHPickerViewController: Apple's WWDC20 session 10652 says it lets people select photos "without requiring full Photo Library access"; an Apple forum answer (thread 664449) says apps do not need to request library access and Apple strongly encourages using it without requesting access. Asset identifiers and metadata beyond the file need PhotoKit access; file representations come through itemProvider.loadFileRepresentation.
3. Notification previews: "Show Previews" (Always, When Unlocked, Never) is a user setting per app and globally; an app cannot set it (Apple forum thread 105332: "strictly a user control"). An app can set `hiddenPreviewsBodyPlaceholder` on a notification category, the text shown when the system hides previews (Apple docs, UNNotificationCategory).
