# Requirements Document: Invoice Management Tab for RBMS Admin Dashboard

## Introduction

The Invoice Management module extends the RBMS admin dashboard with comprehensive invoice creation, management, and tracking capabilities. Administrators can manually create invoices for bookings, capture guest and room details, calculate utilities and GST automatically, and manage invoice lifecycle from draft to payment status. This module integrates with existing Booking, Guest, and HotelSettings models to provide a seamless billing workflow.

---

## Glossary

- **Invoice**: A billing document that records a transaction for room rental and associated services
- **Invoice_Number**: A unique identifier formatted as INV-HHMMSS-NNNNN (hour-minute-second concatenated with zero-padded 5-digit sequence starting from 00001)
- **Admin_User**: An authenticated user with administrative privileges to the system
- **Guest**: A customer who has booked a room (links to existing Guest model)
- **Booking**: An existing room reservation record (links to existing Booking model)
- **Base_Amount**: The room rental cost calculated as (room_base_price × nights)
- **Utilities_Amount**: Additional charges for services (calculated automatically based on room count and duration, or entered manually)
- **Taxable_Amount**: Base amount plus utilities minus discounts
- **GST**: Goods and Services Tax applied as a percentage (sourced from HotelSettings.tax_rate, default 18%)
- **Total_Amount**: Taxable amount plus GST
- **Invoice_Status**: Lifecycle state of an invoice (Draft, Generated, Paid, Archived)
- **Line_Item**: A row in the utilities/services section describing what service or charge applies
- **Check_In_Date**: The date a guest arrives (in YYYY-MM-DD format)
- **Check_Out_Date**: The date a guest departs (in YYYY-MM-DD format)
- **Duration_Nights**: Numeric count of nights = (Check_Out_Date - Check_In_Date) in days
- **Room_Count**: Number of rooms included in the invoice line item
- **Discount_Amount**: Reduction applied to the base or taxable amount
- **HotelSettings**: Singleton configuration model containing tax_rate and other hotel details
- **Admin_Dashboard**: The private React + Vite web application for hotel staff
- **API_Endpoint**: A RESTful service endpoint in the Django backend

---

## Requirements

### Requirement 1: Manual Invoice Creation with Auto-Incrementing Invoice Numbers

**User Story:** As an admin user, I want to create invoices manually with automatically assigned unique invoice numbers, so that each invoice is identifiable and auditable without manual numbering effort.

#### Acceptance Criteria

1. WHEN an admin clicks the "Create Invoice" button, THE System SHALL display a new invoice creation form
2. WHEN the admin submits a new invoice, THE System SHALL generate an Invoice_Number formatted as INV-HHMMSS-NNNNN where HHMMSS is the current hour-minute-second and NNNNN is a zero-padded 5-digit sequence starting from 00001
3. WHEN an invoice is created, THE Invoice_Number SHALL be unique across all invoices in the system
4. WHEN an admin retrieves an invoice detail, THE Invoice_Number SHALL be displayed and immutable (not editable after creation)
5. WHERE the invoice numbering sequence fails to generate a unique number, THE System SHALL raise an error and prevent invoice creation

---

### Requirement 2: Customer Information Entry with Data Validation

**User Story:** As an admin user, I want to enter or select customer information for an invoice, so that invoices contain complete and accurate guest details.

#### Acceptance Criteria

1. WHEN an admin creates a new invoice, THE System SHALL provide a form field to select an existing Guest or enter manual customer details
2. WHERE an existing Guest is selected, THE System SHALL pre-populate: full_name, email, phone, address, id_type (if on record)
3. WHERE an admin enters manual customer details, THE System SHALL validate: 
   - full_name matches regex ^[a-zA-Z\s]{3,200}$ (letters and spaces, 3–200 characters)
   - email matches standard email format
   - phone matches regex ^\+\d{1,3}\d{10}$ (country code + 10 digits, e.g., +919876543210)
   - address is 10–500 characters with valid characters (letters, numbers, spaces, commas, periods, hyphens)
4. IF manual customer details fail validation, THEN THE System SHALL display a descriptive error message and prevent invoice submission
5. WHEN an invoice is saved, THE System SHALL store guest_name, guest_email, guest_phone, guest_address as invoice snapshots

---

### Requirement 3: Booking Details Entry and Automatic Duration Calculation

**User Story:** As an admin user, I want to specify booking details (check-in, check-out dates, room information) on an invoice, so that the invoice reflects the actual stay duration and room assignment.

