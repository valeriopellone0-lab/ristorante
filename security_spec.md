# Security Specifications (TDD)

## 1. Data Invariants
- **MenuItem Integrity**: A menu item can only be created, modified, or deleted by the authenticated Owner (`valeriopellone0@gmail.com`). Public readers can view the menu, but are forbidden from making writes.
- **Booking Creation**: Bookings can be made by anyone (public guest guests or signed-in users) under strict schema validations (valid date, valid email, status initially set to 'pending', guest count between 1 and 20).
- **Booking Visibility Control**: Public users can retrieve a single booking ONLY if they know its exact ID (e.g. for guest lookup). Public users can NEVER list or query all bookings (`allow list` is strictly unauthorized for non-admin queries).
- **Booking State Lock**: Once a booking is marked as `cancelled` or `confirmed`, non-admins cannot change any of its values. Only the verified admin can update states or modify bookings on the back-office interface.
- **Identity Integrity**: No regular user or public guest can change the status of another customer's booking or escalate rights.

---

## 2. The "Dirty Dozen" Malicious Payloads
The following payloads constitute attacks trying to bypass our system bounds. They must all yield `PERMISSION_DENIED` in our database layer.

1. **MenuItem Spoof Write**: A non-authenticated browser attempts to create a new steak dish on the menu.
2. **MenuItem Poison Price**: An attacker tries to write a negative price (`-15.00`) to a drink or dish.
3. **MenuItem Admin Override**: An unverified user tries to set the price of a menu item to zero.
4. **Booking List Scraper**: A malicious actor tries to query and scrape all existing reservations.
5. **Booking Ghost Field**: A client tries to submit a booking containing a malicious ghost field (`isVerifiedVIP: true`) to bypass payment hooks.
6. **Booking Instant Approved**: A user tries to create a booking with `status: "confirmed"` straight away, bypassing approval checks.
7. **Booking Guest Count Overflow**: A user requests a reservation for `10000` guests, exhausting table layout schemas.
8. **Booking Date Poisoning**: A client attempts to book for an empty date standard or invalid date string.
9. **Booking Non-Owner Status Hack**: A client tries to update another booking's status directly from `pending` to `confirmed`.
10. **Booking Empty Fields Write**: A client tries to bypass validations of required parameters (`customerName` empty).
11. **Booking Time Overlap**: Inputting malicious script strings `"<script>alert(1)</script>"` in the booking notes field.
12. **Booking ID Hijacking**: Writing long spam payloads into document paths to inflict Resource Poisoning.

---

## 3. Security Assertions & Firewalls
The safety gates inside `firestore.rules` will secure the application's boundaries seamlessly.
- Authenticated admin: `request.auth != null && request.auth.token.email == 'valeriopellone0@gmail.com' && request.auth.token.email_verified == true`.
