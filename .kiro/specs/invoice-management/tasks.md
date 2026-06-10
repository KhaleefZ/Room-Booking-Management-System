# Implementation Plan: Invoice Management Feature

## Overview

The Invoice Management feature is a comprehensive billing system for the RBMS admin dashboard. This plan breaks down the implementation into 7 sequential phases:

1. **Phase 1 (Foundation)**: Database models, utilities, validators
2. **Phase 2 (Backend API)**: REST endpoints and serializers  
3. **Phase 3 (Backend Tasks)**: Celery async tasks for PDF generation and email delivery
4. **Phase 4 (Frontend State)**: Zustand store and API client integration
5. **Phase 5 (Frontend Components)**: React components for list, form, and detail views
6. **Phase 6 (Integration)**: Connect frontend to backend and add E2E functionality
7. **Phase 7 (Polish)**: PDF styling refinement, email templates, and error handling

Implementation language: **Python (Django backend)** and **TypeScript (React frontend)**

---

## Tasks

### Phase 1: Database Models & Foundation

- [ ] 1. Create Invoice and LineItem Models
  - Create extended Invoice model in `backend/bookings/models.py` with all required fields (invoice_number, invoice_status, guest snapshot fields, booking snapshot fields, pricing fields, audit trail fields)
  - Create LineItem model for utilities/services line items with ForeignKey to Invoice
  - Add proper Meta classes with ordering, indexes, and help text
  - Implement helper methods: `is_draft()`, `is_editable()`, `can_transition_to(new_status)`
  - Add model validation to prevent negative amounts
  - _Requirements: 16.1, 17.1_

- [ ] 2. Create Database Indexes and Constraints
  - Add database indexes for invoice_status, guest_name, created_at (single and composite)
  - Add unique constraint on invoice_number field
  - Set up cascade delete relationship between Invoice and LineItem
  - Create migration file `bookings/migrations/0006_lineitem_invoice_extensions.py`
  - _Requirements: 16.1, 17.1_

- [ ] 3. Create Invoice Number Generator Utility
  - Implement thread-safe `generate_invoice_number()` function in `backend/bookings/utils.py` with format INV-HHMMSS-NNNNN
  - Add retry mechanism for race condition handling (max 10 attempts)
  - Implement `validate_invoice_number()` function to verify number format
  - Add proper error handling with descriptive error messages
  - Include inline documentation explaining the atomic generation strategy
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [ ] 4. Create Price Calculation Utilities
  - Implement `calculate_invoice_totals()` function with formula: taxable = base + utilities - discount; tax = taxable * (tax_rate / 100); total = taxable + tax
  - Implement `calculate_utilities_auto()` function: utilities = room_count * nights * utilities_rate_per_room_per_night
  - Implement `calculate_duration_nights()` function to calculate days between check-in and check-out
  - Add Decimal rounding to 2 places using ROUND_HALF_UP
  - Include property validation: total_amount >= base_amount when discount <= base and tax >= 0
  - _Requirements: 5.2, 6.2, 6.3, 6.4, 7.1_

- [ ] 5. Create Validator Classes
  - Implement GuestNameValidator (3-200 chars, letters and spaces only)
  - Implement GuestEmailValidator (standard email format)
  - Implement GuestPhoneValidator (+country_code + 10 digits)
  - Implement GuestAddressValidator (10-500 chars, alphanumeric + punctuation)
  - Implement DateRangeValidator (check_out > check_in)
  - Implement LineItemValidator (non-empty list, qty >= 1, unit_price > 0)
  - Implement InvoiceStatusTransitionValidator (valid state transitions)
  - Add all validators to `backend/bookings/validators.py`
  - _Requirements: 2.3, 3.3, 4.5, 8.2, 14.2_

- [ ] 6. Update HotelSettings Model
  - Add fields to HotelSettings: `utilities_rate_per_room_per_night` (DecimalField, default 100.00)
  - Ensure `tax_rate` field exists with default 18.00
  - Add static method `get_settings()` for singleton pattern access
  - Create migration for new fields if needed
  - _Requirements: 5.1, 6.1_

- [ ]* 7. Write Property Tests for Calculation Functions
  - **Property 1: Round-trip serialization consistency**
    - Generate random valid invoice dict → serialize → deserialize → compare with original
    - Validates: Requirements 21.4
  - **Property 2: Total amount invariant**
    - For any valid invoice: total_amount = (base + utilities - discount) * (1 + tax_rate/100)
    - Validates: Requirements 6.3, 7.1
  - **Property 3: Utilities calculation idempotence**
    - Calling `calculate_utilities_auto()` multiple times with same inputs yields identical result
    - Validates: Requirements 5.2
  - **Property 4: Duration calculation correctness**
    - calculate_duration_nights(d1, d2) = (d2 - d1).days for all valid date pairs
    - Validates: Requirements 3.2
  - Create tests in `backend/bookings/tests/test_properties.py`
  - Use pytest-hypothesis for property-based testing

