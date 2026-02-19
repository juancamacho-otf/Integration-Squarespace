# Squarespace to HubSpot Integration & Migration

This project is a robust Node.js-based solution designed to synchronize and migrate e-commerce data and customer profiles from Squarespace into HubSpot.

The system supports both a historical initial migration and continuous synchronization, ensuring that Contacts, Deals, Orders (Custom Objects), and Line Items remain consistently updated in HubSpot through background processes, state tracking, and automatic retry mechanisms.

---

#  Table of Contents

- Project Architecture  
- Mapping Logic (Mappers) — Deep Dive  
  - Contact Mapping  
  - Orders and Deals Mapping  
  - Transactions Mapping  
- Core Services  
  - Historical Migration (Initial Load)  
  - Continuous Synchronization  
  - HubSpot & Squarespace Management  
  - State Control & Logging  
- API Endpoints  
- Auxiliary Database (MongoDB)

---

# Project Architecture

The codebase follows a modular architecture to separate API connections, data transformation logic, and business rules.

```
/connections   → API client instances (e.g., HubSpot SDK)
/mapping       → Data transformers converting Squarespace JSON into HubSpot schemas
/routes        → Express endpoints for manual control and inspection
/services      → Business logic, HTTP calls, rate limit handling, sync calculations, logging
/states        → Local JSON storage for cursor tracking and duplicate prevention
```

---

# Mapping Logic (Mappers) — Deep Dive

This is one of the most critical parts of the system. It defines how raw Squarespace data is interpreted and structured inside HubSpot.

## Application Entry Point & Memory Optimization (Cron)

The main application file (`app.js`) not only initializes the Express server but also orchestrates execution in a highly optimized way.

The `node-cron` library schedules synchronization at regular intervals (every 2 hours using `"0 */2 * * *"`). This design provides:

### RAM Saturation Prevention
Avoids infinite loops (`while(true)`) or constant requests that could accumulate memory garbage.

### Resource Release (Garbage Collection)
Once a cron cycle completes, Node.js garbage collection can free memory used by large datasets, maintaining stable RAM usage and preventing out-of-memory crashes.

### Concurrency Control
Each scheduled execution runs sequentially:

1. General sync cycle (`integrationService.runSyncCycle()`)
2. Order sync cycle (`orderSyncService.runOrderSync()`)

This controlled execution prevents CPU spikes and safely respects API rate limits.

---

## 1. Contact Mapping (`contact-mapping.js`)

The `mapProfiles` function converts a Squarespace profile into an optimized object ready for HubSpot.

### Key Fields:

**Basic Identifiers**

- `temporary_id` (Squarespace ID)
- `firstname`
- `lastname`
- `email`

**Key Dates** (ISO dates converted to milliseconds using `getTime()`):

- `sqsp_created_on`
- `first_order_submitted_on`
- `last_order_submitted_on`

**Billing Information** (prefixed with `sqsp_billing_`):

- Billing full name
- Address lines
- City
- State/Region
- Postal code
- Country
- Phone

**Flags**

- `iscustomer` — True if the profile has completed a purchase.

---

## 2. Orders and Deals Mapping (`order-mapping.js`)

A Squarespace order is transformed into three HubSpot entities:

### Order (Custom Object)

- Name format: `SQSP-{OrderNumber}`
- Customer email
- Fulfillment status (`hs_fulfillment_status`)

**Payment Status Calculation**

Compares:

- `grandTotal.value`
- `refundedTotal.value`

Automatically determines:

- Paid
- Refunded
- Partial Refund

**Financial Values**

- Subtotal
- Shipping cost
- Taxes
- Refund amounts
- Discount codes

**Additional Information**

- Private notes
- Checkout notes
- Shipping method

**Addresses**

- Billing (`hs_billing_*`)
- Shipping (`hs_shipping_*`)

---

### Deal (HubSpot Deal)

- Generated `dealname` combining date, customer name, and order number
- Automatic pipeline and stage assignment (e.g., `"checkout_completed"`)
- Stores total amount, shipping cost, taxes, and refunds.

---

### Line Items

Iterates through `order.lineItems` extracting:

- Product name
- Unit price
- Quantity
- SKU
- Product variants (`sqsp_lineitm_variant`)

---

## 3. Transactions Mapping (`transactions-mapping.js`)

The `mapTransactions` function extracts payment information:

- Payment provider (Stripe, PayPal, etc.) → `hs_payment_processing_method`
- External transaction ID → `payment_reference`

---

# Core Services

## Historical Migration (`irunInitialLoad_service.js`)

Script designed to load the entire Squarespace database back to a defined cutoff date:

```
TARGET_START_DATE: December 1, 2025
```

### Workflow:

- Retrieves profiles using cursor pagination
- Processes only customers (`isCustomer === true`)
- For each valid customer:

  - Upsert contact into HubSpot
  - Fetch historical orders by time window (`getOrdersByDateWindow`)
  - Create:

    - Transactions
    - Orders
    - Deals
    - Line items

### Associations (HubSpot v4)

- Contact → Order
- Contact → Deal
- Order → Deal
- Deal → Line Items

Progress is continuously saved into:

```
migration_state.json
```

If the system crashes, migration resumes exactly from the last processed customer.

---

## Continuous Synchronization

### integration_service.js

- Periodically checks Squarespace profiles created or updated since the last sync timestamp (`lastSyncTimestamp`)
- Processes only new or updated data.
- Uses identical logic as the historical migration for consistency.

### order-sync-service.js

Dedicated safety layer focused on orders:

- Looks back 24 hours (`LOOKBACK_WINDOW_MS`)
- Detects new or updated orders
- Creates or updates records in HubSpot
- If an order email has no existing contact, retrieves the profile from Squarespace and creates it automatically.

---

## API Management

### request_service.js

Implements strict Exponential Backoff:

- Applies to Axios HTTP requests and HubSpot SDK calls
- Handles errors such as:

  - 429 (Rate limit)
  - 500 (Server errors)

Retries progressively (up to 10 attempts) preventing synchronization failures.

---

### hubspot-service.js

Standardizes HubSpot Batch API operations.

Includes:

- `upsertContact`
- `upsertDeal`
- `upsertOrder`

Process:

1. Search existing records using `searchApi` with a specific property.
2. If found → update (`batchApi/update`)
3. If not found → create (`batchApi/create`)

---

#  State Control & Logging

## State Management (`state-service.js`)

Reads and writes:

```
states/migration_state.json
```

Ensures atomicity using a temporary `.tmp` file before renaming.

Stored data includes:

- Last processed date
- Last processed email
- Total processed count
- Current status:

  - RUNNING
  - COMPLETED
  - ERROR

---

## Logger (`logger-service.js`)

Writes logs to:

- Console
- Physical file (`logs/app_logs.txt`)

Features:

- Production mode filtering to prevent file overload
- Safe reading of last log lines using streams and buffers to avoid memory issues with large log files.

---

# API Endpoints (`api.route.js`)

Express routes are exposed for monitoring and controlling background tasks.

### Migration Status

```
GET /api/v1/status/migration
```

Returns current progress state.

### Start Migration

```
POST /api/v1/migration/start
```

Triggers async `runInitialLoad()` execution. Prevents parallel execution if already RUNNING.

### Reset Migration State

```
POST /api/v1/migration/reset
```

Forces state back to IDLE. Useful if migration crashes or gets stuck.

### View Logs

```
GET /api/v1/logs/view
```

Displays the last 100 lines directly in the browser.

### Download Full Logs

```
GET /api/v1/download-applog
```

Downloads the complete log file.

