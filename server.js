const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Order Schema
const orderSchema = new mongoose.Schema({
    timestamp: { type: Date, required: true },
    orderCount: { type: Number, required: true },
    durations: {
        heading: Number,
        shopping: Number,
        delivering: Number,
        total: Number
    },
    individualDeliveries: [Number]
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Save a new order
app.post('/api/save-order', async (req, res) => {
    try {
        const orderData = req.body;
        const order = new Order(orderData);
        await order.save();

        console.log('Order saved:', {
            time: new Date(order.timestamp).toLocaleString(),
            total: formatDuration(order.durations.total)
        });

        res.json({
            success: true,
            message: 'Order saved successfully'
        });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save order'
        });
    }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ timestamp: -1 });
        res.json({
            success: true,
            orders: orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders'
        });
    }
});

// Delete an order
app.post('/api/delete-order', async (req, res) => {
    try {
        const { index } = req.body;

        // Get all orders sorted by timestamp descending (newest first)
        const orders = await Order.find().sort({ timestamp: -1 });

        if (typeof index !== 'number' || index < 0 || index >= orders.length) {
            return res.status(400).json({
                success: false,
                error: 'Invalid index'
            });
        }

        // Delete the order by its _id
        await Order.findByIdAndDelete(orders[index]._id);

        // Get updated list
        const updatedOrders = await Order.find().sort({ timestamp: -1 });

        console.log('Order deleted successfully');

        res.json({
            success: true,
            orders: updatedOrders
        });

    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete order',
            details: error.message
        });
    }
});

// Helper function
function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
}

// Start server first, then connect to MongoDB
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shipt Tracker running on port ${PORT}`);

    // Connect to MongoDB after server starts
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URL || 'mongodb://localhost:27017/shipt-tracking';
    console.log('Connecting to MongoDB...');

    mongoose.connect(mongoUrl)
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.error('MongoDB connection error:', err.message));
});