- [ ] 8. Checkpoint - Ensure database models and utilities are tested
  - Run Django migrations successfully: `python manage.py migrate`
  - Verify models have correct fields and indexes: `python manage.py inspectdb` and inspect schema
  - Test invoice number generation for uniqueness (create 100 invoices in sequence, verify all unique)
  - Test all validator classes with valid and invalid inputs
  - Test price calculation functions with edge cases (zero amounts, max precision decimals)
  - Ask the user if questions arise

---

### Phase 2: Backend API - Serializers & Views

- [ ] 9. Create Invoice Serializers
  - Create LineItemSerializer with fields: id, description, quantity, unit_price, line_total (read_only)
  - Create InvoiceListSerializer (minimal fields for list view): invoice_id, invoice_number, guest_name, total_amount, invoice_status, issue_date
  - Create InvoiceDetailSerializer (full invoice with nested line_items and hotel_info)
  - Add serializer method field `hotel_info` that retrieves HotelSettings data
  - Implement custom validation in serializers to check for required fields
  - Create file `backend/bookings/serializers.py` (extend if exists)
  - _Requirements: 18.1, 18.2, 18.3_

- [ ] 10. Create Invoice Creation Serializer with Validation
  - Create InvoiceCreateSerializer with fields: guest_name, guest_email, guest_phone, guest_address, check_in, check_out, base_amount, utilities_amount, discount_amount, line_items, booking_id (optional)
  - Add field-level validation for guest details (use GuestNameValidator, GuestPhoneValidator, etc.)
  - Add object-level validation for date ranges (DateRangeValidator)
  - Add line_items validation (LineItemValidator)
  - Add min/max bounds validation for amounts (non-negative, reasonable upper bounds)
  - Return detailed error dict with field-specific error messages
  - _Requirements: 2.2, 2.3, 3.3, 4.5, 12.2_

- [ ] 11. Create Invoice ViewSet with CRUD Endpoints
  - Create InvoiceViewSet in `backend/bookings/views.py` with actions:
    - `create` (POST /api/v1/invoices/) - Create new invoice with auto-generated invoice_number
    - `list` (GET /api/v1/invoices/) - List invoices with pagination and filtering
    - `retrieve` (GET /api/v1/invoices/{id}/) - Get invoice detail
    - `update_status` (PATCH /api/v1/invoices/{id}/update_status/) - Update invoice status with validation
    - `destroy` (DELETE /api/v1/invoices/{id}/) - Delete invoice (draft only)
  - Add permission classes: IsAuthenticated, IsAdminUser
  - Implement queryset filtering by status, guest_name (case-insensitive), date range, amount range
  - Support ordering by invoice_number, guest_name, total_amount, issue_date
  - Add pagination with default page_size=20, max=100
  - _Requirements: 12.1, 12.3, 13.1, 13.2, 13.5, 13.6, 14.1, 14.3, 15.1, 15.2_

- [ ] 12. Implement Invoice Creation Logic in Create Action
  - In `create()` action: validate serializer data
  - Generate unique invoice_number using `generate_invoice_number()`
  - Calculate duration_nights using `calculate_duration_nights()`
  - Calculate utilities_amount (auto or manual) using `calculate_utilities_auto()` or provided value
  - Calculate all totals using `calculate_invoice_totals()`
  - Retrieve tax_rate from HotelSettings at invoice creation time (immutable snapshot)
  - Create Invoice and associated LineItem records in atomic transaction
  - Return created invoice with 201 Created status
  - Handle race conditions in invoice number generation (retry up to 10 times)
  - _Requirements: 1.2, 1.3, 5.2, 6.2, 6.4, 12.3_

- [ ] 13. Implement Invoice List Filtering and Pagination
  - Support query parameters: page, page_size, status, guest_name, from_date, to_date, min_amount, max_amount, ordering
  - Implement case-insensitive partial match for guest_name using `icontains`
  - Implement date range filtering (inclusive) using `gte` and `lte`
  - Implement amount range filtering using `gte` and `lte`
  - Return paginated response with count, next, previous, page_size fields
  - Set sensible defaults: page=1, page_size=20, ordering="-created_at"
  - _Requirements: 9.2, 9.3, 9.4, 9.5, 13.2, 13.3, 13.4_

