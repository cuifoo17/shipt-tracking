const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Store orders in memory (will add file storage next)
let orders = [];

// Save a new order
app.post('/api/save-order', (req, res) => {
    try {
        const order = req.body;
        orders.unshift(order); // Add to beginning
        
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
app.get('/api/orders', (req, res) => {
    res.json({ 
        success: true, 
        orders: orders 
    });
});

// Delete an order
app.post('/api/delete-order', (req, res) => {
    try {
        const { index } = req.body;
        
        console.log('Delete request received for index:', index);
        console.log('Current orders count:', orders.length);
        
        if (typeof index !== 'number' || index < 0 || index >= orders.length) {
            console.log('Invalid index');
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid index' 
            });
        }
        
        // Delete the order
        const deleted = orders.splice(index, 1);
        console.log('Order deleted successfully');
        console.log('Remaining orders:', orders.length);
        
        // Send back updated list
        res.json({ 
            success: true, 
            orders: orders 
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

// Start server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Shipt Tracker running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop');
});