#### Acceptance Criteria

1. WHEN an admin creates an invoice, THE System SHALL provide form fields for Check_In_Date and Check_Out_Date (date picker, YYYY-MM-DD format)
2. WHEN Check_In_Date and Check_Out_Date are provided, THE System SHALL automatically calculate Duration_Nights as (Check_Out_Date - Check_In_Date) in days and display it
3. IF Check_Out_Date is less than or equal to Check_In_Date, THEN THE System SHALL display an error message and prevent invoice submission
4. WHEN an admin provides Check_In_Date and Check_Out_Date, THE System SHALL allow room selection from a dropdown of available rooms or manual room entry
5. WHEN a room is selected, THE System SHALL display room details (room_name, base_price_per_night) for reference
6. WHEN an invoice is saved, THE System SHALL store check_in, check_out, nights, and room_details as snapshots

---

### Requirement 4: Line Items for Utilities and Services

**User Story:** As an admin user, I want to add multiple line items for utilities and services on an invoice, so that I can itemize all charges separately for transparency and accounting.

#### Acceptance Criteria

1. WHEN an admin creates an invoice, THE System SHALL display a "Line Items" section with a table for utilities/services
2. WHEN an admin clicks "Add Line Item", THE System SHALL append a new row with fields: description (text), quantity (positive number), unit_price (decimal), and a delete button
3. WHEN an admin fills in line item fields, THE System SHALL calculate line_total = quantity × unit_price
4. WHEN an admin deletes a line item, THE System SHALL remove that row and recalculate the utilities_amount total
5. WHEN an admin saves an invoice, THE System SHALL validate that all line items have non-empty description and quantity ≥ 1; IF NOT, THEN display error and prevent submission
6. WHEN line items are saved, THE System SHALL store them in a LineItem model with invoice_id, description, quantity, unit_price, line_total

---

### Requirement 5: Automatic Utilities Amount Calculation

**User Story:** As an admin user, I want utilities to be calculated automatically based on room count and duration, so that common per-room-per-night charges are applied consistently without manual entry.

#### Acceptance Criteria

1. WHEN an admin selects a room count (1, 2, 3+) and duration, THE System SHALL provide an option to auto-calculate utilities
2. WHERE the auto-calculate option is selected, THE System SHALL apply a configurable per-room-per-night rate from HotelSettings (e.g., utilities_rate_per_room_per_night)
3. WHEN auto-calculate is applied, THE System SHALL compute: utilities_amount = room_count × duration_nights × utilities_rate_per_room_per_night
4. WHEN utilities_amount is auto-calculated, THE System SHALL display it prominently and allow the admin to override it manually if needed
5. IF an admin manually overrides utilities_amount, THEN THE System SHALL accept the entered value and use it for total calculations

---

### Requirement 6: Automatic GST Calculation Based on Hotel Settings

**User Story:** As an admin user, I want GST (tax) to be calculated automatically from the hotel settings, so that taxes are applied consistently and reflect the configured tax rate.

#### Acceptance Criteria

1. WHEN an invoice is being prepared or updated, THE System SHALL retrieve the current tax_rate from HotelSettings.tax_rate
2. WHEN all amounts (base, utilities, discounts) are entered, THE System SHALL calculate taxable_amount = (base_amount + utilities_amount - discount_amount)
3. WHEN taxable_amount is determined, THE System SHALL calculate tax_amount = taxable_amount × (tax_rate / 100), rounded to 2 decimal places
4. WHEN tax_amount is calculated, THE System SHALL display it in the price breakdown alongside taxable_amount
5. IF HotelSettings.tax_rate is updated, THEN new invoices (not yet generated) SHALL use the new tax rate; existing invoices SHALL retain their snapshot tax rate

---

### Requirement 7: Price Breakdown and Calculation Display

**User Story:** As an admin user, I want to see a clear price breakdown before finalizing an invoice, so that I can verify all calculations and ensure accuracy before sending to the guest.

#### Acceptance Criteria

1. WHEN an admin is creating or editing an invoice, THE System SHALL display a "Price Breakdown" panel showing:
   - Base Amount (room rental)
   - Utilities Amount (from auto-calc or manual entry)
   - Subtotal (base + utilities)
   - Discount Amount (if applicable)
   - Taxable Amount (subtotal - discount)
   - GST (tax percentage and amount in rupees)
   - Total Amount (taxable + GST)