- [ ] 14. Implement Status Update Validation and Transitions
  - In `update_status()` action: validate new_status is one of valid choices
  - Use InvoiceStatusTransitionValidator to check if transition is allowed
  - Update status_changed_at timestamp when status changes
  - Prevent editing invoice fields when status is not "Draft"
  - Return 400 Bad Request with descriptive error if transition invalid
  - Return 200 OK with updated invoice data on success
  - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 14.2, 14.3, 14.4_

- [ ] 15. Implement Invoice Deletion (Draft Only)
  - In `destroy()` action: check if invoice_status == "Draft"
  - If not draft: return 403 Forbidden with error message "Cannot delete non-draft invoices"
  - If draft: delete invoice (cascade deletes line items) and return 204 No Content
  - Add proper error handling and logging
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 16. Add Invoice API Routes to URLconf
  - Register InvoiceViewSet in `backend/bookings/urls.py` with basename "invoice"
  - Create routes:
    - `/api/v1/invoices/` - list, create
    - `/api/v1/invoices/{id}/` - retrieve, update (reserved for future), destroy
    - `/api/v1/invoices/{id}/update_status/` - custom action for status update
    - `/api/v1/invoices/generate-pdf/` - custom action (for Phase 3)
    - `/api/v1/invoices/export/csv/` - custom action (for Phase 3)
  - Use DRF router for automatic URL generation
  - _Requirements: 12.1, 13.1, 14.1, 15.1_

- [ ]* 17. Write Unit Tests for Serializers and ViewSet
  - **Test 1: InvoiceCreateSerializer validation**
    - Valid input creates invoice successfully
    - Invalid guest_name, email, phone raises ValidationError
    - Invalid date range (check_out <= check_in) raises ValidationError
    - Empty line_items raises ValidationError
    - Validates: Requirements 2.3, 3.3, 4.5, 12.2
  - **Test 2: Invoice list filtering**
    - Filter by status returns correct invoices
    - Filter by guest_name (partial match, case-insensitive) works
    - Filter by date range (inclusive) works
    - Filter by amount range works
    - Validates: Requirements 9.4, 13.2, 13.3, 13.4
  - **Test 3: Status transitions**
    - Valid transitions succeed (Draft→Generated→Paid→Archived)
    - Invalid transitions raise error
    - Validates: Requirements 8.2, 8.5, 8.6, 14.2
  - Create tests in `backend/bookings/tests/test_api.py`

- [ ] 18. Checkpoint - Ensure API endpoints are functional
  - Test invoice creation via POST /api/v1/invoices/ with valid data
  - Verify invoice_number is unique and auto-generated
  - Test invoice list retrieval with filters applied
  - Test status update transitions
  - Test invoice deletion (draft only)
  - Test error responses (400, 403, 404)
  - Ask the user if questions arise

---

### Phase 3: Backend Async Tasks - PDF & Email

- [ ] 19. Implement PDF Generation Task
  - Create `generate_invoice_pdf()` Celery task in `backend/bookings/tasks.py`
  - Task accepts invoice_id parameter
  - Uses ReportLab to generate PDF with:
    - Hotel header (name, address, phone, email)
    - Invoice header (number, date, status)
    - Guest section (name, email, phone, address)
    - Booking details (check-in, check-out, nights, room)
    - Line items table (description, qty, unit_price, line_total)
    - Price breakdown (base, utilities, subtotal, discount, taxable, GST, total)
    - Footer with thank you message
  - Task uploads PDF to Cloudinary and saves pdf_file reference to invoice
  - Task completes within 10 seconds timeout
  - Add proper logging and error handling
  - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [ ] 20. Implement Email Delivery Task
  - Create `send_invoice_email()` Celery task in `backend/bookings/tasks.py`
  - Task accepts invoice_id and recipient_email parameters
  - Task builds email with:
    - Subject: "Invoice INV-{number} from {hotel_name}"
    - Body: Invoice summary with guest name, dates, total amount, thank you message
    - Attachment: PDF file if available
  - Task uses Django SMTP backend for email sending
  - Add retry mechanism with max_retries=3 and exponential backoff (countdown=60)
  - Add proper logging for success and failure cases
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_

- [ ] 21. Create PDF Generation API Endpoint
  - Add `generate_pdf` custom action to InvoiceViewSet (POST /api/v1/invoices/{id}/generate-pdf/)
  - Validate invoice status is not "Draft" (require "Generated")
  - Queue `generate_invoice_pdf()` Celery task asynchronously
  - Return 202 Accepted with task_id and status message
  - Return 400 Bad Request if invoice is Draft with clear error message
  - _Requirements: 11.4, 19.1, 19.4_

- [ ] 22. Create Email Delivery API Endpoint
  - Add `send_email` custom action to InvoiceViewSet (POST /api/v1/invoices/{id}/send-email/)
  - Accept request body with optional recipient_email (defaults to invoice.guest_email)
  - Queue `send_invoice_email()` Celery task asynchronously
  - Return 202 Accepted with confirmation message
  - Return 400 Bad Request if invoice has no email address
  - _Requirements: 11.4, 22.1, 22.2_

