# Local Produce Marketplace

A platform connecting local customers with merchants for fresh produce delivery.

## Tech Stack

- **Backend:**
  - Node.js with Express
  - MongoDB for database
  - JWT for authentication

- **Frontend:**
  - Pure HTML, CSS, and JavaScript
  - No frontend framework - keeping it simple and fast
  - Modern CSS features (Grid, Flexbox)

## Project Structure

```
project-feb-10/
├── backend/
│   ├── config/         # Configuration files
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   │   ├── customer/   # Customer-specific routes
│   │   ├── merchant/   # Merchant-specific routes
│   │   └── admin/      # Admin-specific routes
│   ├── scripts/        # Utility scripts
│   └── server.js       # Main server file
├── frontend/
│   ├── shared_images/  # Shared images across portals
│   ├── customer-portal/# Customer-facing portal
│   │   ├── index.html     # Home page
│   │   ├── products.html  # Product listings
│   │   ├── merchants.html # Merchant listings
│   │   ├── cart.html      # Shopping cart
│   │   └── account.html   # User account
│   ├── merchant-portal/# Merchant dashboard
│   │   ├── index.html     # Dashboard home
│   │   └── products.html  # Product management
│   └── admin-portal/   # Admin dashboard
│       ├── index.html     # Admin home
│       ├── merchants.html # Merchant management
│       └── orders.html    # Order management
└── .env               # Environment variables
```

## Server Setup

We use a single Express server that handles both the API endpoints and serves static files. This simplifies development and deployment.

### Key Features:
- Single server running on port 3000
- Serves static files from the frontend directory
- Separate portals for customers, merchants, and admins
- Shared resources accessible across all portals
- Handles all API routes under `/api/*`
- CORS enabled for development
- MongoDB connection for data persistence

## Getting Started

1. **Prerequisites:**
   - Node.js (v16 or higher)
   - MongoDB (local installation)
   - Cloudinary account (for image upload functionality)
   - Modern web browser (Chrome 60+, Firefox 54+, Safari 10+, or Edge 79+)
   - Git (recommended for version control)

2. **Installation:**
   ```bash
   # Install dependencies
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file with:
   ```
   # Server Configuration
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/local-produce
   JWT_SECRET=your_jwt_secret_key_here

   # Cloudinary Configuration (required for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Database Setup:**
   ```bash
   # Optional: Seed the database with sample data (will clear existing data)
   npm run seed

   This will:
   - Create an admin user (email: admin@example.com, password: admin123)
   - Create sample merchants and products
   - Set up delivery dates
   ```

5. **Start the Server:**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

6. **Access the Application:**
   The application runs at `http://localhost:3000`

   Available Portals:
   - Customer Portal: `http://localhost:3000/customer-portal`
   - Merchant Portal: `http://localhost:3000/merchant-portal`
   - Admin Portal: `http://localhost:3000/admin-portal`

7. **Admin Users:**
   For security reasons, admin users can only be created in specific ways:
   1. First admin can be created by running: `npm run seed`
      (email: admin@example.com, password: admin123)
   2. Additional admin users can only be created through direct database insertion
   3. There is no public registration endpoint for admin users

## Color Scheme

The application uses an earthy green color palette that reflects the natural, fresh essence of local produce:

- Light Yellow (`#E3E566`): Used for the logo and hover states in navigation
- Light Green (`#A5CF61`): Used for navigation links and secondary elements
- Medium Green (`#6F9B3C`): Primary action color, used for buttons and merchant names
- Deep Green (`#558257`): Used for hover states and price text
- Dark Teal (`#264E49`): Primary color for navigation bar and headings
- Cream (`#F5F5F0`): Background color

This color scheme was chosen to create a natural, organic feel that suits a local produce marketplace while ensuring good contrast and readability.

## Database Models

### User Model
```javascript
{
    email: String,          // Unique, Required
    password: String,       // Required, Hashed with bcrypt
    role: String,          // Required: 'customer', 'merchant', or 'admin'
    name: String,          // Required
    timestamps: true       // Creates createdAt and updatedAt
}
```

### MerchantShop Model
```javascript
{
    userId: ObjectId,      // References User model
    businessName: String,  // Required
    description: String,   // Required
    category: String,      // Required: 'Fruit & Veg', 'Bakery', etc.
    coordinates: {         // Location coordinates
        lat: Number,
        lng: Number
    },
    locationString: String, // Required
    image: String,         // Cloudinary URL
    status: String,        // Required: 'pending', 'approved', 'delisted'
    timestamps: true
}
```