2. WHEN any of the above values change, THE System SHALL update the breakdown in real-time
3. WHEN the invoice is displayed for review, THE System SHALL highlight the Total Amount prominently
4. WHEN an admin hovers over any line item in the breakdown, THE System SHALL display a tooltip explaining the calculation

---

### Requirement 8: Invoice Status Lifecycle Management

**User Story:** As an admin user, I want to track invoice status through its lifecycle, so that I can manage invoicing workflow and distinguish between drafts, finalized invoices, paid invoices, and archived records.

#### Acceptance Criteria

1. WHEN an invoice is first created (unsaved form), THE Invoice_Status SHALL be "Draft"
2. WHEN an admin clicks "Generate Invoice", THE System SHALL change Invoice_Status to "Generated" and lock editing except for status changes
3. WHEN an admin marks an invoice as "Paid" (via a "Mark as Paid" button or payment receipt upload), THE Invoice_Status SHALL change to "Paid"
4. WHEN an invoice is no longer needed, THE System SHALL allow an admin to set Invoice_Status to "Archived"
5. IF an invoice is in "Draft" status, THE System SHALL allow full editing and deletion
6. IF an invoice is in "Generated" or "Paid" status, THE System SHALL prevent editing except for status transitions
7. WHEN Invoice_Status transitions, THE System SHALL record a status_changed_at timestamp

---

### Requirement 9: Frontend Invoice List and Filtering

**User Story:** As an admin user, I want to view a list of all invoices with filtering and search capabilities, so that I can quickly locate invoices by guest, date, or status.

#### Acceptance Criteria

1. WHEN an admin navigates to the Invoice Management tab, THE System SHALL display a paginated list of all invoices
2. WHEN the invoice list is displayed, THE System SHALL show columns: Invoice_Number, Guest_Name, Total_Amount, Invoice_Status, Issue_Date
3. WHEN an admin clicks on an invoice row, THE System SHALL navigate to the invoice detail view with full information
4. WHEN an admin uses the filter panel, THE System SHALL support filtering by:
   - Invoice_Status (Draft, Generated, Paid, Archived)
   - Date range (from_date to to_date)
   - Guest_Name (text search, case-insensitive partial match)
   - Amount range (min_amount to max_amount)
5. WHEN an admin sorts by a column header, THE System SHALL sort invoices by that column (Invoice_Number, Guest_Name, Total_Amount, Issue_Date)
6. WHEN pagination controls are visible, THE System SHALL display 20 invoices per page with next/previous navigation

---

### Requirement 10: Frontend Invoice Creation Form UI

**User Story:** As an admin user, I want an intuitive multi-section form to create invoices, so that I can efficiently fill in guest details, booking dates, and line items without confusion.

#### Acceptance Criteria

1. WHEN an admin clicks "Create Invoice", THE System SHALL display a form with collapsible sections:
   - Section 1: Guest Details (select existing or enter manual)
   - Section 2: Booking Details (check-in, check-out, room selection)
   - Section 3: Line Items (utilities and services)
   - Section 4: Price Breakdown (read-only summary)
2. WHEN an admin is in Section 1, THE System SHALL show: Guest dropdown with search, or "Enter Manual Details" toggle for name, email, phone, address fields
3. WHEN an admin is in Section 2, THE System SHALL show: Check_In_Date picker, Check_Out_Date picker, auto-calculated Duration_Nights, Room selection dropdown
4. WHEN an admin is in Section 3, THE System SHALL show: Table of line items with add/delete buttons, auto-calculate utilities checkbox, manual utilities override field
5. WHEN an admin is in Section 4, THE System SHALL show: read-only price breakdown display (no editing)
6. WHEN form validation fails, THE System SHALL highlight invalid fields in red and display error messages below the field

---

### Requirement 11: Frontend Invoice Detail and Preview View

**User Story:** As an admin user, I want to view a detailed, printable preview of an invoice, so that I can verify all information before sharing with a guest or generating a PDF.

#### Acceptance Criteria

1. WHEN an admin opens an invoice detail view, THE System SHALL display:
   - Invoice_Number, Issue_Date, Invoice_Status
   - Guest name, email, phone, address (from invoice snapshot)
   - Hotel name, address, phone, email (from HotelSettings)
   - Booking period (Check_In_Date to Check_Out_Date, Duration_Nights)
   - Line items table with description, quantity, unit_price, line_total
   - Price breakdown: base, utilities, subtotal, discount, taxable, GST, total