- [ ] 23. Create CSV Export Endpoint
  - Add `export_csv` custom action to InvoiceViewSet (GET /api/v1/invoices/export/csv/)
  - Support same query parameters as list endpoint (filters)
  - Generate CSV with columns: Invoice Number, Guest Name, Check-In, Check-Out, Base Amount, Utilities Amount, Discount, Tax Amount, Total Amount, Status, Issue Date
  - Ensure proper CSV escaping for commas and quotes
  - Return with Content-Disposition header for automatic download
  - Format numeric values to 2 decimal places
  - _Requirements: 20.4, 20.5, 21.3, 21.4, 21.5_

- [ ] 24. Create Parser and Pretty Printer Utilities
  - Create InvoiceParser class in `backend/bookings/serialization.py`
    - `parse(json_str)` method validates JSON structure and required fields
    - Converts string amounts to Decimal objects
    - Validates line_items structure
    - Raises descriptive ValueError for invalid data
  - Create InvoicePrettyPrinter class with methods:
    - `to_json(invoice_dict)` - returns formatted JSON string
    - `to_text(invoice_dict)` - returns human-readable formatted text with aligned columns
    - `to_csv(invoices_list)` - returns CSV string with proper formatting
  - Ensure round-trip property: parse(print(data)) ≈ data
  - Format all numeric values consistently (2 decimal places)
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [ ]* 25. Write Unit Tests for Async Tasks
  - **Test 1: PDF generation**
    - Celery task creates PDF file successfully
    - PDF contains all required invoice data
    - Task completes within 10 seconds
    - Validates: Requirements 19.1, 19.2, 19.3
  - **Test 2: Email delivery**
    - Celery task sends email successfully
    - Email contains correct subject and body
    - Email attachment includes PDF when available
    - Task retries on failure
    - Validates: Requirements 22.1, 22.2, 22.3, 22.4, 22.5
  - **Test 3: Parser and printer**
    - Parser validates and deserializes valid JSON
    - Parser raises error for invalid JSON or missing fields
    - Printer formats invoice to text, CSV, JSON correctly
    - Round-trip property: parse(print(x)) preserves data
    - Validates: Requirements 21.1, 21.2, 21.3, 21.4, 21.5
  - Create tests in `backend/bookings/tests/test_tasks.py`

- [ ] 26. Checkpoint - Ensure async tasks work correctly
  - Test PDF generation task with mock Cloudinary storage
  - Verify PDF contains all invoice data with correct formatting
  - Test email task with mock SMTP backend
  - Test retry logic for failed email sends
  - Test parser/printer round-trip for various invoice structures
  - Ask the user if questions arise

---

### Phase 4: Frontend State Management

- [ ] 27. Create Zustand Invoice Store
  - Create `frontend/src/store/invoiceStore.ts` with Zustand store
  - State structure:
    - **List state**: invoices[], filters{}, currentPage, pageSize, totalCount, isLoading
    - **Detail state**: selectedInvoice, isLoadingDetail
    - **Form state**: formState (nested structure with guest, booking, line items, totals)
  - Implement actions:
    - `fetchInvoices(filters, page)` - GET /api/v1/invoices/ with query params
    - `fetchInvoiceDetail(invoiceId)` - GET /api/v1/invoices/{id}/
    - `createInvoice(data)` - POST /api/v1/invoices/
    - `updateInvoiceStatus(invoiceId, newStatus)` - PATCH /api/v1/invoices/{id}/update_status/
    - `deleteInvoice(invoiceId)` - DELETE /api/v1/invoices/{id}/
    - `generatePDF(invoiceId)` - POST /api/v1/invoices/{id}/generate-pdf/
    - `sendEmail(invoiceId, recipientEmail)` - POST /api/v1/invoices/{id}/send-email/
    - `initializeForm()` - Reset form to empty state
    - `resetForm()` - Clear all form fields
    - `updateFormSection(section, data)` - Update specific form section
    - `validateForm()` - Validate all form sections
  - Add error handling and loading states
  - _Requirements: 13.1, 13.5, 14.1, 19.1, 22.1_