### Product Model
```javascript
{
    merchantId: ObjectId,  // References MerchantShop model
    item: String,         // Required
    description: String,  // Required
    price: Number,       // Required
    unit: String,        // Required (e.g., 'kg', 'each')
    category: String,    // Product category
    localityCategory: String, // Required: 'own_product', 'local_50', etc.
    coordinates: {
        lat: Number,
        lng: Number
    },
    producer: String,
    image: String,       // Cloudinary URL
    inStock: Boolean    // Default: true
}
```

### Order Model
```javascript
{
    customer: ObjectId,    // References User model
    merchantOrders: [{     // Array of merchant-specific orders
        merchant: ObjectId,  // References MerchantShop model
        items: [{
            product: ObjectId, // References Product model
            quantity: Number,
            price: Number,
            rating: {
                score: Number,  // 1-5
                ratedAt: Date
            }
        }],
        status: String    // 'created', 'ready', 'at depot'
    }],
    deliveryDate: ObjectId, // References DeliveryDate model
    status: String,        // 'pending', 'confirmed', 'completed', 'cancelled'
    totalAmount: Number,
    timestamps: true
}
```

### DeliveryDate Model
```javascript
{
    date: Date,           // Required
    status: String,       // Required: 'open', 'closed', 'past'
    timestamps: true
}
```

### Model Relationships
```
User ─┬─── MerchantShop ─── Product
      └─── Order ─┬─── MerchantShop
                  ├─── Product
                  └─── DeliveryDate
```

- A User can be a customer (places orders) or a merchant (owns a shop)
- A MerchantShop belongs to one User and can have many Products
- An Order belongs to a customer User and contains multiple MerchantOrders
- Each MerchantOrder references one MerchantShop and multiple Products
- Each Order is associated with one DeliveryDate

## API Endpoints

All API endpoints are prefixed with `/api`. For example, the customer browse endpoint is accessed at `/api/customer/browse/products`.

### Authentication Routes

#### Customer Auth (`/customer/auth`)
- `POST /register` - Register a new customer
- `POST /login` - Customer login
- `GET /profile` - Get customer profile
- `PUT /profile` - Update customer profile

#### Merchant Auth (`/merchant/auth`)
- `POST /register` - Register as a merchant
- `POST /login` - Merchant login
- `GET /profile` - Get merchant profile
- `PUT /profile` - Update merchant profile

#### Admin Auth (`/admin/auth`)
- `POST /login` - Admin login
- `GET /profile` - Get admin profile

### Customer Routes

#### Browse (`/customer/browse`)
- `GET /products` - List all products
- `GET /products/:id` - Get product details
- `GET /merchants` - List all merchants
- `GET /merchants/:id` - Get merchant details
- `GET /delivery-dates` - Get available delivery dates

#### Orders (`/customer/orders`)
- `POST /` - Create a new order
- `GET /` - List customer's orders
- `GET /:id` - Get order details
- `PATCH /:id/status` - Update order status
- `POST /:id/rate` - Rate products in an order

### Merchant Routes

#### Shop Management (`/merchant/shop`)
- `GET /` - Get merchant's shop details
- `PUT /` - Update shop details
- `PATCH /status` - Update shop status

#### Products (`/merchant/products`)
- `POST /` - Add a new product
- `GET /` - List merchant's products
- `GET /:id` - Get product details
- `PUT /:id` - Update product
- `DELETE /:id` - Delete product
- `PATCH /:id/stock` - Update product stock status

#### Orders (`/merchant/orders`)
- `GET /` - List orders for merchant
- `GET /:id` - Get order details
- `PATCH /:id/status` - Update order status

#### Delivery Dates (`/merchant/delivery-dates`)
- `GET /` - List delivery dates
- `GET /:id` - Get delivery date details

### Admin Routes

#### Merchant Management (`/admin/merchants`)
- `GET /` - List all merchants
- `GET /:id` - Get merchant details
- `PATCH /:id/status` - Update merchant status
- `DELETE /:id` - Delete merchant

#### Product Management (`/admin/products`)
- `GET /` - List all products
- `GET /:id` - Get product details
- `DELETE /:id` - Delete product

#### Order Management (`/admin/orders`)
- `GET /` - List all orders
- `GET /:id` - Get order details
- `PATCH /:id/status` - Update order status

#### Delivery Dates (`/admin/delivery-dates`)
- `POST /` - Create delivery date
- `GET /` - List all delivery dates
- `PATCH /:id/status` - Update delivery date status
- `DELETE /:id` - Delete delivery date

### Authentication
All routes except authentication and public browsing require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Response Format
All API responses follow the format:
```javascript
{
    success: true/false,
    data: {}, // Response data
    error: {} // Error details if success is false
}
```

## Development Notes

- The server uses `nodemon` in development for auto-reloading
- Static files are served from `frontend/customer-portal`
- API routes are prefixed with `/api`
- MongoDB connection is handled automatically on server start