2. WHEN an admin clicks "Print" or "Print to PDF" button, THE System SHALL generate a browser print dialog or PDF file in standard invoice format
3. WHEN a PDF is generated, THE System SHALL save the PDF file reference in the invoice record for download history
4. WHEN an admin clicks "Email Invoice", THE System SHALL open an email compose dialog with guest_email pre-filled and invoice attached (if PDF available)

---

### Requirement 12: Backend API Endpoint for Invoice Creation

**User Story:** As a frontend developer, I want a REST API endpoint to create invoices, so that the React admin dashboard can submit invoice data to the Django backend.

#### Acceptance Criteria

1. THE System SHALL provide a POST endpoint: /api/v1/invoices/ (admin-only, authenticated)
2. WHEN an admin submits invoice data (guest_name, email, phone, address, check_in, check_out, base_amount, utilities_amount, discount_amount, line_items), THE API SHALL validate all fields and return 400 Bad Request with error messages if validation fails
3. WHEN invoice data is valid, THE API SHALL:
   - Generate a unique Invoice_Number
   - Create an Invoice record
   - Create associated LineItem records from line_items array
   - Return 201 Created with the created invoice object including invoice_id and Invoice_Number
4. IF a database error occurs, THE API SHALL return 500 Internal Server Error with a user-friendly error message

---

### Requirement 13: Backend API Endpoint for Invoice Retrieval

**User Story:** As a frontend developer, I want REST API endpoints to retrieve invoices, so that the React admin dashboard can display invoice lists and details.

#### Acceptance Criteria

1. THE System SHALL provide a GET endpoint: /api/v1/invoices/ (admin-only, paginated, filterable)
2. WHEN an admin requests the invoices list, THE API SHALL support query parameters:
   - page (integer, default 1)
   - page_size (integer, default 20)
   - status (string, filter by Invoice_Status)
   - guest_name (string, partial match search)
   - from_date (date, YYYY-MM-DD)
   - to_date (date, YYYY-MM-DD)
   - min_amount (decimal)
   - max_amount (decimal)
3. WHEN query parameters are provided, THE API SHALL filter invoices accordingly and return paginated results
4. WHEN results are returned, THE API SHALL include pagination metadata: count, next, previous, page_size
5. THE System SHALL provide a GET endpoint: /api/v1/invoices/{invoice_id}/ (admin-only)
6. WHEN an admin requests an invoice detail, THE API SHALL return: Invoice_Number, Issue_Date, Invoice_Status, guest details, booking details, line items, price breakdown

---

### Requirement 14: Backend API Endpoint for Invoice Status Update

**User Story:** As a frontend developer, I want an API endpoint to update invoice status, so that the React admin dashboard can change status from Draft to Generated, Paid, or Archived.

#### Acceptance Criteria

1. THE System SHALL provide a PATCH endpoint: /api/v1/invoices/{invoice_id}/update_status/ (admin-only)
2. WHEN an admin submits a status update request (new_status), THE API SHALL validate that:
   - new_status is one of: "Draft", "Generated", "Paid", "Archived"
   - the current status allows transition to new_status (e.g., Draft → Generated, Generated → Paid, any → Archived)
3. IF the transition is invalid, THE API SHALL return 400 Bad Request with error message
4. WHEN the transition is valid, THE API SHALL update Invoice_Status and status_changed_at timestamp, then return 200 OK with the updated invoice

---

### Requirement 15: Backend API Endpoint for Invoice Deletion (Draft Only)

**User Story:** As a frontend developer, I want an API endpoint to delete draft invoices, so that admins can remove incorrectly created invoices before generation.

#### Acceptance Criteria

1. THE System SHALL provide a DELETE endpoint: /api/v1/invoices/{invoice_id}/ (admin-only)
2. IF an invoice is in "Draft" status, THE API SHALL allow deletion and return 204 No Content
3. IF an invoice is in "Generated", "Paid", or "Archived" status, THE API SHALL return 403 Forbidden with error message "Cannot delete non-draft invoices"

---

### Requirement 16: Backend Invoice Model Extension

**User Story:** As a backend developer, I want the Invoice model to store all invoice data comprehensively, so that invoices serve as immutable billing records.

#### Acceptance Criteria