- [ ] 28. Create API Client Utilities
  - Create `frontend/src/api/client.ts` with axios/fetch wrapper for authenticated requests
  - Implement `invoiceAPI` object with methods:
    - `createInvoice(payload)` - Calls POST /api/v1/invoices/
    - `listInvoices(filters, page, pageSize)` - Calls GET /api/v1/invoices/
    - `getInvoice(invoiceId)` - Calls GET /api/v1/invoices/{id}/
    - `updateStatus(invoiceId, newStatus)` - Calls PATCH /api/v1/invoices/{id}/update_status/
    - `deleteInvoice(invoiceId)` - Calls DELETE /api/v1/invoices/{id}/
    - `generatePDF(invoiceId)` - Calls POST /api/v1/invoices/{id}/generate-pdf/
    - `sendEmail(invoiceId, recipientEmail)` - Calls POST /api/v1/invoices/{id}/send-email/
    - `exportCSV(filters)` - Calls GET /api/v1/invoices/export/csv/ and triggers download
  - Add request/response interceptors for error handling
  - Add JWT token to Authorization header
  - _Requirements: 12.1, 13.1, 14.1, 19.1, 22.1_

- [ ] 29. Create TypeScript Types and Interfaces
  - Create `frontend/src/types/invoice.ts` with TypeScript interfaces:
    - `Invoice` - Full invoice object with all fields
    - `InvoiceSummary` - List view summary (invoice_id, number, guest, total, status, date)
    - `LineItem` - Line item with description, quantity, unit_price, line_total
    - `GuestDetails` - Guest name, email, phone, address
    - `BookingDetails` - Check-in, check-out, nights, room_id, room_name
    - `FilterState` - Filters for list view (status, guestName, dates, amounts)
    - `PaginationMeta` - Pagination info (count, next, previous, page_size)
    - `InvoiceFormState` - Form state structure for creation
    - `ApiResponse` - Generic response wrapper with data and errors
  - Use strict typing throughout frontend
  - _Requirements: 10.2, 13.5, 13.6_

- [ ]* 30. Write Unit Tests for Store and API Client
  - **Test 1: Store initialization and actions**
    - Store initializes with empty invoices and correct default values
    - fetchInvoices action updates invoices[], filters, pagination meta
    - createInvoice action adds new invoice to store
    - updateInvoiceStatus action changes status_changed_at
    - Validates: Requirements 13.1, 13.5, 14.1
  - **Test 2: API client**
    - API client methods call correct endpoints with correct parameters
    - API client handles error responses correctly
    - API client adds JWT token to requests
    - Validates: Requirements 12.1, 13.1
  - Create tests in `frontend/src/tests/store.test.ts` and `frontend/src/tests/api.test.ts`

- [ ] 31. Checkpoint - Ensure state management is working
  - Verify Zustand store initializes correctly
  - Test fetching invoices (mock API response)
  - Test form state updates
  - Verify API client adds authentication headers
  - Ask the user if questions arise

---

### Phase 5: Frontend Components

- [ ] 32. Create Invoice List Component
  - Create `frontend/src/components/InvoiceList.tsx`
  - Display paginated table with columns: Invoice Number, Guest Name, Total Amount, Status, Issue Date
  - Implement row click to navigate to detail view
  - Implement "Create Invoice" button
  - Add pagination controls (previous/next) with page indicator
  - Use Tailwind CSS for styling
  - Show loading spinner while fetching
  - _Requirements: 9.1, 9.2, 9.6, 10.1_

- [ ] 33. Create Invoice Filter and Search Panel
  - Create `frontend/src/components/InvoiceFilterPanel.tsx`
  - Implement filter inputs:
    - Status dropdown (Draft, Generated, Paid, Archived)
    - Guest name search field (text input)
    - Date range pickers (from_date, to_date)
    - Amount range sliders (min_amount, max_amount)
  - Implement "Apply Filters" and "Clear Filters" buttons
  - On filter change: call store.fetchInvoices() with filters and reset to page 1
  - Use Tailwind CSS for styling
  - _Requirements: 9.4, 9.5, 20.1, 20.2_

- [ ] 34. Create Invoice Creation Form Component
  - Create `frontend/src/components/InvoiceCreateForm.tsx`
  - Implement 4-section collapsible form:
    - **Section 1: Guest Details**
      - Guest dropdown with search (show existing guests)
      - "Enter Manual Details" toggle
      - Manual guest fields: name, email, phone, address (hidden by default)
    - **Section 2: Booking Details**
      - Check-in date picker (YYYY-MM-DD)
      - Check-out date picker (YYYY-MM-DD)
      - Display calculated nights (auto-calculated)
      - Room selection dropdown with room name and base price display
    - **Section 3: Line Items**
      - Table of line items (description, quantity, unit_price)
      - Add Line Item button
      - Delete button for each row
      - Auto-calculate utilities checkbox
      - Manual utilities override field
    - **Section 4: Price Breakdown** (read-only)
      - Display base, utilities, subtotal, discount, taxable, GST, total
      - Real-time updates on field changes
  - Show validation errors in red below fields
  - Implement Save Draft and Generate buttons
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 35. Create Guest Details Form Section
  - Create `frontend/src/components/sections/GuestDetailsForm.tsx`
  - Implement guest dropdown with search functionality
  - On guest select: populate manual fields with guest data
  - Implement "Enter Manual Details" toggle to show/hide manual entry fields
  - Manual fields with validation:
    - Guest name (3-200 chars, letters and spaces)
    - Guest email (valid email format)
    - Guest phone (+country_code + 10 digits)
    - Guest address (10-500 chars)
  - Show validation errors below each field
  - Sync to form store state
  - _Requirements: 2.1, 2.2, 2.3, 10.2, 10.3_

- [ ] 36. Create Booking Details Form Section
  - Create `frontend/src/components/sections/BookingDetailsForm.tsx`
  - Implement check-in date picker
  - Implement check-out date picker with validation (must be after check-in)
  - Auto-display calculated nights (check_out - check_in)
  - Implement room selection dropdown (fetch from API or mock)
  - Display selected room details (name, base price per night)
  - Calculate base_amount = room_base_price × nights
  - Show validation errors
  - Sync to form store state
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.2, 10.4_

- [ ] 37. Create Line Items Form Section
  - Create `frontend/src/components/sections/LineItemsForm.tsx`
  - Implement line items table with rows for: description, quantity, unit_price
  - Auto-calculate line_total = quantity × unit_price for each row
  - Implement "Add Line Item" button to append new row
  - Implement delete button (X icon) for each row
  - Implement "Auto-Calculate Utilities" checkbox
  - When checked: calculate utilities_amount = room_count × nights × utilities_rate (show calculated value)
  - Implement manual utilities override field (shows calculated value by default)
  - Show validation errors for empty description or qty < 1
  - Sync line items and utilities to form store state
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 38. Create Price Breakdown Display Component
  - Create `frontend/src/components/sections/PriceBreakdown.tsx`
  - Display read-only breakdown:
    - Base Amount (room rental)
    - Utilities Amount
    - Subtotal (base + utilities)
    - Discount Amount
    - Taxable Amount (subtotal - discount)
    - GST Amount (with percentage displayed)
    - Total Amount (highlighted prominently)
  - Update in real-time as form fields change
  - Add hover tooltips explaining each calculation
  - Highlight Total Amount with larger font/background color
  - Use currency formatting (₹ with 2 decimal places)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 10.4_

- [ ] 39. Create Invoice Detail View Component
  - Create `frontend/src/components/InvoiceDetail.tsx`
  - Display invoice information in sections:
    - Header: Invoice number, date, status
    - Guest section: name, email, phone, address
    - Hotel section: name, address, phone, email (from HotelSettings)
    - Booking section: check-in, check-out, nights, room details
    - Line items table: description, qty, unit_price, line_total
    - Price breakdown: all calculated totals
  - Implement action buttons:
    - "Print" - Open browser print dialog
    - "Generate PDF" - Trigger PDF generation task
    - "Email" - Open email compose modal
    - Status dropdown - Change status with validation
    - "Delete" button (draft only)
  - Show loading states and success/error messages
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 40. Create Email Compose Modal Component
  - Create `frontend/src/components/EmailComposeModal.tsx`
  - Modal fields:
    - Recipient email (pre-filled with guest_email, editable)
    - Subject (pre-filled with "Invoice INV-{number} from {hotel_name}", editable)
    - Body (pre-filled with invoice summary, editable)
    - Attachment preview (show PDF filename if available)
  - Implement "Send" and "Cancel" buttons
  - Show loading indicator while sending
  - Show success/error message after sending
  - Close modal on success
  - _Requirements: 11.4, 22.1, 22.2, 22.3_

- [ ] 41. Create Invoice List Layout with All Components
  - Create main `frontend/src/pages/InvoiceManagement.tsx` page
  - Layout structure:
    - Header: "Invoice Management", "Create Invoice" button
    - Filter panel (collapsible)
    - Invoice list component
    - Pagination controls
  - Route: `/invoices`
  - Integrate all components created in previous tasks
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ]* 42. Write Component Tests
  - **Test 1: InvoiceList component**
    - Renders table with invoice data
    - Pagination controls work correctly
    - Click on invoice navigates to detail
    - Validates: Requirements 9.1, 9.2, 9.6
  - **Test 2: InvoiceCreateForm component**
    - Form sections display correctly
    - Validation errors show for invalid inputs
    - Form submission sends correct API request
    - Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
  - **Test 3: Price breakdown updates**
    - Breakdown updates when amounts change
    - Total amount calculation is correct
    - Validates: Requirements 7.2, 7.3
  - Create tests in `frontend/src/components/__tests__/`