1. THE Invoice model SHALL have fields:
   - invoice_number (CharField, unique, auto-generated)
   - invoice_status (CharField, choices: Draft/Generated/Paid/Archived, default Draft)
   - booking (ForeignKey to Booking, optional for manual invoices)
   - guest_name, guest_email, guest_phone, guest_address (snapshots)
   - check_in (DateField), check_out (DateField), nights (PositiveIntegerField)
   - room_details (CharField, snapshot of room name)
   - base_amount, utilities_amount, discount_amount, tax_amount, total_amount (DecimalField, 2 places)
   - line_items (reverse relation to LineItem model)
   - issue_date (DateTimeField, auto_now_add)
   - status_changed_at (DateTimeField, nullable, tracks last status change)
   - pdf_file (FileField, optional, for generated PDFs)
   - created_at, updated_at (DateTimeField, auto tracking)
2. THE Invoice model SHALL define __str__ method returning "Invoice {invoice_number} ({guest_name})"

---

### Requirement 17: Backend LineItem Model for Invoice Line Items

**User Story:** As a backend developer, I want a LineItem model to store invoice utilities and services, so that line items are tracked separately and associated with their parent invoice.

#### Acceptance Criteria

1. THE LineItem model SHALL have fields:
   - invoice (ForeignKey to Invoice, cascade delete)
   - description (CharField, max_length 255)
   - quantity (PositiveIntegerField, min 1)
   - unit_price (DecimalField, max_digits 10, decimal_places 2)
   - line_total (DecimalField, max_digits 10, decimal_places 2, auto-calculated)
2. THE LineItem model SHALL define __str__ method returning "{description} (qty: {quantity})"
3. WHEN a LineItem is saved, THE System SHALL calculate and store line_total = quantity × unit_price

---

### Requirement 18: Backend Serializer for Invoice API Responses

**User Story:** As a backend developer, I want a serializer to convert Invoice model data to JSON, so that API responses are consistent and the frontend receives properly formatted data.

#### Acceptance Criteria

1. THE InvoiceSerializer SHALL include all Invoice fields plus nested LineItem data
2. WHEN an invoice is serialized, THE System SHALL include:
   - invoice_id, invoice_number, invoice_status, issue_date, status_changed_at
   - guest_name, guest_email, guest_phone, guest_address
   - check_in, check_out, nights, room_details
   - base_amount, utilities_amount, discount_amount, tax_amount, total_amount
   - line_items (array of LineItem objects with description, quantity, unit_price, line_total)
3. THE LineItemSerializer SHALL include: id, description, quantity, unit_price, line_total

---

### Requirement 19: Invoice PDF Generation Capability

**User Story:** As an admin user, I want to generate a PDF version of an invoice, so that I can print or email a professional, formatted document to guests.

#### Acceptance Criteria

1. WHEN an admin clicks "Generate PDF" on an invoice detail view, THE System SHALL trigger a backend task to generate a PDF
2. WHEN the PDF is generated, THE System SHALL include:
   - Hotel header (name, address, phone, email, GST registration number if available)
   - Invoice header (Invoice_Number, Issue_Date, Invoice_Status)
   - Guest section (guest name, email, phone, address)
   - Booking details (Check_In_Date, Check_Out_Date, Duration_Nights, Room details)
   - Line items table (description, quantity, unit_price, line_total)
   - Price breakdown (base, utilities, subtotal, discount, taxable, GST, total)
   - Footer (thank you message, hotel branding)
3. WHEN the PDF is generated successfully, THE System SHALL save it to the invoice record (pdf_file field) and return a download link
4. IF PDF generation fails, THE System SHALL display an error message and log the failure

---

### Requirement 20: Invoice Search and Export Capability

**User Story:** As an admin user, I want to search invoices by guest name, date range, or amount, and export filtered results as CSV, so that I can analyze billing data and generate reports.

#### Acceptance Criteria

1. WHEN an admin enters a guest name in the search field, THE System SHALL perform case-insensitive partial match on guest_name and display matching invoices
2. WHEN an admin selects a date range (from_date to to_date), THE System SHALL filter invoices by issue_date within that range (inclusive)
3. WHEN an admin filters by amount range (min_amount to max_amount), THE System SHALL display invoices where total_amount is within the range
4. WHEN an admin combines filters (e.g., guest name + date range + status), THE System SHALL apply all filters (AND logic) and display matching results
5. WHEN an admin clicks "Export CSV", THE System SHALL generate a CSV file containing filtered invoice rows with columns: Invoice_Number, Guest_Name, Check_In, Check_Out, Base_Amount, Utilities_Amount, Discount_Amount, Tax_Amount, Total_Amount, Invoice_Status, Issue_Date
6. WHEN CSV export is triggered, THE System SHALL immediately download the file to the user's computer