- [ ] 43. Checkpoint - Ensure all frontend components work
  - Invoice list displays and filters work
  - Create form validates inputs correctly
  - Price breakdown updates in real-time
  - Invoice detail view displays all data
  - Email modal pre-fills correctly
  - Ask the user if questions arise

---

### Phase 6: Frontend-Backend Integration

- [ ] 44. Integrate Invoice List with API
  - Update InvoiceListView to fetch from store (which calls API)
  - On component mount: call store.fetchInvoices() with default filters
  - On filter change: call store.fetchInvoices() with new filters
  - On pagination: call store.fetchInvoices() with new page
  - Display loading spinner while fetching
  - Display error message if API fails
  - Add "Retry" button on error
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ] 45. Integrate Invoice Creation Form with API
  - On form submission: validate form locally first
  - Call store.createInvoice(formData)
  - Show loading spinner while creating
  - On success: reset form, navigate to invoice detail
  - On error: show error message with field-level details
  - Handle 400 Bad Request (validation errors) with field mapping
  - Handle 500 errors with retry option
  - _Requirements: 1.1, 12.1, 12.3, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2_

- [ ] 46. Integrate Invoice Detail View with API
  - On component mount: fetch invoice using store.fetchInvoiceDetail(invoiceId)
  - Show loading spinner while fetching
  - Display all invoice data once fetched
  - On "Generate PDF" click: call store.generatePDF(invoiceId)
  - Show success message when PDF is ready
  - Provide download link when PDF is available
  - On "Email" click: open EmailComposeModal
  - On status change: call store.updateInvoiceStatus(invoiceId, newStatus)
  - On delete click: show confirmation and call store.deleteInvoice(invoiceId)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 14.1, 15.1, 19.1_

- [ ] 47. Integrate Email Compose Modal
  - On "Send" click: validate recipient email
  - Call store.sendEmail(invoiceId, recipientEmail)
  - Show loading indicator while sending
  - On success: show "Email sent successfully" message and close modal
  - On error: show error message with retry option
  - Attach PDF to email automatically if available
  - _Requirements: 11.4, 22.1, 22.2, 22.3, 22.4, 22.5_

- [ ] 48. Implement CSV Export Functionality
  - Add "Export CSV" button to invoice list
  - On click: call invoiceAPI.exportCSV(currentFilters)
  - Apply current filters to export
  - Trigger file download automatically
  - Show success message
  - _Requirements: 20.4, 20.5, 21.4, 21.5_

- [ ] 49. Add Error Handling and User Feedback
  - Create error handler in store for API errors
  - Map API error codes to user-friendly messages
  - Show toast/notification on error, success, warning
  - Add retry buttons for failed operations
  - Log errors to console for debugging
  - Handle network errors gracefully
  - _Requirements: 2.4, 12.4, 14.4, 15.3, 19.4_

- [ ]* 50. Write Integration Tests
  - **Test 1: Invoice creation to detail view**
    - Create invoice via form API
    - Navigate to detail view
    - Verify all data displays correctly
    - Validates: Requirements 1.1, 12.3, 13.6, 11.1, 11.2
  - **Test 2: Invoice list filtering**
    - Create multiple invoices
    - Apply filters
    - Verify filtered results
    - Validates: Requirements 9.4, 13.2, 13.3, 13.4
  - **Test 3: PDF generation and email**
    - Generate PDF task queued
    - Send email task queued
    - Verify tasks complete
    - Validates: Requirements 19.1, 22.1, 22.2
  - Create tests in `frontend/src/tests/integration.test.ts`

- [ ] 51. Checkpoint - Ensure full integration works end-to-end
  - Create invoice via form and verify in list
  - Filter invoices and verify results
  - Update invoice status and verify change
  - Generate PDF and verify file is created
  - Send email and verify task is queued
  - Export CSV and verify download
  - Ask the user if questions arise

---

### Phase 7: Polish and Refinements

- [ ] 52. Enhance PDF Styling and Layout
  - Improve PDF layout with better spacing and formatting
  - Add hotel logo to PDF header (if available)
  - Add GST registration number and tax ID (if available)
  - Add invoice serial number or reference
  - Add company bank details (if available)
  - Improve line items table formatting
  - Add alternating row colors for readability
  - Add footer with page numbers (for multi-page invoices)
  - Use professional fonts and consistent branding
  - _Requirements: 19.2, 19.3_

- [ ] 53. Create Professional Email Templates
  - Create HTML email template in `backend/bookings/templates/invoice_email.html`
  - Template includes:
    - Personalized greeting
    - Invoice summary table
    - Important dates (check-in, check-out)
    - Total amount highlighted
    - Call-to-action (view invoice, pay now links if applicable)
    - Hotel contact information
    - Professional footer with logo
  - Create plain text fallback template
  - Use Django template language for dynamic content
  - _Requirements: 22.1, 22.2, 22.3_