---

### Requirement 21: Parser and Pretty Printer for Invoice Data Export Formats

**User Story:** As a backend developer, I want a parser for JSON invoice data and a pretty printer for formatted text/CSV export, so that invoices can be reliably converted between formats and exported accurately.

#### Acceptance Criteria

1. WHEN invoice JSON data (from API) is received, THE Parser SHALL validate structure and deserialize it into Python objects (Invoice, LineItem dictionaries)
2. WHEN parser encounters invalid JSON structure or missing required fields, THE System SHALL raise a descriptive error with the specific field or structure issue
3. WHEN valid Invoice objects are available, THE Pretty_Printer SHALL format them into:
   - Readable text format (for human review, with aligned columns)
   - CSV format (for spreadsheet import, with proper escaping for commas and quotes)
   - JSON format (for API responses and data interchange)
4. THE Pretty_Printer SHALL ensure formatting is deterministic: parsing → printing → parsing produces equivalent object (round-trip property)
5. WHEN a Pretty_Printer generates text/CSV, THE System SHALL include proper headers and ensure all numeric values are formatted to 2 decimal places for consistency

---

### Requirement 22: Invoice Email Delivery to Guests

**User Story:** As an admin user, I want to email invoices to guests directly from the dashboard, so that guests receive their billing documents promptly.

#### Acceptance Criteria

1. WHEN an admin clicks "Email Invoice" on an invoice detail view, THE System SHALL open an email compose dialog
2. WHEN the dialog opens, THE System SHALL pre-fill: recipient (guest_email), subject ("Invoice INV-{invoice_number} from {hotel_name}"), and body with invoice details
3. WHERE a PDF file exists, THE System SHALL attach the PDF to the email
4. WHEN an admin clicks "Send", THE System SHALL queue an email task and return confirmation "Email sent successfully"
5. IF email sending fails, THE System SHALL display error message with retry option

---

## Non-Functional Requirements

### Performance and Scalability

1. Invoice list API endpoint SHALL return results within 500ms for up to 10,000 invoices with standard filters applied
2. Invoice PDF generation SHALL complete within 10 seconds for a single invoice
3. The system SHALL support concurrent creation of up to 10 invoices simultaneously without race conditions in invoice number generation

### Data Integrity and Backup

1. Once an invoice status transitions to "Generated", the invoice data SHALL be treated as immutable (read-only audit trail)
2. All invoice PDF files SHALL be stored in a durable storage backend (Cloudinary or cloud storage) with backup retention for 2 years
3. Invoice records and related LineItem records SHALL maintain referential integrity (deletion of invoice cascades to line items)

### Compliance and Audit Trail

1. Every invoice status change SHALL be logged with timestamp and triggering admin user (if implementable with Django auth)
2. Invoice numbers SHALL never be reused across the system's lifetime
3. All invoice data snapshots (guest info, amounts, tax rate) SHALL be immutable after invoice is moved from "Draft" status

---

## Common Acceptance Criteria Patterns (Testing Guidance)

### Property-Based Testing Recommendations

1. **Round-Trip Property (Parser/Pretty Printer):** 
   - Generate random valid invoice JSON → parse → print → parse → verify equivalence
   - Test ensures serializer and deserializer work reliably

2. **Invariants (Price Calculations):**
   - total_amount SHALL always equal (base_amount + utilities_amount - discount_amount) × (1 + tax_rate/100)
   - For any valid invoice, total_amount ≥ base_amount (always true when discount ≤ base and tax ≥ 0)

3. **Idempotence (Status Updates):**
   - Calling update_status("Paid") twice SHALL result in same state (no double-marking as paid)
   - Generating PDF multiple times for same invoice SHALL produce invoices with identical content (except timestamps)

4. **Metamorphic Properties:**
   - Filtering invoices by guest_name "John" should return ≤ total invoices count
   - Invoices in "Paid" status count ≤ invoices in "Generated" status count

### Integration Test Recommendations

- Test invoice creation with existing Booking model integration (verify booking lookup and details population)
- Test HotelSettings tax_rate retrieval and application in multiple concurrent invoice creations
- Test email delivery queue (mock SMTP backend, verify email task is queued)
- Test PDF generation task with Celery (verify task queuing and file storage)