- [ ] 54. Add Status-Based UI Behavior
  - Disable edit buttons for Generated/Paid invoices
  - Show read-only indicator for non-Draft invoices
  - Enable PDF generation only for Generated+ invoices
  - Enable email only for Generated+ invoices
  - Show status badge with color coding (Draft=gray, Generated=blue, Paid=green, Archived=dark)
  - Show status change history (if tracked)
  - _Requirements: 8.2, 8.5, 8.6, 11.3_

- [ ] 55. Implement Responsive Design
  - Ensure invoice list table is responsive on mobile
  - Stack form sections on mobile (don't collapse)
  - Make price breakdown full-width on mobile
  - Test on various screen sizes (375px, 768px, 1024px+)
  - Use Tailwind CSS responsive classes
  - Ensure buttons and inputs are touch-friendly (48px minimum)
  - _Requirements: 10.4, 11.1_

- [ ] 56. Add Loading and Error States
  - Show skeleton loaders for invoice list while fetching
  - Show spinner for form submission
  - Show error boundary for component errors
  - Display user-friendly error messages
  - Add retry buttons for failed loads
  - Show "No invoices found" message when list is empty
  - _Requirements: 9.1, 10.6_

- [ ] 57. Implement Form Auto-Save (Optional Enhancement)
  - Auto-save form state to localStorage every 5 seconds
  - On page load: restore form from localStorage if exists
  - Show "Saving..." indicator briefly
  - Show "Draft saved" message on successful save
  - Clear localStorage on successful form submission
  - Allow manual "Clear Draft" button
  - _Requirements: 10.5_

- [ ] 58. Add Search and Export Features
  - Implement advanced search (combine multiple filters)
  - Show search query description
  - Add "Save Search" feature (optional)
  - Implement CSV export with applied filters
  - Show export progress indicator
  - Verify CSV data is correct and complete
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 59. Performance Optimization
  - Implement pagination to handle large invoice lists (10,000+)
  - Use virtual scrolling for long invoice tables (if needed)
  - Lazy-load invoice details component
  - Optimize API calls (combine filters into single request)
  - Add query result caching in store
  - Minimize bundle size by using tree-shaking
  - _Requirements: 9.1, 9.6, 13.1, 13.2_

- [ ] 60. Final Testing and Bug Fixes
  - Test invoice creation with edge cases (very long names, special characters)
  - Test date range filtering with boundary dates
  - Test amount filtering with decimal values
  - Test PDF generation with various invoice sizes
  - Test email delivery with invalid email addresses
  - Test concurrent invoice creation (race condition scenarios)
  - Test form validation with all invalid inputs
  - Test API error responses and error handling
  - _Requirements: All_

- [ ] 61. Checkpoint - Polish is complete
  - PDF looks professional and well-formatted
  - Email templates are styled and personalized
  - UI is responsive on all screen sizes
  - Error handling is comprehensive
  - Form validation is user-friendly
  - All edge cases are handled gracefully
  - Ask the user if questions arise

---

## Notes

- Tasks marked with `*` are optional test-related subtasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Implementation language: Python (Django) for backend, TypeScript (React) for frontend
- All amounts use Decimal type with 2-place rounding (ROUND_HALF_UP)
- Invoice data is immutable after status changes from Draft
- All API endpoints require JWT authentication and admin user status
- Celery tasks for PDF and email are async and can complete independently

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["9.1", "9.2", "10.1", "10.2"] },
    { "id": 5, "tasks": ["11.1", "11.2", "11.3", "11.4", "11.5"] },
    { "id": 6, "tasks": ["12.1", "12.2", "13.1", "13.2", "14.1", "14.2", "14.3"] },
    { "id": 7, "tasks": ["15.1", "16.1"] },
    { "id": 8, "tasks": ["19.1", "19.2", "19.3"] },
    { "id": 9, "tasks": ["20.1", "20.2", "20.3", "21.1", "21.2", "21.3", "21.4"] },
    { "id": 10, "tasks": ["27.1", "28.1", "29.1"] },
    { "id": 11, "tasks": ["32.1", "33.1", "34.1"] },
    { "id": 12, "tasks": ["35.1", "36.1", "37.1", "38.1"] },
    { "id": 13, "tasks": ["39.1", "40.1", "41.1"] },
    { "id": 14, "tasks": ["44.1", "45.1", "46.1", "47.1", "48.1", "49.1"] },
    { "id": 15, "tasks": ["52.1", "53.1", "54.1", "55.1", "56.1", "57.1", "58.1", "59.1"] },
    { "id": 16, "tasks": ["60.1"] }
  ]
}
```

